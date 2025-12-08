import uuid
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_
from app.extensions import db
from app.models import User, Property, PropertyPhoto, Lease

properties_bp = Blueprint('properties', __name__)


def get_pagination_params():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)  # Limit to 100 per page
    return page, per_page


@properties_bp.route('', methods=['GET'])
@jwt_required()
def get_properties():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        query = Property.query

        # Apply role-based filtering
        if current_user.role == 'property_owner':
            query = query.filter_by(owner_id=current_user_id)
        elif current_user.role == 'property_manager':
            query = query.filter(
                or_(
                    Property.manager_id == current_user_id,
                    Property.owner_id == current_user_id
                )
            )
        elif current_user.role == 'tenant':
            # Get properties where tenant has active lease
            tenant_properties = db.session.query(Lease.property_id).filter(
                Lease.tenant_id == current_user_id,
                Lease.status == 'active'
            ).subquery()
            query = query.filter(Property.id.in_(tenant_properties))

        # Apply filters
        filters = {}

        if request.args.get('status'):
            filters['status'] = request.args.get('status')

        if request.args.get('type'):
            filters['type'] = request.args.get('type')

        if request.args.get('city'):
            filters['city'] = request.args.get('city')

        if request.args.get('bedrooms'):
            filters['bedrooms'] = int(request.args.get('bedrooms'))

        if request.args.get('is_listed'):
            filters['is_listed'] = request.args.get('is_listed').lower() == 'true'

        if request.args.get('owner_id'):
            filters['owner_id'] = request.args.get('owner_id')

        if request.args.get('manager_id'):
            filters['manager_id'] = request.args.get('manager_id')

        # Apply filters to query
        for key, value in filters.items():
            if hasattr(Property, key):
                query = query.filter(getattr(Property, key) == value)

        # Price range filter
        min_price = request.args.get('min_price')
        max_price = request.args.get('max_price')

        if min_price or max_price:
            price_filters = []
            if min_price:
                price_filters.append(Property.monthly_rent >= float(min_price))
            if max_price:
                price_filters.append(Property.monthly_rent <= float(max_price))
            query = query.filter(and_(*price_filters))

        # Pagination
        page, per_page = get_pagination_params()

        properties = query.order_by(Property.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'data': [prop.to_dict(include_relationships=True) for prop in properties.items],
            'pagination': {
                'page': properties.page,
                'per_page': properties.per_page,
                'total': properties.total,
                'pages': properties.pages,
                'has_next': properties.has_next,
                'has_prev': properties.has_prev
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch properties',
            'error': str(e)
        }), 500


@properties_bp.route('/<property_id>', methods=['GET'])
@jwt_required()
def get_property(property_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        property = Property.query.get_or_404(property_id)

        # Check authorization
        can_access = (
            property.owner_id == current_user_id or
            property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_access and current_user.role == 'tenant':
            # Check if tenant has active lease for this property
            has_active_lease = Lease.query.filter(
                Lease.property_id == property_id,
                Lease.tenant_id == current_user_id,
                Lease.status == 'active'
            ).first()
            can_access = bool(has_active_lease)

        if not can_access:
            return jsonify({
                'success': False,
                'message': 'Not authorized to view this property'
            }), 403

        property_data = property.to_dict(include_relationships=True)

        return jsonify({
            'success': True,
            'data': property_data
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch property',
            'error': str(e)
        }), 500


@properties_bp.route('', methods=['POST'])
@jwt_required()
def create_property():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Check authorization
        allowed_roles = ['admin', 'owner', 'manager']
        if current_user.role not in allowed_roles:
            return jsonify({
                'success': False,
                'message': 'Not authorized to create properties'
            }), 403

        data = request.get_json()

        # Validate required fields
        required_fields = [
            'name', 'type', 'address', 'city', 'state', 'zip_code',
            'bedrooms', 'bathrooms'
        ]

        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400

        # Create property
        property = Property(
            id=str(uuid.uuid4()),
            name=data['name'].strip(),
            type=data['type'],
            address=data['address'].strip(),
            city=data['city'].strip(),
            state=data['state'].strip(),
            zip_code=data['zip_code'].strip(),
            country=data.get('country', 'Kenya').strip(),
            description=data.get('description', '').strip(),
            bedrooms=int(data['bedrooms']),
            bathrooms=int(data['bathrooms']),
            square_feet=data.get('square_feet'),
            year_built=data.get('year_built'),
            amenities=json.dumps(data.get('amenities', [])),
            features=json.dumps(data.get('features', {})),
            monthly_rent=data.get('monthly_rent'),
            purchase_price=data.get('purchase_price'),
            security_deposit=data.get('security_deposit'),
            property_tax=data.get('property_tax'),
            status='vacant',
            is_listed=data.get('is_listed', False),
            owner_id=current_user_id if current_user.role == 'property_owner' else data.get('owner_id', current_user_id),
            manager_id=data.get('manager_id')
        )

        db.session.add(property)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Property created successfully',
            'data': property.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create property',
            'error': str(e)
        }), 500


@properties_bp.route('/<property_id>', methods=['PUT'])
@jwt_required()
def update_property(property_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        property = Property.query.get_or_404(property_id)

        # Check authorization
        can_update = (
            property.owner_id == current_user_id or
            property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_update:
            return jsonify({
                'success': False,
                'message': 'Not authorized to update this property'
            }), 403

        data = request.get_json()

        # Update allowed fields
        updatable_fields = [
            'name', 'address', 'city', 'state', 'zip_code', 'country',
            'description', 'bedrooms', 'bathrooms', 'square_feet',
            'year_built', 'monthly_rent', 'purchase_price',
            'security_deposit', 'property_tax', 'is_listed', 'manager_id',
            'status'
        ]

        for field in updatable_fields:
            if field in data:
                if field == 'amenities':
                    setattr(property, field, json.dumps(data[field]))
                elif field == 'features':
                    setattr(property, field, json.dumps(data[field]))
                else:
                    setattr(property, field, data[field])

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Property updated successfully',
            'data': property.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update property',
            'error': str(e)
        }), 500


@properties_bp.route('/<property_id>', methods=['DELETE'])
@jwt_required()
def delete_property(property_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admin can delete properties'
            }), 403

        property = Property.query.get_or_404(property_id)

        db.session.delete(property)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Property deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete property',
            'error': str(e)
        }), 500
