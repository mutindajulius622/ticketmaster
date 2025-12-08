import uuid
from datetime import datetime
from app.extensions import db


class MaintenanceTicket(db.Model):
    __tablename__ = 'maintenance_tickets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = db.Column(db.String(36), db.ForeignKey('properties.id'), nullable=False)
    tenant_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # Ticket Details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100))  # plumbing, electrical, appliance, etc.

    # Priority and Status
    priority = db.Column(db.String(50), default='medium')  # low, medium, high, emergency
    status = db.Column(db.String(50), default='open')  # open, in_progress, completed, cancelled

    # Assignment
    assigned_to_id = db.Column(db.String(36), db.ForeignKey('users.id'))

    # Resolution
    resolution = db.Column(db.Text)
    cost = db.Column(db.Float)
    completed_at = db.Column(db.DateTime)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    property = db.relationship('Property', back_populates='maintenance_tickets')
    tenant = db.relationship('User', foreign_keys=[tenant_id], back_populates='maintenance_tickets')
    assigned_to = db.relationship('User', foreign_keys=[assigned_to_id], back_populates='assigned_tickets')

    def to_dict(self):
        return {
            'id': self.id,
            'property_id': self.property_id,
            'tenant_id': self.tenant_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'priority': self.priority,
            'status': self.status,
            'assigned_to_id': self.assigned_to_id,
            'resolution': self.resolution,
            'cost': self.cost,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'property': {
                'id': self.property.id,
                'name': self.property.name,
                'address': self.property.address
            } if self.property else None,
            'tenant': {
                'id': self.tenant.id,
                'first_name': self.tenant.first_name,
                'last_name': self.tenant.last_name
            } if self.tenant else None,
            'assigned_to': {
                'id': self.assigned_to.id,
                'first_name': self.assigned_to.first_name,
                'last_name': self.assigned_to.last_name
            } if self.assigned_to else None
        }
