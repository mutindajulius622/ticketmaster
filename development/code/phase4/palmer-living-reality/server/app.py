from flask import Flask, request, make_response, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_restful import Api, Resource
from flask_cors import CORS
from config import Config
from models import db, User, Property, RentalAgreement, Amenity, PropertyImage
from sqlalchemy import and_, or_
from datetime import datetime, date
import re

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)
api = Api(app)
CORS(app, supports_credentials=True)

# ============== AUTHENTICATION HELPERS ==============
def login_required(f):
    """Decorator to require authentication"""
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return make_response(jsonify({'error': 'Authentication required'}), 401)
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def admin_required(f):
    """Decorator to require admin role"""
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return make_response(jsonify({'error': 'Authentication required'}), 401)
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return make_response(jsonify({'error': 'Admin access required'}), 403)
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def owner_required(f):
    """Decorator to require owner role"""
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return make_response(jsonify({'error': 'Authentication required'}), 401)
        user = User.query.get(session['user_id'])
        if not user or user.role not in ['admin', 'owner']:
            return make_response(jsonify({'error': 'Owner access required'}), 403)
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def validate_email(email):
    """Validate email format"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password complexity"""
    if len(password) < 6:
        return False
    return True

# ============== AUTH ROUTES ==============
class AuthRegister(Resource):
    def post(self):
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return make_response(jsonify({'error': f'{field} is required'}), 400)
        
        # Validate email format
        if not validate_email(data['email']):
            return make_response(jsonify({'error': 'Invalid email format'}), 400)
        
        # Validate password
        if not validate_password(data['password']):
            return make_response(jsonify({'error': 'Password must be at least 6 characters'}), 400)
        
        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return make_response(jsonify({'error': 'Username already exists'}), 400)
        if User.query.filter_by(email=data['email']).first():
            return make_response(jsonify({'error': 'Email already exists'}), 400)
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            role=data['role'],
            phone=data.get('phone'),
            is_verified=(data['role'] != 'tenant')  # Tenants need admin verification
        )
        user.password = data['password']
        
        db.session.add(user)
        db.session.commit()
        
        # Set session
        session['user_id'] = user.id
        session['role'] = user.role
        
        return make_response(user.to_dict(), 201)

class AuthLogin(Resource):
    def post(self):
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return make_response(jsonify({'error': 'Username and password required'}), 400)
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.authenticate(data['password']):
            return make_response(jsonify({'error': 'Invalid credentials'}), 401)
        
        # Check if tenant is verified
        if user.role == 'tenant' and not user.is_verified:
            return make_response(jsonify({'error': 'Account pending verification by admin'}), 403)
        
        session['user_id'] = user.id
        session['role'] = user.role
        session['username'] = user.username
        
        return make_response(user.to_dict(), 200)

class AuthLogout(Resource):
    def post(self):
        session.clear()
        return make_response(jsonify({'message': 'Logged out successfully'}), 200)

class AuthCheck(Resource):
    def get(self):
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                return make_response(user.to_dict(), 200)
        return make_response(jsonify({'error': 'Not authenticated'}), 401)

# ============== USER ROUTES ==============
class Users(Resource):
    @admin_required
    def get(self):
        users = User.query.all()
        return make_response([u.to_dict() for u in users], 200)
    
    @admin_required
    def post(self):
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return make_response(jsonify({'error': f'{field} is required'}), 400)
        
        if not validate_email(data['email']):
            return make_response(jsonify({'error': 'Invalid email format'}), 400)
        
        if User.query.filter_by(username=data['username']).first():
            return make_response(jsonify({'error': 'Username exists'}), 400)
        
        user = User(
            username=data['username'],
            email=data['email'],
            role=data['role'],
            is_verified=(data['role'] != 'tenant')
        )
        user.password = data['password']
        
        db.session.add(user)
        db.session.commit()
        return make_response(user.to_dict(), 201)

class UserById(Resource):
    @login_required
    def get(self, user_id):
        # Users can view their own profile, admins can view anyone
        if session['user_id'] != user_id and session.get('role') != 'admin':
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        user = User.query.get(user_id)
        if not user:
            return make_response(jsonify({'error': 'User not found'}), 404)
        return make_response(user.to_dict(), 200)
    
    @login_required
    def put(self, user_id):
        if session['user_id'] != user_id and session.get('role') != 'admin':
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        user = User.query.get(user_id)
        if not user:
            return make_response(jsonify({'error': 'User not found'}), 404)
        
        data = request.get_json()
        
        if 'email' in data and not validate_email(data['email']):
            return make_response(jsonify({'error': 'Invalid email format'}), 400)
        
        if 'username' in data and User.query.filter(User.username == data['username'], User.id != user_id).first():
            return make_response(jsonify({'error': 'Username exists'}), 400)
        
        allowed_fields = ['username', 'email', 'phone', 'is_verified']
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        if 'password' in data and validate_password(data['password']):
            user.password = data['password']
        
        db.session.commit()
        return make_response(user.to_dict(), 200)
    
    @admin_required
    def delete(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return make_response(jsonify({'error': 'User not found'}), 404)
        
        db.session.delete(user)
        db.session.commit()
        return make_response(jsonify({'message': 'User deleted'}), 200)

# ============== PROPERTY ROUTES ==============
class Properties(Resource):
    def get(self):
        """Public access - get all properties (no tenant info)"""
        query = Property.query
        
        # Filters
        property_type = request.args.get('type')
        min_rent = request.args.get('min_rent')
        max_rent = request.args.get('max_rent')
        location = request.args.get('location')
        bedrooms = request.args.get('bedrooms')
        is_for_rent = request.args.get('for_rent')
        is_for_sale = request.args.get('for_sale')
        
        if property_type:
            query = query.filter(Property.property_type == property_type)
        if min_rent:
            query = query.filter(Property.rent_amount >= float(min_rent))
        if max_rent:
            query = query.filter(Property.rent_amount <= float(max_rent))
        if location:
            query = query.filter(Property.location.ilike(f'%{location}%'))
        if bedrooms:
            query = query.filter(Property.bedrooms >= int(bedrooms))
        if is_for_rent:
            query = query.filter(Property.is_for_rent == (is_for_rent == 'true'))
        if is_for_sale:
            query = query.filter(Property.is_for_sale == (is_for_sale == 'true'))
        
        properties = query.all()
        return make_response([p.to_dict() for p in properties], 200)
    
    @owner_required
    def post(self):
        """Property owners can add properties"""
        data = request.get_json()
        
        required_fields = ['name', 'property_type', 'location', 'rent_amount']
        for field in required_fields:
            if field not in data:
                return make_response(jsonify({'error': f'{field} is required'}), 400)
        
        try:
            property = Property(
                name=data['name'],
                property_type=data['property_type'],
                description=data.get('description'),
                location=data['location'],
                address=data.get('address'),
                rent_amount=float(data['rent_amount']),
                sale_price=float(data['sale_price']) if data.get('sale_price') else None,
                is_for_rent=data.get('is_for_rent', True),
                is_for_sale=data.get('is_for_sale', False),
                image_url=data.get('image_url'),
                bedrooms=int(data['bedrooms']) if data.get('bedrooms') else 0,
                bathrooms=float(data['bathrooms']) if data.get('bathrooms') else 0,
                square_feet=int(data['square_feet']) if data.get('square_feet') else None,
                owner_id=session['user_id']
            )
            
            db.session.add(property)
            db.session.commit()
            return make_response(property.to_dict(), 201)
        except ValueError as e:
            return make_response(jsonify({'error': str(e)}), 400)

class PropertyById(Resource):
    def get(self, property_id):
        """Public access - get property details (no tenant info)"""
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        return make_response(property.to_dict(), 200)
    
    @owner_required
    def put(self, property_id):
        """Property owner or admin can update property"""
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
        # Check ownership (admin can edit any)
        if session.get('role') != 'admin' and property.owner_id != session['user_id']:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        data = request.get_json()
        
        allowed_fields = ['name', 'property_type', 'description', 'location', 'address',
                         'rent_amount', 'sale_price', 'is_for_rent', 'is_for_sale',
                         'image_url', 'bedrooms', 'bathrooms', 'square_feet']
        
        for field in allowed_fields:
            if field in data:
                if field in ['rent_amount', 'sale_price']:
                    setattr(property, field, float(data[field]) if data[field] else None)
                elif field in ['bedrooms', 'square_feet']:
                    setattr(property, field, int(data[field]) if data[field] else None)
                elif field == 'bathrooms':
                    setattr(property, field, float(data[field]) if data[field] else 0)
                elif field in ['is_for_rent', 'is_for_sale']:
                    setattr(property, field, bool(data[field]))
                else:
                    setattr(property, field, data[field])
        
        db.session.commit()
        return make_response(property.to_dict(), 200)
    
    @owner_required
    def delete(self, property_id):
        """Property owner or admin can delete property"""
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
        if session.get('role') != 'admin' and property.owner_id != session['user_id']:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        db.session.delete(property)
        db.session.commit()
        return make_response(jsonify({'message': 'Property deleted'}), 200)

# ============== RENTAL AGREEMENT ROUTES ==============
class RentalAgreements(Resource):
    @login_required
    def get(self):
        """Get rental agreements based on role"""
        user = User.query.get(session['user_id'])
        
        if user.role == 'admin':
            agreements = RentalAgreement.query.all()
        elif user.role == 'owner':
            # Owners see agreements for their properties
            agreements = RentalAgreement.query.join(Property).filter(Property.owner_id == user.id).all()
        elif user.role == 'tenant':
            # Tenants see only their agreements
            agreements = RentalAgreement.query.filter_by(tenant_id=user.id).all()
        else:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        return make_response([a.to_dict() for a in agreements], 200)
    
    def post(self):
        """Create rental agreement (tenant applies)"""
        if 'user_id' not in session:
            return make_response(jsonify({'error': 'Authentication required'}), 401)
        
        data = request.get_json()
        
        required_fields = ['property_id', 'lease_start_date', 'rent_amount']
        for field in required_fields:
            if field not in data:
                return make_response(jsonify({'error': f'{field} is required'}), 400)
        
        property = Property.query.get(data['property_id'])
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
        try:
            lease_start = datetime.strptime(data['lease_start_date'], '%Y-%m-%d').date()
            lease_end = None
            if data.get('lease_end_date'):
                lease_end = datetime.strptime(data['lease_end_date'], '%Y-%m-%d').date()
        except ValueError:
            return make_response(jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400)
        
        agreement = RentalAgreement(
            rent_amount=float(data['rent_amount']),
            lease_start_date=lease_start,
            lease_end_date=lease_end,
            tenant_id=session['user_id'],
            property_id=data['property_id'],
            notes=data.get('notes'),
            verified=False,
            status='pending'
        )
        
        db.session.add(agreement)
        db.session.commit()
        return make_response(agreement.to_dict(), 201)

class RentalAgreementById(Resource):
    @login_required
    def get(self, agreement_id):
        """Get specific agreement"""
        agreement = RentalAgreement.query.get(agreement_id)
        if not agreement:
            return make_response(jsonify({'error': 'Agreement not found'}), 404)
        
        user = User.query.get(session['user_id'])
        
        # Check access
        if user.role == 'tenant' and agreement.tenant_id != user.id:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        elif user.role == 'owner':
            if agreement.property.owner_id != user.id:
                return make_response(jsonify({'error': 'Access denied'}), 403)
        
        return make_response(agreement.to_dict(), 200)
    
    @admin_required
    def put(self, agreement_id):
        """Admin can verify/update agreements"""
        agreement = RentalAgreement.query.get(agreement_id)
        if not agreement:
            return make_response(jsonify({'error': 'Agreement not found'}), 404)
        
        data = request.get_json()
        
        allowed_fields = ['verified', 'status', 'notes', 'rent_amount']
        for field in allowed_fields:
            if field in data:
                if field == 'verified':
                    agreement.verified = bool(data[field])
                elif field == 'status':
                    if data[field] in ['pending', 'active', 'terminated']:
                        agreement.status = data[field]
                elif field == 'rent_amount':
                    agreement.rent_amount = float(data[field])
                else:
                    setattr(agreement, field, data[field])
        
        db.session.commit()
        return make_response(agreement.to_dict(), 200)
    
    @login_required
    def delete(self, agreement_id):
        """Admin or tenant can cancel"""
        agreement = RentalAgreement.query.get(agreement_id)
        if not agreement:
            return make_response(jsonify({'error': 'Agreement not found'}), 404)
        
        user = User.query.get(session['user_id'])
        
        if user.role == 'tenant' and agreement.tenant_id != user.id:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        db.session.delete(agreement)
        db.session.commit()
        return make_response(jsonify({'message': 'Agreement deleted'}), 200)

# ============== ADMIN VERIFICATION ROUTES ==============
class VerifyTenant(Resource):
    """Admin can verify pending tenants"""
    @admin_required
    def put(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return make_response(jsonify({'error': 'User not found'}), 404)
        
        if user.role != 'tenant':
            return make_response(jsonify({'error': 'Only tenants need verification'}), 400)
        
        data = request.get_json()
        user.is_verified = data.get('is_verified', True)
        
        db.session.commit()
        return make_response(user.to_dict(), 200)

class PendingTenants(Resource):
    """Get list of unverified tenants"""
    @admin_required
    def get(self):
        tenants = User.query.filter_by(role='tenant', is_verified=False).all()
        return make_response([t.to_dict() for t in tenants], 200)

# ============== AMENITY ROUTES ==============
class Amenities(Resource):
    def get(self):
        amenities = Amenity.query.all()
        return make_response([a.to_dict() for a in amenities], 200)
    
    @admin_required
    def post(self):
        data = request.get_json()
        
        if not data.get('name'):
            return make_response(jsonify({'error': 'Amenity name is required'}), 400)
        
        amenity = Amenity(
            name=data['name'],
            description=data.get('description')
        )
        
        db.session.add(amenity)
        db.session.commit()
        return make_response(amenity.to_dict(), 201)

# ============== REGISTER API ROUTES ==============
api.add_resource(AuthRegister, '/api/register')
api.add_resource(AuthLogin, '/api/login')
api.add_resource(AuthLogout, '/api/logout')
api.add_resource(AuthCheck, '/api/me')
api.add_resource(Users, '/api/users')
api.add_resource(UserById, '/api/users/<int:user_id>')
api.add_resource(Properties, '/api/properties')
api.add_resource(PropertyById, '/api/properties/<int:property_id>')
api.add_resource(RentalAgreements, '/api/rental-agreements')
api.add_resource(RentalAgreementById, '/api/rental-agreements/<int:agreement_id>')
api.add_resource(VerifyTenant, '/api/verify-tenant/<int:user_id>')
api.add_resource(PendingTenants, '/api/pending-tenants')
api.add_resource(Amenities, '/api/amenities')

if __name__ == '__main__':
    app.run(port=5555, debug=True)

