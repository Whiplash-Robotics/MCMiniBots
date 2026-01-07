# MCMiniBots Tournament Landing Page

A modern full-stack web application for the MCMiniBots Tournament platform, built with React Router (frontend) and Flask (backend).

## Tech Stack

### Frontend
- **React Router 7** - Full-stack React framework with SSR
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **Monaco Editor** - Code editor for bot submissions
- **ApexCharts** - Data visualization

### Backend
- **Flask** - Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **JWT** - Authentication
- **Flask-CORS** - Cross-origin support

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.9+
- **PostgreSQL** 12+

### Installing PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

## Quick Start

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd landing
```

### 2. Install Dependencies

```bash
# Install concurrently (needed to run both services)
npm install

# Install all project dependencies (frontend + backend)
npm run install:all
```

### 3. Database Setup

First, create a PostgreSQL role for your user (if you don't have one):

```bash
# Create PostgreSQL role matching your system username
sudo -u postgres createuser -s $(whoami)
```

Then create the database:

```bash
# Create the database
createdb mcminibots
```

### 4. Environment Configuration

Copy the example environment file and update it with your credentials:

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and **replace `your-postgres-username` with your actual PostgreSQL username** (usually your system username):

```env
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-change-in-production
DATABASE_URL=postgresql://your-postgres-username@localhost:5432/mcminibots
FLASK_APP=app.py
FLASK_ENV=development
```

For example, if your username is `ryan-zhu`, the DATABASE_URL should be:
```
DATABASE_URL=postgresql://ryan-zhu@localhost:5432/mcminibots
```

**Note:** The `.env` file is gitignored and should never be committed to version control

### 5. Initialize Database

```bash
# Create database tables
npm run db:init
```

### 6. Create Admin Account

```bash
# Interactive prompt to create admin user
npm run db:create-admin
```

Follow the prompts to set up your admin credentials.

### 7. Start Development Servers

```bash
npm run dev
```

This will start both services:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only the frontend development server |
| `npm run dev:backend` | Start only the backend API server |
| `npm run install:all` | Install all dependencies (frontend + backend) |
| `npm run install:frontend` | Install only frontend dependencies |
| `npm run install:backend` | Install only backend dependencies |
| `npm run build` | Build frontend for production |
| `npm run db:init` | Initialize database tables |
| `npm run db:create-admin` | Create admin user account |

## Project Structure

```
landing/
├── frontend/               # React Router application
│   ├── app/               # Application code
│   │   ├── routes/        # Route components
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context providers
│   │   └── root.tsx       # Root component
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
│
├── backend/               # Flask API
│   ├── app.py            # Main Flask application
│   ├── models.py         # Database models
│   ├── create_admin.py   # Admin creation script
│   ├── utils/            # Utility modules
│   │   ├── token_counter.py    # Token counting
│   │   └── security_scanner.py # Code security
│   ├── requirements.txt  # Python dependencies
│   └── .env             # Environment variables (gitignored)
│
└── package.json          # Root package.json for orchestration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Submissions
- `POST /api/submissions` - Submit bot code
- `GET /api/submissions/user` - Get user's submissions
- `GET /api/submissions/<id>/code` - Get submission code
- `POST /api/analyze-tokens` - Analyze code tokens

### Admin (Protected)
- `GET /api/admin/submissions` - Get all submissions
- `GET /api/admin/submissions/pending` - Get pending submissions
- `PUT /api/admin/submissions/<id>/status` - Update submission status
- `DELETE /api/admin/submissions/<id>` - Delete submission
- `GET /api/admin/analytics` - Get platform analytics
- `GET /api/admin/users` - Get all users

## Bot Categories & Token Limits

| Category | Token Limit |
|----------|-------------|
| Lightweight | 512 tokens |
| Middleweight | 1024 tokens |
| Heavyweight | 2048 tokens |
| Superheavy | Unlimited |

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Werkzeug secure password hashing
- **Code Security Scanning** - JavaScript code analysis
- **Import Restrictions** - Configurable allowed imports
- **SQL Injection Protection** - SQLAlchemy ORM
- **CORS Configuration** - Controlled cross-origin access

## Production Deployment

### Building for Production

```bash
npm run build
```

### Environment Variables

For production, generate secure keys:

```python
import secrets
print("SECRET_KEY=" + secrets.token_urlsafe(32))
print("JWT_SECRET_KEY=" + secrets.token_urlsafe(32))
```

Update `.env`:
```env
FLASK_ENV=production
SECRET_KEY=<generated-key>
JWT_SECRET_KEY=<generated-key>
DATABASE_URL=<production-database-url>
```

### Deployment Checklist

- [ ] Set `FLASK_ENV=production`
- [ ] Use production WSGI server (gunicorn, uWSGI)
- [ ] Generate secure SECRET_KEY and JWT_SECRET_KEY
- [ ] Configure production database
- [ ] Set up database backups
- [ ] Configure CORS for production domain
- [ ] Use HTTPS/SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure environment variables securely

### Docker Deployment

Both frontend and backend include Dockerfiles. See individual README files in each directory for Docker-specific instructions.

## Troubleshooting

### Database Connection Issues

**Problem:** Can't connect to PostgreSQL

**Solutions:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or `brew services list` (macOS)
- Check credentials in `backend/.env`
- Ensure database exists: `psql -U postgres -l`
- Grant proper permissions to database user

### Import Errors (Backend)

**Problem:** Module not found errors

**Solutions:**
- Ensure virtual environment exists: `ls backend/venv`
- Reinstall dependencies: `npm run install:backend`
- Check Python version: `python --version` (should be 3.9+)

### Port Already in Use

**Problem:** Port 5000 or 5173 already in use

**Solutions:**
- Kill existing processes: `lsof -ti:5000 | xargs kill -9`
- Change ports in respective config files

### Frontend Not Connecting to Backend

**Problem:** API calls failing with CORS or network errors

**Solutions:**
- Ensure both services are running: `npm run dev`
- Check backend is running on port 5000
- Verify CORS settings in `backend/app.py`
- Check browser console for specific errors

## Development Tips

- **Hot Reload:** Both frontend and backend support hot reload during development
- **Logs:** The `npm run dev` command shows color-coded logs (cyan=backend, magenta=frontend)
- **Database Changes:** After modifying models, re-run `npm run db:init` to update schema
- **Admin Panel:** Access at `/admin` after logging in with admin credentials

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create a pull request

## Support

For issues and questions, please refer to the main project repository or create an issue.

## License

[Your License Here]
