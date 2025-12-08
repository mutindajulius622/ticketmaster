import uuid
import json
from datetime import datetime
from app.extensions import db


class Lease(db.Model):
    __tablename__ = 'leases'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = db.Column(db.String(36), db.ForeignKey('properties.id'), nullable=False)
    tenant_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # Lease Terms
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    monthly_rent = db.Column(db.Float, nullable=False)
    security_deposit = db.Column(db.Float, nullable=False)
    late_fee = db.Column(db.Float, default=50.00)
    utilities_included = db.Column(db.Text, default='[]')  # JSON string

    # Status
    status = db.Column(db.String(50), default='active')  # active, expired, terminated, pending

    # Documents
    document_url = db.Column(db.String(500))
    signed_date = db.Column(db.Date)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    property = db.relationship('Property', back_populates='leases')
    tenant = db.relationship('User', foreign_keys=[tenant_id], back_populates='leases')
    payments = db.relationship(
        'Payment',
        back_populates='lease',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )

    def to_dict(self):
        try:
            utilities = json.loads(self.utilities_included) if self.utilities_included else []
        except:
            utilities = []

        return {
            'id': self.id,
            'property_id': self.property_id,
            'tenant_id': self.tenant_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'monthly_rent': self.monthly_rent,
            'security_deposit': self.security_deposit,
            'late_fee': self.late_fee,
            'utilities_included': utilities,
            'status': self.status,
            'document_url': self.document_url,
            'signed_date': self.signed_date.isoformat() if self.signed_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'property': self.property.to_dict() if self.property else None,
            'tenant': {
                'id': self.tenant.id,
                'first_name': self.tenant.first_name,
                'last_name': self.tenant.last_name,
                'email': self.tenant.email
            } if self.tenant else None
        }
