# MCMiniBots Tournament Platform

A comprehensive web application for hosting JavaScript bot competitions in Minecraft PVP tournaments. Features a modern neumorphic UI, token-based code analysis, and comprehensive admin tools.

## 🎯 Project Overview

This platform allows developers to:
- Submit JavaScript bots across different weight categories
- Real-time token counting and code analysis
- Security scanning for safe code execution
- Admin panel for submission management
- Beautiful neumorphic design with dark/light themes

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **TailwindCSS** for styling
- **Monaco Editor** for code editing
- **Neumorphic UI** design system

### Backend
- **Flask** web framework
- **PostgreSQL** database
- **SQLAlchemy** ORM
- **JWT** authentication
- **Token counter** integration
- **Security scanner** for code validation

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended) 🐳

**Prerequisites:** Only Docker Desktop is required!

#### Windows:
```bash
# Double-click start.bat or run in Command Prompt:
start.bat
```

#### macOS/Linux:
```bash
# Make script executable and run:
chmod +x start.sh
./start.sh
```

**That's it!** The entire platform will be running at:
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Backend API**: http://localhost:5000

#### Create Admin Account:
```bash
# Windows:
admin-setup.bat

# macOS/Linux:
./admin-setup.sh
```

#### Stop the Platform:
```bash
# Windows:
stop.bat

# macOS/Linux:
./stop.sh
```

---

### Option 2: Manual Setup (Development)

**Prerequisites:**
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+

#### 1. Database Setup
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE mcminibots;
CREATE USER mcminibots_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE mcminibots TO mcminibots_user;
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file with your database credentials
cp .env.example .env  # If exists, or edit .env directly

# Initialize database
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# Create admin account
python create_admin.py

# Run backend server
python app.py
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🏆 Bot Categories

| Category | Token Limit | Description |
|----------|-------------|-------------|
| **Lightweight** | 512 tokens | Nimble, efficient bots |
| **Middleweight** | 1,024 tokens | Balanced capabilities |
| **Heavyweight** | 2,048 tokens | Advanced strategies |
| **Superheavy** | Unlimited | Maximum potential |

## 🛠️ Features

### User Features
- **Registration & Authentication**: Secure JWT-based auth
- **Code Editor**: Monaco editor with JavaScript syntax highlighting
- **Real-time Token Counting**: Separate code and string token analysis
- **Security Validation**: Automated scanning for prohibited imports
- **Multiple Submissions**: One bot per category, unlimited updates
- **Neumorphic UI**: Beautiful, tactile interface design

### Admin Features
- **Submission Management**: View, approve, reject, delete submissions
- **Code Review**: Full code inspection capabilities
- **Analytics Dashboard**: User counts, submission statistics
- **Category Analytics**: Submissions breakdown by weight class
- **User Management**: Admin privilege assignment

### Security Features
- **Import Restrictions**: Configurable allowed imports list
- **Code Scanning**: AST-based security analysis
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: SQLAlchemy ORM protection
- **XSS Prevention**: Sanitized data handling

## 📁 Project Structure

```
mcminibots-tournament/
├── 🐳 Docker Files
│   ├── docker-compose.yml      # Main orchestration
│   ├── start.bat/start.sh      # One-command startup
│   ├── admin-setup.bat/.sh     # Admin account creation
│   ├── stop.bat/stop.sh        # Shutdown scripts
│   └── init-db.sql             # Database initialization
├── frontend/                   # React application
│   ├── Dockerfile              # Frontend container
│   ├── nginx.conf              # Nginx configuration
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route components
│   │   ├── context/            # React context providers
│   │   └── utils/              # Utility functions
│   ├── public/
│   └── package.json
├── backend/                    # Flask application
│   ├── Dockerfile              # Backend container
│   ├── app.py                  # Main Flask app
│   ├── models.py               # Database models
│   ├── create_admin.py         # Admin creation script
│   ├── utils/
│   │   ├── token_counter.py    # Token analysis
│   │   └── security_scanner.py # Security validation
│   ├── requirements.txt
│   ├── .env
│   └── allowed.json            # Allowed imports config
└── README.md
```

## 🎨 Design System

The platform features a **neumorphic design** with:
- **Soft shadows**: Dual light/dark shadows for 3D effect
- **Extruded elements**: Components appear carved from background
- **Monochromatic palette**: Unified color scheme
- **Gold accents**: Premium tournament branding
- **Dark/Light themes**: User preference support
- **Tactile interactions**: Button press animations

### Color Palette
- **Background**: `#e0e0e0` (light) / `#2c2c2c` (dark)
- **Primary**: Background-matching elements
- **Accent**: Gold gradient (`#f59e0b` to `#d97706`)
- **Text**: High contrast for accessibility

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/verify` - Token verification

### Submissions  
- `POST /api/analyze-tokens` - Token analysis
- `POST /api/submissions` - Submit bot code
- `GET /api/submissions/user` - User's submissions
- `GET /api/submissions/<id>/code` - Get submission code

### Admin (Requires admin JWT)
- `GET /api/admin/submissions` - All submissions
- `PUT /api/admin/submissions/<id>/status` - Update status
- `DELETE /api/admin/submissions/<id>` - Delete submission
- `GET /api/admin/analytics` - Platform analytics

## 🔒 Admin Account Setup

After setting up the backend, create an admin account:

```bash
cd backend
python create_admin.py
```

Follow the prompts to create your admin credentials. You can then:
1. Log in through the web interface
2. Access the admin panel at `/admin`
3. Manage all submissions and view analytics

## ⚡ Token Counter Integration

The platform uses the provided token counting script with:
- **esprima**: JavaScript AST parsing
- **tiktoken**: OpenAI token counting
- **Separated counting**: Code tokens vs string tokens
- **Real-time analysis**: As-you-type token updates

## 🛡️ Security Scanner

Integrated security scanning prevents:
- **Unauthorized imports**: Configurable allowlist
- **Dynamic imports**: `import()` validation
- **eval() calls**: Forbidden execution
- **require() abuse**: Module loading restrictions

Default allowed imports:
- `mineflayer`
- `pathfinding`
- `vec3`
- `util`

## 🚀 Production Deployment

### Docker Production Deployment (Recommended)

1. **Clone the repository** on your production server
2. **Update environment variables** in `docker-compose.yml`:
   ```yaml
   environment:
     - FLASK_ENV=production
     - SECRET_KEY=your-secure-secret-key-here
     - JWT_SECRET_KEY=your-secure-jwt-key-here
     - DATABASE_URL=postgresql://user:pass@database:5432/mcminibots
   ```
3. **Start the platform**:
   ```bash
   # Linux/macOS:
   ./start.sh
   
   # Windows:
   start.bat
   ```
4. **Create admin account**:
   ```bash
   # Linux/macOS:
   ./admin-setup.sh
   
   # Windows:
   admin-setup.bat
   ```
5. **Configure reverse proxy** (optional) for custom domain:
   ```nginx
   # Nginx example
   server {
       listen 80;
       server_name your-domain.com;
       location / {
           proxy_pass http://localhost:3000;
       }
   }
   ```

### Manual Production Deployment

#### Backend Deployment
1. Set environment variables:
   ```
   FLASK_ENV=production
   SECRET_KEY=<secure-random-key>
   JWT_SECRET_KEY=<secure-random-key>
   DATABASE_URL=<production-database-url>
   ```

2. Use production WSGI server:
   ```bash
   gunicorn --bind 0.0.0.0:5000 app:app
   ```

#### Frontend Deployment
1. Build for production:
   ```bash
   npm run build
   ```

2. Serve static files with nginx/Apache
3. Configure API proxy to backend

#### Database Migration
For production database changes:
```bash
flask db init
flask db migrate -m "Description"
flask db upgrade
```

## 📊 Analytics & Monitoring

The admin panel provides:
- **Total submission counts**
- **User registration metrics**
- **Category distribution**
- **Recent activity tracking**
- **Submission status breakdown**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎮 Tournament Rules

1. **One bot per category** per user
2. **Token limits enforced** for fair competition
3. **Security scanning required** for all submissions
4. **JavaScript only** - `.js` file format
5. **Restricted imports** for security
6. **No malicious code** allowed

## 🔗 Links

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Admin Panel**: `http://localhost:3000/admin`
- **Token Counter**: `http://localhost:3000/token-counter`

---

**Built for the MCMiniBots Tournament - Where JavaScript meets Minecraft PVP! 🎮⚔️**