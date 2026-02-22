from flask import Flask, request, make_response, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_restful import Api, Resource
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from .config import Config
from .models.index import db, User, Property, RentalAgreement, Amenity, Payment, Inquiry
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from marshmallow import ValidationError
from datetime import datetime, date, timedelta
import re
import logging
import os

# Import M-Pesa service with fallback
try:
    from server.services.mpesa_service import MpesaService
    MPESA_SERVICE_AVAILABLE = True
except ImportError:
    MPESA_SERVICE_AVAILABLE = False
    logging.warning("M-Pesa service not available - payments will be simulated")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='../client/dist', static_url_path='')
app.config.from_object(Config)

# Configure session for cross-origin requests
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
api = Api(app)
CORS(app, supports_credentials=True)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

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
    if len(password) < 8:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.islower() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    return True

def validate_password_strength(password):
    """Detailed password validation with error messages"""
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    return errors if errors else None


# ============== API RESOURCES ==============

class AuthRegister(Resource):
    @limiter.limit("5 per minute")
    def post(self):
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return make_response(jsonify({'error': f'{field} is required'}), 400)
        
        if not validate_email(data['email']):
            return make_response(jsonify({'error': 'Invalid email format'}), 400)
        
        password_errors = validate_password_strength(data['password'])
        if password_errors:
            return make_response(jsonify({
                'error': 'Password does not meet requirements',
                'details': password_errors
            }), 400)
        
        if data['role'] not in ['admin', 'owner', 'tenant']:
            return make_response(jsonify({'error': 'Invalid role. Must be admin, owner, or tenant'}), 400)
        
        if User.query.filter_by(username=data['username']).first():
            return make_response(jsonify({'error': 'Username already exists'}), 400)
        if User.query.filter_by(email=data['email']).first():
            return make_response(jsonify({'error': 'Email already exists'}), 400)
        
        try:
            user = User(
                username=data['username'],
                email=data['email'],
                role=data['role'],
                phone=data.get('phone'),
                first_name=data['first_name'],
                last_name=data['last_name'],
                is_verified=(data['role'] != 'tenant')
            )
            user.password = data['password']
            
            db.session.add(user)
            db.session.commit()
            
            session['user_id'] = user.id
            session['role'] = user.role
            
            return make_response(user.to_dict(), 201)
        except (IntegrityError, ValidationError) as e:
            db.session.rollback()
            return make_response(jsonify({'error': str(e)}), 400)


class AuthLogin(Resource):
    @limiter.limit("10 per minute")
    def post(self):
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return make_response(jsonify({'error': 'Username and password required'}), 400)
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.authenticate(data['password']):
            return make_response(jsonify({'error': 'Invalid credentials'}), 401)
        
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


class Properties(Resource):
    def get(self):
        """Public access - get all properties"""
        query = Property.query
        
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
        
        result = []
        for p in properties:
            result.append({
                'id': p.id,
                'name': p.name,
                'property_type': p.property_type,
                'description': p.description,
                'location': p.location,
                'address': p.address,
                'rent_amount': p.rent_amount,
                'sale_price': p.sale_price,
                'is_for_rent': p.is_for_rent,
                'is_for_sale': p.is_for_sale,
                'image_url': p.image_url,
                'bedrooms': p.bedrooms,
                'bathrooms': p.bathrooms,
                'square_feet': p.square_feet,
                'owner_id': p.owner_id,
                'created_at': p.created_at.isoformat(),
                'updated_at': p.updated_at.isoformat() if p.updated_at else None
            })
            
        return make_response(jsonify(result), 200)
    
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
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        return make_response(property.to_dict(), 200)
    
    @owner_required
    def put(self, property_id):
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
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
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
        if session.get('role') != 'admin' and property.owner_id != session['user_id']:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        db.session.delete(property)
        db.session.commit()
        return make_response(jsonify({'message': 'Property deleted'}), 200)


class RentalAgreements(Resource):
    @login_required
    def get(self):
        user = User.query.get(session['user_id'])
        
        if user.role == 'admin':
            agreements = RentalAgreement.query.all()
        elif user.role == 'owner':
            agreements = RentalAgreement.query.join(Property).filter(Property.owner_id == user.id).all()
        elif user.role == 'tenant':
            agreements = RentalAgreement.query.filter_by(tenant_id=user.id).all()
        else:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        return make_response([a.to_dict() for a in agreements], 200)
    
    def post(self):
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
        agreement = RentalAgreement.query.get(agreement_id)
        if not agreement:
            return make_response(jsonify({'error': 'Agreement not found'}), 404)
        
        user = User.query.get(session['user_id'])
        
        if user.role == 'tenant' and agreement.tenant_id != user.id:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        elif user.role == 'owner':
            if agreement.property.owner_id != user.id:
                return make_response(jsonify({'error': 'Access denied'}), 403)
        
        return make_response(agreement.to_dict(), 200)
    
    @admin_required
    def put(self, agreement_id):
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
        agreement = RentalAgreement.query.get(agreement_id)
        if not agreement:
            return make_response(jsonify({'error': 'Agreement not found'}), 404)
        
        user = User.query.get(session['user_id'])
        
        if user.role == 'tenant' and agreement.tenant_id != user.id:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        db.session.delete(agreement)
        db.session.commit()
        return make_response(jsonify({'message': 'Agreement deleted'}), 200)


class VerifyTenant(Resource):
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
    @admin_required
    def get(self):
        tenants = User.query.filter_by(role='tenant', is_verified=False).all()
        return make_response([t.to_dict() for t in tenants], 200)


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


class PropertyAmenities(Resource):
    @login_required
    def get(self, property_id):
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        return make_response([a.to_dict() for a in property.amenities], 200)
    
    @owner_required
    def post(self, property_id):
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
        if session.get('role') != 'admin' and property.owner_id != session['user_id']:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        data = request.get_json()
        
        if not data.get('amenity_id'):
            return make_response(jsonify({'error': 'Amenity ID is required'}), 400)
        
        amenity = Amenity.query.get(data['amenity_id'])
        if not amenity:
            return make_response(jsonify({'error': 'Amenity not found'}), 404)
        
        if amenity not in property.amenities:
            property.amenities.append(amenity)
            db.session.commit()
        
        return make_response([a.to_dict() for a in property.amenities], 200)
    
    @owner_required
    def delete(self, property_id):
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
        if session.get('role') != 'admin' and property.owner_id != session['user_id']:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        data = request.get_json()
        
        if not data.get('amenity_id'):
            return make_response(jsonify({'error': 'Amenity ID is required'}), 400)
        
        amenity = Amenity.query.get(data['amenity_id'])
        if not amenity:
            return make_response(jsonify({'error': 'Amenity not found'}), 404)
        
        if amenity in property.amenities:
            property.amenities.remove(amenity)
            db.session.commit()
        
        return make_response([a.to_dict() for a in property.amenities], 200)


class InitiatePayment(Resource):
    @login_required
    def post(self):
        data = request.get_json()

        required_fields = ['amount', 'phone_number', 'payment_method']
        for field in required_fields:
            if field not in data:
                return make_response(jsonify({'error': f'{field} is required'}), 400)

        if data['payment_method'] not in ['mpesa_stk_push', 'mpesa_paybill']:
            return make_response(jsonify({'error': 'Invalid payment method'}), 400)

        amount = float(data['amount'])
        if amount < app.config.get('MINIMUM_PAYMENT_AMOUNT', 1) or amount > app.config.get('MAXIMUM_PAYMENT_AMOUNT', 100000):
            return make_response(jsonify({'error': 'Invalid payment amount'}), 400)

        try:
            payment = Payment(
                amount=amount,
                payment_method=data['payment_method'],
                phone_number=data['phone_number'],
                account_reference=data.get('account_reference', f'RENT-{session["user_id"]}'),
                transaction_desc=data.get('description', 'Rent Payment'),
                user_id=session['user_id'],
                rental_agreement_id=data.get('rental_agreement_id')
            )

            db.session.add(payment)
            db.session.commit()

            if data['payment_method'] == 'mpesa_stk_push':
                if MPESA_SERVICE_AVAILABLE:
                    mpesa_service = MpesaService()
                    result = mpesa_service.initiate_stk_push(
                        phone_number=data['phone_number'],
                        amount=int(amount),
                        account_reference=payment.account_reference,
                        transaction_desc=payment.transaction_desc
                    )

                    if result.get('ResponseCode') == '0':
                        payment.checkout_request_id = result['CheckoutRequestID']
                        payment.merchant_request_id = result['MerchantRequestID']
                        db.session.commit()

                        return make_response({
                            'payment_id': payment.id,
                            'status': 'initiated',
                            'checkout_request_id': payment.checkout_request_id,
                            'message': 'STK Push initiated successfully. Check your phone to complete payment.'
                        }, 200)
                    else:
                        payment.status = 'failed'
                        db.session.commit()
                        return make_response(jsonify({
                            'error': 'Failed to initiate STK Push',
                            'details': result.get('ResponseDescription', 'Unknown error')
                        }), 400)
                else:
                    import uuid
                    payment.checkout_request_id = f"ws_co_{uuid.uuid4().hex[:8]}"
                    payment.merchant_request_id = f"ws_mer_{uuid.uuid4().hex[:8]}"
                    db.session.commit()

                    return make_response({
                        'payment_id': payment.id,
                        'status': 'initiated',
                        'checkout_request_id': payment.checkout_request_id,
                        'message': 'Payment initiated (SIMULATION MODE). No real payment processed.'
                    }, 200)

            elif data['payment_method'] == 'mpesa_paybill':
                payment.status = 'pending'
                db.session.commit()

                return make_response({
                    'payment_id': payment.id,
                    'status': 'pending',
                    'message': f'Please pay {amount} KES to Paybill {app.config.get("MPESA_BUSINESS_SHORT_CODE", "ENTER_PAYBILL")} with account number {payment.account_reference}',
                    'paybill_number': app.config.get('MPESA_BUSINESS_SHORT_CODE', 'ENTER_PAYBILL'),
                    'account_number': payment.account_reference
                }, 200)

        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Payment initiation error: {str(e)}")
            return make_response(jsonify({'error': 'Payment initiation failed', 'details': str(e)}), 500)


class PaymentStatus(Resource):
    @login_required
    def get(self, payment_id):
        payment = Payment.query.get(payment_id)
        if not payment:
            return make_response(jsonify({'error': 'Payment not found'}), 404)

        if payment.user_id != session['user_id'] and session.get('role') != 'admin':
            return make_response(jsonify({'error': 'Access denied'}), 403)

        return make_response(payment.to_dict(), 200)


class Payments(Resource):
    @login_required
    def get(self):
        user = User.query.get(session['user_id'])

        if user.role == 'admin':
            payments = Payment.query.all()
        else:
            payments = Payment.query.filter_by(user_id=user.id).all()

        return make_response([p.to_dict() for p in payments], 200)


class MpesaCallback(Resource):
    def post(self):
        try:
            data = request.get_json()

            app.logger.info(f"M-Pesa Callback: {data}")

            if data.get('Body', {}).get('stkCallback', {}):
                callback_data = data['Body']['stkCallback']

                checkout_request_id = callback_data.get('CheckoutRequestID')
                result_code = callback_data.get('ResultCode')
                result_desc = callback_data.get('ResultDesc')

                payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()

                if payment:
                    if result_code == 0:
                        callback_metadata = callback_data.get('CallbackMetadata', {}).get('Item', [])

                        for item in callback_metadata:
                            if item.get('Name') == 'MpesaReceiptNumber':
                                payment.mpesa_receipt_number = item.get('Value')
                            elif item.get('Name') == 'TransactionDate':
                                timestamp_str = str(item.get('Value'))
                                if len(timestamp_str) == 14:
                                    payment.payment_date = datetime.strptime(timestamp_str, '%Y%m%d%H%M%S')
                            elif item.get('Name') == 'PhoneNumber':
                                payment.phone_number = str(item.get('Value'))
                            elif item.get('Name') == 'Amount':
                                payment.amount = float(item.get('Value'))

                        payment.status = 'completed'
                        payment.transaction_id = payment.mpesa_receipt_number

                    else:
                        payment.status = 'failed'

                    payment.updated_at = datetime.utcnow()
                    db.session.commit()

                return make_response({'ResultCode': 0, 'ResultDesc': 'Callback received successfully'}, 200)
            else:
                return make_response({'ResultCode': 1, 'ResultDesc': 'Invalid callback data'}, 400)

        except Exception as e:
            app.logger.error(f"M-Pesa callback error: {str(e)}")
            db.session.rollback()
            return make_response({'ResultCode': 1, 'ResultDesc': 'Callback processing failed'}, 500)


class Inquiries(Resource):
    def get(self):
        """Public access - get all inquiries (admin/owner only)"""
        if 'user_id' not in session:
            return make_response(jsonify({'error': 'Authentication required'}), 401)
        
        user = User.query.get(session['user_id'])
        
        if user.role == 'admin':
            inquiries = Inquiry.query.all()
        elif user.role == 'owner':
            inquiries = Inquiry.query.join(Property).filter(Property.owner_id == user.id).all()
        elif user.role == 'tenant':
            inquiries = Inquiry.query.filter_by(user_id=user.id).all()
        else:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        return make_response([i.to_dict() for i in inquiries], 200)
    
    def post(self):
        """Public access - create a new inquiry (guest or authenticated users)"""
        data = request.get_json()
        
        required_fields = ['property_id', 'inquiry_type']
        for field in required_fields:
            if field not in data:
                return make_response(jsonify({'error': f'{field} is required'}), 400)
        
        # Validate property exists
        property = Property.query.get(data['property_id'])
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
        try:
            preferred_move_in_date = None
            if data.get('preferred_move_in_date'):
                preferred_move_in_date = datetime.strptime(data['preferred_move_in_date'], '%Y-%m-%d').date()
        except ValueError:
            return make_response(jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400)
        
        inquiry = Inquiry(
            inquiry_type=data['inquiry_type'],
            user_name=data.get('user_name'),
            user_email=data.get('user_email'),
            user_phone=data.get('user_phone'),
            message=data.get('message'),
            preferred_contact_method=data.get('preferred_contact_method', 'email'),
            preferred_move_in_date=preferred_move_in_date,
            property_id=data['property_id'],
            user_id=session.get('user_id') if 'user_id' in session else None
        )
        
        db.session.add(inquiry)
        db.session.commit()
        
        return make_response(inquiry.to_dict(), 201)


class InquiryById(Resource):
    @login_required
    def get(self, inquiry_id):
        inquiry = Inquiry.query.get(inquiry_id)
        if not inquiry:
            return make_response(jsonify({'error': 'Inquiry not found'}), 404)
        
        user = User.query.get(session['user_id'])
        
        # Admin can access all, owner can access inquiries for their properties
        if user.role == 'admin':
            pass  # Access granted
        elif user.role == 'owner':
            if inquiry.property.owner_id != user.id:
                return make_response(jsonify({'error': 'Access denied'}), 403)
        elif user.role == 'tenant':
            if inquiry.user_id != user.id:
                return make_response(jsonify({'error': 'Access denied'}), 403)
        else:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        return make_response(inquiry.to_dict(), 200)
    
    @login_required
    def put(self, inquiry_id):
        inquiry = Inquiry.query.get(inquiry_id)
        if not inquiry:
            return make_response(jsonify({'error': 'Inquiry not found'}), 404)
        
        user = User.query.get(session['user_id'])
        
        # Only admin or property owner can update inquiry status
        if user.role not in ['admin', 'owner']:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        if user.role == 'owner':
            if inquiry.property.owner_id != user.id:
                return make_response(jsonify({'error': 'Access denied'}), 403)
        
        data = request.get_json()
        
        # Only admin can update status
        if 'status' in data and user.role == 'admin':
            if data['status'] in ['new', 'contacted', 'completed', 'archived']:
                inquiry.status = data['status']
        
        # Owner can add notes
        if 'notes' in data and user.role == 'owner':
            inquiry.notes = data.get('notes')
        
        db.session.commit()
        return make_response(inquiry.to_dict(), 200)
    
    @login_required
    def delete(self, inquiry_id):
        inquiry = Inquiry.query.get(inquiry_id)
        if not inquiry:
            return make_response(jsonify({'error': 'Inquiry not found'}), 404)
        
        user = User.query.get(session['user_id'])
        
        # Only admin can delete inquiries
        if user.role != 'admin':
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        db.session.delete(inquiry)
        db.session.commit()
        return make_response(jsonify({'message': 'Inquiry deleted'}), 200)


class PropertyInquiries(Resource):
    @login_required
    def get(self, property_id):
        """Get all inquiries for a specific property (owner/admin only)"""
        property = Property.query.get(property_id)
        if not property:
            return make_response(jsonify({'error': 'Property not found'}), 404)
        
        user = User.query.get(session['user_id'])
        
        if user.role == 'admin':
            inquiries = Inquiry.query.filter_by(property_id=property_id).all()
        elif user.role == 'owner':
            if property.owner_id != user.id:
                return make_response(jsonify({'error': 'Access denied'}), 403)
            inquiries = Inquiry.query.filter_by(property_id=property_id).all()
        else:
            return make_response(jsonify({'error': 'Access denied'}), 403)
        
        return make_response([i.to_dict() for i in inquiries], 200)


class MyInquiries(Resource):
    @login_required
    def get(self):
        """Get all inquiries created by the logged-in user"""
        user = User.query.get(session['user_id'])
        inquiries = Inquiry.query.filter_by(user_id=user.id).all()
        return make_response([i.to_dict() for i in inquiries], 200)


# ============== API ROUTES ==============
# Auth routes
api.add_resource(AuthRegister, '/api/register')
api.add_resource(AuthLogin, '/api/login')
api.add_resource(AuthLogout, '/api/logout')
api.add_resource(AuthCheck, '/api/me')

# User routes
api.add_resource(Users, '/api/users')
api.add_resource(UserById, '/api/users/<int:user_id>')

# Property routes
api.add_resource(Properties, '/api/properties')
api.add_resource(PropertyById, '/api/properties/<int:property_id>')

# Rental agreement routes
api.add_resource(RentalAgreements, '/api/rental-agreements')
api.add_resource(RentalAgreementById, '/api/rental-agreements/<int:agreement_id>')

# Admin routes
api.add_resource(VerifyTenant, '/api/verify-tenant/<int:user_id>')
api.add_resource(PendingTenants, '/api/pending-tenants')

# Amenity routes
api.add_resource(Amenities, '/api/amenities')
api.add_resource(PropertyAmenities, '/api/properties/<int:property_id>/amenities')

# Payment routes
api.add_resource(InitiatePayment, '/api/payments/initiate')
api.add_resource(PaymentStatus, '/api/payments/<int:payment_id>/status')
api.add_resource(Payments, '/api/payments')
api.add_resource(MpesaCallback, '/api/mpesa/callback')

# Inquiry routes
api.add_resource(Inquiries, '/api/inquiries')
api.add_resource(InquiryById, '/api/inquiries/<int:inquiry_id>')
api.add_resource(PropertyInquiries, '/api/properties/<int:property_id>/inquiries')
api.add_resource(MyInquiries, '/api/my-inquiries')


# ============== CATCH-ALL ROUTE FOR REACT FRONTEND ==============
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React app for all non-API routes"""
    if path.startswith('api/'):
        return make_response(jsonify({'error': 'API endpoint not found'}), 404)
    
    try:
        return app.send_static_file('index.html')
    except:
        return make_response(jsonify({
            'error': 'Frontend not built',
            'message': 'Run "cd client && npm run build" to build the frontend',
            'frontend_url': 'http://localhost:5173'
        }), 200)


if __name__ == '__main__':
    app.run(port=5555, debug=True)

