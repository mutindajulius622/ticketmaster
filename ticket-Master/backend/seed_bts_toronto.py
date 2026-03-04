import os
from datetime import datetime
from app import create_app, db
from app.models import User, Event, Venue, VenueSection, Seat, TicketType, Ticket
from app.utils.security import PasswordHandler

def seed_bts_event():
    app = create_app()
    with app.app_context():
        # 1. Create Organizer
        organizer = User.query.filter_by(email='organizer@ticketmaster.com').first()
        if not organizer:
            organizer = User(
                email='organizer@ticketmaster.com',
                password_hash=PasswordHandler.hash_password('Organizer@123!'),
                first_name='Ticket',
                last_name='Organizer',
                role=User.Role.ORGANIZER,
                status=User.Status.ACTIVE,
                email_verified=True
            )
            db.session.add(organizer)
            db.session.commit()
            print("Organizer created.")
        else:
            organizer.password_hash = PasswordHandler.hash_password('Organizer@123!')
            db.session.commit()

        # 2. Create Venue
        venue = Venue.query.filter_by(name='Rogers Stadium').first()
        if not venue:
            venue = Venue(
                name='Rogers Stadium',
                description='Outdoor stadium in Toronto for major events.',
                address='123 Stadium Way',
                city='Toronto',
                state='Ontario',
                country='Canada',
                capacity=50000,
                image_url='https://example.com/rogers_stadium.jpg'
            )
            db.session.add(venue)
            db.session.commit()
            print("Venue created.")

        # 3. Create Venue Section C7
        section = VenueSection.query.filter_by(venue_id=venue.id, name='SEC C7').first()
        if not section:
            section = VenueSection(
                venue_id=venue.id,
                name='SEC C7',
                capacity=100,
                rows=10,
                seats_per_row=10,
                color='#FF0000'
            )
            db.session.add(section)
            db.session.commit()
            print("Section C7 created.")

        # 4. Create Seats (18-21) in Row 7
        seats = []
        for seat_num in range(18, 22):
            seat = Seat.query.filter_by(section_id=section.id, row=7, seat_number=seat_num).first()
            if not seat:
                seat = Seat(
                    section_id=section.id,
                    row=7,
                    seat_number=seat_num,
                    status=Seat.Status.RESERVED,
                    price=250.0
                )
                db.session.add(seat)
                seats.append(seat)
        db.session.commit()
        print("Seats 18-21 created.")

        # 5. Create Event
        # Date: Sat, Aug 22, 8:00 PM.
        start_date = datetime(2026, 8, 22, 20, 0, 0)
        end_date = datetime(2026, 8, 22, 23, 59, 0)
        
        event = Event.query.filter_by(title="BTS WORLD TOUR 'ARIRANG' IN TORONTO").first()
        if not event:
            event = Event(
                title="BTS WORLD TOUR 'ARIRANG' IN TORONTO",
                description="BTS World Tour Arirang in Toronto - Army Membership Presale",
                category=Event.Category.MUSIC,
                location='Toronto, Canada',
                start_date=start_date,
                end_date=end_date,
                status=Event.Status.PUBLISHED,
                organizer_id=organizer.id,
                venue_id=venue.id,
                is_featured=True
            )
            db.session.add(event)
            db.session.commit()
            print("Event created.")

        # 6. Create TicketType
        ticket_type = TicketType.query.filter_by(event_id=event.id, name='ARMY MEMBERSHIP PRESALE').first()
        if not ticket_type:
            ticket_type = TicketType(
                event_id=event.id,
                name='ARMY MEMBERSHIP PRESALE',
                type=TicketType.Type.VIP,
                price=250.0,
                quantity=100,
                sold=4,
                description='Special presale for ARMY members.'
            )
            db.session.add(ticket_type)
            db.session.commit()
            print("TicketType created.")

        # 7. Create Attendee (Luqman)
        attendee = User.query.filter_by(email='luqman@example.com').first()
        if not attendee:
            attendee = User(
                email='luqman@example.com',
                password_hash=PasswordHandler.hash_password('Luqman@123!'),
                first_name='Luqman',
                last_name='User',
                role=User.Role.ATTENDEE,
                status=User.Status.ACTIVE,
                email_verified=True
            )
            db.session.add(attendee)
            db.session.commit()
            print("Attendee Luqman created.")
        else:
            attendee.password_hash = PasswordHandler.hash_password('Luqman@123!')
            db.session.commit()

        # 8. Create Tickets for Seats 18-21
        order_num_base = "31-14693/C10"
        for i, seat_num in enumerate(range(18, 22)):
            # Find the seat again by number
            seat = Seat.query.filter_by(section_id=section.id, row=7, seat_number=seat_num).first()
            ticket_number = f"{order_num_base}-{seat_num}"
            ticket = Ticket.query.filter_by(ticket_number=ticket_number).first()
            if not ticket:
                ticket = Ticket(
                    event_id=event.id,
                    ticket_type_id=ticket_type.id,
                    seat_id=seat.id,
                    attendee_id=attendee.id,
                    ticket_number=ticket_number,
                    price=250.0,
                    status=Ticket.Status.CONFIRMED,
                    qr_code='https://example.com/qr/bts-toronto-ticket-' + str(seat_num)
                )
                db.session.add(ticket)
                # Update seat status
                seat.status = Seat.Status.SOLD
        
        db.session.commit()
        print("Tickets for Luqman (Seats 18-21) created.")

if __name__ == "__main__":
    seed_bts_event()
