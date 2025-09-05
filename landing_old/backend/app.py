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

# Initialize models with database instance
User, Category, Submission = init_db_models(db)

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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)