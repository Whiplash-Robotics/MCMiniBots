# MCMiniBots Tournament Backend

Flask-based backend API for the MCMiniBots Tournament platform.

## Setup Instructions

### 1. Prerequisites

- Python 3.9+
- PostgreSQL database
- Node.js (for frontend)

### 2. Database Setup

1. Install PostgreSQL if not already installed
2. Create a database:
   ```sql
   CREATE DATABASE mcminibots;
   CREATE USER mcminibots_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE mcminibots TO mcminibots_user;
   ```

3. Update the `.env` file with your database credentials:
   ```
   DATABASE_URL=postgresql://mcminibots_user:your_password@localhost:5432/mcminibots
   ```

### 3. Python Environment Setup

1. Create and activate virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 4. Environment Configuration

1. Copy `.env.example` to `.env` (if exists) or create `.env`:
   ```
   SECRET_KEY=your-secret-key-change-this-in-production
   JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production
   DATABASE_URL=postgresql://username:password@localhost:5432/mcminibots
   FLASK_APP=app.py
   FLASK_ENV=development
   ```

2. Generate secure keys for production:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))  # For SECRET_KEY
   print(secrets.token_urlsafe(32))  # For JWT_SECRET_KEY
   ```

### 5. Database Migration

1. Initialize database:
   ```bash
   python -c "from app import app, db; app.app_context().push(); db.create_all()"
   ```

### 6. Create Admin Account

Run the admin creation script:
```bash
python create_admin.py
```

Follow the prompts to create your admin account. This account will have access to the admin panel.

### 7. Run the Application

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Submissions
- `POST /api/analyze-tokens` - Analyze JavaScript code tokens
- `POST /api/submissions` - Submit bot code
- `GET /api/submissions/user` - Get user's submissions
- `GET /api/submissions/<id>/code` - Get submission code

### Admin Endpoints
- `GET /api/admin/submissions` - Get all submissions (admin only)
- `GET /api/admin/submissions/<id>/code` - Get submission code (admin only)
- `PUT /api/admin/submissions/<id>/status` - Update submission status (admin only)
- `DELETE /api/admin/submissions/<id>` - Delete submission (admin only)
- `GET /api/admin/analytics` - Get platform analytics (admin only)

## Bot Categories and Token Limits

- **Lightweight**: 512 tokens
- **Middleweight**: 1024 tokens  
- **Heavyweight**: 2048 tokens
- **Superheavy**: Unlimited tokens

## Security Features

- JWT-based authentication
- Password hashing with Werkzeug
- JavaScript code security scanning
- Import restrictions (configurable allowed imports)
- SQL injection protection with SQLAlchemy ORM

## Token Counter Integration

The platform includes a token counter that uses:
- **esprima**: JavaScript parsing
- **tiktoken**: OpenAI's token counting library

Code tokens and string tokens are counted separately to provide accurate token usage.

## File Structure

```
backend/
├── app.py              # Main Flask application
├── models.py           # Database models
├── create_admin.py     # Admin user creation script
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
├── README.md          # This file
└── utils/
    ├── token_counter.py    # Token counting utilities
    └── security_scanner.py # Code security scanning
```

## Development

### Running Tests
(Add test instructions here when tests are implemented)

### Database Migrations
If you make changes to models:
```bash
flask db init
flask db migrate -m "Description of changes"
flask db upgrade
```

## Production Deployment

1. Set `FLASK_ENV=production` in environment
2. Use a production WSGI server (gunicorn, uWSGI)
3. Use environment variables for sensitive configuration
4. Set up proper database backup procedures
5. Configure CORS for your frontend domain
6. Use HTTPS in production

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists and user has proper permissions

### Import Errors
- Ensure virtual environment is activated
- Install all requirements: `pip install -r requirements.txt`

### Token Counter Issues
- Verify esprima and tiktoken are installed
- Check JavaScript syntax in submitted code

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.