from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Payment, Ticket, User
from app.schemas.user_schema import PaymentSchema
from app.utils.integrations import PayPalHandler
from datetime import datetime

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')
payment_schema = PaymentSchema()


@payments_bp.route('/paypal/create-order', methods=['POST'])
@jwt_required()
def create_paypal_order():
    """Create PayPal order"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('payment_id'):
            return jsonify({'error': 'Missing payment_id'}), 400
        
        payment = Payment.query.get(data['payment_id'])
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        if payment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Create PayPal order
        paypal = PayPalHandler()
        result = paypal.create_order(
            amount=float(payment.amount),
            currency=payment.currency or 'USD',
            reference=payment.transaction_id,
            description=payment.description or 'Event Ticket Purchase',
            return_url=f"{current_app.config.get('FRONTEND_URL')}/checkout/success"
        )
        
        if result['success']:
            order_data = result['data']
            payment.metadata = {
                'paypal_order_id': order_data.get('id'),
                'status': order_data.get('status')
            }
            db.session.commit()
            
            # Return approval link
            approve_link = next(
                (link['href'] for link in order_data.get('links', []) if link['rel'] == 'approve'),
                None
            )
            
            return jsonify({
                'message': 'Order created successfully',
                'order_id': order_data.get('id'),
                'approve_link': approve_link,
                'data': order_data
            }), 201
        else:
            return jsonify({
                'error': 'Failed to create order',
                'details': result.get('error')
            }), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/create', methods=['POST'])
@jwt_required()
def create_payment():
    """Create a payment and associated ticket placeholders (PENDING)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        ticket_type_id = data.get('ticket_type_id')
        seat_ids = data.get('seat_ids', [])
        quantity = int(data.get('quantity', 0)) or 0

        # Calculate amount
        amount = 0.0
        tickets_to_create = []

        if seat_ids:
            for sid in seat_ids:
                seat = None
                try:
                    from app.models import Seat
                    seat = Seat.query.get(sid)
                except Exception:
                    seat = None
                if not seat:
                    return jsonify({'error': f'Seat not found: {sid}'}), 404
                amount += float(seat.price or 0)
                tickets_to_create.append({'seat_id': seat.id, 'price': seat.price or 0, 'ticket_type_id': ticket_type_id})
        elif ticket_type_id and quantity > 0:
            from app.models import TicketType
            tt = TicketType.query.get(ticket_type_id)
            if not tt:
                return jsonify({'error': 'Ticket type not found'}), 404
            amount = float(tt.price) * quantity
            for i in range(quantity):
                tickets_to_create.append({'seat_id': None, 'price': tt.price, 'ticket_type_id': ticket_type_id})
        else:
            return jsonify({'error': 'No seats or ticket type specified'}), 400

        # Create payment
        from app.utils.security import ValidationHandler
        payment = Payment(
            user_id=current_user_id,
            amount=amount,
            currency=data.get('currency', 'USD'),
            method=data.get('method', Payment.Method.CARD),
            status=Payment.Status.PENDING,
            transaction_id=ValidationHandler.generate_transaction_id(),
            description=data.get('description')
        )

        db.session.add(payment)
        db.session.flush()

        # Create tickets linked to this payment
        created_tickets = []
        for t in tickets_to_create:
            ticket = Ticket(
                event_id=data.get('event_id') or None,
                ticket_type_id=t.get('ticket_type_id') or None,
                seat_id=t.get('seat_id'),
                attendee_id=current_user_id,
                payment_id=payment.id,
                ticket_number=ValidationHandler.generate_ticket_number(),
                price=t.get('price') or 0,
                status=Ticket.Status.PENDING
            )
            db.session.add(ticket)
            created_tickets.append(ticket)

            # Mark seat as RESERVED if provided
            if t.get('seat_id'):
                s = Seat.query.get(t.get('seat_id'))
                if s and s.status == Seat.Status.AVAILABLE:
                    s.status = Seat.Status.RESERVED
                    s.reserved_by = current_user_id
                    from datetime import datetime, timedelta
                    s.reserved_until = datetime.utcnow() + timedelta(minutes=10)

        db.session.commit()

        return jsonify({'payment_id': payment.id, 'payment': payment.to_dict(), 'tickets': [t.to_dict() for t in created_tickets]}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/paypal/capture-order', methods=['POST'])
@jwt_required()
def capture_paypal_order():
    """Capture PayPal order after approval"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('order_id'):
            return jsonify({'error': 'Missing order_id'}), 400
        
        # Find payment by PayPal order ID
        payment = Payment.query.all()
        payment = next(
            (p for p in payment if p.metadata and p.metadata.get('paypal_order_id') == data['order_id']),
            None
        )
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        if payment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Capture payment
        paypal = PayPalHandler()
        result = paypal.capture_payment(data['order_id'])
        
        if result['success']:
            order_data = result['data']
            payment.status = Payment.Status.COMPLETED
            payment.metadata['paypal_order_data'] = order_data
            
            # Extract capture ID from purchase units
            try:
                capture_id = order_data['purchase_units'][0]['payments']['captures'][0]['id']
                payment.metadata['paypal_capture_id'] = capture_id
            except (KeyError, IndexError):
                pass
            
            # Update ticket statuses
            tickets = Ticket.query.filter_by(payment_id=payment.id).all()
            for ticket in tickets:
                ticket.status = Ticket.Status.CONFIRMED
            
            # Update event attendees count
            if tickets:
                event = tickets[0].event
                event.total_attendees += len(tickets)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Payment captured successfully',
                'payment': payment.to_dict(),
                'tickets': [t.to_dict() for t in tickets]
            }), 200
        else:
            payment.status = Payment.Status.FAILED
            db.session.commit()
            
            return jsonify({
                'error': 'Failed to capture payment',
                'details': result.get('error')
            }), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/paypal/callback', methods=['POST'])
def paypal_callback():
    """Handle PayPal webhook callback"""
    try:
        webhook_data = request.get_json()
        
        # Verify webhook
        paypal = PayPalHandler()
        if not paypal.verify_webhook(webhook_data):
            return jsonify({'status': 'ignored'}), 200
        
        event_type = webhook_data.get('event_type')
        resource = webhook_data.get('resource', {})
        
        if event_type == 'PAYMENT.CAPTURE.COMPLETED':
            # Payment completed via webhook
            order_id = resource.get('supplementary_data', {}).get('related_ids', {}).get('order_id')
            
            payment = Payment.query.all()
            payment = next(
                (p for p in payment if p.metadata and p.metadata.get('paypal_order_id') == order_id),
                None
            )
            
            if payment:
                payment.status = Payment.Status.COMPLETED
                
                # Update tickets
                tickets = Ticket.query.filter_by(payment_id=payment.id).all()
                for ticket in tickets:
                    ticket.status = Ticket.Status.CONFIRMED
                
                db.session.commit()
        
        elif event_type == 'PAYMENT.CAPTURE.REFUNDED':
            # Refund processed
            capture_id = resource.get('id')
            
            payment = Payment.query.all()
            payment = next(
                (p for p in payment if p.metadata and p.metadata.get('paypal_capture_id') == capture_id),
                None
            )
            
            if payment:
                payment.status = Payment.Status.REFUNDED
                
                # Update tickets
                tickets = Ticket.query.filter_by(payment_id=payment.id).all()
                for ticket in tickets:
                    ticket.status = Ticket.Status.REFUNDED
                    ticket.ticket_type.sold -= 1
                
                db.session.commit()
        
        return jsonify({'status': 'received'}), 200
    
    except Exception as e:
        current_app.logger.error(f"PayPal webhook error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@payments_bp.route('/<payment_id>/status', methods=['GET'])
@jwt_required()
def get_payment_status(payment_id):
    """Get payment status"""
    try:
        current_user_id = get_jwt_identity()
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        if payment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'payment': payment.to_dict(),
            'tickets': [t.to_dict() for t in Ticket.query.filter_by(payment_id=payment_id).all()]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('', methods=['GET'])
@jwt_required()
def get_user_payments():
    """Get payments for current user"""
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        query = Payment.query.filter_by(user_id=current_user_id)
        total = query.count()
        payments = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'payments': [p.to_dict() for p in payments.items],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/<payment_id>/refund', methods=['POST'])
@jwt_required()
def refund_payment(payment_id):
    """Refund a payment"""
    try:
        current_user_id = get_jwt_identity()
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        if payment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if payment.status != Payment.Status.COMPLETED:
            return jsonify({'error': 'Only completed payments can be refunded'}), 400
        
        # Perform PayPal refund
        paypal = PayPalHandler()
        capture_id = payment.metadata.get('paypal_capture_id') if payment.metadata else None
        
        if not capture_id:
            return jsonify({'error': 'No capture ID found for refund'}), 400
        
        result = paypal.refund_payment(
            capture_id=capture_id,
            amount=float(payment.amount),
            currency=payment.currency or 'USD'
        )
        
        if result['success']:
            payment.status = Payment.Status.REFUNDED
            
            # Mark tickets as refunded
            tickets = Ticket.query.filter_by(payment_id=payment_id).all()
            for ticket in tickets:
                ticket.status = Ticket.Status.REFUNDED
                ticket.ticket_type.sold -= 1
            
            db.session.commit()
            
            return jsonify({
                'message': 'Payment refunded successfully',
                'payment': payment.to_dict()
            }), 200
        else:
            return jsonify({
                'error': 'Failed to process refund',
                'details': result.get('error')
            }), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
