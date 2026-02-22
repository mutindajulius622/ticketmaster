import time
from datetime import datetime, timedelta
from app.models import db, User, Venue, VenueSection, Seat
from flask_jwt_extended import create_access_token


def create_user(app, email='test@example.com'):
    user = User(
        email=email,
        password_hash='test',
        first_name='Test',
        last_name='User'
    )
    db.session.add(user)
    db.session.commit()
    return user


def create_venue_and_seat(app):
    venue = Venue(name='Test Venue', description='x', address='123 St', city='City', country='Country', capacity=100)
    db.session.add(venue)
    db.session.commit()

    section = VenueSection(venue_id=venue.id, name='Main', capacity=100, rows=10, seats_per_row=10)
    db.session.add(section)
    db.session.commit()

    seat = Seat(section_id=section.id, row=1, seat_number=1, status=Seat.Status.AVAILABLE, price=50.0)
    db.session.add(seat)
    db.session.commit()

    return venue, section, seat


def test_reserve_and_expire_release(client, app):
    with app.app_context():
        # create user and seat
        user = create_user(app)
        venue, section, seat = create_venue_and_seat(app)

        # create token
        token = create_access_token(identity=user.id)
        headers = {'Authorization': f'Bearer {token}'}

        # Reserve seat with short hold
        resp = client.post('/api/seats/reserve', json={'seat_ids': [seat.id], 'event_id': None, 'hold_seconds': 1}, headers=headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'reserved' in data and seat.id in data['reserved']

        # Ensure seat status is RESERVED
        s = Seat.query.get(seat.id)
        assert s.status == Seat.Status.RESERVED

        # Wait for expiration
        time.sleep(2)

        # Run cleanup logic here: mimic release script
        now = datetime.utcnow()
        expired = Seat.query.filter(Seat.status == Seat.Status.RESERVED, Seat.reserved_until.isnot(None), Seat.reserved_until < now).all()
        for es in expired:
            es.status = Seat.Status.AVAILABLE
            es.reserved_by = None
            es.reserved_until = None
        db.session.commit()

        # Verify seat released
        s2 = Seat.query.get(seat.id)
        assert s2.status == Seat.Status.AVAILABLE
