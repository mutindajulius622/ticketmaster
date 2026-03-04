from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import db, User, Event, Payment, Ticket, Venue, VenueSection, Seat, TicketType
from datetime import datetime, timedelta
import os, uuid, base64

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def admin_required(fn):
    """Decorator to check if user is admin or super admin"""
    from functools import wraps
    @wraps(fn)
    def decorated_function(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') not in [User.Role.ADMIN, User.Role.SUPER_ADMIN]:
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return decorated_function


def super_admin_required(fn):
    """Decorator to check if user is super admin"""
    from functools import wraps
    @wraps(fn)
    def decorated_function(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != User.Role.SUPER_ADMIN:
            return jsonify({'error': 'Super Admin access required'}), 403
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


@admin_bp.route('/users/<user_id>/promote', methods=['POST'])
@jwt_required()
@super_admin_required
def promote_user_to_admin(user_id):
    """Promote a user to Admin (Super Admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.role = User.Role.ADMIN
        db.session.commit()
        
        return jsonify({
            'message': 'User promoted to Admin successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<user_id>/demote', methods=['POST'])
@jwt_required()
@super_admin_required
def demote_admin(user_id):
    """Demote an Admin to Attendee (Super Admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.role = User.Role.ATTENDEE
        db.session.commit()
        
        return jsonify({
            'message': 'Admin demoted to Attendee successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
@super_admin_required
def delete_user(user_id):
    """Delete a user (Super Admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
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


# ──────────────────────────────────────────────
# ADMIN EVENT CREATION (full pipeline)
# ──────────────────────────────────────────────

@admin_bp.route('/venues', methods=['GET'])
@jwt_required()
@admin_required
def list_venues():
    """List all venues (Admin)"""
    venues = Venue.query.all()
    return jsonify({'venues': [v.to_dict() for v in venues]}), 200


@admin_bp.route('/upload-image', methods=['POST'])
@jwt_required()
@admin_required
def upload_image():
    """Upload event image (base64) – stores file locally and returns path"""
    try:
        data = request.get_json()
        image_b64 = data.get('image')  # data:image/png;base64,.....
        if not image_b64:
            return jsonify({'error': 'No image provided'}), 400

        # Strip the data-URL prefix if present
        if ',' in image_b64:
            header, image_b64 = image_b64.split(',', 1)
            ext = header.split('/')[1].split(';')[0] if '/' in header else 'jpg'
        else:
            ext = 'jpg'

        filename = f"event_{uuid.uuid4().hex}.{ext}"
        upload_dir = os.path.join(current_app.root_path, '..', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(image_b64))

        # Return a URL the frontend can use
        image_url = f"{os.environ.get('API_URL', 'http://localhost:5000')}/uploads/{filename}"
        return jsonify({'image_url': image_url}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/events/create-full', methods=['POST'])
@jwt_required()
@admin_required
def create_full_event():
    """
    One-shot endpoint: creates Venue (or reuses existing), VenueSections,
    Seats, Event, and TicketTypes (VVIP / VIP / Regular).

    Expected JSON body:
    {
      "event": { title, description, category, location, start_date, end_date, image_url, tags },
      "venue": { name, address, city, state, country, reuse_id (optional) },
      "sections": [
        { name, ticket_type, rows, seats_per_row, color }
      ],
      "ticket_types": [
        { name, type, price, description }
      ]
    }
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        ev = data.get('event', {})
        vn = data.get('venue', {})
        sections_data = data.get('sections', [])
        ticket_types_data = data.get('ticket_types', [])

        # ── Venue ──
        venue = None
        if vn.get('reuse_id'):
            venue = Venue.query.get(vn['reuse_id'])
        if not venue:
            total_capacity = sum(
                int(s.get('rows', 0)) * int(s.get('seats_per_row', 0))
                for s in sections_data
            ) or 1000
            venue = Venue(
                name=vn.get('name', 'Main Venue'),
                description=vn.get('description', ''),
                address=vn.get('address', ''),
                city=vn.get('city', ''),
                state=vn.get('state', ''),
                country=vn.get('country', ''),
                capacity=total_capacity,
            )
            db.session.add(venue)
            db.session.flush()

        # ── Event ──
        start_date = datetime.fromisoformat(ev['start_date'].replace('Z', '+00:00').replace('+00:00', ''))
        end_date   = datetime.fromisoformat(ev['end_date'].replace('Z', '+00:00').replace('+00:00', ''))

        event = Event(
            title=ev['title'],
            description=ev.get('description', ''),
            category=ev.get('category', 'other'),
            location=ev.get('location', venue.city),
            start_date=start_date,
            end_date=end_date,
            image_url=ev.get('image_url', ''),
            tags=','.join(ev.get('tags', [])) if isinstance(ev.get('tags'), list) else ev.get('tags', ''),
            status=Event.Status.PUBLISHED,
            organizer_id=current_user_id,
            venue_id=venue.id,
            is_featured=ev.get('is_featured', False),
        )
        db.session.add(event)
        db.session.flush()

        # ── Sections + Seats ──
        TIER_COLORS = {
            'vvip': '#FFD700',   # gold
            'vip':  '#026CDF',   # blue
            'regular': '#6B7280' # gray
        }
        for sec in sections_data:
            rows = int(sec.get('rows', 5))
            spr  = int(sec.get('seats_per_row', 10))
            tier = sec.get('ticket_type', 'regular').lower()
            color = sec.get('color') or TIER_COLORS.get(tier, '#6B7280')

            section = VenueSection(
                venue_id=venue.id,
                name=sec.get('name', f"Section {tier.upper()}"),
                capacity=rows * spr,
                rows=rows,
                seats_per_row=spr,
                color=color,
            )
            db.session.add(section)
            db.session.flush()

            for row in range(1, rows + 1):
                for seat_num in range(1, spr + 1):
                    db.session.add(Seat(
                        section_id=section.id,
                        row=row,
                        seat_number=seat_num,
                        status=Seat.Status.AVAILABLE,
                    ))

        # ── Ticket Types ──
        for tt in ticket_types_data:
            total_qty = sum(
                int(s.get('rows', 5)) * int(s.get('seats_per_row', 10))
                for s in sections_data
                if s.get('ticket_type', '').lower() == tt.get('type', '').lower()
            ) or int(tt.get('quantity', 100))

            db.session.add(TicketType(
                event_id=event.id,
                name=tt['name'],
                type=tt['type'],
                price=float(tt['price']),
                quantity=total_qty,
                sold=0,
                description=tt.get('description', ''),
            ))

        db.session.commit()

        return jsonify({
            'message': 'Event created successfully',
            'event': event.to_dict(),
            'venue': venue.to_dict(),
        }), 201

    except KeyError as e:
        db.session.rollback()
        return jsonify({'error': f'Missing required field: {e}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
