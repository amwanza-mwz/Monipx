# Production Deployment Guide - Monipx v1.1.7

**Version:** 1.1.7  
**Status:** Production Ready  
**Date:** 2026-01-04

---

## 🚀 Quick Start (Ubuntu Server)

### Step 1: Generate Encryption Key

```bash
# Generate a secure encryption key
echo "SSH_ENCRYPTION_KEY=\"$(openssl rand -base64 32)\"" > ~/.monipx_env
chmod 600 ~/.monipx_env

# Verify it was created
cat ~/.monipx_env
```

**⚠️ IMPORTANT:** Save this key securely! You'll need it to decrypt SSH credentials.

---

### Step 2: Pull Latest Image

```bash
docker pull mwanzaa12/monipx:latest
```

---

### Step 3: Deploy Container

```bash
# Load encryption key
source ~/.monipx_env

# Run container
docker run -d \
  --name monipx \
  --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$SSH_ENCRYPTION_KEY" \
  mwanzaa12/monipx:latest
```

---

### Step 4: Verify Deployment

```bash
# Check container status
docker ps | grep monipx

# Check logs
docker logs monipx --tail 50

# Test web interface
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-01-04T..."}
```

---

## 🔄 Update to v1.1.7

If you're running an older version:

```bash
# Load your existing encryption key
source ~/.monipx_env

# Stop and remove old container
docker stop monipx && docker rm monipx

# Pull latest image
docker pull mwanzaa12/monipx:latest

# Start new container with same encryption key
docker run -d \
  --name monipx \
  --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$SSH_ENCRYPTION_KEY" \
  mwanzaa12/monipx:latest
```

**⚠️ CRITICAL:** Use the SAME encryption key to preserve existing SSH sessions!

---

## 🔒 Security Checklist

- [ ] `SSH_ENCRYPTION_KEY` is set and unique
- [ ] `~/.monipx_env` has permissions `600` (not readable by others)
- [ ] Firewall allows port 3001 (or your custom port)
- [ ] Container is running with `--restart unless-stopped`
- [ ] Data is persisted in Docker volumes (not in container)

---

## 📊 What's New in v1.1.7

### Critical Fixes
✅ **Terminal Isolation** - Terminals no longer mix output between sessions  
✅ **Hardcoded Secrets Removed** - All encryption keys now from environment  
✅ **Better Error Messages** - Clear feedback for SSH decryption failures  
✅ **WebSocket Fix** - Works on any server without hardcoded URLs  

### Improvements
- Startup warning if `SSH_ENCRYPTION_KEY` not configured
- Validates encrypted data before decryption
- Better logging for terminal session filtering

---

## 🌐 Access Your Instance

After deployment, access Monipx at:

```
http://YOUR_SERVER_IP:3001
```

Replace `YOUR_SERVER_IP` with your server's IP address.

---

## 🛠️ Troubleshooting

### Terminal Shows "Connecting..." Forever

**Cause:** WebSocket connection issue  
**Fix:** Check browser console for errors. Ensure port 3001 is accessible.

### "Failed to decrypt SSH key" Error

**Cause:** Wrong encryption key or key changed  
**Fix:** 
1. Check `docker exec monipx printenv SSH_ENCRYPTION_KEY`
2. Compare with `cat ~/.monipx_env`
3. If different, restart container with correct key

### Terminals Mixing Output

**Cause:** Old version (< 1.1.7)  
**Fix:** Update to v1.1.7 using the update command above

---

## 📦 Multi-Platform Support

Monipx v1.1.7 supports:
- **linux/amd64** - Intel/AMD processors
- **linux/arm64** - ARM processors (Raspberry Pi, AWS Graviton, Apple Silicon)

Docker automatically pulls the correct architecture for your system.

---

## 🔐 Backup & Recovery

### Backup Encryption Key
```bash
# Backup your encryption key
cp ~/.monipx_env ~/monipx_env_backup_$(date +%Y%m%d).txt
```

### Backup Database
```bash
# Backup database volume
docker run --rm \
  -v monipx-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/monipx-backup-$(date +%Y%m%d).tar.gz /data
```

---

## 📞 Support

- **GitHub:** https://github.com/amwanza-mwz/Monipx
- **Issues:** https://github.com/amwanza-mwz/Monipx/issues
- **Changelog:** See `CHANGELOG-1.1.7.md`

