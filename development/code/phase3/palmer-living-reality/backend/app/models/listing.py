from datetime import datetime
from enum import Enum
import uuid
from app.extensions import db


class ListingType(Enum):
    RENT = 'rent'
    SALE = 'sale'


class Listing(db.Model):
    """Property listing model for rent or sale."""
    __tablename__ = 'listings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = db.Column(db.String(36), db.ForeignKey('properties.id'), nullable=False)
    
    # Listing details
    type = db.Column(db.Enum(ListingType), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Pricing
    price = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), default='KES')
    
    # Listing status
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    
    # Contact information
    contact_name = db.Column(db.String(100))
    contact_email = db.Column(db.String(120))
    contact_phone = db.Column(db.String(20))
    
    # Metadata
    views_count = db.Column(db.Integer, default=0)
    favorites_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    # Relationships
    property = db.relationship('Property', back_populates='listings')
    
    # Indexes
    __table_args__ = (
        db.Index('idx_listing_property', 'property_id'),
        db.Index('idx_listing_type', 'type'),
        db.Index('idx_listing_active', 'is_active'),
        db.Index('idx_listing_featured', 'is_featured'),
        db.Index('idx_listing_price', 'price'),
        db.Index('idx_listing_created', 'created_at'),
    )
    
    def to_dict(self):
        """Convert listing to dictionary."""
        return {
            'id': self.id,
            'property_id': self.property_id,
            'type': self.type.value if self.type else None,
            'title': self.title,
            'description': self.description,
            'price': float(self.price) if self.price else None,
            'currency': self.currency,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'views_count': self.views_count,
            'favorites_count': self.favorites_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'property': self.property.to_dict() if self.property else None
        }
    
    def increment_views(self):
        """Increment view count."""
        self.views_count += 1
        db.session.commit()
    
    def increment_favorites(self):
        """Increment favorites count."""
        self.favorites_count += 1
        db.session.commit()
    
    def decrement_favorites(self):
        """Decrement favorites count."""
        if self.favorites_count > 0:
            self.favorites_count -= 1
            db.session.commit()
    
    def is_expired(self):
        """Check if listing is expired."""
        if self.expires_at:
            return datetime.utcnow() > self.expires_at
        return False
    
    def __repr__(self):
        return f'<Listing {self.title}>'
