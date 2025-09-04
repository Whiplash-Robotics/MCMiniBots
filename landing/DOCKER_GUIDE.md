# MCMiniBots Tournament - Docker Guide 🐳

## Overview

The MCMiniBots Tournament platform uses Docker for easy deployment and consistent environments. With Docker, you can run the entire platform with a single command!

## 📦 What's Included

- **PostgreSQL Database** - Persistent data storage
- **Flask Backend** - Python API server
- **React Frontend** - Modern web interface served by Nginx
- **Automatic networking** between services
- **Volume persistence** for database data

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- 4GB+ available RAM
- Ports 3000, 5000, 5432 available

### Launch Platform

#### Windows:
```cmd
# Double-click or run in Command Prompt
start.bat
```

#### macOS/Linux:
```bash
# Make executable and run
chmod +x start.sh
./start.sh
```

The script will:
1. Check Docker installation
2. Build all container images
3. Start all services
4. Show access URLs
5. Open browser automatically

## 🔑 Admin Setup

After the platform is running:

#### Windows:
```cmd
admin-setup.bat
```

#### macOS/Linux:
```bash
./admin-setup.sh
```

Follow the prompts to create your admin account.

## 🛑 Stopping the Platform

#### Windows:
```cmd
stop.bat
```

#### macOS/Linux:
```bash
./stop.sh
```

## 🐳 Docker Commands Reference

### Basic Operations
```bash
# Start all services
docker compose up -d

# Stop all services  
docker compose down

# View running services
docker compose ps

# View logs
docker compose logs -f

# Restart a specific service
docker compose restart backend
```

### Database Operations
```bash
# Connect to database
docker compose exec database psql -U mcminibots_user -d mcminibots

# Backup database
docker compose exec database pg_dump -U mcminibots_user mcminibots > backup.sql

# Restore database
docker compose exec -T database psql -U mcminibots_user -d mcminibots < backup.sql
```

### Development Operations
```bash
# Rebuild and restart
docker compose up --build -d

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Execute commands in containers
docker compose exec backend python create_admin.py
docker compose exec backend python -c "from app import app; print(app.config)"
```

## 📁 Docker Files Explained

### `docker-compose.yml`
Main orchestration file defining:
- **database**: PostgreSQL 15 with persistent storage
- **backend**: Flask app with Python dependencies
- **frontend**: React app served by Nginx

### `backend/Dockerfile`
- Uses Python 3.9 slim image
- Installs system dependencies
- Copies and installs Python packages
- Sets up non-root user for security
- Includes health checks

### `frontend/Dockerfile` 
- Multi-stage build (Node.js → Nginx)
- Builds React app for production
- Serves with optimized Nginx config
- Includes API proxying to backend

### `frontend/nginx.conf`
- Handles React Router routing
- Proxies `/api/*` requests to backend
- Enables gzip compression
- Sets caching headers

## 🔧 Customization

### Environment Variables
Edit `docker-compose.yml` to customize:
```yaml
environment:
  - SECRET_KEY=your-secret-key-here
  - JWT_SECRET_KEY=your-jwt-key-here
  - FLASK_ENV=development  # or production
```

### Port Changes
Change exposed ports:
```yaml
ports:
  - "8080:80"    # Frontend on port 8080
  - "8000:5000"  # Backend on port 8000
```

### Volume Mounts (Development)
For live code reloading:
```yaml
volumes:
  - ./backend:/app        # Backend hot reload
  - ./frontend/src:/app/src  # Frontend hot reload
```

## 🔍 Health Checks

All services include health checks:
- **Database**: `pg_isready` check
- **Backend**: HTTP endpoint verification
- **Frontend**: Nginx status check

View health status:
```bash
docker compose ps
```

## 📊 Monitoring

### View System Resources
```bash
# Container resource usage
docker stats

# Container details
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Log Management
```bash
# All logs with timestamps
docker compose logs -f -t

# Specific service logs
docker compose logs -f backend

# Last N lines
docker compose logs --tail=100 backend
```

## 🔒 Security Notes

- Database uses strong password (change in production)
- Backend runs as non-root user
- No unnecessary ports exposed
- Frontend served over HTTPS-ready Nginx
- Environment variables for secrets

## 🚀 Production Deployment

1. **Update passwords** in `docker-compose.yml`
2. **Set production environment**:
   ```yaml
   environment:
     - FLASK_ENV=production
     - SECRET_KEY=your-secure-production-key
   ```
3. **Use external database** (recommended):
   ```yaml
   environment:
     - DATABASE_URL=postgresql://user:pass@your-db-host:5432/mcminibots
   ```
4. **Set up reverse proxy** for HTTPS
5. **Configure backup strategy** for volumes

## 🛠️ Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Find what's using ports
netstat -tlnp | grep :3000
lsof -i :3000

# Change ports in docker-compose.yml
```

**Permission errors:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

**Database connection fails:**
```bash
# Check database logs
docker compose logs database

# Recreate database
docker compose down -v
docker compose up -d
```

**Build failures:**
```bash
# Clean rebuild
docker compose down
docker system prune -a
docker compose up --build
```

### Reset Everything
```bash
# Nuclear option - removes all data
docker compose down -v
docker system prune -a -f
docker volume prune -f
```

## 📈 Scaling

For high traffic, scale services:
```bash
# Run multiple backend instances
docker compose up --scale backend=3

# Use load balancer (add to docker-compose.yml)
```

## ✅ Benefits of Docker Setup

- **One-command deployment** - No complex setup
- **Consistent environment** - Same on dev/staging/prod
- **Easy updates** - Pull and restart
- **Isolated services** - No conflicts with host system
- **Persistent data** - Database survives restarts
- **Health monitoring** - Built-in service checks
- **Log aggregation** - Centralized logging
- **Backup friendly** - Volume-based data storage

---

**Your MCMiniBots Tournament platform is now fully dockerized and production-ready! 🎮🚀**