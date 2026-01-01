# 🐳 How to Run Monipx in Docker

## Quick Start (3 Steps)

### Step 1: Make sure Docker Desktop is running
- Open Docker Desktop application
- Wait until it shows "Docker Desktop is running"

### Step 2: Build and Start the Container

```bash
cd /Users/arnoldmwz/Desktop/DEV/Docker-App/monipx
docker-compose up -d --build
```

This will:
- Build the Docker image
- Create the container
- Start the application
- Run database migrations

### Step 3: Access the Application

Open your browser and go to: **http://localhost:3001**

You'll see the setup page where you can create your admin account!

---

## 📋 Complete Commands

### Build and Start
```bash
docker-compose up -d --build
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Container
```bash
docker-compose down
```

### Restart Container
```bash
docker-compose restart
```

### Check Status
```bash
docker-compose ps
```

### View Container Logs
```bash
docker-compose logs -f monipx
```

---

## 🎯 First Time Setup

1. **Access**: http://localhost:3001
2. **You'll be redirected** to `/setup` page
3. **Create Admin Account**:
   - Username: (choose your username)
   - Password: (min 6 characters)
   - Email: (optional)
4. **Click "Create Admin Account"**
5. **Start using Monipx!**

---

## ✅ Verify It's Running

```bash
# Check if container is running
docker-compose ps

# Check health
curl http://localhost:3001/health

# View logs
docker-compose logs --tail=50
```

---

## 🐛 Troubleshooting

### Port 3001 Already in Use
```bash
# Find what's using the port
lsof -i :3001

# Or change port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

---

## 🎨 What You'll See

- **Brand Color**: #ff2667 (pink/magenta) throughout the app
- **Setup Page**: Create admin account on first run
- **Dashboard**: View statistics and subnets
- **Subnet Management**: Add and manage subnets
- **IP Inventory**: Manage IPs with domain/hostname

---

**Ready to run! Just execute: `docker-compose up -d --build`** 🚀

