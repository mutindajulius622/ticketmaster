import os
from app import create_app
from app.extensions import db
from app.models import User, Property, Lease, Payment, MaintenanceTicket
import click
from flask.cli import with_appcontext

app = create_app(os.getenv('FLASK_ENV') or 'development')


@app.cli.command("init-db")
@with_appcontext
def init_db_command():
    """Initialize the database."""
    db.drop_all()
    db.create_all()
    click.echo('Initialized the database.')


@app.cli.command("seed-db")
@with_appcontext
def seed_db_command():
    """Seed the database with sample data."""
    from datetime import datetime, timedelta
    import uuid

    # Check if users already exist
    if User.query.filter_by(email='admin@palmerliving.com').first():
        click.echo('Database already seeded.')
        return

    # Create admin user
    admin = User(
        id=str(uuid.uuid4()),
        email='admin@palmerliving.com',
        first_name='Admin',
        last_name='User',
        role='admin',
        is_active=True,
        is_verified=True
    )
    admin.password = 'Admin123!'

    # Create property owner
    owner = User(
        id=str(uuid.uuid4()),
        email='owner@muthuku.com',
        first_name='Muthuku',
        last_name='Apartments',
        role='owner',
        is_active=True,
        is_verified=True
    )
    owner.password = 'Owner123!'

    # Create property manager
    manager = User(
        id=str(uuid.uuid4()),
        email='manager@palmerliving.com',
        first_name='John',
        last_name='Manager',
        role='manager',
        is_active=True,
        is_verified=True
    )
    manager.password = 'Manager123!'

    # Create tenant
    tenant = User(
        id=str(uuid.uuid4()),
        email='tenant@example.com',
        first_name='Jane',
        last_name='Tenant',
        role='tenant',
        is_active=True,
        is_verified=True
    )
    tenant.password = 'Tenant123!'

    db.session.add_all([admin, owner, manager, tenant])
    db.session.commit()
    
    # Create properties
    property1 = Property(
        id=str(uuid.uuid4()),
        name='Muthuku Apartments',
        property_type='APARTMENT',
        address=' Wote makindu Road',
        city='makueni',
        state='kenya',
        zip_code='00100',
        bedrooms=2,
        bathrooms=1,
        square_feet=850,
        amenities=['parking', 'security', 'water backup'],
        monthly_rent=25000.00,
        security_deposit=50000.00,
        status='VACANT',
        owner_id=owner.id,
        manager_id=manager.id
    )

    property2 = Property(
        id=str(uuid.uuid4()),
        name='Muthuku Apartments - Unit 102',
        property_type='APARTMENT',
        address='Kathonzweni Road',
        city='Kathonzweni',
        state='kenya',
        zip_code='00100',
        bedrooms=3,
        bathrooms=2,
        square_feet=1200,
        amenities=['parking', 'security', 'water backup', 'balcony'],
        monthly_rent=35000.00,
        security_deposit=70000.00,
        status='OCCUPIED',
        owner_id=owner.id,
        manager_id=manager.id
    )
    
    db.session.add_all([property1, property2])
    db.session.commit()
    
    # Create lease for property 2
    lease = Lease(
        id=str(uuid.uuid4()),
        property_id=property2.id,
        tenant_id=tenant.id,
        start_date=datetime.utcnow().date() - timedelta(days=30),
        end_date=datetime.utcnow().date() + timedelta(days=335),
        monthly_rent=35000.00,
        security_deposit=70000.00,
        status='active'
    )
    
    db.session.add(lease)
    db.session.commit()
    
    # Create payment for lease
    payment = Payment(
        id=str(uuid.uuid4()),
        lease_id=lease.id,
        tenant_id=tenant.id,
        amount=35000.00,
        due_date=datetime.utcnow().date().replace(day=5),
        paid_date=datetime.utcnow().date(),
        payment_method='mpesa',
        status='paid',
        transaction_id='MPESA123456'
    )
    
    db.session.add(payment)
    db.session.commit()
    
    click.echo('Database seeded with sample data.')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
