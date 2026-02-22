from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User
from app.utils.security import PasswordHandler, ValidationHandler, JWTHandler
from app.schemas.user_schema import UserSchema
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
user_schema = UserSchema()


@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('email') or not data.get('password') or not data.get('first_name') or not data.get('last_name'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if not ValidationHandler.is_valid_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        is_strong, msg = PasswordHandler.is_strong_password(data['password'])
        if not is_strong:
            return jsonify({'error': msg}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        user = User(
            email=data['email'],
            password_hash=PasswordHandler.hash_password(data['password']),
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone_number=data.get('phone_number'),
            role=data.get('role', User.Role.ATTENDEE)
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not PasswordHandler.verify_password(data['password'], user.password_hash):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if user.status == User.Status.BANNED:
            return jsonify({'error': 'Your account has been banned'}), 403
        
        if user.status == User.Status.INACTIVE:
            return jsonify({'error': 'Your account is inactive'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'email': user.email,
                'role': user.role,
                'full_name': f"{user.first_name} {user.last_name}"
            }
        )
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'email': user.email,
                'role': user.role,
                'full_name': f"{user.first_name} {user.last_name}"
            }
        )
        
        return jsonify({
            'access_token': access_token
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not PasswordHandler.verify_password(data['current_password'], user.password_hash):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        is_strong, msg = PasswordHandler.is_strong_password(data['new_password'])
        if not is_strong:
            return jsonify({'error': msg}), 400
        
        user.password_hash = PasswordHandler.hash_password(data['new_password'])
        db.session.commit()
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout"""
    # In a stateless JWT architecture, logout is handled client-side
    # Here we just return a success response
    return jsonify({'message': 'Logout successful'}), 200
