# 🐳 Monipx Docker Deployment Guide

## Quick Start (Like Uptime Kuma)

### Step 1: Start Docker Desktop

Make sure Docker Desktop is running on your Mac.

### Step 2: Deploy Monipx

```bash
cd /Users/arnoldmwz/Desktop/DEV/Docker-App/monipx

# Build and start
docker-compose up -d
```

### Step 3: Access the Application

Open your browser and go to: **http://localhost:3001**

### Step 4: Create Admin User

On first access, you'll be redirected to the setup page where you can:
- Create your admin username
- Set your password
- Add your email (optional)

After creating the admin account, you'll have full access to Monipx!

---

## 🎨 Brand Color

The app uses **#ff2667** as the primary brand color throughout the interface.

---

## 📦 Docker Volumes

Data is persisted in Docker volumes:
- `monipx-data` - Database and application data
- `monipx-logs` - Application logs

This means your data persists even if you remove the container!

---

## 🔧 Common Commands

### Start Container
```bash
docker-compose up -d
```

### Stop Container
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Container
```bash
docker-compose restart
```

### Rebuild and Restart
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
```

### Access Container Shell
```bash
docker-compose exec monipx sh
```

---

## 🗄️ Database

The database is stored in a Docker volume and persists across container restarts.

To access the database:
```bash
docker-compose exec monipx sh -c "sqlite3 /app/data/monipx.db"
```

---

## 🔐 Security

- Admin user is created on first deployment
- Passwords are hashed using SHA-256
- Database is stored in a Docker volume (not exposed)
- Application runs as non-root user in container

---

## 🌐 Port Configuration

Default port: **3001**

To change the port, edit `docker-compose.yml`:
```yaml
ports:
  - "YOUR_PORT:3001"
```

---

## 📊 Health Check

The container includes a health check. View status:
```bash
docker inspect monipx | grep -A 10 Health
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check if port is in use
lsof -i :3001
```

### Database Issues

```bash
# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Permission Issues

The container runs as non-root user. If you have permission issues:
```bash
docker-compose down
docker volume rm monipx-data monipx-logs
docker-compose up -d
```

---

## 🚀 Production Deployment

For production, consider:
1. Using a reverse proxy (nginx) with SSL
2. Setting up regular backups
3. Using environment variables for sensitive data
4. Monitoring container health

---

## ✅ First Time Setup Flow

1. **Deploy container**: `docker-compose up -d`
2. **Access app**: http://localhost:3001
3. **Redirected to setup**: `/setup` page appears
4. **Create admin**: Enter username, password, email
5. **Start using**: Full access to all features!

---

**Ready to deploy! 🎉**

