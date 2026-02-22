from flask import Blueprint, request, jsonify
from app.models import db, Event, TicketType, User
from sqlalchemy import or_, and_, func
from datetime import datetime

search_bp = Blueprint('search', __name__, url_prefix='/api/search')


@search_bp.route('/suggestions', methods=['GET'])
def get_search_suggestions():
    """Get autocomplete suggestions for search"""
    try:
        query = request.args.get('q', '').lower().strip()
        
        if not query or len(query) < 2:
            return jsonify({'suggestions': []}), 200
        
        # Search for events
        events = db.session.query(Event).filter(
            Event.status == Event.Status.PUBLISHED,
            or_(
                Event.title.ilike(f'%{query}%'),
                Event.description.ilike(f'%{query}%'),
                Event.location.ilike(f'%{query}%')
            )
        ).limit(10).all()
        
        # Search for organizers
        organizers = db.session.query(User).filter(
            User.role == User.Role.ORGANIZER,
            or_(
                User.first_name.ilike(f'%{query}%'),
                User.last_name.ilike(f'%{query}%')
            )
        ).limit(5).all()
        
        suggestions = []
        
        # Add event suggestions
        for event in events:
            suggestions.append({
                'type': 'event',
                'title': event.title,
                'id': event.id,
                'category': event.category
            })
        
        # Add organizer suggestions
        for organizer in organizers:
            suggestions.append({
                'type': 'organizer',
                'title': f'{organizer.first_name} {organizer.last_name}',
                'id': organizer.id
            })
        
        return jsonify({'suggestions': suggestions}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/trending', methods=['GET'])
def get_trending_searches():
    """Get trending search topics"""
    try:
        # Get popular event categories
        trending = db.session.query(
            Event.category,
            func.count(Event.id).label('count')
        ).filter(
            Event.status == Event.Status.PUBLISHED
        ).group_by(Event.category).order_by(
            func.count(Event.id).desc()
        ).limit(10).all()
        
        results = [{'category': t[0], 'count': t[1]} for t in trending]
        
        return jsonify({'trending': results}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/nearby', methods=['GET'])
def get_nearby_events():
    """Get events near a geographic location"""
    try:
        latitude = request.args.get('lat', type=float)
        longitude = request.args.get('lng', type=float)
        radius_km = request.args.get('radius', default=50, type=float)
        
        if latitude is None or longitude is None:
            return jsonify({'error': 'Latitude and longitude required'}), 400
        
        # Simple distance calculation (Haversine formula)
        from sqlalchemy import func
        
        events = db.session.query(Event).filter(
            Event.status == Event.Status.PUBLISHED,
            Event.latitude.isnot(None),
            Event.longitude.isnot(None)
        ).all()
        
        # Filter by distance
        nearby = []
        for event in events:
            # Calculate distance
            from math import radians, cos, sin, asin, sqrt
            lon1, lat1, lon2, lat2 = map(radians, [longitude, latitude, event.longitude, event.latitude])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            r = 6371  # Radius of earth in kilometers
            distance = c * r
            
            if distance <= radius_km:
                nearby.append({
                    'id': event.id,
                    'title': event.title,
                    'location': event.location,
                    'distance_km': round(distance, 2),
                    'start_date': event.start_date.isoformat() if event.start_date else None
                })
        
        nearby.sort(key=lambda x: x['distance_km'])
        
        return jsonify({'events': nearby}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/filters', methods=['GET'])
def get_filter_options():
    """Get available filter options"""
    try:
        # Get unique categories
        categories = db.session.query(Event.category).distinct().all()
        categories = [c[0] for c in categories if c[0]]
        
        # Get unique locations
        locations = db.session.query(Event.location).distinct().filter(
            Event.location.isnot(None)
        ).limit(100).all()
        locations = [l[0] for l in locations if l[0]]
        
        # Get price range
        ticket_types = db.session.query(
            func.min(TicketType.price).label('min_price'),
            func.max(TicketType.price).label('max_price')
        ).first()
        
        price_range = {
            'min': float(ticket_types.min_price) if ticket_types.min_price else 0,
            'max': float(ticket_types.max_price) if ticket_types.max_price else 10000
        }
        
        return jsonify({
            'categories': categories,
            'locations': locations[:50],  # Limit for performance
            'price_range': price_range
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
