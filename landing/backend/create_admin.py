#!/usr/bin/env python3
"""
Script to create an admin user for the MCMiniBots Tournament platform.

Usage:
    python create_admin.py

This script will prompt for admin details and create an admin account.
"""

from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime

def create_admin_user():
    """Create an admin user interactively."""
    
    print("=== MCMiniBots Tournament - Create Admin User ===\n")
    
    # Get admin details
    username = input("Enter admin username: ").strip()
    if not username:
        print("Username cannot be empty!")
        return False
        
    email = input("Enter admin email: ").strip()
    if not email or '@' not in email:
        print("Please enter a valid email address!")
        return False
        
    password = input("Enter admin password: ").strip()
    if len(password) < 8:
        print("Password must be at least 8 characters long!")
        return False
    
    confirm_password = input("Confirm admin password: ").strip()
    if password != confirm_password:
        print("Passwords do not match!")
        return False
    
    # Import here to avoid issues if app is not properly configured
    try:
        from app import app, db, User
    except ImportError as e:
        print(f"Error importing app components: {e}")
        print("Make sure you're running this from the backend directory!")
        return False
    
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            if existing_user.is_admin:
                print(f"Admin user with email {email} already exists!")
                return False
            else:
                # Promote existing user to admin
                print(f"User {existing_user.username} found. Promoting to admin...")
                existing_user.is_admin = True
                db.session.commit()
                print(f"✅ User {existing_user.username} is now an admin!")
                return True
        
        # Check username
        existing_username = User.query.filter_by(username=username).first()
        if existing_username:
            print(f"Username {username} is already taken!")
            return False
        
        # Create new admin user
        try:
            admin_user = User(
                id=str(uuid.uuid4()),
                username=username,
                email=email,
                password_hash=generate_password_hash(password),
                is_admin=True,
                created_at=datetime.utcnow()
            )
            
            db.session.add(admin_user)
            db.session.commit()
            
            print(f"\n✅ Admin user created successfully!")
            print(f"Username: {username}")
            print(f"Email: {email}")
            print(f"Admin privileges: ✅")
            print(f"\nYou can now log in to the admin panel using these credentials.")
            
            return True
            
        except Exception as e:
            print(f"Error creating admin user: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = create_admin_user()
    exit(0 if success else 1)