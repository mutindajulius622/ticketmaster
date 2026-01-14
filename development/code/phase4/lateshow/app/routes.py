"""
API routes for the Late Show application.

Routes:
- GET /episodes - Get all episodes
- GET /episodes/:id - Get a specific episode with its appearances
- GET /guests - Get all guests
- POST /appearances - Create a new appearance
"""
from flask import Blueprint, request, jsonify
from app.models import db, Episode, Guest, Appearance

api_bp = Blueprint('api', __name__)


@api_bp.route('/episodes', methods=['GET'])
def get_episodes():
    """Get all episodes."""
    episodes = Episode.query.all()
    return jsonify([episode.to_dict() for episode in episodes])


@api_bp.route('/episodes/<int:episode_id>', methods=['GET'])
def get_episode(episode_id):
    """Get a specific episode with its appearances."""
    episode = Episode.query.get(episode_id)
    
    if not episode:
        return jsonify({"error": "Episode not found"}), 404
    
    return jsonify(episode.to_dict(include_appearances=True))


@api_bp.route('/guests', methods=['GET'])
def get_guests():
    """Get all guests."""
    guests = Guest.query.all()
    return jsonify([guest.to_dict() for guest in guests])


@api_bp.route('/appearances', methods=['POST'])
def create_appearance():
    """Create a new appearance."""
    data = request.get_json()
    
    # Extract data from request
    rating = data.get('rating')
    episode_id = data.get('episode_id')
    guest_id = data.get('guest_id')
    
    # Validate required fields
    errors = []
    if rating is None:
        errors.append('rating is required')
    if episode_id is None:
        errors.append('episode_id is required')
    if guest_id is None:
        errors.append('guest_id is required')
    
    # Validate rating range
    if rating is not None:
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            errors.append('rating must be an integer between 1 and 5')
    
    # Validate episode exists
    if episode_id is not None:
        episode = Episode.query.get(episode_id)
        if not episode:
            errors.append('episode not found')
    
    # Validate guest exists
    if guest_id is not None:
        guest = Guest.query.get(guest_id)
        if not guest:
            errors.append('guest not found')
    
    if errors:
        return jsonify({"errors": errors}), 400
    
    # Create the appearance
    appearance = Appearance(
        rating=rating,
        episode_id=episode_id,
        guest_id=guest_id
    )
    
    db.session.add(appearance)
    db.session.commit()
    
    return jsonify(appearance.to_dict()), 201

