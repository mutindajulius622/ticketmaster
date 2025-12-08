from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, UserRole

users_bp = Blueprint('users', __name__)


@users_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users - Admin and Manager access only."""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Check authorization - only admin and managers can list users
        if current_user.role not in ['admin', 'manager']:
            return jsonify({
                'success': False,
                'message': 'Not authorized to view users'
            }), 403

        # Get query parameters
        role_filter = request.args.get('role')
        active_filter = request.args.get('is_active')
        verified_filter = request.args.get('is_verified')

        query = User.query

        # Apply filters
        if role_filter:
            query = query.filter_by(role=role_filter)

        if active_filter is not None:
            is_active = active_filter.lower() == 'true'
            query = query.filter_by(is_active=is_active)

        if verified_filter is not None:
            is_verified = verified_filter.lower() == 'true'
            query = query.filter_by(is_verified=is_verified)

        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)

        users = query.order_by(User.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'data': [user.to_dict() for user in users.items],
            'pagination': {
                'page': users.page,
                'per_page': users.per_page,
                'total': users.total,
                'pages': users.pages,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch users',
            'error': str(e)
        }), 500


@users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get specific user details - Admin and Manager access only."""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Check authorization
        if current_user.role not in ['admin', 'manager']:
            return jsonify({
                'success': False,
                'message': 'Not authorized to view user details'
            }), 403

        user = User.query.get_or_404(user_id)

        return jsonify({
            'success': True,
            'data': user.to_dict()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch user',
            'error': str(e)
        }), 500


@users_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user - Admin only."""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Check authorization - only admin can update users
        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Not authorized to update users'
            }), 403

        user = User.query.get_or_404(user_id)
        data = request.get_json()

        # Update allowed fields
        updatable_fields = ['first_name', 'last_name', 'phone', 'role', 'is_active', 'is_verified']

        for field in updatable_fields:
            if field in data:
                if field == 'role':
                    # Validate role
                    try:
                        UserRole(data[field])
                        setattr(user, field, data[field])
                    except ValueError:
                        return jsonify({
                            'success': False,
                            'message': 'Invalid role specified'
                        }), 400
                else:
                    setattr(user, field, data[field])

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'data': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update user',
            'error': str(e)
        }), 500


@users_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def deactivate_user(user_id):
    """Deactivate user - Admin only."""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Check authorization - only admin can deactivate users
        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Not authorized to deactivate users'
            }), 403

        user = User.query.get_or_404(user_id)

        # Prevent deactivating self
        if user.id == current_user_id:
            return jsonify({
                'success': False,
                'message': 'Cannot deactivate your own account'
            }), 400

        user.is_active = False
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User deactivated successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to deactivate user',
            'error': str(e)
        }), 500


@users_bp.route('/<user_id>/verify', methods=['POST'])
@jwt_required()
def verify_user(user_id):
    """Verify user account - Admin only."""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Check authorization - only admin can verify users
        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Not authorized to verify users'
            }), 403

        user = User.query.get_or_404(user_id)

        user.is_verified = True
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User verified successfully',
            'data': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to verify user',
            'error': str(e)
        }), 500
