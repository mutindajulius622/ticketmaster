from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Ticket, TicketType, Event, Payment, User
from app.schemas.user_schema import TicketSchema
from app.utils.security import ValidationHandler
from datetime import datetime
try:
    import qrcode
    HAS_QR = True
except Exception:
    qrcode = None
    HAS_QR = False
import io
import base64

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')
ticket_schema = TicketSchema()


@tickets_bp.route('', methods=['GET'])
@jwt_required()
def get_user_tickets():
    """Get tickets for current user"""
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        query = Ticket.query.filter_by(attendee_id=current_user_id)
        total = query.count()
        tickets = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'tickets': [t.to_dict() for t in tickets.items],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    """Get ticket details"""
    try:
        current_user_id = get_jwt_identity()
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        if ticket.attendee_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        ticket_data = ticket.to_dict()
        ticket_data['event'] = ticket.event.to_dict()
        ticket_data['ticket_type'] = ticket.ticket_type.to_dict()
        
        return jsonify(ticket_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('', methods=['POST'])
@jwt_required()
def purchase_ticket():
    """Purchase a ticket for an event"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('ticket_type_id') or not data.get('quantity'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        ticket_type = TicketType.query.get(data['ticket_type_id'])
        if not ticket_type:
            return jsonify({'error': 'Ticket type not found'}), 404
        
        event = Event.query.get(ticket_type.event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        quantity = int(data['quantity'])
        available = ticket_type.quantity - ticket_type.sold
        
        if quantity > available:
            return jsonify({'error': f'Only {available} tickets available'}), 400
        
        # Calculate total price
        total_price = quantity * ticket_type.price
        
        # Create payment record
        payment = Payment(
            user_id=current_user_id,
            amount=total_price,
            currency='KES',
            method=data.get('payment_method', Payment.Method.MPESA),
            status=Payment.Status.PENDING,
            transaction_id=ValidationHandler.generate_transaction_id(),
            description=f"Purchase of {quantity} ticket(s) for {event.title}"
        )
        
        db.session.add(payment)
        db.session.flush()  # Get payment ID
        
        # Create tickets
        tickets_created = []
        for i in range(quantity):
            ticket = Ticket(
                event_id=event.id,
                ticket_type_id=ticket_type.id,
                attendee_id=current_user_id,
                payment_id=payment.id,
                ticket_number=ValidationHandler.generate_ticket_number(),
                price=ticket_type.price,
                status=Ticket.Status.PENDING
            )
            
            # Generate QR code if library is available
            if HAS_QR:
                qr = qrcode.QRCode(version=1, box_size=10, border=5)
                qr.add_data(ticket.ticket_number)
                qr.make(fit=True)
                img = qr.make_image(fill_color="black", back_color="white")
                # Convert to base64
                img_io = io.BytesIO()
                img.save(img_io, 'PNG')
                img_io.seek(0)
                ticket.qr_code = base64.b64encode(img_io.getvalue()).decode()
            else:
                ticket.qr_code = None
            
            db.session.add(ticket)
            tickets_created.append(ticket)
        
        # Update ticket type sold count
        ticket_type.sold += quantity
        
        db.session.commit()
        
        return jsonify({
            'message': 'Tickets created successfully, awaiting payment confirmation',
            'payment': payment.to_dict(),
            'tickets': [t.to_dict() for t in tickets_created]
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_ticket(ticket_id):
    """Cancel a ticket"""
    try:
        current_user_id = get_jwt_identity()
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        if ticket.attendee_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if ticket.status not in [Ticket.Status.PENDING, Ticket.Status.CONFIRMED]:
            return jsonify({'error': 'Cannot cancel this ticket'}), 400
        
        ticket.status = Ticket.Status.CANCELLED
        
        # Update ticket type sold count
        ticket.ticket_type.sold -= 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ticket cancelled successfully',
            'ticket': ticket.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/download', methods=['GET'])
@jwt_required()
def download_ticket(ticket_id):
    """Download ticket (with QR code)"""
    try:
        current_user_id = get_jwt_identity()
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        if ticket.attendee_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Return ticket with QR code
        ticket_data = ticket.to_dict()
        ticket_data['qr_code_data'] = ticket.qr_code  # Already base64 encoded
        ticket_data['event'] = ticket.event.to_dict()
        ticket_data['ticket_type'] = ticket.ticket_type.to_dict()
        
        return jsonify(ticket_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/validate', methods=['POST'])
@jwt_required()
def validate_ticket(ticket_id):
    """Validate/scan a ticket (for event staff)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Only event organizers and admins can validate tickets
        if not user or user.role not in [User.Role.ORGANIZER, User.Role.ADMIN]:
            return jsonify({'error': 'Only event staff can validate tickets'}), 403
        
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        # Check if user is the event organizer
        if ticket.event.organizer_id != current_user_id and user.role != User.Role.ADMIN:
            return jsonify({'error': 'You can only validate tickets for your events'}), 403
        
        if ticket.status != Ticket.Status.CONFIRMED:
            return jsonify({'error': 'Ticket is not valid for validation'}), 400
        
        ticket.status = Ticket.Status.USED
        ticket.used_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ticket validated successfully',
            'ticket': ticket.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
