from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
import jwt
import bcrypt
import re
import uuid


class JWTHandler:
    """JWT token handling utilities"""
    
    @staticmethod
    def encode_token(data, expires_in=None):
        """Encode JWT token"""
        if expires_in is None:
            expires_in = current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
        
        payload = {
            **data,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + expires_in
        }
        
        return jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm=current_app.config['JWT_ALGORITHM']
        )
    
    @staticmethod
    def decode_token(token):
        """Decode JWT token"""
        try:
            return jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=[current_app.config['JWT_ALGORITHM']]
            )
        except jwt.InvalidTokenError as e:
            return None


class PasswordHandler:
    """Password hashing and validation utilities"""
    
    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
    
    @staticmethod
    def verify_password(password, hash_value):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hash_value.encode('utf-8'))
    
    @staticmethod
    def is_strong_password(password):
        """Validate password strength"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        if not re.search(r'[0-9]', password):
            return False, "Password must contain at least one digit"
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        return True, "Password is strong"


class ValidationHandler:
    """Data validation utilities"""
    
    @staticmethod
    def is_valid_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def is_valid_phone(phone):
        """Validate phone number (Kenya format)"""
        pattern = r'^(\+254|0)?[1-9]\d{8}$'
        return re.match(pattern, phone) is not None
    
    @staticmethod
    def generate_ticket_number():
        """Generate unique ticket number"""
        return f"TKT-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    @staticmethod
    def generate_transaction_id():
        """Generate unique transaction ID"""
        return f"TXN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8].upper()}"


def token_required(fn):
    """Decorator for protected routes requiring JWT token"""
    @wraps(fn)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            return fn(current_user_id, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Unauthorized', 'message': str(e)}), 401
    return decorated


def role_required(*roles):
    """Decorator for role-based access control"""
    def decorator(fn):
        @wraps(fn)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role')
            
            if user_role not in roles:
                return jsonify({'error': 'Forbidden', 'message': 'You do not have permission to access this resource'}), 403
            
            return fn(*args, **kwargs)
        return decorated_function
    return decorator


def handle_errors(fn):
    """Decorator for centralized error handling"""
    @wraps(fn)
    def decorated(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': 'Bad Request', 'message': str(e)}), 400
        except PermissionError as e:
            return jsonify({'error': 'Forbidden', 'message': str(e)}), 403
        except Exception as e:
            current_app.logger.error(f"Unhandled error: {str(e)}")
            return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected error occurred'}), 500
    return decorated
