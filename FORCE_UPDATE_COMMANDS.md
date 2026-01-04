# Monipx Production Update Guide

**Current Version:** v1.1.7
**Critical Fixes:** Terminal session isolation bug, SSH key encryption error messages

---

## 🚨 IMPORTANT: Read Before Updating

This update fixes critical bugs:
1. **Terminal sessions showing wrong output** - Fixed session isolation
2. **Confusing SSH encryption errors** - Better error messages

---

## ✅ Standard Update (Recommended for Most Users)

**Copy and paste these commands on your production server:**

```bash
# Step 1: Backup your database (IMPORTANT!)
mkdir -p ~/monipx-backups
docker cp monipx:/app/data/monipx.db ~/monipx-backups/monipx-backup-$(date +%Y%m%d-%H%M%S).db

# Step 2: Stop and remove old container
docker stop monipx
docker rm monipx

# Step 3: Remove old images to force fresh pull
docker images | grep monipx | awk '{print $3}' | xargs docker rmi -f

# Step 4: Pull latest version (v1.1.7)
docker pull mwanzaa12/monipx:latest

# Step 5: Start new container with your existing data
# Make sure you have your SSH_ENCRYPTION_KEY ready!
# If you saved it in ~/.monipx_env, use it:

docker run -d \
  --name monipx \
  --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" \
  mwanzaa12/monipx:latest

# Step 6: Verify it's running
docker ps | grep monipx
docker logs --tail 30 monipx
```

**Expected output:** You should see "Server running on port 3001" in the logs.

---

## ⚡ Quick One-Liner Update (For Advanced Users)

**WARNING:** Only use if you're confident and have your encryption key ready!

```bash
docker cp monipx:/app/data/monipx.db ~/monipx-backup-$(date +%Y%m%d-%H%M%S).db && \
docker stop monipx && docker rm monipx && \
docker rmi -f $(docker images | grep monipx | awk '{print $3}') && \
docker pull mwanzaa12/monipx:latest && \
docker run -d --name monipx --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" \
  mwanzaa12/monipx:latest && \
docker logs --tail 30 monipx
```

---

## 🔄 Alternative: Using Docker Compose

If you're using docker-compose:

```bash
# Step 1: Backup database
mkdir -p ~/monipx-backups
docker cp monipx:/app/data/monipx.db ~/monipx-backups/monipx-backup-$(date +%Y%m%d-%H%M%S).db

# Step 2: Stop services
docker-compose down

# Step 3: Remove old images
docker images | grep monipx | awk '{print $3}' | xargs docker rmi -f

# Step 4: Pull latest
docker-compose pull

# Step 5: Start with new version
docker-compose up -d

# Step 6: Verify
docker-compose logs --tail 30
```

---

## 🆘 Troubleshooting: If Update Fails

---

## Verification Commands

After update, verify you have v1.1.7:

```bash
# Check image digest
docker inspect monipx | grep -A 5 "Image"

# Check architecture
docker inspect mwanzaa12/monipx:latest | grep "Architecture"

# Should show: "Architecture": "amd64"

# Check logs for version
docker logs monipx | head -20

# Test the application
curl http://localhost:3001/health
```

---

## What to Look For

The new v1.1.7 image should have:
- **Version:** v1.1.7
- **Architecture:** `amd64` or `arm64` (depending on your system)
- **Platform:** `linux/amd64` or `linux/arm64`

---

## Troubleshooting

If you still see the old version:

1. **Check what image is actually running:**
   ```bash
   docker inspect monipx | grep "Image"
   ```

2. **Check image creation date:**
   ```bash
   docker images | grep monipx
   ```
   Should show recent date (today)

3. **Force pull with --no-cache:**
   ```bash
   docker pull --no-cache mwanzaa12/monipx:latest
   ```

4. **Check Docker Hub directly:**
   ```bash
   curl -s https://hub.docker.com/v2/repositories/mwanzaa12/monipx/tags/latest | jq
   ```
