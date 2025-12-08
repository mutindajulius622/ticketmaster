import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from app.extensions import db
from app.models import User, MaintenanceTicket, Property

maintenance_bp = Blueprint('maintenance', __name__)


@maintenance_bp.route('', methods=['GET'])
@jwt_required()
def get_maintenance_tickets():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        query = MaintenanceTicket.query

        # Apply role-based filtering
        if current_user.role == 'property_owner':
            query = query.filter(
                MaintenanceTicket.property_id.in_(
                    db.session.query(Property.id).filter_by(owner_id=current_user_id)
                )
            )
        elif current_user.role == 'property_manager':
            query = query.filter(
                MaintenanceTicket.property_id.in_(
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

        tickets = query.order_by(MaintenanceTicket.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'data': [ticket.to_dict() for ticket in tickets.items],
            'pagination': {
                'page': tickets.page,
                'per_page': tickets.per_page,
                'total': tickets.total,
                'pages': tickets.pages,
                'has_next': tickets.has_next,
                'has_prev': tickets.has_prev
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch maintenance tickets',
            'error': str(e)
        }), 500


@maintenance_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
def get_maintenance_ticket(ticket_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        ticket = MaintenanceTicket.query.get_or_404(ticket_id)

        # Check authorization
        can_access = (
            ticket.tenant_id == current_user_id or
            ticket.property.owner_id == current_user_id or
            ticket.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_access:
            return jsonify({
                'success': False,
                'message': 'Not authorized to view this maintenance ticket'
            }), 403

        return jsonify({
            'success': True,
            'data': ticket.to_dict()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch maintenance ticket',
            'error': str(e)
        }), 500


@maintenance_bp.route('', methods=['POST'])
@jwt_required()
def create_maintenance_ticket():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        data = request.get_json()

        # Validate required fields
        required_fields = ['property_id', 'title', 'description', 'priority']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400

        # Check if property exists and user has access
        property = Property.query.get_or_404(data['property_id'])
        can_create = (
            property.owner_id == current_user_id or
            property.manager_id == current_user_id or
            current_user.role == 'admin' or
            current_user.role == 'tenant'  # Tenants can report issues
        )

        if not can_create:
            return jsonify({
                'success': False,
                'message': 'Not authorized to create maintenance ticket for this property'
            }), 403

        # Create maintenance ticket
        ticket = MaintenanceTicket(
            id=str(uuid.uuid4()),
            property_id=data['property_id'],
            tenant_id=current_user_id,
            title=data['title'].strip(),
            description=data['description'].strip(),
            priority=data['priority'],
            status='open',
            category=data.get('category')
        )

        db.session.add(ticket)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Maintenance ticket created successfully',
            'data': ticket.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create maintenance ticket',
            'error': str(e)
        }), 500


@maintenance_bp.route('/<ticket_id>', methods=['PUT'])
@jwt_required()
def update_maintenance_ticket(ticket_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        ticket = MaintenanceTicket.query.get_or_404(ticket_id)

        # Check authorization
        can_update = (
            ticket.property.owner_id == current_user_id or
            ticket.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_update:
            return jsonify({
                'success': False,
                'message': 'Not authorized to update this maintenance ticket'
            }), 403

        data = request.get_json()

        # Update allowed fields
        updatable_fields = ['title', 'description', 'priority', 'status', 'category', 'assigned_to_id', 'cost', 'completed_at']
        for field in updatable_fields:
            if field in data:
                if field == 'completed_at' and data[field]:
                    setattr(ticket, field, datetime.fromisoformat(data[field]))
                else:
                    setattr(ticket, field, data[field])

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Maintenance ticket updated successfully',
            'data': ticket.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update maintenance ticket',
            'error': str(e)
        }), 500


@maintenance_bp.route('/<ticket_id>', methods=['DELETE'])
@jwt_required()
def delete_maintenance_ticket(ticket_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admin can delete maintenance tickets'
            }), 403

        ticket = MaintenanceTicket.query.get_or_404(ticket_id)

        db.session.delete(ticket)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Maintenance ticket deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete maintenance ticket',
            'error': str(e)
        }), 500
