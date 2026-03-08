from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Ticket, TicketType, Event, Payment, User, Seat
from app.utils.security import ValidationHandler
from app.utils.email import send_ticket_email
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
    """Download ticket data (with QR code, generated on-the-fly if needed)"""
    try:
        current_user_id = get_jwt_identity()
        ticket = Ticket.query.get(ticket_id)

        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404

        if ticket.attendee_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Generate / refresh QR code if missing or is a plain URL (not base64)
        need_qr = (
            not ticket.qr_code or
            ticket.qr_code.startswith('http') or
            ticket.qr_code.startswith('https')
        )
        if need_qr:
            try:
                import qrcode, io, base64
                qr_content = f"TICKET:{ticket.ticket_number}|EVENT:{ticket.event_id}"
                qr_img = qrcode.make(qr_content)
                buf = io.BytesIO()
                qr_img.save(buf, format='PNG')
                ticket.qr_code = base64.b64encode(buf.getvalue()).decode()
                db.session.commit()
            except Exception as qr_err:
                current_app.logger.error(f"[QR GEN ERROR] {qr_err}")

        ticket_data = ticket.to_dict()
        return jsonify(ticket_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/email', methods=['POST'])
@jwt_required()
def email_ticket(ticket_id):
    """Send ticket to user's email"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        ticket = Ticket.query.get(ticket_id)

        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404

        if ticket.attendee_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Reuse existing logic
        ticket_dict = ticket.to_dict()
        event_dict = ticket.event.to_dict() if ticket.event else {}
        
        success = send_ticket_email(user.email, ticket_dict, event_dict)
        if success:
            return jsonify({'message': 'Ticket sent to email successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send email'}), 500

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


@tickets_bp.route('/<ticket_id>/transfer', methods=['POST'])
@jwt_required()
def transfer_ticket(ticket_id):
    """Transfer a ticket to another user"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        recipient_email = data.get('email')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        note = data.get('note', '')
        
        if not recipient_email:
            return jsonify({'error': 'Recipient email is required'}), 400
            
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
            
        if ticket.attendee_id != current_user_id:
            return jsonify({'error': 'Unauthorized: Only the owner can transfer this ticket'}), 403
            
        if ticket.status != Ticket.Status.CONFIRMED:
            return jsonify({'error': f'Cannot transfer ticket with status: {ticket.status}'}), 400
            
        # Find or create recipient
        recipient = User.query.filter_by(email=recipient_email).first()
        if not recipient:
            # Create a placeholder user
            from werkzeug.security import generate_password_hash
            import uuid
            
            recipient = User(
                email=recipient_email,
                password_hash=generate_password_hash(str(uuid.uuid4())),
                first_name=first_name or recipient_email.split('@')[0],
                last_name=last_name or 'User',
                role=User.Role.ATTENDEE,
                status=User.Status.ACTIVE,
                email_verified=False
            )
            db.session.add(recipient)
            db.session.flush() # Get the player ID
            
        # Perform transfer
        ticket.attendee_id = recipient.id
        db.session.commit()

        # Notify recipient by email
        try:
            ticket_dict = ticket.to_dict()
            event_dict = ticket.event.to_dict() if ticket.event else {}
            send_ticket_email(recipient_email, ticket_dict, event_dict)
        except Exception as email_err:
            current_app.logger.error(f"[TRANSFER EMAIL ERROR] {email_err}")
        
        return jsonify({
            'message': f'Ticket transferred successfully to {recipient_email}',
            'ticket': ticket.to_dict()
        }), 200

        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/quick-purchase', methods=['POST'])
def quick_purchase():
    """Create a ticket quickly with seat selection and QR code"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        event_id = data.get('event_id')
        seat_id = data.get('seat_id')
        
        if not all([email, first_name, last_name, event_id]):
            return jsonify({'error': 'Missing required fields (email, names, event_id)'}), 400
            
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
            
        # Find or create attendee
        attendee = User.query.filter_by(email=email).first()
        if not attendee:
            from werkzeug.security import generate_password_hash
            import uuid
            attendee = User(
                email=email,
                password_hash=generate_password_hash(str(uuid.uuid4())),
                first_name=first_name,
                last_name=last_name,
                role=User.Role.ATTENDEE,
                status=User.Status.ACTIVE,
                email_verified=True
            )
            db.session.add(attendee)
            db.session.flush()

        # Handle seat selection if provided
        seat = None
        if seat_id:
            seat = Seat.query.get(seat_id)
            if not seat:
                return jsonify({'error': 'Seat not found'}), 404
            if seat.status != Seat.Status.AVAILABLE and seat.status != Seat.Status.RESERVED:
                return jsonify({'error': 'Seat is already taken'}), 400
            seat.status = Seat.Status.SOLD

        # Find a default ticket type for the event
        ticket_type = event.ticket_types.first()
        if not ticket_type:
            ticket_type = TicketType(
                event_id=event.id,
                name='General Admission',
                type=TicketType.Type.REGULAR,
                price=10.0,
                quantity=1000,
                sold=0
            )
            db.session.add(ticket_type)
            db.session.flush()

        # Create ticket
        ticket = Ticket(
            event_id=event.id,
            ticket_type_id=ticket_type.id,
            seat_id=seat.id if seat else None,
            attendee_id=attendee.id,
            ticket_number=ValidationHandler.generate_ticket_number(),
            price=ticket_type.price,
            status=Ticket.Status.CONFIRMED
        )
        
        # Generate QR code
        qr_data = f"TICKET:{ticket.ticket_number}|EVENT:{event.title}|USER:{email}"
        if HAS_QR:
            import qrcode
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(qr_data)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            img_io = io.BytesIO()
            img.save(img_io, 'PNG')
            img_io.seek(0)
            ticket.qr_code = base64.b64encode(img_io.getvalue()).decode()
        
        db.session.add(ticket)
        ticket_type.sold += 1
        db.session.commit()
        
        # Send ticket confirmation email
        ticket_dict = ticket.to_dict()
        event_dict = event.to_dict()
        send_ticket_email(email, ticket_dict, event_dict)
        
        return jsonify({
            'message': 'Ticket created and email sent successfully',
            'ticket': ticket_dict
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
