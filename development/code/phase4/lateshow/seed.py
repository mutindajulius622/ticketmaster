"""
Seed script to populate the database with sample data from CSV files.
"""
import csv
import os
from app import create_app
from app.models import db, Episode, Guest, Appearance

def seed_database():
    """Seed the database with sample data from CSV files."""
    app = create_app('development')
    
    with app.app_context():
        # Clear existing data
        Appearance.query.delete()
        Episode.query.delete()
        Guest.query.delete()
        
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        seed_data_dir = os.path.join(script_dir, 'seed_data')
        
        # Seed episodes from CSV
        episodes = []
        episodes_file = os.path.join(seed_data_dir, 'episodes.csv')
        with open(episodes_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                episode = Episode(
                    id=int(row['id']),
                    date=row['date'],
                    number=int(row['number'])
                )
                db.session.add(episode)
                episodes.append(episode)
        
        # Seed guests from CSV
        guests = []
        guests_file = os.path.join(seed_data_dir, 'guests.csv')
        with open(guests_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                guest = Guest(
                    id=int(row['id']),
                    name=row['name'],
                    occupation=row['occupation']
                )
                db.session.add(guest)
                guests.append(guest)
        
        # Commit to get IDs
        db.session.commit()
        
        # Seed appearances from CSV
        appearances = []
        appearances_file = os.path.join(seed_data_dir, 'appearances.csv')
        with open(appearances_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                appearance = Appearance(
                    id=int(row['id']),
                    rating=int(row['rating']),
                    guest_id=int(row['guest_id']),
                    episode_id=int(row['episode_id'])
                )
                db.session.add(appearance)
                appearances.append(appearance)
        
        db.session.commit()
        
        print("Database seeded successfully!")
        print(f"Created {len(episodes)} episodes")
        print(f"Created {len(guests)} guests")
        print(f"Created {len(appearances)} appearances")

if __name__ == '__main__':
    seed_database()

