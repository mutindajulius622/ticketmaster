from app import app, db
from models import User
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
            username='Julius Mutinda',
            email='juliusmwendwa082@gmail.com',
            role='admin',
            is_verified=True
        )
        admin_user.password = 'admin123'  # Change this to a secure password

        db.session.add(admin_user)
        db.session.commit()
        print("Admin user created successfully.")
        print("Username: Julius Mutinda")
        print("Password: admin123")
        print("Please change the password after first login.")

if __name__ == '__main__':
    create_admin()