from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()


class BaseModel(db.Model):
    """Base model with common fields"""
    __abstract__ = True
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class User(BaseModel):
    """User model for all user types"""
    __tablename__ = 'users'
    
    class Role:
        ADMIN = 'admin'
        ORGANIZER = 'organizer'
        ATTENDEE = 'attendee'
        
        VALID_ROLES = [ADMIN, ORGANIZER, ATTENDEE]
    
    class Status:
        ACTIVE = 'active'
        INACTIVE = 'inactive'
        BANNED = 'banned'
        
        VALID_STATUSES = [ACTIVE, INACTIVE, BANNED]
    
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    role = db.Column(db.String(20), default=Role.ATTENDEE, nullable=False)
    status = db.Column(db.String(20), default=Status.ACTIVE, nullable=False)
    email_verified = db.Column(db.Boolean, default=False)
    is_2fa_enabled = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    events = db.relationship('Event', backref='organizer', lazy='dynamic', foreign_keys='Event.organizer_id')
    tickets = db.relationship('Ticket', backref='attendee', lazy='dynamic', foreign_keys='Ticket.attendee_id')
    reviews = db.relationship('Review', backref='reviewer', lazy='dynamic', cascade='all, delete-orphan')
    saved_events = db.relationship('Event', secondary='saved_events', backref='saved_by')
    payments = db.relationship('Payment', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'profile_picture': self.profile_picture,
            'bio': self.bio,
            'role': self.role,
            'status': self.status,
            'email_verified': self.email_verified,
            'full_name': f"{self.first_name} {self.last_name}"
        })
        return base_dict


class Event(BaseModel):
    """Event model"""
    __tablename__ = 'events'
    
    class Status:
        DRAFT = 'draft'
        PUBLISHED = 'published'
        ONGOING = 'ongoing'
        COMPLETED = 'completed'
        CANCELLED = 'cancelled'
        
        VALID_STATUSES = [DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED]
    
    class Category:
        MUSIC = 'music'
        SPORTS = 'sports'
        TECHNOLOGY = 'technology'
        BUSINESS = 'business'
        ENTERTAINMENT = 'entertainment'
        EDUCATION = 'education'
        HEALTH = 'health'
        OTHER = 'other'
        
        VALID_CATEGORIES = [MUSIC, SPORTS, TECHNOLOGY, BUSINESS, ENTERTAINMENT, EDUCATION, HEALTH, OTHER]
    
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default=Category.OTHER, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default=Status.DRAFT, nullable=False)
    organizer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    venue_id = db.Column(db.String(36), db.ForeignKey('venues.id'), nullable=True)
    total_attendees = db.Column(db.Integer, default=0)
    average_rating = db.Column(db.Float, default=0.0)
    tags = db.Column(db.String(500), nullable=True)  # CSV format
    is_featured = db.Column(db.Boolean, default=False)
    
    # Relationships
    ticket_types = db.relationship('TicketType', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    tickets = db.relationship('Ticket', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'image_url': self.image_url,
            'status': self.status,
            'organizer_id': self.organizer_id,
            'total_attendees': self.total_attendees,
            'average_rating': self.average_rating,
            'tags': self.tags.split(',') if self.tags else [],
            'is_featured': self.is_featured,
        })
        return base_dict


class TicketType(BaseModel):
    """Ticket type model (Early Bird, VIP, Regular)"""
    __tablename__ = 'ticket_types'
    
    class Type:
        EARLY_BIRD = 'early_bird'
        VIP = 'vip'
        REGULAR = 'regular'
        
        VALID_TYPES = [EARLY_BIRD, VIP, REGULAR]
    
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # Early Bird, VIP, Regular
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    sold = db.Column(db.Integer, default=0)
    description = db.Column(db.Text, nullable=True)
    start_sale = db.Column(db.DateTime, nullable=True)
    end_sale = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    tickets = db.relationship('Ticket', backref='ticket_type', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'event_id': self.event_id,
            'name': self.name,
            'type': self.type,
            'price': self.price,
            'quantity': self.quantity,
            'sold': self.sold,
            'available': self.quantity - self.sold,
            'description': self.description,
            'start_sale': self.start_sale.isoformat() if self.start_sale else None,
            'end_sale': self.end_sale.isoformat() if self.end_sale else None,
        })
        return base_dict


class Ticket(BaseModel):
    """Ticket model for purchased tickets"""
    __tablename__ = 'tickets'
    
    class Status:
        PENDING = 'pending'
        CONFIRMED = 'confirmed'
        USED = 'used'
        CANCELLED = 'cancelled'
        REFUNDED = 'refunded'
        
        VALID_STATUSES = [PENDING, CONFIRMED, USED, CANCELLED, REFUNDED]
    
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    ticket_type_id = db.Column(db.String(36), db.ForeignKey('ticket_types.id'), nullable=False)
    seat_id = db.Column(db.String(36), db.ForeignKey('seats.id'), nullable=True)
    attendee_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    payment_id = db.Column(db.String(36), db.ForeignKey('payments.id'), nullable=True)
    ticket_number = db.Column(db.String(50), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default=Status.PENDING, nullable=False)
    qr_code = db.Column(db.String(500), nullable=True)
    used_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    payment = db.relationship('Payment', backref='tickets', lazy='joined')
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'event_id': self.event_id,
            'ticket_type_id': self.ticket_type_id,
            'seat_id': self.seat_id,
            'attendee_id': self.attendee_id,
            'payment_id': self.payment_id,
            'ticket_number': self.ticket_number,
            'price': self.price,
            'status': self.status,
            'qr_code': self.qr_code,
            'used_at': self.used_at.isoformat() if self.used_at else None,
        })
        return base_dict


class Payment(BaseModel):
    """Payment model for ticket purchases"""
    __tablename__ = 'payments'
    
    class Status:
        PENDING = 'pending'
        COMPLETED = 'completed'
        FAILED = 'failed'
        REFUNDED = 'refunded'
        
        VALID_STATUSES = [PENDING, COMPLETED, FAILED, REFUNDED]
    
    class Method:
        MPESA = 'mpesa'
        CARD = 'card'
        BANK_TRANSFER = 'bank_transfer'
        
        VALID_METHODS = [MPESA, CARD, BANK_TRANSFER]
    
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='KES', nullable=False)
    method = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default=Status.PENDING, nullable=False)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    mpesa_receipt = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    metadata_json = db.Column('metadata', db.JSON, nullable=True)
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'user_id': self.user_id,
            'amount': self.amount,
            'currency': self.currency,
            'method': self.method,
            'status': self.status,
            'transaction_id': self.transaction_id,
            'mpesa_receipt': self.mpesa_receipt,
            'description': self.description,
            'metadata': self.metadata_json,
        })
        return base_dict


class Review(BaseModel):
    """Review/Rating model for events"""
    __tablename__ = 'reviews'
    
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    reviewer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    title = db.Column(db.String(255), nullable=True)
    comment = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'event_id': self.event_id,
            'reviewer_id': self.reviewer_id,
            'rating': self.rating,
            'title': self.title,
            'comment': self.comment,
        })
        return base_dict


class Venue(BaseModel):
    """Venue model for hosting events"""
    __tablename__ = 'venues'
    
    name = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False, index=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    capacity = db.Column(db.Integer, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    amenities = db.Column(db.JSON, nullable=True)  # parking, wifi, accessible, etc.
    
    # Relationships
    sections = db.relationship('VenueSection', backref='venue', lazy='dynamic', cascade='all, delete-orphan')
    events = db.relationship('Event', backref='venue', lazy='dynamic', foreign_keys='Event.venue_id')
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'name': self.name,
            'description': self.description,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'postal_code': self.postal_code,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'capacity': self.capacity,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'image_url': self.image_url,
            'amenities': self.amenities,
        })
        return base_dict


class VenueSection(BaseModel):
    """Seating sections within a venue"""
    __tablename__ = 'venue_sections'
    
    venue_id = db.Column(db.String(36), db.ForeignKey('venues.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # Floor 1, Section A, etc.
    capacity = db.Column(db.Integer, nullable=False)
    rows = db.Column(db.Integer, nullable=False)  # Number of rows
    seats_per_row = db.Column(db.Integer, nullable=False)  # Seats per row
    color = db.Column(db.String(7), nullable=True)  # Hex color for UI
    
    # Relationships
    seats = db.relationship('Seat', backref='section', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'venue_id': self.venue_id,
            'name': self.name,
            'capacity': self.capacity,
            'rows': self.rows,
            'seats_per_row': self.seats_per_row,
            'color': self.color,
        })
        return base_dict


class Seat(BaseModel):
    """Individual seat in a venue section"""
    __tablename__ = 'seats'
    
    class Status:
        AVAILABLE = 'available'
        RESERVED = 'reserved'
        SOLD = 'sold'
        BLOCKED = 'blocked'
        
        VALID_STATUSES = [AVAILABLE, RESERVED, SOLD, BLOCKED]
    
    section_id = db.Column(db.String(36), db.ForeignKey('venue_sections.id'), nullable=False)
    row = db.Column(db.Integer, nullable=False)  # Row number
    seat_number = db.Column(db.Integer, nullable=False)  # Seat number in row
    status = db.Column(db.String(20), default=Status.AVAILABLE, nullable=False)
    price = db.Column(db.Float, nullable=True)  # Seat-specific pricing
    accessibility = db.Column(db.JSON, nullable=True)  # wheelchair, aisle, etc.
    reserved_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    reserved_until = db.Column(db.DateTime, nullable=True, index=True)
    
    # Relationships
    tickets = db.relationship('Ticket', backref='seat', lazy='dynamic')
    
    __table_args__ = (
        db.Index('idx_section_row_seat', 'section_id', 'row', 'seat_number'),
    )
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'section_id': self.section_id,
            'row': self.row,
            'seat_number': self.seat_number,
            'status': self.status,
            'price': self.price,
            'accessibility': self.accessibility,
            'reserved_by': self.reserved_by,
            'reserved_until': self.reserved_until.isoformat() if self.reserved_until else None,
        })
        return base_dict


# Association table for saved events
saved_events = db.Table(
    'saved_events',
    db.Column('user_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('event_id', db.String(36), db.ForeignKey('events.id'), primary_key=True),
    db.Column('saved_at', db.DateTime, default=datetime.utcnow)
)
