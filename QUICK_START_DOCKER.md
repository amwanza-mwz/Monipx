# 🚀 Quick Start - Run Monipx in Docker

## ⚠️ Important: Start Docker Desktop First!

Before running the app, you **must** start Docker Desktop:

1. **Open Docker Desktop** (from Applications or Spotlight)
2. **Wait** until the Docker icon in the menu bar shows it's running
3. **Then** run the commands below

---

## 🎯 Easy Way (Recommended)

Use the startup script:

```bash
./START_DOCKER.sh
```

This script will:
- ✅ Check if Docker is running
- ✅ Build the container
- ✅ Start the application
- ✅ Show you the status

---

## 📝 Manual Way

If you prefer to run commands manually:

### 1. Start Docker Desktop
Open the Docker Desktop application and wait for it to be ready.

### 2. Build and Start
```bash
docker-compose up -d --build
```

### 3. Check Status
```bash
docker-compose ps
```

### 4. View Logs
```bash
docker-compose logs -f
```

### 5. Access the App
Open: **http://localhost:3001**

---

## ✅ Verify It's Working

After starting, check:

```bash
# Check container status
docker-compose ps

# Check health endpoint
curl http://localhost:3001/health

# View logs
docker-compose logs --tail=50
```

---

## 🎉 First Time Setup

1. Open **http://localhost:3001** in your browser
2. You'll see the **Setup** page
3. Create your admin account:
   - Username
   - Password (min 6 characters)
   - Email (optional)
4. Click **"Create Admin Account"**
5. Start using Monipx!

---

## 🛑 Stop the App

```bash
docker-compose down
```

---

## 🔄 Restart the App

```bash
docker-compose restart
```

---

**Remember: Start Docker Desktop first, then run the commands!** 🐳

