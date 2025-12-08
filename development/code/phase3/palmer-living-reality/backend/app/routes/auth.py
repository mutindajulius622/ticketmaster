from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, UserRole
from app.utils.validators import validate_email, validate_password
from datetime import datetime
import uuid

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        # Validate email
        if not validate_email(data['email']):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Validate password
        if not validate_password(data['password']):
            return jsonify({
                'success': False,
                'message': 'Password must be at least 8 characters with letters and numbers'
            }), 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email'].lower()).first():
            return jsonify({
                'success': False,
                'message': 'User already exists'
            }), 409
        
        # Validate role
        try:
            role = UserRole(data['role'])
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid role specified'
            }), 400
        
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=data['email'].lower(),
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            phone=data.get('phone', '').strip(),
            role=role,
            is_active=True,
            is_verified=False
        )
        user.password = data['password']  # This will hash the password
        
        # Save to database
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'data': {
                'user': user.to_dict(),
                'access_token': access_token
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Registration failed',
            'error': str(e)
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """User login."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Find user
        user = User.query.filter_by(email=data['email'].lower()).first()
        
        if not user or not user.verify_password(data['password']):
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Account is deactivated. Please contact administrator.'
            }), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user': user.to_dict(),
                'access_token': access_token
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Login failed',
            'error': str(e)
        }), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get profile',
            'error': str(e)
        }), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name'].strip()
        
        if 'last_name' in data:
            user.last_name = data['last_name'].strip()
        
        if 'phone' in data:
            user.phone = data['phone'].strip()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'data': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update profile',
            'error': str(e)
        }), 500


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change user password."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        
        # Validate required fields
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({
                'success': False,
                'message': 'Current password and new password are required'
            }), 400
        
        # Verify current password
        if not user.verify_password(data['current_password']):
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 401
        
        # Validate new password
        if not validate_password(data['new_password']):
            return jsonify({
                'success': False,
                'message': 'New password must be at least 8 characters with letters and numbers'
            }), 400
        
        # Update password
        user.password = data['new_password']
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to change password',
            'error': str(e)
        }), 500
