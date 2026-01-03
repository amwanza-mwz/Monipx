# ⚡ Monipx Quick Installation Guide

**Get Monipx running on Ubuntu in 2 minutes!**

---

## 🚀 Step 1: Generate Encryption Key

**Copy and paste BOTH lines at once into your Ubuntu terminal:**

```bash
export SSH_ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "SSH_ENCRYPTION_KEY=$SSH_ENCRYPTION_KEY" > ~/.monipx_env
```

**Press Enter.** *(You won't see any output - that's normal!)*

---

### ✅ Verify the Key Was Created

```bash
cat ~/.monipx_env
```

**You should see something like:**
```
SSH_ENCRYPTION_KEY=Kx7aP9vQ2wR5tY8uI1oP3aS6dF9gI2jK4lZ7xC0sB5n=
```

**⚠️ IMPORTANT:** This key encrypts your SSH credentials. Keep it safe!

---

## 🐳 Step 2: Pull the Docker Image

**Choose ONE option:**

### Option A: From Docker Hub (Recommended)

```bash
docker pull mwanzaa12/monipx:v1.1.1
```

### Option B: From GitHub Container Registry

```bash
docker pull ghcr.io/amwanza-mwz/monipx:latest
```

---

## 🚀 Step 3: Start Monipx

**Choose the SAME option you used in Step 2:**

### Option A: Using Docker Hub Image

```bash
docker run -d \
  --name monipx \
  --restart=unless-stopped \
  -p 3000:3000 \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e "SSH_ENCRYPTION_KEY=$(cat ~/.monipx_env | cut -d'=' -f2)" \
  mwanzaa12/monipx:v1.1.1
```

### Option B: Using GitHub Container Registry Image

```bash
docker run -d \
  --name monipx \
  --restart=unless-stopped \
  -p 3000:3000 \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e "SSH_ENCRYPTION_KEY=$(cat ~/.monipx_env | cut -d'=' -f2)" \
  ghcr.io/amwanza-mwz/monipx:latest
```

---

## ✅ Step 4: Verify It's Running

```bash
docker ps | grep monipx
```

**You should see:**
```
CONTAINER ID   IMAGE                              STATUS          PORTS
abc123def456   mwanzaa12/monipx:v1.1.1           Up 10 seconds   0.0.0.0:3000->3000/tcp, 0.0.0.0:3001->3001/tcp
```

---

## 🌐 Step 5: Access Monipx

**Open your web browser and go to:**

```
http://YOUR_SERVER_IP:3000
```

**Example:**
```
http://10.201.30.23:3000
```

**✅ You should see the Monipx login page!**

---

## 🔍 Troubleshooting

### Can't Access the Web Interface?

**Check if the container is running:**
```bash
docker ps | grep monipx
```

**Check the logs:**
```bash
docker logs monipx
```

**Check firewall:**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

### Container Won't Start?

**View error logs:**
```bash
docker logs monipx
```

**Common issue: Encryption key not set**
```bash
# Verify key exists
cat ~/.monipx_env

# If empty, regenerate:
export SSH_ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "SSH_ENCRYPTION_KEY=$SSH_ENCRYPTION_KEY" > ~/.monipx_env

# Restart container
docker stop monipx
docker rm monipx
# Then run the docker run command again
```

### SSL Error (SSL_ERROR_RX_RECORD_TOO_LONG)?

**Use HTTP, not HTTPS:**
```
✅ Correct: http://10.201.30.23:3000
❌ Wrong:  https://10.201.30.23:3000
```

For HTTPS, see: [MY_DEPLOYMENT_GUIDE.md](MY_DEPLOYMENT_GUIDE.md#ssltls-setup-with-nginx)

---

## 🛠️ Useful Commands

### View Logs
```bash
docker logs -f monipx
```

### Restart Container
```bash
docker restart monipx
```

### Stop Container
```bash
docker stop monipx
```

### Start Container
```bash
docker start monipx
```

### Remove Container
```bash
docker stop monipx
docker rm monipx
```

### View Encryption Key
```bash
cat ~/.monipx_env
```

---

## 📚 Next Steps

1. **Create your admin account** at `http://YOUR_SERVER_IP:3000`
2. **Add servers to monitor** in the web interface
3. **Set up SSL/TLS** for secure HTTPS access (optional)
   - See: [MY_DEPLOYMENT_GUIDE.md](MY_DEPLOYMENT_GUIDE.md#ssltls-setup-with-nginx)
4. **Configure backups** of your encryption key and data

---

## 🔐 Security Notes

**Your encryption key is stored in:** `~/.monipx_env`

**⚠️ CRITICAL:**
- Keep this file safe
- Backup to a secure location
- Never commit to version control
- Losing this key means losing access to encrypted SSH credentials

**Backup your key:**
```bash
cp ~/.monipx_env ~/monipx_key_backup_$(date +%Y%m%d).txt
```

---

## 📖 Full Documentation

For complete documentation, see:
- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **Production Deployment:** [MY_DEPLOYMENT_GUIDE.md](MY_DEPLOYMENT_GUIDE.md)
- **Complete Reference:** [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md)
- **Start Here:** [00_START_HERE.md](00_START_HERE.md)

---

**🎉 That's it! You're running Monipx!**

**Access:** `http://YOUR_SERVER_IP:3000`

---

**Last Updated:** 2024-01-15  
**Version:** 1.1.1  
**Status:** ✅ Production Ready

