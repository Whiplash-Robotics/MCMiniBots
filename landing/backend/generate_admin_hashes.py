#!/usr/bin/env python3
"""
One-time script to generate password hashes for admin accounts.
Run this script, copy the hashes to admin_config.py, then delete this file.

Usage:
    python generate_admin_hashes.py
"""

from werkzeug.security import generate_password_hash
import getpass

def generate_admin_hashes():
    """Generate password hashes for admin accounts."""
    
    print("=== MCMiniBots Admin Password Hash Generator ===")
    print("This script will help you generate secure password hashes for admin accounts.")
    print("After copying the hashes to admin_config.py, DELETE THIS SCRIPT!\n")
    
    admin_accounts = [
        {'username': 'MCMINIBOTS ADMIN', 'email': 'admin.mcminibots@gmail.com'},
        {'username': 'Ryan Zhu Admin', 'email': 'zhuryan917@gmail.com'}
    ]
    
    print("Generated admin config (copy this to admin_config.py):\n")
    print("ADMIN_ACCOUNTS = [")
    
    for i, admin in enumerate(admin_accounts):
        print(f"\n  # {admin['username']}")
        password = getpass.getpass(f"Enter password for {admin['username']} ({admin['email']}): ")

        password_hash = generate_password_hash(password)
        
        print("  {")
        print(f"    'username': '{admin['username']}',")
        print(f"    'email': '{admin['email']}',")
        print(f"    'password_hash': '{password_hash}'")
        print("  }" + ("," if i < len(admin_accounts) - 1 else ""))
    
    print("]\n")
    print("IMPORTANT:")
    print("1. Copy the above ADMIN_ACCOUNTS array to admin_config.py")
    print("2. DELETE this generate_admin_hashes.py script")
    print("3. Never commit plain text passwords to the repo!")

if __name__ == "__main__":
    generate_admin_hashes()