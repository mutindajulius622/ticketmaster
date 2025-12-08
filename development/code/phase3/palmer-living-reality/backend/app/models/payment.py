from datetime import datetime
from enum import Enum
import uuid
from app.extensions import db


class PaymentStatus(Enum):
    PENDING = 'pending'
    PAID = 'paid'
    OVERDUE = 'overdue'
    PARTIAL = 'partial'
    FAILED = 'failed'
    REFUNDED = 'refunded'


class PaymentMethod(Enum):
    MPESA = 'mpesa'
    BANK_TRANSFER = 'bank_transfer'
    CHEQUE = 'cheque'
    CREDIT_CARD = 'credit_card'


class Payment(db.Model):
    """Payment model for rent and other payments."""
    __tablename__ = 'payments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lease_id = db.Column(db.String(36), db.ForeignKey('leases.id'), nullable=False)
    tenant_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Payment Details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    paid_date = db.Column(db.Date)
    
    # Payment Method
    payment_method = db.Column(db.Enum(PaymentMethod))
    transaction_id = db.Column(db.String(100))
    receipt_url = db.Column(db.String(500))
    
    # Status
    status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Type
    payment_type = db.Column(db.String(50), default='rent')  # rent, deposit, fee, maintenance
    description = db.Column(db.String(200))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lease = db.relationship('Lease', back_populates='payments')
    tenant = db.relationship('User', foreign_keys=[tenant_id], back_populates='payments')
    
    # Indexes
    __table_args__ = (
        db.Index('idx_payment_lease', 'lease_id'),
        db.Index('idx_payment_tenant', 'tenant_id'),
        db.Index('idx_payment_status', 'status'),
        db.Index('idx_payment_due_date', 'due_date'),
        db.Index('idx_payment_paid_date', 'paid_date'),
    )
    
    def to_dict(self):
        """Convert payment to dictionary."""
        return {
            'id': self.id,
            'lease_id': self.lease_id,
            'tenant_id': self.tenant_id,
            'amount': float(self.amount) if self.amount else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'payment_method': self.payment_method.value if self.payment_method else None,
            'transaction_id': self.transaction_id,
            'receipt_url': self.receipt_url,
            'status': self.status.value if self.status else None,
            'payment_type': self.payment_type,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'lease': self.lease.to_dict() if self.lease else None,
            'tenant': {
                'id': self.tenant.id,
                'first_name': self.tenant.first_name,
                'last_name': self.tenant.last_name
            } if self.tenant else None
        }
    
    def is_overdue(self):
        """Check if payment is overdue."""
        today = datetime.utcnow().date()
        return self.status == PaymentStatus.PENDING and self.due_date < today
    
    def mark_as_paid(self, payment_method, transaction_id=None):
        """Mark payment as paid."""
        self.status = PaymentStatus.PAID
        self.payment_method = payment_method
        self.paid_date = datetime.utcnow().date()
        self.transaction_id = transaction_id
    
    def __repr__(self):
        return f'<Payment {self.id}>'
