import uuid
from datetime import datetime
from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class UserRole(Enum):
    ADMIN = 'admin'
    OWNER = 'owner'
    MANAGER = 'manager'
    TENANT = 'tenant'


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    avatar_url = db.Column(db.String(500))

    # Role management
    role = db.Column(db.String(50), nullable=False, default='tenant')  # admin, owner, manager, tenant
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relationships
    owned_properties = db.relationship(
        'Property',
        foreign_keys='Property.owner_id',
        back_populates='owner',
        lazy='dynamic'
    )

    managed_properties = db.relationship(
        'Property',
        foreign_keys='Property.manager_id',
        back_populates='manager',
        lazy='dynamic'
    )

    leases = db.relationship(
        'Lease',
        foreign_keys='Lease.tenant_id',
        back_populates='tenant',
        lazy='dynamic'
    )

    payments = db.relationship(
        'Payment',
        foreign_keys='Payment.tenant_id',
        back_populates='tenant',
        lazy='dynamic'
    )

    maintenance_tickets = db.relationship(
        'MaintenanceTicket',
        foreign_keys='MaintenanceTicket.tenant_id',
        back_populates='tenant',
        lazy='dynamic'
    )

    assigned_tickets = db.relationship(
        'MaintenanceTicket',
        foreign_keys='MaintenanceTicket.assigned_to_id',
        back_populates='assigned_to',
        lazy='dynamic'
    )

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'avatar_url': self.avatar_url,
            'role': self.role,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def __repr__(self):
        return f'<User {self.email}>'
