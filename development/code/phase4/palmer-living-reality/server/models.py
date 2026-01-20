from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates
from sqlalchemy.ext.associationproxy import association_proxy
from config import Config
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
    role = db.Column(db.String, nullable=False) # 'admin', 'owner', 'tenant'
    is_verified = db.Column(db.Boolean, default=False)  # For tenants, admin must verify
    phone = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    properties = db.relationship('Property', back_populates='owner', lazy=True)
    rental_agreements = db.relationship('RentalAgreement', back_populates='tenant', lazy=True)

    serialize_rules = ('-properties.owner', '-rental_agreements.tenant', '-_password_hash',)

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

class Property(db.Model, SerializerMixin):
    __tablename__ = 'properties'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    property_type = db.Column(db.String, nullable=False) # 'apartment', 'mansion', 'bungalow'
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String, nullable=False)
    address = db.Column(db.String, nullable=True)
    rent_amount = db.Column(db.Float, nullable=False)
    sale_price = db.Column(db.Float, nullable=True)
    is_for_rent = db.Column(db.Boolean, default=True)
    is_for_sale = db.Column(db.Boolean, default=False)
    image_url = db.Column(db.String)
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

