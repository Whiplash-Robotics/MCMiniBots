from datetime import datetime
import uuid

# This will be set in app.py
db = None

class User(db.Model if db else object):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())) if db else None
    username = db.Column(db.String(80), unique=True, nullable=False) if db else None
    email = db.Column(db.String(120), unique=True, nullable=False) if db else None
    password_hash = db.Column(db.String(255), nullable=False) if db else None
    is_admin = db.Column(db.Boolean, default=False, nullable=False) if db else None
    created_at = db.Column(db.DateTime, default=datetime.utcnow) if db else None
    
    def __repr__(self):
        return f'<User {self.username}>'

class Category(db.Model if db else object):
    __tablename__ = 'categories'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())) if db else None
    name = db.Column(db.String(50), unique=True, nullable=False) if db else None
    token_limit = db.Column(db.Integer, nullable=True) if db else None  # NULL for unlimited
    description = db.Column(db.Text) if db else None
    created_at = db.Column(db.DateTime, default=datetime.utcnow) if db else None
    
    def __repr__(self):
        return f'<Category {self.name}>'

class Submission(db.Model if db else object):
    __tablename__ = 'submissions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())) if db else None
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False) if db else None
    category = db.Column(db.String(50), nullable=False) if db else None
    filename = db.Column(db.String(255), nullable=False) if db else None
    code = db.Column(db.Text, nullable=False) if db else None
    code_tokens = db.Column(db.Integer, nullable=False) if db else None
    string_tokens = db.Column(db.Integer, nullable=False) if db else None
    total_tokens = db.Column(db.Integer, nullable=False) if db else None
    status = db.Column(db.String(20), default='pending', nullable=False) if db else None  # pending, approved, rejected
    rejection_reason = db.Column(db.Text, nullable=True) if db else None  # Store rejection reason when status is rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow) if db else None
    last_modified = db.Column(db.DateTime, default=datetime.utcnow) if db else None
    
    def __repr__(self):
        return f'<Submission {self.filename}>'

def init_db_models(database):
    """Initialize models with the database instance"""
    global db
    db = database
    
    # Re-create the classes with proper db reference
    global User, Category, Submission
    
    class User(db.Model):
        __tablename__ = 'users'
        
        id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
        username = db.Column(db.String(80), unique=True, nullable=False)
        email = db.Column(db.String(120), unique=True, nullable=False)
        password_hash = db.Column(db.String(255), nullable=False)
        is_admin = db.Column(db.Boolean, default=False, nullable=False)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        
        # Relationship
        submissions = db.relationship('Submission', backref='user', lazy=True)
        
        def __repr__(self):
            return f'<User {self.username}>'

    class Category(db.Model):
        __tablename__ = 'categories'
        
        id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
        name = db.Column(db.String(50), unique=True, nullable=False)
        token_limit = db.Column(db.Integer, nullable=True)  # NULL for unlimited
        description = db.Column(db.Text)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        
        def __repr__(self):
            return f'<Category {self.name}>'

    class Submission(db.Model):
        __tablename__ = 'submissions'
        
        id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
        user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
        category = db.Column(db.String(50), nullable=False)
        filename = db.Column(db.String(255), nullable=False)
        code = db.Column(db.Text, nullable=False)
        code_tokens = db.Column(db.Integer, nullable=False)
        string_tokens = db.Column(db.Integer, nullable=False)
        total_tokens = db.Column(db.Integer, nullable=False)
        status = db.Column(db.String(20), default='pending', nullable=False)  # pending, approved, rejected
        rejection_reason = db.Column(db.Text, nullable=True)  # Store rejection reason when status is rejected
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        last_modified = db.Column(db.DateTime, default=datetime.utcnow)
        
        def __repr__(self):
            return f'<Submission {self.filename}>'
    
    return User, Category, Submission