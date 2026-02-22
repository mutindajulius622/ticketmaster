"""
Migration script to add first_name and last_name columns to the users table.
Run this script to update an existing database.
"""
import sys
import os

# Add parent directory to path for imports when running directly
if __name__ == '__main__':
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

from server.main import app, db
from sqlalchemy import text

def migrate():
    with app.app_context():
        # Check if columns already exist
        inspector = db.inspector(db.engine)
        columns = [c['name'] for c in inspector.get_columns('users')]
        
        if 'first_name' in columns and 'last_name' in columns:
            print("Columns 'first_name' and 'last_name' already exist. Skipping migration.")
            return
        
        # Add first_name column
        if 'first_name' not in columns:
            print("Adding 'first_name' column...")
            db.session.execute(text("ALTER TABLE users ADD COLUMN first_name VARCHAR NOT NULL DEFAULT 'User'"))
            print("Added 'first_name' column.")
        
        # Add last_name column
        if 'last_name' not in columns:
            print("Adding 'last_name' column...")
            db.session.execute(text("ALTER TABLE users ADD COLUMN last_name VARCHAR NOT NULL DEFAULT ''"))
            print("Added 'last_name' column.")
        
        # Update existing users with placeholder names
        print("Updating existing users with placeholder names...")
        db.session.execute(text("UPDATE users SET first_name = 'User' WHERE first_name IS NULL OR first_name = ''"))
        db.session.execute(text("UPDATE users SET last_name = '' WHERE last_name IS NULL"))
        
        db.session.commit()
        print("Migration completed successfully!")

if __name__ == '__main__':
    migrate()

