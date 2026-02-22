"""
Database Setup Script for Palmer Living Reality
Creates admin, owner, and tenant demo accounts with sample properties

Run from project root:
    python -m server.setup_db
    
Or from server directory:
    python setup_db.py
"""
import sys
import os

# Add parent directory to path for imports when running directly
if __name__ == '__main__':
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

from flask import Flask
from flask_migrate import Migrate
from datetime import datetime, date, timedelta
from config import Config
from server.models.index import db


# Initialize extensions
migrate = Migrate()


def main():
    """Main setup function"""
    print("\n" + "="*60)
    print("Palmer Living Reality - Database Setup")
    print("="*60 + "\n")
    
    
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        # Import models inside app context to ensure proper initialization
        from server.models.index import User, Property, RentalAgreement
        
        # Create tables
        db.create_all()
        print("Database tables created/verified\n")
        
        # Define helper functions inside app context for access to db and models
        def create_demo_users(User):
            """Create demo users for testing"""
            users = []
            
            # Admin user - check by email OR by role to avoid duplicates
            existing_admin = User.query.filter(
                (User.email == 'juliusmwendwa082@gmail.com') | (User.role == 'admin')
            ).first()
            
            if not existing_admin:
                admin = User(
                    username='Palmer',
                    email='juliusmwendwa082@gmail.com',
                    first_name='Julius',
                    last_name='Mutinda',
                    role='admin',
                    is_verified=True
                )
                admin.password = '@Palmer39871011.'
                db.session.add(admin)
                users.append(admin)
                print("Created admin user: Palmer/@Palmer39871011.")
            else:
                print("Admin user already exists")
                users.append(existing_admin)
            
            # Property Owner
            if not User.query.filter_by(username='owner').first():
                owner = User(
                    username='owner',
                    email='owner@palmer.com',
                    first_name='Property',
                    last_name='Owner',
                    role='owner',
                    is_verified=True
                )
                owner.password = 'owner123'
                db.session.add(owner)
                users.append(owner)
                print("Created owner user: owner/owner123")
            else:
                print("Owner user already exists")
                users.append(User.query.filter_by(username='owner').first())
            
            # Second Property Owner
            if not User.query.filter_by(username='jane_properties').first():
                owner2 = User(
                    username='jane_properties',
                    email='jane@palmer.com',
                    first_name='Jane',
                    last_name='Properties',
                    role='owner',
                    is_verified=True
                )
                owner2.password = 'jane123'
                db.session.add(owner2)
                users.append(owner2)
                print("Created owner user: jane_properties/jane123")
            else:
                print("Jane owner user already exists")
                users.append(User.query.filter_by(username='jane_properties').first())
            
            # Verified Tenant
            if not User.query.filter_by(username='verified_tenant').first():
                verified_tenant = User(
                    username='verified_tenant',
                    email='verified@tenant.com',
                    first_name='Verified',
                    last_name='Tenant',
                    role='tenant',
                    is_verified=True
                )
                verified_tenant.password = 'tenant123'
                db.session.add(verified_tenant)
                users.append(verified_tenant)
                print("Created verified tenant: verified_tenant/tenant123")
            else:
                print("Verified tenant already exists")
                users.append(User.query.filter_by(username='verified_tenant').first())
            
            # Unverified Tenant (for testing admin verification workflow)
            if not User.query.filter_by(username='tenant').first():
                tenant = User(
                    username='tenant',
                    email='tenant@tenant.com',
                    first_name='New',
                    last_name='Tenant',
                    role='tenant',
                    is_verified=False  # Needs admin verification
                )
                tenant.password = 'tenant123'
                db.session.add(tenant)
                users.append(tenant)
                print("Created unverified tenant: tenant/tenant123 (needs admin verification)")
            else:
                print("Unverified tenant already exists")
                users.append(User.query.filter_by(username='tenant').first())
            
            db.session.commit()
            return users


        def create_sample_properties(Property, owners, db):
            """Create sample properties for demo"""
            owner1 = next((u for u in owners if u.username == 'owner'), owners[1] if len(owners) > 1 else owners[0])
            owner2 = next((u for u in owners if u.username == 'jane_properties'), owners[0])
            
            properties = []
            
            # Properties from owner1
            sample_props = [
                {
                    'name': 'Muthuku Luxury Apartments',
                    'property_type': 'apartment',
                    'description': 'Modern luxury apartments in the heart of Nairobi with stunning city views.',
                    'location': 'Nairobi',
                    'address': '123 Muthiki Road, Westlands',
                    'rent_amount': 45000,
                    'sale_price': None,
                    'is_for_rent': True,
                    'is_for_sale': False,
                    'bedrooms': 3,
                    'bathrooms': 2,
                    'square_feet': 1500,
                    'owner': owner1
                },
                {
                    'name': 'Palmer Heights Mansion',
                    'property_type': 'mansion',
                    'description': 'Stunning 6-bedroom mansion in the prestigious Karen area.',
                    'location': 'Karen, Nairobi',
                    'address': '45 Karen Road',
                    'rent_amount': 0,
                    'sale_price': 150000000,
                    'is_for_rent': False,
                    'is_for_sale': True,
                    'bedrooms': 6,
                    'bathrooms': 5,
                    'square_feet': 8500,
                    'owner': owner1
                },
                {
                    'name': 'Cozy Kileleshwa Bungalow',
                    'property_type': 'bungalow',
                    'description': 'Charming 3-bedroom bungalow in the serene Kileleshwa neighborhood.',
                    'location': 'Kileleshwa, Nairobi',
                    'address': '78 Kileleshwa Avenue',
                    'rent_amount': 65000,
                    'sale_price': 45000000,
                    'is_for_rent': True,
                    'is_for_sale': True,
                    'bedrooms': 3,
                    'bathrooms': 2,
                    'square_feet': 2200,
                    'owner': owner1
                }
            ]
            
            # Properties from owner2 (jane_properties)
            sample_props_2 = [
                {
                    'name': 'Westlands Studio Apartment',
                    'property_type': 'apartment',
                    'description': 'Compact and cozy studio apartment in the vibrant Westlands area.',
                    'location': 'Westlands, Nairobi',
                    'address': '201 Karibu Street',
                    'rent_amount': 25000,
                    'sale_price': None,
                    'is_for_rent': True,
                    'is_for_sale': False,
                    'bedrooms': 1,
                    'bathrooms': 1,
                    'square_feet': 600,
                    'owner': owner2
                },
                {
                    'name': 'Riverside Family Home',
                    'property_type': 'bungalow',
                    'description': 'Spacious family home near the river.',
                    'location': 'Riverside Drive, Nairobi',
                    'address': '15 Riverside Close',
                    'rent_amount': 85000,
                    'sale_price': 65000000,
                    'is_for_rent': True,
                    'is_for_sale': True,
                    'bedrooms': 4,
                    'bathrooms': 3,
                    'square_feet': 3200,
                    'owner': owner2
                },
                {
                    'name': 'Kilimani Penthouse',
                    'property_type': 'apartment',
                    'description': 'Luxurious penthouse with panoramic city views.',
                    'location': 'Kilimani, Nairobi',
                    'address': '88 Kilimani Road',
                    'rent_amount': 120000,
                    'sale_price': 95000000,
                    'is_for_rent': True,
                    'is_for_sale': True,
                    'bedrooms': 4,
                    'bathrooms': 3,
                    'square_feet': 2800,
                    'owner': owner2
                }
            ]
            
            all_props = sample_props + sample_props_2
            
            for prop_data in all_props:
                existing = Property.query.filter_by(name=prop_data['name']).first()
                if not existing:
                    property = Property(
                        name=prop_data['name'],
                        property_type=prop_data['property_type'],
                        description=prop_data['description'],
                        location=prop_data['location'],
                        address=prop_data['address'],
                        rent_amount=prop_data['rent_amount'],
                        sale_price=prop_data['sale_price'],
                        is_for_rent=prop_data['is_for_rent'],
                        is_for_sale=prop_data['is_for_sale'],
                        bedrooms=prop_data['bedrooms'],
                        bathrooms=prop_data['bathrooms'],
                        square_feet=prop_data['square_feet'],
                        owner_id=prop_data['owner'].id,
                        image_url='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
                    )
                    db.session.add(property)
                    properties.append(property)
                    print(f"Created property: {property.name}")
                else:
                    print(f"Property already exists: {existing.name}")
                    properties.append(existing)
            
            db.session.commit()
            return properties


        def create_sample_agreements(RentalAgreement, users, properties):
            """Create sample rental agreements for demo"""
            owner = next((u for u in users if u.username == 'owner'), users[0])
            verified_tenant = next((u for u in users if u.username == 'verified_tenant'), None)
            
            if not verified_tenant:
                print("No verified tenant found, skipping agreement creation")
                return
            
            # Find a property for rent
            rent_property = next((p for p in properties if p.is_for_rent and p.owner_id == owner.id), properties[0])
            
            # Check if agreement exists
            existing = RentalAgreement.query.filter_by(
                tenant_id=verified_tenant.id,
                property_id=rent_property.id
            ).first()
            
            if not existing:
                agreement = RentalAgreement(
                    rent_amount=rent_property.rent_amount,
                    lease_start_date=date.today(),
                    lease_end_date=date.today() + timedelta(days=365),
                    tenant_id=verified_tenant.id,
                    property_id=rent_property.id,
                    notes='Sample rental agreement for demo purposes',
                    verified=True,
                    status='active'
                )
                db.session.add(agreement)
                db.session.commit()
                print(f"Created rental agreement for {verified_tenant.username} on {rent_property.name}")
            else:
                print(f"Rental agreement already exists for {verified_tenant.username}")
        
        # Create demo users
        print("-"*40)
        print("Creating Demo Users")
        print("-"*40)
        users = create_demo_users(User)
        print(f"\nTotal users: {User.query.count()}")
        
        # Create sample properties
        print("\n" + "-"*40)
        print("Creating Sample Properties")
        print("-"*40)
        properties = create_sample_properties(Property, users, db)
        print(f"\nTotal properties: {Property.query.count()}")
        
        # Create sample agreements
        print("\n" + "-"*40)
        print("Creating Sample Agreements")
        print("-"*40)
        create_sample_agreements(RentalAgreement, users, properties)
        print(f"\nTotal agreements: {RentalAgreement.query.count()}")
        
        # Summary
        print("\n" + "="*60)
        print("Setup Complete!")
        print("="*60)
        print("\nDemo Accounts:")
        print("   Admin:     admin / admin123")
        print("   Owner:     owner / owner123")
        print("   Owner:     jane_properties / jane123")
        print("   Tenant:    verified_tenant / tenant123 (verified)")
        print("   Tenant:    tenant / tenant123 (unverified)")
        print("\nStart the servers:")
        print("   Backend:  python app.py")
        print("   Frontend: cd ../client && npm run dev")
        print("="*60 + "\n")


if __name__ == '__main__':
    main()