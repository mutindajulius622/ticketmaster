import os
from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash
import sys

def create_super_admin(email, password, first_name, last_name):
    app = create_app()
    with app.app_context():
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"User with email {email} already exists. Updating to Super Admin.")
            user.role = User.Role.SUPER_ADMIN
            user.password_hash = generate_password_hash(password)
        else:
            user = User(
                email=email,
                password_hash=generate_password_hash(password),
                first_name=first_name,
                last_name=last_name,
                role=User.Role.SUPER_ADMIN,
                status=User.Status.ACTIVE,
                email_verified=True
            )
            db.session.add(user)
        
        db.session.commit()
        print(f"Super Admin {email} created/updated successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python create_super_admin.py <email> <password> <first_name> <last_name>")
    else:
        create_super_admin(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
