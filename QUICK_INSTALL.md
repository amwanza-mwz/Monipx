# 🚀 Quick Install Guide

**Current Version:** v1.1.7

## Docker Hub (Recommended)

### Pull and Run
```bash
docker pull mwanzaa12/monipx:latest

docker run -d \
  --name monipx \
  --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY=$(openssl rand -base64 32) \
  mwanzaa12/monipx:latest
```

### Access
Open: **http://localhost:3001**

---

## GitHub Container Registry

```bash
docker pull ghcr.io/amwanza-mwz/monipx:latest

docker run -d \
  --name monipx \
  --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY=$(openssl rand -base64 32) \
  ghcr.io/amwanza-mwz/monipx:latest
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `SSH_ENCRYPTION_KEY` | Yes | 32-byte base64 key for SSH credential encryption |

---

## Volumes

| Volume | Purpose |
|--------|---------|
| `monipx-data` | SQLite database and persistent data |
| `monipx-logs` | Application logs |

---

## Ports

| Port | Description |
|------|-------------|
| `3001` | Web UI and API |

---

## First Time Setup

1. **Generate encryption key:**
   ```bash
   export SSH_ENCRYPTION_KEY=$(openssl rand -base64 32)
   echo "SSH_ENCRYPTION_KEY=$SSH_ENCRYPTION_KEY" > ~/.monipx_env
   ```

2. **Start container:**
   ```bash
   docker run -d \
     --name monipx \
     --restart unless-stopped \
     -p 3001:3001 \
     -v monipx-data:/app/data \
     -v monipx-logs:/app/logs \
     -e NODE_ENV=production \
     -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" \
     mwanzaa12/monipx:latest
   ```

3. **Access UI:**
   - Open: http://localhost:3001
   - Create your first SSH session
   - Start monitoring!

---

## Update to Latest Version

### Quick Update (One Command)
```bash
docker stop monipx && docker rm monipx && docker pull mwanzaa12/monipx:latest && docker run -d --name monipx --restart unless-stopped -p 3001:3001 -v monipx-data:/app/data -v monipx-logs:/app/logs -e NODE_ENV=production -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" mwanzaa12/monipx:latest
```

### Step-by-Step Update
```bash
# Pull latest
docker pull mwanzaa12/monipx:latest

# Stop and remove old container
docker stop monipx
docker rm monipx

# Start new container (data persists in volumes)
docker run -d \
  --name monipx \
  --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" \
  mwanzaa12/monipx:latest
```

✅ **Data is preserved** - All your monitors, SSH sessions, and settings remain intact!

---

## Troubleshooting

### Container won't start
```bash
docker logs monipx
```

### Check encryption key
```bash
docker exec monipx printenv SSH_ENCRYPTION_KEY
```

### Reset database (⚠️ deletes all data)
```bash
docker stop monipx
docker volume rm monipx-data
docker start monipx
```

---

## Support

- **Issues:** https://github.com/arnoldmwz/monipx/issues
- **Docs:** https://github.com/arnoldmwz/monipx
- **Docker Hub:** https://hub.docker.com/r/mwanzaa12/monipx

---

**Version:** 1.1.7  
**Last Updated:** 2026-01-04
**Release Notes:** [v1.1.7](https://github.com/amwanza-mwz/Monipx/releases/tag/v1.1.7)

