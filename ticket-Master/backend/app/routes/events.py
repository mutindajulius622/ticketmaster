from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import db, Event, TicketType, Ticket, User, Review
from app.schemas.user_schema import EventSchema, TicketTypeSchema, ReviewSchema
from datetime import datetime
from sqlalchemy import or_, and_

events_bp = Blueprint('events', __name__, url_prefix='/api/events')
event_schema = EventSchema()
ticket_type_schema = TicketTypeSchema()
review_schema = ReviewSchema()


@events_bp.route('', methods=['POST'])
@jwt_required()
def create_event():
    """Create a new event (Organizer only)"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        user = User.query.get(current_user_id)
        if not user or user.role not in [User.Role.ORGANIZER, User.Role.ADMIN]:
            return jsonify({'error': 'Only organizers can create events'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'location', 'start_date', 'end_date']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create event
        event = Event(
            title=data['title'],
            description=data['description'],
            category=data.get('category', Event.Category.OTHER),
            location=data['location'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            start_date=datetime.fromisoformat(data['start_date']),
            end_date=datetime.fromisoformat(data['end_date']),
            image_url=data.get('image_url'),
            status=Event.Status.DRAFT,
            organizer_id=current_user_id,
            tags=','.join(data.get('tags', [])) if data.get('tags') else None
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'message': 'Event created successfully',
            'event': event.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@events_bp.route('/<event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    """Update an event (Organizer only)"""
    try:
        current_user_id = get_jwt_identity()
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        if event.organizer_id != current_user_id:
            return jsonify({'error': 'You can only update your own events'}), 403
        
        data = request.get_json()
        
        # Update fields
        event.title = data.get('title', event.title)
        event.description = data.get('description', event.description)
        event.category = data.get('category', event.category)
        event.location = data.get('location', event.location)
        event.latitude = data.get('latitude', event.latitude)
        event.longitude = data.get('longitude', event.longitude)
        event.image_url = data.get('image_url', event.image_url)
        event.status = data.get('status', event.status)
        
        if 'start_date' in data:
            event.start_date = datetime.fromisoformat(data['start_date'])
        if 'end_date' in data:
            event.end_date = datetime.fromisoformat(data['end_date'])
        if 'tags' in data:
            event.tags = ','.join(data['tags']) if data['tags'] else None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Event updated successfully',
            'event': event.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@events_bp.route('/<event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Delete an event (Organizer only)"""
    try:
        current_user_id = get_jwt_identity()
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        if event.organizer_id != current_user_id:
            return jsonify({'error': 'You can only delete your own events'}), 403
        
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({'message': 'Event deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@events_bp.route('/<event_id>', methods=['GET'])
def get_event(event_id):
    """Get event details"""
    try:
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        event_data = event.to_dict()
        event_data['organizer'] = event.organizer.to_dict()
        event_data['ticket_types'] = [tt.to_dict() for tt in event.ticket_types]
        
        return jsonify(event_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@events_bp.route('', methods=['GET'])
def list_events():
    """List events with advanced filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        category = request.args.get('category')
        location = request.args.get('location')
        search = request.args.get('search')
        status = request.args.get('status', Event.Status.PUBLISHED)
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        price_min = request.args.get('priceMin', type=float)
        price_max = request.args.get('priceMax', type=float)
        tags = request.args.get('tags', '').split(',') if request.args.get('tags') else []
        featured = request.args.get('featured', type=bool)
        sort_by = request.args.get('sortBy', 'date')  # date, price, popularity
        
        query = Event.query.filter_by(status=status)
        
        if category:
            query = query.filter_by(category=category)
        
        if location:
            query = query.filter(Event.location.ilike(f'%{location}%'))
        
        if search:
            query = query.filter(
                or_(
                    Event.title.ilike(f'%{search}%'),
                    Event.description.ilike(f'%{search}%'),
                    Event.tags.ilike(f'%{search}%')
                )
            )
        
        # Date range filtering
        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date)
                query = query.filter(Event.start_date >= start_datetime)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_datetime = datetime.fromisoformat(end_date)
                query = query.filter(Event.end_date <= end_datetime)
            except ValueError:
                pass
        
        # Price range filtering (join with ticket types)
        if price_min is not None or price_max is not None:
            query = query.join(TicketType)
            if price_min is not None:
                query = query.filter(TicketType.price >= price_min)
            if price_max is not None:
                query = query.filter(TicketType.price <= price_max)
        
        # Tag filtering
        if tags and tags[0]:
            tag_filters = [Event.tags.ilike(f'%{tag.strip()}%') for tag in tags if tag.strip()]
            if tag_filters:
                query = query.filter(or_(*tag_filters))
        
        # Featured events
        if featured:
            query = query.filter(Event.featured == True)
        
        total = query.count()
        
        # Sorting
        if sort_by == 'price':
            # This would require aggregation, simplified for now
            query = query.order_by(Event.created_at.desc())
        elif sort_by == 'popularity':
            query = query.order_by(Event.view_count.desc() if hasattr(Event, 'view_count') else Event.created_at.desc())
        else:  # date
            query = query.order_by(Event.start_date.asc())
        
        events_paginated = query.paginate(page=page, per_page=limit)
        
        return jsonify({
            'events': [e.to_dict() for e in events_paginated.items],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@events_bp.route('/<event_id>/ticket-types', methods=['POST'])
@jwt_required()
def create_ticket_type(event_id):
    """Create ticket type for event"""
    try:
        current_user_id = get_jwt_identity()
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        if event.organizer_id != current_user_id:
            return jsonify({'error': 'You can only manage your own events'}), 403
        
        data = request.get_json()
        
        ticket_type = TicketType(
            event_id=event_id,
            name=data.get('name'),
            type=data.get('type'),
            price=data.get('price'),
            quantity=data.get('quantity'),
            description=data.get('description'),
            start_sale=datetime.fromisoformat(data['start_sale']) if data.get('start_sale') else None,
            end_sale=datetime.fromisoformat(data['end_sale']) if data.get('end_sale') else None,
        )
        
        db.session.add(ticket_type)
        db.session.commit()
        
        return jsonify({
            'message': 'Ticket type created successfully',
            'ticket_type': ticket_type.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@events_bp.route('/<event_id>/reviews', methods=['GET'])
def get_event_reviews(event_id):
    """Get reviews for an event"""
    try:
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        reviews = Review.query.filter_by(event_id=event_id).all()
        
        return jsonify({
            'reviews': [r.to_dict() for r in reviews],
            'average_rating': event.average_rating,
            'total_reviews': len(reviews)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@events_bp.route('/<event_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(event_id):
    """Create a review for an event"""
    try:
        current_user_id = get_jwt_identity()
        event = Event.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Check if user has a ticket for this event
        ticket = Ticket.query.filter_by(
            event_id=event_id,
            attendee_id=current_user_id,
            status=Ticket.Status.CONFIRMED
        ).first()
        
        if not ticket:
            return jsonify({'error': 'You must have attended this event to leave a review'}), 403
        
        data = request.get_json()
        
        review = Review(
            event_id=event_id,
            reviewer_id=current_user_id,
            rating=data.get('rating'),
            title=data.get('title'),
            comment=data.get('comment')
        )
        
        db.session.add(review)
        
        # Update event rating
        reviews = Review.query.filter_by(event_id=event_id).all()
        avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
        event.average_rating = avg_rating
        
        db.session.commit()
        
        return jsonify({
            'message': 'Review created successfully',
            'review': review.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
