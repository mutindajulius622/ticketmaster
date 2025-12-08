import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from app.extensions import db
from app.models import User, Lease, Property

leases_bp = Blueprint('leases', __name__)


@leases_bp.route('', methods=['GET'])
@jwt_required()
def get_leases():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        query = Lease.query

        # Apply role-based filtering
        if current_user.role == 'property_owner':
            query = query.filter(
                Lease.property_id.in_(
                    db.session.query(Property.id).filter_by(owner_id=current_user_id)
                )
            )
        elif current_user.role == 'property_manager':
            query = query.filter(
                Lease.property_id.in_(
                    db.session.query(Property.id).filter(
                        or_(
                            Property.manager_id == current_user_id,
                            Property.owner_id == current_user_id
                        )
                    )
                )
            )
        elif current_user.role == 'tenant':
            query = query.filter_by(tenant_id=current_user_id)

        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)

        leases = query.order_by(Lease.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'data': [lease.to_dict(include_relationships=True) for lease in leases.items],
            'pagination': {
                'page': leases.page,
                'per_page': leases.per_page,
                'total': leases.total,
                'pages': leases.pages,
                'has_next': leases.has_next,
                'has_prev': leases.has_prev
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch leases',
            'error': str(e)
        }), 500


@leases_bp.route('/<lease_id>', methods=['GET'])
@jwt_required()
def get_lease(lease_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        lease = Lease.query.get_or_404(lease_id)

        # Check authorization
        can_access = (
            lease.tenant_id == current_user_id or
            lease.property.owner_id == current_user_id or
            lease.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_access:
            return jsonify({
                'success': False,
                'message': 'Not authorized to view this lease'
            }), 403

        return jsonify({
            'success': True,
            'data': lease.to_dict(include_relationships=True)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch lease',
            'error': str(e)
        }), 500


@leases_bp.route('', methods=['POST'])
@jwt_required()
def create_lease():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Check authorization
        allowed_roles = ['admin', 'owner', 'manager']
        if current_user.role not in allowed_roles:
            return jsonify({
                'success': False,
                'message': 'Not authorized to create leases'
            }), 403

        data = request.get_json()

        # Validate required fields
        required_fields = ['property_id', 'tenant_id', 'start_date', 'end_date', 'monthly_rent']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400

        # Check if property exists and user has access
        property = Property.query.get_or_404(data['property_id'])
        if property.owner_id != current_user_id and property.manager_id != current_user_id and current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Not authorized to create lease for this property'
            }), 403

        # Check if tenant exists
        tenant = User.query.get_or_404(data['tenant_id'])
        if tenant.role != 'tenant':
            return jsonify({
                'success': False,
                'message': 'Invalid tenant specified'
            }), 400

        # Create lease
        lease = Lease(
            id=str(uuid.uuid4()),
            property_id=data['property_id'],
            tenant_id=data['tenant_id'],
            start_date=datetime.fromisoformat(data['start_date']),
            end_date=datetime.fromisoformat(data['end_date']),
            monthly_rent=float(data['monthly_rent']),
            security_deposit=data.get('security_deposit'),
            status='active'
        )

        db.session.add(lease)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Lease created successfully',
            'data': lease.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create lease',
            'error': str(e)
        }), 500


@leases_bp.route('/<lease_id>', methods=['PUT'])
@jwt_required()
def update_lease(lease_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        lease = Lease.query.get_or_404(lease_id)

        # Check authorization
        can_update = (
            lease.property.owner_id == current_user_id or
            lease.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_update:
            return jsonify({
                'success': False,
                'message': 'Not authorized to update this lease'
            }), 403

        data = request.get_json()

        # Update allowed fields
        updatable_fields = ['start_date', 'end_date', 'monthly_rent', 'security_deposit', 'status']
        for field in updatable_fields:
            if field in data:
                if field in ['start_date', 'end_date']:
                    setattr(lease, field, datetime.fromisoformat(data[field]))
                else:
                    setattr(lease, field, data[field])

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Lease updated successfully',
            'data': lease.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update lease',
            'error': str(e)
        }), 500


@leases_bp.route('/<lease_id>', methods=['DELETE'])
@jwt_required()
def delete_lease(lease_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admin can delete leases'
            }), 403

        lease = Lease.query.get_or_404(lease_id)

        db.session.delete(lease)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Lease deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete lease',
            'error': str(e)
        }), 500
