import sys
import os

# Add parent directory to path for imports when running directly
if __name__ == '__main__':
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

from server.main import app, db
from server.models.index import User
from flask_cors import CORS
CORS(app)

def create_admin():
    with app.app_context():
        # Check if admin already exists
        admin = User.query.filter_by(role='admin').first()
        if admin:
            print("Admin user already exists.")
            return

        # Create admin user
        admin_user = User(
            username='admin',
            email='juliusmwendwa082@gmail.com',
            first_name='Julius',
            last_name='Mutinda',
            role='admin',
            is_verified=True
        )
        admin_user.password = '@Palmer39871011.'  # Change this to a secure password

        db.session.add(admin_user)
        db.session.commit()
        print("Admin user created successfully.")
        print("Username: Julius Mutinda")
        print("Password: @Palmer39871011.")
        print("Please change the password after first login.")

if __name__ == '__main__':
    create_admin()

