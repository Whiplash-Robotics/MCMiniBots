# MCMiniBots Tournament - Setup Guide 🎮

## ✅ Project Complete!

Your MCMiniBots Tournament platform is fully implemented with:
- ✅ **React Frontend** with neumorphic UI design
- ✅ **Flask Backend** with PostgreSQL database  
- ✅ **Token Counter** integration
- ✅ **Security Scanner** for code validation
- ✅ **Admin Panel** for submission management
- ✅ **JWT Authentication** system
- ✅ **Docker Setup** for one-command deployment

## 🐳 Super Quick Start (Docker - Recommended)

**Prerequisites:** Only Docker Desktop is required!

### Windows Users:
1. **Install Docker Desktop** from https://www.docker.com/products/docker-desktop
2. **Double-click `start.bat`** or run in Command Prompt:
   ```cmd
   start.bat
   ```
3. **Wait 30-60 seconds** for services to initialize
4. **Create admin account:**
   ```cmd
   admin-setup.bat
   ```
5. **Access your platform:**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

### macOS/Linux Users:
1. **Install Docker** from https://docs.docker.com/get-docker/
2. **Run the startup script:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
3. **Wait 30-60 seconds** for services to initialize
4. **Create admin account:**
   ```bash
   ./admin-setup.sh
   ```
5. **Access your platform:**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

**That's it! Your entire tournament platform is now running! 🎉**

---

## 🛠️ Manual Setup (Development/Custom)

### Step 1: Database Setup
```sql
-- Connect to PostgreSQL as admin user
CREATE DATABASE mcminibots;
CREATE USER mcminibots_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE mcminibots TO mcminibots_user;
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure database connection
# Edit .env file and update DATABASE_URL:
# DATABASE_URL=postgresql://mcminibots_user:secure_password_123@localhost:5432/mcminibots

# Initialize database tables
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# Create your admin account
python create_admin.py
# Follow prompts to create admin username, email, and password

# Start backend server
python app.py
```

### Step 3: Frontend Setup
```bash
# Open new terminal and navigate to frontend
cd frontend

# Install Node.js dependencies
npm install

# Start React development server
npm start
```

## 🌐 Access Your Platform

After both servers are running:

- **Main Website**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin (login with admin account)
- **Token Counter**: http://localhost:3000/token-counter

## 🎯 Platform Features Overview

### For Users:
1. **Registration/Login** - Create accounts to submit bots
2. **Bot Submission** - Upload JavaScript files by category
3. **Token Counter** - Real-time analysis of code complexity
4. **Code Editor** - Monaco editor with syntax highlighting
5. **Security Validation** - Automatic scanning for safe code

### For Admins:
1. **Submission Management** - View, approve, reject, delete submissions
2. **Code Review** - Full code inspection capabilities  
3. **User Analytics** - Track registrations and activity
4. **Category Statistics** - Monitor submissions by weight class

### Weight Categories:
- **Lightweight**: 512 tokens max
- **Middleweight**: 1,024 tokens max
- **Heavyweight**: 2,048 tokens max  
- **Superheavy**: Unlimited tokens

## 🎨 UI Features

Your platform includes a beautiful **neumorphic design** with:
- Soft, tactile button interactions
- Light/dark theme toggle
- Gold accent colors for premium feel
- Responsive layout for all devices
- Smooth animations and transitions

## 🔐 Admin Registration Process

**To register an admin account:**

1. Run the backend server (`python app.py`)
2. Execute: `python create_admin.py`
3. Enter admin details when prompted:
   - Username (unique)
   - Email address  
   - Password (min 8 characters)
   - Confirm password
4. Admin account is created with full privileges
5. Log in through the web interface to access `/admin`

## 🛡️ Security Features

- **Import Restrictions**: Only allowed modules can be imported
- **Code Scanning**: AST-based security analysis  
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: All data properly validated
- **SQL Injection Protection**: SQLAlchemy ORM used

**Default Allowed Imports:**
- `mineflayer` - Minecraft bot framework
- `pathfinding` - Navigation utilities
- `vec3` - 3D vector math
- `util` - Standard utilities

## 📁 File Structure Reference

```
mcminibots-tournament/
├── frontend/                    # React TypeScript app
│   ├── src/
│   │   ├── components/         # Reusable UI components  
│   │   │   ├── NeuroButton.tsx # Neumorphic buttons
│   │   │   ├── NeuroCard.tsx   # Card components
│   │   │   ├── NeuroInput.tsx  # Form inputs
│   │   │   ├── CodeEditor.tsx  # Monaco code editor
│   │   │   └── Layout.tsx      # Main layout
│   │   ├── pages/              # Route pages
│   │   │   ├── Home.tsx        # Landing page
│   │   │   ├── Submit.tsx      # Bot submission
│   │   │   ├── TokenCounter.tsx # Token analysis
│   │   │   ├── Admin.tsx       # Admin panel
│   │   │   └── Login.tsx       # Authentication
│   │   ├── context/            # React contexts
│   │   │   ├── AuthContext.tsx # User authentication
│   │   │   └── ThemeContext.tsx # Theme switching
│   │   └── App.tsx             # Main React component
│   └── package.json            # Frontend dependencies
├── backend/                     # Flask Python API
│   ├── app.py                  # Main Flask application
│   ├── models.py               # Database models
│   ├── create_admin.py         # Admin account creation
│   ├── utils/
│   │   ├── token_counter.py    # JavaScript token analysis
│   │   └── security_scanner.py # Code security scanning
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment configuration
│   └── allowed.json           # Allowed imports list
└── README.md                   # Full documentation
```

## 🔧 Troubleshooting

### Docker Issues
```bash
# Check if Docker is running
docker --version
docker compose version

# View service logs
docker compose logs -f

# Restart all services
docker compose restart

# Complete reset (removes all data)
docker compose down -v
docker system prune -a
```

### Database Connection Issues (Manual Setup)
```bash
# Verify PostgreSQL is running
# Check credentials in .env file
# Test connection:
python -c "from app import app, db; app.app_context().push(); print('DB connected!')"
```

### Frontend Not Loading
```bash
# Clear npm cache
npm cache clean --force
# Reinstall dependencies  
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Linux/macOS:
lsof -i :3000
lsof -i :5000

# Kill the process or change ports in docker-compose.yml
```

## 🎯 Next Steps

1. **Test the complete flow:**
   - Register a user account
   - Submit a test bot in each category
   - Use admin panel to review submissions
   - Test the token counter with sample code

2. **Customize for your tournament:**
   - Update allowed imports in `backend/allowed.json`
   - Modify weight class limits if needed
   - Add your branding and tournament details

3. **Production deployment:**
   - Set up proper environment variables
   - Configure production database
   - Deploy to your preferred hosting platform

## 🏆 You're Ready to Host Your Tournament!

Your MCMiniBots Tournament platform is now fully functional with:
- Professional neumorphic design
- Robust security features  
- Comprehensive admin tools
- Real-time token analysis
- Category-based competition structure

**Happy tournament hosting! 🎮⚔️**