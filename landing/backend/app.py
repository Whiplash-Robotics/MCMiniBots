from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import json
import subprocess
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/mcminibots')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app)

from models import init_db_models
from utils.token_counter import count_tokens_from_code
from utils.security_scanner import scan_code
from admin_config import get_admin_accounts, is_admin_email, get_admin_by_email

# Initialize models with database instance
User, Category, Submission = init_db_models(db)

def initialize_admin_accounts():
    """Initialize admin accounts from admin_config.py on startup."""
    admin_accounts = get_admin_accounts()
    
    for admin_config in admin_accounts:
        # Skip if placeholder hash (not replaced yet)
        if 'REPLACE_WITH_REAL_HASH' in admin_config['password_hash'] or not admin_config['password_hash']:
            print(f"WARNING: Skipping admin {admin_config['username']} - placeholder hash detected")
            print("   Run generate_admin_hashes.py to create real hashes")
            continue
            
        # Check if admin already exists
        existing_admin = User.query.filter_by(email=admin_config['email']).first()
        
        if not existing_admin:
            # Create new admin
            admin_user = User(
                username=admin_config['username'],
                email=admin_config['email'],
                password_hash=admin_config['password_hash'],
                is_admin=True
            )
            db.session.add(admin_user)
            print(f"SUCCESS: Created admin account: {admin_config['username']} ({admin_config['email']})")
        else:
            # Update existing user to be admin
            if not existing_admin.is_admin:
                existing_admin.is_admin = True
                print(f"SUCCESS: Promoted {existing_admin.username} to admin")
            
            # Update password hash if different (allows password updates)
            if existing_admin.password_hash != admin_config['password_hash']:
                existing_admin.password_hash = admin_config['password_hash']
                print(f"SUCCESS: Updated password for admin: {admin_config['username']}")
    
    try:
        db.session.commit()
        print("SUCCESS: Admin account initialization complete!")
    except Exception as e:
        print(f"ERROR: Error initializing admin accounts: {e}")
        db.session.rollback()

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'success': False, 'message': 'Username already taken'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        is_admin=False
    )
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'success': True,
        'token': access_token,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'isAdmin': user.is_admin
        }
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'success': True,
            'token': access_token,
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'isAdmin': user.is_admin
            }
        })
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user:
        return jsonify({
            'success': True,
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'isAdmin': user.is_admin
            }
        })
    
    return jsonify({'success': False, 'message': 'Invalid token'}), 401

@app.route('/api/analyze-tokens', methods=['POST'])
def analyze_tokens():
    data = request.get_json()
    code = data.get('code', '')
    
    try:
        code_tokens, string_tokens = count_tokens_from_code(code)
        return jsonify({
            'success': True,
            'codeTokens': code_tokens,
            'stringTokens': string_tokens,
            'totalTokens': code_tokens + string_tokens
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/submissions', methods=['POST'])
@jwt_required()
def submit_code():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    category = data.get('category')
    filename = data.get('filename')
    code = data.get('code')
    code_tokens = data.get('codeTokens', 0)
    string_tokens = data.get('stringTokens', 0)
    
    # Validate category limits
    category_limits = {
        'lightweight': 512,
        'middleweight': 1024,
        'heavyweight': 2048,
        'superheavy': None
    }
    
    total_tokens = code_tokens + string_tokens
    limit = category_limits.get(category)
    
    if limit and total_tokens > limit:
        return jsonify({
            'success': False,
            'message': f'Code exceeds {limit} token limit for {category}'
        }), 400
    
    # Run security scan
    scan_result = scan_code(code)
    if scan_result['status'] != 0:
        return jsonify({
            'success': False,
            'message': 'Security scan failed',
            'errors': scan_result.get('errors', [])
        }), 400
    
    # Check if user already has a submission for this category
    existing = Submission.query.filter_by(
        user_id=current_user_id,
        category=category
    ).first()
    
    if existing:
        # Update existing submission
        existing.filename = filename
        existing.code = code
        existing.code_tokens = code_tokens
        existing.string_tokens = string_tokens
        existing.total_tokens = total_tokens
        existing.last_modified = datetime.utcnow()
        existing.status = 'pending'
        
        db.session.commit()
        message = 'Submission updated successfully'
    else:
        # Create new submission
        submission = Submission(
            user_id=current_user_id,
            category=category,
            filename=filename,
            code=code,
            code_tokens=code_tokens,
            string_tokens=string_tokens,
            total_tokens=total_tokens,
            status='pending'
        )
        
        db.session.add(submission)
        db.session.commit()
        message = 'Submission created successfully'
    
    return jsonify({'success': True, 'message': message})

@app.route('/api/submissions/user', methods=['GET'])
@jwt_required()
def get_user_submissions():
    current_user_id = get_jwt_identity()
    submissions = Submission.query.filter_by(user_id=current_user_id).all()
    
    return jsonify({
        'success': True,
        'submissions': [{
            'id': str(s.id),
            'category': s.category,
            'filename': s.filename,
            'codeTokens': s.code_tokens,
            'stringTokens': s.string_tokens,
            'totalTokens': s.total_tokens,
            'status': s.status,
            'rejectionReason': s.rejection_reason,
            'createdAt': s.created_at.isoformat(),
            'lastModified': s.last_modified.isoformat()
        } for s in submissions]
    })

@app.route('/api/submissions/<submission_id>/code', methods=['GET'])
@jwt_required()
def get_submission_code(submission_id):
    current_user_id = get_jwt_identity()
    submission = Submission.query.filter_by(
        id=submission_id,
        user_id=current_user_id
    ).first()
    
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    return jsonify({
        'success': True,
        'code': submission.code
    })

# Admin routes
@app.route('/api/admin/submissions', methods=['GET'])
@jwt_required()
def admin_get_submissions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    submissions = db.session.query(Submission, User).join(User).all()
    
    return jsonify({
        'success': True,
        'submissions': [{
            'id': str(s.Submission.id),
            'username': s.User.username,
            'email': s.User.email,
            'category': s.Submission.category,
            'filename': s.Submission.filename,
            'codeTokens': s.Submission.code_tokens,
            'stringTokens': s.Submission.string_tokens,
            'totalTokens': s.Submission.total_tokens,
            'status': s.Submission.status,
            'rejectionReason': s.Submission.rejection_reason,
            'createdAt': s.Submission.created_at.isoformat(),
            'lastModified': s.Submission.last_modified.isoformat()
        } for s in submissions]
    })

@app.route('/api/admin/submissions/<submission_id>/code', methods=['GET'])
@jwt_required()
def admin_get_submission_code(submission_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    return jsonify({
        'success': True,
        'code': submission.code
    })

@app.route('/api/admin/submissions/<submission_id>/status', methods=['PUT'])
@jwt_required()
def admin_update_submission_status(submission_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    data = request.get_json()
    submission.status = data['status']
    
    # Handle rejection reason
    if data['status'] == 'rejected':
        submission.rejection_reason = data.get('rejectionReason', '')
    else:
        submission.rejection_reason = None  # Clear rejection reason if approved
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Status updated'})

@app.route('/api/admin/submissions/<submission_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_submission(submission_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    db.session.delete(submission)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Submission deleted'})

@app.route('/api/admin/submissions/bulk-action', methods=['POST'])
@jwt_required()
def admin_bulk_submission_action():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    submission_ids = data.get('submissionIds', [])
    action = data.get('action')  # 'approve', 'reject', 'delete'
    rejection_reason = data.get('rejectionReason', '')  # For bulk rejections
    
    if not submission_ids or not action:
        return jsonify({'success': False, 'message': 'Missing submissionIds or action'}), 400
    
    if action not in ['approve', 'reject', 'delete']:
        return jsonify({'success': False, 'message': 'Invalid action. Must be approve, reject, or delete'}), 400
    
    processed = 0
    
    for submission_id in submission_ids:
        submission = Submission.query.get(submission_id)
        if submission:
            if action == 'delete':
                db.session.delete(submission)
            elif action == 'approve':
                submission.status = 'approved'
                submission.rejection_reason = None  # Clear rejection reason if approved
            elif action == 'reject':
                submission.status = 'rejected'
                submission.rejection_reason = rejection_reason
            processed += 1
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Successfully {action}d {processed} submission(s)'
    })

@app.route('/api/admin/submissions/pending', methods=['GET'])
@jwt_required()
def admin_get_pending_submissions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    pending_submissions = db.session.query(Submission, User).join(User).filter(
        Submission.status == 'pending'
    ).order_by(Submission.created_at.asc()).all()
    
    return jsonify({
        'success': True,
        'submissions': [{
            'id': str(s.Submission.id),
            'username': s.User.username,
            'email': s.User.email,
            'category': s.Submission.category,
            'filename': s.Submission.filename,
            'codeTokens': s.Submission.code_tokens,
            'stringTokens': s.Submission.string_tokens,
            'totalTokens': s.Submission.total_tokens,
            'status': s.Submission.status,
            'rejectionReason': s.Submission.rejection_reason,
            'createdAt': s.Submission.created_at.isoformat(),
            'lastModified': s.Submission.last_modified.isoformat()
        } for s in pending_submissions]
    })

@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def admin_get_analytics():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    total_submissions = Submission.query.count()
    total_users = User.query.count()
    
    # Recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_activity = Submission.query.filter(
        Submission.created_at >= week_ago
    ).count()
    
    # Submissions by category
    categories = db.session.query(
        Submission.category,
        db.func.count(Submission.id)
    ).group_by(Submission.category).all()
    
    submissions_by_category = {cat: count for cat, count in categories}
    
    return jsonify({
        'success': True,
        'totalSubmissions': total_submissions,
        'totalUsers': total_users,
        'recentActivity': recent_activity,
        'submissionsByCategory': submissions_by_category
    })

# User Management Admin Routes
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def admin_get_users():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    # Get search query parameter
    search = request.args.get('search', '').strip()
    
    # Build query
    users_query = User.query
    
    if search:
        users_query = users_query.filter(
            db.or_(
                User.username.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )
    
    # Order by creation date (newest first)
    users = users_query.order_by(User.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'users': [{
            'id': str(u.id),
            'username': u.username,
            'email': u.email,
            'isAdmin': u.is_admin,
            'createdAt': u.created_at.isoformat(),
            'submissionCount': len(u.submissions)
        } for u in users]
    })

@app.route('/api/admin/users/<user_id>/reset-password', methods=['POST'])
@jwt_required()
def admin_reset_user_password(user_id):
    current_user_id = get_jwt_identity()
    admin_user = User.query.get(current_user_id)
    
    if not admin_user or not admin_user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    data = request.get_json()
    new_password = data.get('newPassword')
    
    if not new_password or len(new_password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    # Update password
    target_user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Password reset for user {target_user.username}'
    })

# Token Limit Management
@app.route('/api/admin/token-limits', methods=['GET'])
@jwt_required()
def admin_get_token_limits():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    # Return current token limits (these are hardcoded in app.py currently)
    category_limits = {
        'lightweight': 512,
        'middleweight': 1024,
        'heavyweight': 2048,
        'superheavy': None  # Unlimited
    }
    
    return jsonify({
        'success': True,
        'tokenLimits': category_limits
    })

@app.route('/api/admin/token-limits', methods=['PUT'])
@jwt_required()
def admin_update_token_limits():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_admin:
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    
    # For now, this just returns success - would need to store limits in database
    # or configuration for this to be truly dynamic
    return jsonify({
        'success': True,
        'message': 'Token limits updated (Note: Currently hardcoded in app.py)',
        'note': 'To make this fully dynamic, token limits should be stored in database'
    })

@app.route('/api/stats', methods=['GET'])
def get_public_stats():
    total_submissions = Submission.query.count()
    total_users = User.query.count()
    
    return jsonify({
        'success': True,
        'totalCompetitors': total_users,
        'totalSubmissions': total_submissions
    })

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    # Get submissions with user data, ordered by ELO (default 1000 for now)
    leaderboard_data = db.session.query(
        Submission.category,
        Submission.filename,
        Submission.total_tokens,
        Submission.created_at,
        User.username
    ).join(User).filter(
        Submission.status == 'approved'  # Only show approved submissions
    ).all()
    
    # Group by category and add default ELO
    categories_data = {}
    for submission in leaderboard_data:
        category = submission.category
        if category not in categories_data:
            categories_data[category] = []
        
        categories_data[category].append({
            'username': submission.username,
            'filename': submission.filename,
            'tokens': submission.total_tokens,
            'elo': 1000,  # Default ELO for now
            'matches': 0,  # Will be updated later when matches are implemented
            'wins': 0,
            'losses': 0,
            'createdAt': submission.created_at.isoformat()
        })
    
    # Sort each category by ELO (all same for now), then by username
    for category in categories_data:
        categories_data[category].sort(key=lambda x: (-x['elo'], x['username']))
    
    # Get top bot from each category for hall of fame
    hall_of_fame = {}
    for category, bots in categories_data.items():
        if bots:
            hall_of_fame[category] = bots[0]
    
    return jsonify({
        'success': True,
        'leaderboards': categories_data,
        'hallOfFame': hall_of_fame
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        initialize_admin_accounts()
    app.run(debug=True, host='0.0.0.0', port=5000)