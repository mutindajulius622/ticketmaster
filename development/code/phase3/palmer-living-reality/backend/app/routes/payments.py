import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from app.extensions import db
from app.models import User, Payment, Lease, Property

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('', methods=['GET'])
@jwt_required()
def get_payments():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        query = Payment.query

        # Apply role-based filtering
        if current_user.role == 'property_owner':
            query = query.filter(
                Payment.lease_id.in_(
                    db.session.query(Lease.id).filter(
                        Lease.property_id.in_(
                            db.session.query(Property.id).filter_by(owner_id=current_user_id)
                        )
                    )
                )
            )
        elif current_user.role == 'property_manager':
            query = query.filter(
                Payment.lease_id.in_(
                    db.session.query(Lease.id).filter(
                        Lease.property_id.in_(
                            db.session.query(Property.id).filter(
                                or_(
                                    Property.manager_id == current_user_id,
                                    Property.owner_id == current_user_id
                                )
                            )
                        )
                    )
                )
            )
        elif current_user.role == 'tenant':
            query = query.filter(
                Payment.lease_id.in_(
                    db.session.query(Lease.id).filter_by(tenant_id=current_user_id)
                )
            )

        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)

        payments = query.order_by(Payment.created_at.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'success': True,
            'data': [payment.to_dict(include_relationships=True) for payment in payments.items],
            'pagination': {
                'page': payments.page,
                'per_page': payments.per_page,
                'total': payments.total,
                'pages': payments.pages,
                'has_next': payments.has_next,
                'has_prev': payments.has_prev
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch payments',
            'error': str(e)
        }), 500


@payments_bp.route('/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        payment = Payment.query.get_or_404(payment_id)

        # Check authorization
        can_access = (
            payment.lease.tenant_id == current_user_id or
            payment.lease.property.owner_id == current_user_id or
            payment.lease.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_access:
            return jsonify({
                'success': False,
                'message': 'Not authorized to view this payment'
            }), 403

        return jsonify({
            'success': True,
            'data': payment.to_dict(include_relationships=True)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch payment',
            'error': str(e)
        }), 500


@payments_bp.route('', methods=['POST'])
@jwt_required()
def create_payment():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        data = request.get_json()

        # Validate required fields
        required_fields = ['lease_id', 'amount', 'payment_date', 'payment_method']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400

        # Check if lease exists and user has access
        lease = Lease.query.get_or_404(data['lease_id'])
        can_create = (
            lease.tenant_id == current_user_id or
            lease.property.owner_id == current_user_id or
            lease.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_create:
            return jsonify({
                'success': False,
                'message': 'Not authorized to create payment for this lease'
            }), 403

        # Create payment
        payment = Payment(
            id=str(uuid.uuid4()),
            lease_id=data['lease_id'],
            amount=float(data['amount']),
            payment_date=datetime.fromisoformat(data['payment_date']),
            payment_method=data['payment_method'],
            transaction_id=data.get('transaction_id'),
            notes=data.get('notes'),
            status='completed'
        )

        db.session.add(payment)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Payment recorded successfully',
            'data': payment.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to record payment',
            'error': str(e)
        }), 500


@payments_bp.route('/<payment_id>', methods=['PUT'])
@jwt_required()
def update_payment(payment_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        payment = Payment.query.get_or_404(payment_id)

        # Check authorization
        can_update = (
            payment.lease.property.owner_id == current_user_id or
            payment.lease.property.manager_id == current_user_id or
            current_user.role == 'admin'
        )

        if not can_update:
            return jsonify({
                'success': False,
                'message': 'Not authorized to update this payment'
            }), 403

        data = request.get_json()

        # Update allowed fields
        updatable_fields = ['amount', 'payment_date', 'payment_method', 'transaction_id', 'notes', 'status']
        for field in updatable_fields:
            if field in data:
                if field == 'payment_date':
                    setattr(payment, field, datetime.fromisoformat(data[field]))
                else:
                    setattr(payment, field, data[field])

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Payment updated successfully',
            'data': payment.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update payment',
            'error': str(e)
        }), 500


@payments_bp.route('/<payment_id>', methods=['DELETE'])
@jwt_required()
def delete_payment(payment_id):
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Only admin can delete payments'
            }), 403

        payment = Payment.query.get_or_404(payment_id)

        db.session.delete(payment)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Payment deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete payment',
            'error': str(e)
        }), 500
