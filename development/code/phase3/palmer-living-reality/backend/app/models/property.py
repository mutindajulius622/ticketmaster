from datetime import datetime
from enum import Enum
import uuid
from app.extensions import db
import json


class PropertyType(Enum):
    APARTMENT = 'apartment'
    HOUSE = 'house'
    COMMERCIAL = 'commercial'
    CONDO = 'condo'


class PropertyStatus(Enum):
    VACANT = 'vacant'
    OCCUPIED = 'occupied'
    UNDER_MAINTENANCE = 'under_maintenance'
    UNDER_RENOVATION = 'under_renovation'


class Property(db.Model):
    """Property/Apartment model."""
    __tablename__ = 'properties'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic Information
    name = db.Column(db.String(200), nullable=False)
    property_type = db.Column(db.Enum(PropertyType), nullable=False)
    
    # Address
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(100), default='Kenya')
    
    # Description
    description = db.Column(db.Text)
    
    # Property Details
    bedrooms = db.Column(db.Integer, nullable=False)
    bathrooms = db.Column(db.Integer, nullable=False)
    square_feet = db.Column(db.Integer)
    year_built = db.Column(db.Integer)
    amenities = db.Column(db.JSON, default=list)  # List of amenities
    features = db.Column(db.JSON, default=dict)   # Additional features
    
    # Ownership
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    manager_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    # Financial Information
    monthly_rent = db.Column(db.Numeric(10, 2))
    purchase_price = db.Column(db.Numeric(12, 2))
    security_deposit = db.Column(db.Numeric(10, 2))
    property_tax = db.Column(db.Numeric(10, 2))
    
    # Status
    status = db.Column(db.Enum(PropertyStatus), default=PropertyStatus.VACANT)
    is_listed = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = db.relationship(
        'User', 
        foreign_keys=[owner_id],
        back_populates='owned_properties'
    )
    
    manager = db.relationship(
        'User',
        foreign_keys=[manager_id],
        back_populates='managed_properties'
    )
    
    photos = db.relationship(
        'PropertyPhoto',
        back_populates='property',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    
    leases = db.relationship(
        'Lease',
        back_populates='property',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    
    maintenance_tickets = db.relationship(
        'MaintenanceTicket',
        back_populates='property',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    
    listings = db.relationship(
        'Listing',
        back_populates='property',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )
    
    # Indexes
    __table_args__ = (
        db.Index('idx_property_city_state', 'city', 'state'),
        db.Index('idx_property_status', 'status'),
        db.Index('idx_property_owner', 'owner_id'),
        db.Index('idx_property_manager', 'manager_id'),
    )
    
    def to_dict(self, include_relationships=False):
        """Convert property to dictionary."""
        data = {
            'id': self.id,
            'name': self.name,
            'type': self.property_type.value if self.property_type else None,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'country': self.country,
            'description': self.description,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'square_feet': self.square_feet,
            'year_built': self.year_built,
            'amenities': self.amenities or [],
            'features': self.features or {},
            'monthly_rent': float(self.monthly_rent) if self.monthly_rent else None,
            'purchase_price': float(self.purchase_price) if self.purchase_price else None,
            'security_deposit': float(self.security_deposit) if self.security_deposit else None,
            'property_tax': float(self.property_tax) if self.property_tax else None,
            'status': self.status.value if self.status else None,
            'is_listed': self.is_listed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'owner': {
                'id': self.owner.id,
                'first_name': self.owner.first_name,
                'last_name': self.owner.last_name,
                'email': self.owner.email
            } if self.owner else None,
            'manager': {
                'id': self.manager.id,
                'first_name': self.manager.first_name,
                'last_name': self.manager.last_name,
                'email': self.manager.email
            } if self.manager else None
        }
        
        if include_relationships:
            data['photos'] = [photo.to_dict() for photo in self.photos.limit(5).all()]
            data['active_lease'] = None
            active_lease = self.leases.filter_by(status='active').first()
            if active_lease:
                data['active_lease'] = active_lease.to_dict()
        
        return data
    
    def __repr__(self):
        return f'<Property {self.name}>'


class PropertyPhoto(db.Model):
    """Property photos model."""
    __tablename__ = 'property_photos'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = db.Column(db.String(36), db.ForeignKey('properties.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    property = db.relationship('Property', back_populates='photos')
    
    def to_dict(self):
        return {
            'id': self.id,
            'property_id': self.property_id,
            'url': self.url,
            'is_primary': self.is_primary,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
