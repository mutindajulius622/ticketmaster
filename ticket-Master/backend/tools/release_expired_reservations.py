"""
Script to release expired seat reservations.
Run with the app context, e.g.: `python -m backend.tools.release_expired_reservations`
Or integrate into a scheduler/cron that runs every minute.
"""
from datetime import datetime
from app import create_app
from app.models import db, Seat

app = create_app()

with app.app_context():
    now = datetime.utcnow()
    expired = Seat.query.filter(Seat.status == Seat.Status.RESERVED, Seat.reserved_until.isnot(None), Seat.reserved_until < now).all()
    released = []
    for seat in expired:
        seat.status = Seat.Status.AVAILABLE
        try:
            seat.reserved_by = None
        except Exception:
            pass
        try:
            seat.reserved_until = None
        except Exception:
            pass
        released.append(seat.id)

    if released:
        db.session.commit()
        print(f"Released {len(released)} seats: {released}")
    else:
        print("No expired reservations found.")
