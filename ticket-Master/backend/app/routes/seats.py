from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Seat, VenueSection, Venue
from datetime import datetime, timedelta

seats_bp = Blueprint('seats', __name__, url_prefix='/api/seats')


@seats_bp.route('/venue/<int:venue_id>/seatmap', methods=['GET'])
def get_venue_seatmap(venue_id):
    try:
        venue = Venue.query.get(venue_id)
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404

        sections = VenueSection.query.filter_by(venue_id=venue_id).all()
        payload = []
        for sec in sections:
            seats = Seat.query.filter_by(section_id=sec.id).order_by(Seat.row.asc(), Seat.seat_number.asc()).all()
            payload.append({
                'section': {
                    'id': sec.id,
                    'name': sec.name,
                    'rows': sec.rows,
                    'seats_per_row': sec.seats_per_row,
                },
                'seats': [s.to_dict() for s in seats]
            })

        return jsonify({'venue': venue.to_dict(), 'sections': payload}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@seats_bp.route('/reserve', methods=['POST'])
@jwt_required()
def reserve_seats():
    """Reserve seats temporarily for the current user"""
    try:
        data = request.get_json() or {}
        seat_ids = data.get('seat_ids', [])
        event_id = data.get('event_id')
        hold_seconds = int(data.get('hold_seconds', 600))

        if not seat_ids:
            return jsonify({'error': 'No seats specified'}), 400

        current_user_id = get_jwt_identity()
        now = datetime.utcnow()
        reserved = []
        conflicts = []

        for sid in seat_ids:
            seat = Seat.query.get(sid)
            if not seat:
                conflicts.append({'seat_id': sid, 'reason': 'not_found'})
                continue

            # If seat is not available, check if it's reserved but the reservation expired
            if seat.status != Seat.Status.AVAILABLE:
                if seat.status == Seat.Status.RESERVED and getattr(seat, 'reserved_until', None):
                    if seat.reserved_until and seat.reserved_until < now:
                        # expired reservation - allow re-reserve
                        seat.status = Seat.Status.AVAILABLE
                        if hasattr(seat, 'reserved_by'):
                            seat.reserved_by = None
                        if hasattr(seat, 'reserved_until'):
                            seat.reserved_until = None
                    else:
                        conflicts.append({'seat_id': sid, 'reason': f'unavailable ({seat.status})'})
                        continue
                else:
                    conflicts.append({'seat_id': sid, 'reason': f'unavailable ({seat.status})'})
                    continue

            seat.status = Seat.Status.RESERVED
            # Optional fields - only set if columns exist in model
            if hasattr(seat, 'reserved_by'):
                seat.reserved_by = current_user_id
            if hasattr(seat, 'reserved_until'):
                seat.reserved_until = now + timedelta(seconds=hold_seconds)

            reserved.append(seat.id)

        db.session.commit()

        return jsonify({'reserved': reserved, 'conflicts': conflicts}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@seats_bp.route('/release', methods=['POST'])
@jwt_required()
def release_seats():
    try:
        data = request.get_json() or {}
        seat_ids = data.get('seat_ids', [])

        if not seat_ids:
            return jsonify({'error': 'No seats specified'}), 400

        for sid in seat_ids:
            seat = Seat.query.get(sid)
            if not seat:
                continue
            seat.status = Seat.Status.AVAILABLE
            if hasattr(seat, 'reserved_by'):
                seat.reserved_by = None
            if hasattr(seat, 'reserved_until'):
                seat.reserved_until = None

        db.session.commit()
        return jsonify({'released': seat_ids}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
