import sys
import os

# Add parent directory to path for imports when running directly
if __name__ == '__main__':
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

from server.main import app
from server.models import db
from flask_cors import CORS

CORS(app)

# Ensure db is initialized with the app
db.init_app(app)


def seed_properties():
    """Seed properties into the database"""
    with app.app_context():
        # Import models inside app context to avoid SQLAlchemy initialization issues
        from models.index import User, Property
        
        # Get or create an owner user
        owner = User.query.filter_by(role='owner').first()
        if not owner:
            # Create an owner if none exists
            owner = User(
                username='property_owner',
                email='owner@palmer.com',
                first_name='Property',
                last_name='Owner',
                role='owner',
                is_verified=True
            )
            owner.password = 'owner123'
            db.session.add(owner)
            db.session.commit()
            print("Created owner user: property_owner / owner123")
        else:
            print(f"Using existing owner: {owner.username}")

        # Check if properties already exist
        existing_properties = Property.query.all()
        if existing_properties:
            print(f"Properties already exist ({len(existing_properties)}). Skipping seed.")
            return

        # Create sample properties
        properties = [
            {
                'name': 'Muthuku Apartments',
                'property_type': 'apartment',
                'description': 'Beautiful apartments located in the heart of the city. Features modern amenities, 24/7 security, and stunning city views. Perfect for young professionals and small families.',
                'location': 'Nairobi, Kenya',
                'address': '123 Muthuki Avenue, Westlands',
                'rent_amount': 25000,  # KES per month
                'sale_price': None,
                'is_for_rent': True,
                'is_for_sale': False,
                'image_url': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
                'bedrooms': 2,
                'bathrooms': 2,
                'square_feet': 1200
            },
            {
                'name': 'Modern Downtown Loft',
                'property_type': 'apartment',
                'description': 'A stylish and modern loft in the heart of downtown, with breathtaking city views and high-end finishes. Ideal for those who love the urban lifestyle.',
                'location': 'Downtown, Nairobi',
                'address': '789 Central Business District',
                'rent_amount': 50000,
                'sale_price': None,
                'is_for_rent': True,
                'is_for_sale': False,
                'image_url': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
                'bedrooms': 1,
                'bathrooms': 1,
                'square_feet': 800
            },
            {
                'name': 'Palmer Luxury Mansion',
                'property_type': 'mansion',
                'description': 'Stunning luxury mansion with expansive grounds, private pool, and panoramic views. Features 6 bedrooms, home theater, gym, and staff quarters. The ultimate in luxury living.',
                'location': 'Karen, Nairobi',
                'address': '456 Karen Road, Karen Estate',
                'rent_amount': None,
                'sale_price': 150000000,  # KES
                'is_for_rent': False,
                'is_for_sale': True,
                'image_url': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
                'bedrooms': 6,
                'bathrooms': 7,
                'square_feet': 8500
            },
            {
                'name': 'Cozy Bungalow',
                'property_type': 'bungalow',
                'description': 'Charming 3-bedroom bungalow in a quiet neighborhood. Features a spacious garden, modern kitchen, and covered parking. Perfect for families looking for a peaceful home.',
                'location': 'Kileleshwa, Nairobi',
                'address': '789 Kileleshwa Avenue',
                'rent_amount': None,
                'sale_price': 45000000,  # KES
                'is_for_rent': False,
                'is_for_sale': True,
                'image_url': 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop',
                'bedrooms': 3,
                'bathrooms': 2,
                'square_feet': 2500
            }
        ]

        for prop_data in properties:
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
                image_url=prop_data['image_url'],
                bedrooms=prop_data['bedrooms'],
                bathrooms=prop_data['bathrooms'],
                square_feet=prop_data['square_feet'],
                owner_id=owner.id
            )
            db.session.add(property)
            print(f"Added property: {property.name}")

        db.session.commit()
        print("\nAll sample properties seeded successfully!")
        print(f"- 2 Apartments for rent")
        print(f"- 1 Mansion for sale")
        print(f"- 1 Bungalow for sale")


if __name__ == '__main__':
    seed_properties()

