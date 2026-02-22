from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import db, User, Event, Payment, Ticket
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def admin_required(fn):
    """Decorator to check if user is admin"""
    from functools import wraps
    @wraps(fn)
    def decorated_function(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != User.Role.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return decorated_function


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def list_users():
    """List all users (Admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        role = request.args.get('role')
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = User.query
        
        if role:
            query = query.filter_by(role=role)
        if status:
            query = query.filter_by(status=status)
        if search:
            query = query.filter(
                (User.email.ilike(f'%{search}%')) |
                (User.first_name.ilike(f'%{search}%')) |
                (User.last_name.ilike(f'%{search}%'))
            )
        
        total = query.count()
        users = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'users': [u.to_dict() for u in users.items],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<user_id>/role', methods=['PUT'])
@jwt_required()
@admin_required
def update_user_role(user_id):
    """Update user role (Admin only)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        new_role = data.get('role')
        
        if new_role not in User.Role.VALID_ROLES:
            return jsonify({'error': 'Invalid role'}), 400
        
        user.role = new_role
        db.session.commit()
        
        return jsonify({
            'message': 'User role updated successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<user_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_user_status(user_id):
    """Update user status (Admin only)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in User.Status.VALID_STATUSES:
            return jsonify({'error': 'Invalid status'}), 400
        
        user.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': 'User status updated successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/events', methods=['GET'])
@jwt_required()
@admin_required
def list_all_events():
    """List all events (Admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        
        query = Event.query
        
        if status:
            query = query.filter_by(status=status)
        
        total = query.count()
        events = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'events': [e.to_dict() for e in events.items],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/events/<event_id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_event(event_id):
    """Approve an event (Admin only)"""
    try:
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        event.status = Event.Status.PUBLISHED
        db.session.commit()
        
        return jsonify({
            'message': 'Event approved successfully',
            'event': event.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/events/<event_id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def reject_event(event_id):
    """Reject an event (Admin only)"""
    try:
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        data = request.get_json()
        reason = data.get('reason', 'Event was rejected by admin')
        
        # Store rejection reason if needed
        event.status = Event.Status.CANCELLED
        db.session.commit()
        
        return jsonify({
            'message': 'Event rejected successfully',
            'event': event.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
@admin_required
def get_analytics():
    """Get platform analytics (Admin only)"""
    try:
        # Calculate time period
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # User analytics
        total_users = User.query.count()
        organizers = User.query.filter_by(role=User.Role.ORGANIZER).count()
        attendees = User.query.filter_by(role=User.Role.ATTENDEE).count()
        new_users = User.query.filter(User.created_at >= start_date).count()
        
        # Event analytics
        total_events = Event.query.count()
        published_events = Event.query.filter_by(status=Event.Status.PUBLISHED).count()
        new_events = Event.query.filter(Event.created_at >= start_date).count()
        
        # Payment analytics
        total_revenue = db.session.query(db.func.sum(Payment.amount)).filter(
            Payment.status == Payment.Status.COMPLETED,
            Payment.created_at >= start_date
        ).scalar() or 0
        
        completed_payments = Payment.query.filter(
            Payment.status == Payment.Status.COMPLETED,
            Payment.created_at >= start_date
        ).count()
        
        # Ticket analytics
        total_tickets_sold = Ticket.query.filter(
            Ticket.status.in_([Ticket.Status.CONFIRMED, Ticket.Status.USED]),
            Ticket.created_at >= start_date
        ).count()
        
        return jsonify({
            'users': {
                'total': total_users,
                'organizers': organizers,
                'attendees': attendees,
                'new': new_users
            },
            'events': {
                'total': total_events,
                'published': published_events,
                'new': new_events
            },
            'payments': {
                'total_revenue': total_revenue,
                'completed_payments': completed_payments
            },
            'tickets': {
                'total_sold': total_tickets_sold
            },
            'period': {
                'days': days,
                'start_date': start_date.isoformat(),
                'end_date': datetime.utcnow().isoformat()
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/reports/revenue', methods=['GET'])
@jwt_required()
@admin_required
def revenue_report():
    """Get revenue report (Admin only)"""
    try:
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        payments = Payment.query.filter(
            Payment.status == Payment.Status.COMPLETED,
            Payment.created_at >= start_date
        ).all()
        
        total_revenue = sum(p.amount for p in payments)
        by_method = {}
        
        for payment in payments:
            method = payment.method
            if method not in by_method:
                by_method[method] = 0
            by_method[method] += payment.amount
        
        return jsonify({
            'total_revenue': total_revenue,
            'by_method': by_method,
            'payment_count': len(payments),
            'period_days': days
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
