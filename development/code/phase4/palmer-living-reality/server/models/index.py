from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates
from sqlalchemy.ext.associationproxy import association_proxy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

# Many-to-Many association table for Property-Amenity with user-submittable attribute
property_amenities = db.Table('property_amenities',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('property_id', db.Integer, db.ForeignKey('properties.id'), nullable=False),
    db.Column('amenity_id', db.Integer, db.ForeignKey('amenities.id'), nullable=False),
    db.Column('user_note', db.String, nullable=True),  # User submittable attribute
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False) # 'admin', 'owner', 'tenant'
    is_verified = db.Column(db.Boolean, default=False)  # For tenants, admin must verify
    phone = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    properties = db.relationship('Property', back_populates='owner', lazy=True)
    rental_agreements = db.relationship('RentalAgreement', back_populates='tenant', lazy=True)
    payments = db.relationship('Payment', back_populates='user', lazy=True)

    serialize_rules = ('-properties.owner', '-rental_agreements.tenant', '-payments.user', '-_password_hash',)

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self._password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password)

    @validates('role')
    def validate_role(self, key, role):
        if role not in ['admin', 'owner', 'tenant']:
            raise ValueError("Role must be one of 'admin', 'owner', or 'tenant'")
        return role

    @validates('email')
    def validate_email(self, key, email):
        if '@' not in email:
            raise ValueError("Invalid email format")
        return email


# Properties model
class Property(db.Model, SerializerMixin):
    __tablename__ = 'properties'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    property_type = db.Column(db.String, nullable=False) # 'apartment', 'mansion', 'bungalow'
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String, nullable=False)
    address = db.Column(db.String, nullable=True)
    rent_amount = db.Column(db.Float, nullable=True)
    sale_price = db.Column(db.Float, nullable=True)
    is_for_rent = db.Column(db.Boolean, default=True)
    is_for_sale = db.Column(db.Boolean, default=False)
    image_url = db.Column(db.String, nullable=True)
    bedrooms = db.Column(db.Integer, default=0)
    bathrooms = db.Column(db.Float, default=0)
    square_feet = db.Column(db.Integer, nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner = db.relationship('User', back_populates='properties')
    rental_agreements = db.relationship('RentalAgreement', back_populates='property', lazy=True, cascade="all, delete-orphan")
    amenities = db.relationship('Amenity', secondary=property_amenities, back_populates='properties')

    serialize_rules = ('-owner.properties', '-rental_agreements.property', '-amenities.properties',)

    @validates('property_type')
    def validate_property_type(self, key, property_type):
        if property_type not in ['apartment', 'mansion', 'bungalow']:
            raise ValueError("Property type must be 'apartment', 'mansion', or 'bungalow'")
        return property_type

    @validates('rent_amount')
    def validate_rent_amount(self, key, rent_amount):
        if rent_amount is None:
            return rent_amount
        if rent_amount < 0:
            raise ValueError("Rent amount cannot be negative")
        return rent_amount

    @validates('bedrooms', 'bathrooms', 'square_feet')
    def validate_positive_integers(self, key, value):
        if value is not None and value < 0:
            raise ValueError(f"{key} cannot be negative")
        return value

class RentalAgreement(db.Model, SerializerMixin):
    __tablename__ = 'rental_agreements'

    id = db.Column(db.Integer, primary_key=True)
    rent_amount = db.Column(db.Float, nullable=False)
    lease_start_date = db.Column(db.Date, nullable=False)
    lease_end_date = db.Column(db.Date)
    verified = db.Column(db.Boolean, default=False)  # Admin verification required
    status = db.Column(db.String, default='pending')  # 'pending', 'active', 'terminated'
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    tenant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)

    tenant = db.relationship('User', back_populates='rental_agreements')
    property = db.relationship('Property', back_populates='rental_agreements')

    serialize_rules = ('-tenant.rental_agreements', '-property.rental_agreements',)

    @validates('rent_amount')
    def validate_rent_amount(self, key, rent_amount):
        if rent_amount < 0:
            raise ValueError("Rent amount cannot be negative")
        return rent_amount

class Amenity(db.Model, SerializerMixin):
    __tablename__ = 'amenities'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    properties = db.relationship('Property', secondary=property_amenities, back_populates='amenities')

    serialize_rules = ('-properties',)

# Property images for gallery
class PropertyImage(db.Model, SerializerMixin):
    __tablename__ = 'property_images'

    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    image_url = db.Column(db.String, nullable=False)
    caption = db.Column(db.String, nullable=True)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    property = db.relationship('Property', back_populates='images')

    serialize_rules = ('-property',)

# Add back_populates to Property for images
Property.images = db.relationship('PropertyImage', back_populates='property', lazy=True, cascade="all, delete-orphan")


# Payment model for tracking rent payments
class Payment(db.Model, SerializerMixin):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String, nullable=False)  # 'mpesa_stk_push', 'mpesa_paybill'
    phone_number = db.Column(db.String, nullable=False)
    account_reference = db.Column(db.String, nullable=True)
    transaction_desc = db.Column(db.String, nullable=True)
    status = db.Column(db.String, default='pending')  # 'pending', 'initiated', 'completed', 'failed'
    
    # M-Pesa specific fields
    checkout_request_id = db.Column(db.String, nullable=True)
    merchant_request_id = db.Column(db.String, nullable=True)
    mpesa_receipt_number = db.Column(db.String, nullable=True)
    transaction_id = db.Column(db.String, nullable=True)
    payment_date = db.Column(db.DateTime, nullable=True)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rental_agreement_id = db.Column(db.Integer, db.ForeignKey('rental_agreements.id'), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', back_populates='payments')
    rental_agreement = db.relationship('RentalAgreement', backref='payments')

    serialize_rules = ('-user.payments', '-rental_agreement.payments',)

    @validates('amount')
    def validate_amount(self, key, amount):
        if amount < 0:
            raise ValueError("Payment amount cannot be negative")
        return amount

    @validates('payment_method')
    def validate_payment_method(self, key, payment_method):
        if payment_method not in ['mpesa_stk_push', 'mpesa_paybill']:
            raise ValueError("Payment method must be 'mpesa_stk_push' or 'mpesa_paybill'")
        return payment_method

    @validates('status')
    def validate_status(self, key, status):
        if status not in ['pending', 'initiated', 'completed', 'failed']:
            raise ValueError("Status must be 'pending', 'initiated', 'completed', or 'failed'")
        return status


# Inquiry model for property inquiries (rent/sale)
class Inquiry(db.Model, SerializerMixin):
    __tablename__ = 'inquiries'

    id = db.Column(db.Integer, primary_key=True)
    inquiry_type = db.Column(db.String, nullable=False)  # 'rent' or 'sale'
    status = db.Column(db.String, default='new')  # 'new', 'contacted', 'completed', 'archived'
    
    # User contact info (optional - can be null for guest inquiries)
    user_name = db.Column(db.String, nullable=True)
    user_email = db.Column(db.String, nullable=True)
    user_phone = db.Column(db.String, nullable=True)
    
    # Inquiry details
    message = db.Column(db.Text, nullable=True)
    preferred_contact_method = db.Column(db.String, default='email')  # 'email', 'phone', 'whatsapp'
    preferred_move_in_date = db.Column(db.Date, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable for guest inquiries
    
    # Relationships
    property = db.relationship('Property', backref='inquiries')
    user = db.relationship('User', backref='inquiries')

    serialize_rules = ('-property.inquiries', '-user.inquiries',)

    @validates('inquiry_type')
    def validate_inquiry_type(self, key, inquiry_type):
        if inquiry_type not in ['rent', 'sale']:
            raise ValueError("Inquiry type must be 'rent' or 'sale'")
        return inquiry_type

    @validates('status')
    def validate_status(self, key, status):
        if status not in ['new', 'contacted', 'completed', 'archived']:
            raise ValueError("Status must be 'new', 'contacted', 'completed', or 'archived'")
        return status

    @validates('preferred_contact_method')
    def validate_contact_method(self, key, method):
        if method and method not in ['email', 'phone', 'whatsapp']:
            raise ValueError("Contact method must be 'email', 'phone', or 'whatsapp'")
        return method

