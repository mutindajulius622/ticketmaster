import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from app.extensions import db
from app.models import User, Listing, Property

listings_bp = Blueprint('listings', __name__)


@listings_bp.route('', methods=['GET'])
@jwt_required()
def get_listings():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        query = Listing.query

        # Apply role-based filtering
        if current_user.role == 'owner':
            query = query.filter(
                Listing.property_id.in_(
                    db.session.query(Property.id).filter_by(owner_id=current_user_id)
                )
            )
        elif current_user.role == 'manager':
            query = query.filter(
                Listing.property_id.in_(
                    db.session.query(Property.id).filter(
                        or_(
                            Property.manager_id == current_user_id,
                            Property.owner_id == current_user_id
                        )
                    )
                )
            )

        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)

        listings = query.order_by(Listing.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'data': [listing.to_dict(include_relationships=True) for listing in listings.items],
            'pagination': {
                'page': listings.page,
                'per_page': listings.per_page,
                'total': listings.total,
                'pages': listings.pages,
                'has_next': listings.has_next,
                'has_prev': listings.has_prev
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch listings',
            'error': str(e)
        }), 500


@listings_bp.route('/<listing_id>', methods=['GET'])
@jwt_required()
def get_listing(listing_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        listing = Listing.query.get_or_404(listing_id)

        # Check authorization
        can_access = (
            listing.property.owner_id == current_user_id or
            listing.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_access:
            return jsonify({
                'success': False,
                'message': 'Not authorized to view this listing'
            }), 403

        return jsonify({
            'success': True,
            'data': listing.to_dict(include_relationships=True)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch listing',
            'error': str(e)
        }), 500


@listings_bp.route('', methods=['POST'])
@jwt_required()
def create_listing():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Check authorization
        allowed_roles = ['admin', 'property_owner', 'property_manager']
        if current_user.role not in allowed_roles:
            return jsonify({
                'success': False,
                'message': 'Not authorized to create listings'
            }), 403

        data = request.get_json()

        # Validate required fields
        required_fields = ['property_id', 'title', 'description', 'price']
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
                'message': 'Not authorized to create listing for this property'
            }), 403

        # Create listing
        listing = Listing(
            id=str(uuid.uuid4()),
            property_id=data['property_id'],
            title=data['title'].strip(),
            description=data['description'].strip(),
            price=float(data['price']),
            listing_type=data.get('listing_type', 'rent'),
            status='active',
            featured=data.get('featured', False)
        )

        db.session.add(listing)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Listing created successfully',
            'data': listing.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create listing',
            'error': str(e)
        }), 500


@listings_bp.route('/<listing_id>', methods=['PUT'])
@jwt_required()
def update_listing(listing_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        listing = Listing.query.get_or_404(listing_id)

        # Check authorization
        can_update = (
            listing.property.owner_id == current_user_id or
            listing.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_update:
            return jsonify({
                'success': False,
                'message': 'Not authorized to update this listing'
            }), 403

        data = request.get_json()

        # Update allowed fields
        updatable_fields = ['title', 'description', 'price', 'listing_type', 'status', 'featured']
        for field in updatable_fields:
            if field in data:
                setattr(listing, field, data[field])

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Listing updated successfully',
            'data': listing.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update listing',
            'error': str(e)
        }), 500


@listings_bp.route('/<listing_id>', methods=['DELETE'])
@jwt_required()
def delete_listing(listing_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admin can delete listings'
            }), 403

        listing = Listing.query.get_or_404(listing_id)

        db.session.delete(listing)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Listing deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete listing',
            'error': str(e)
        }), 500
