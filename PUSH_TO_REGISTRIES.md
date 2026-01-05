# 🚀 Push Clean Image to Registries

## ✅ Image Status: VERIFIED CLEAN

The Docker image `monipx:1.1.3` has been verified to contain:
- ✅ **NO database files** (0 .db files found)
- ✅ **NO sensitive data** (empty /app/data/ directory)
- ✅ **NO internal IPs in data** (only in helper scripts - acceptable)
- ✅ **NO backups** (/app/backups/ doesn't exist)

**This image is SAFE to push to public registries!**

---

## 📦 Push to GitHub Container Registry

### 1. Login to GitHub Container Registry
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u amwanza-mwz --password-stdin
```

Or create a Personal Access Token:
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `write:packages`, `read:packages`, `delete:packages`
4. Copy the token and run:
```bash
docker login ghcr.io -u amwanza-mwz
# Paste token when prompted
```

### 2. Tag the Image
```bash
docker tag monipx:1.1.3 ghcr.io/amwanza-mwz/monipx:latest
docker tag monipx:1.1.3 ghcr.io/amwanza-mwz/monipx:1.1.3
```

### 3. Push to GitHub
```bash
docker push ghcr.io/amwanza-mwz/monipx:latest
docker push ghcr.io/amwanza-mwz/monipx:1.1.3
```

### 4. Make Package Public (Optional)
1. Go to https://github.com/amwanza-mwz?tab=packages
2. Click on `monipx`
3. Click "Package settings"
4. Scroll to "Danger Zone"
5. Click "Change visibility" → "Public"

---

## 🐳 Push to Docker Hub

### 1. Login to Docker Hub
```bash
docker login
# Enter your Docker Hub username and password
```

### 2. Tag the Image
```bash
# Replace 'yourusername' with your Docker Hub username
docker tag monipx:1.1.3 yourusername/monipx:latest
docker tag monipx:1.1.3 yourusername/monipx:1.1.3
```

### 3. Push to Docker Hub
```bash
docker push yourusername/monipx:latest
docker push yourusername/monipx:1.1.3
```

---

## 🔍 Verify Pushed Images

### GitHub Container Registry
```bash
docker pull ghcr.io/amwanza-mwz/monipx:latest
docker run --rm ghcr.io/amwanza-mwz/monipx:latest sh -c "find /app -name '*.db' 2>/dev/null"
# Should return nothing
```

### Docker Hub
```bash
docker pull yourusername/monipx:latest
docker run --rm yourusername/monipx:latest sh -c "find /app -name '*.db' 2>/dev/null"
# Should return nothing
```

---

## 📝 Update Documentation

### Update README.md
Add installation instructions:

```markdown
## 🐳 Docker Installation

### From GitHub Container Registry
\`\`\`bash
docker pull ghcr.io/amwanza-mwz/monipx:latest

docker run -d --name monipx --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  ghcr.io/amwanza-mwz/monipx:latest
\`\`\`

### From Docker Hub
\`\`\`bash
docker pull yourusername/monipx:latest

docker run -d --name monipx --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  yourusername/monipx:latest
\`\`\`
```

---

## 🔒 Security Checklist

Before pushing, verify:
- [x] No database files in image
- [x] No sensitive data in /app/data/
- [x] No backups in /app/backups/
- [x] No internal IPs in data (only in docs/scripts)
- [x] .dockerignore excludes data/, *.db, backups/
- [x] .gitignore excludes sensitive files
- [x] Encryption key passed as environment variable
- [x] Container runs with non-root user

---

## 🎯 Quick Commands

### Build and Push Everything
```bash
# Build clean image
./BUILD_CLEAN_IMAGE.sh

# Push to GitHub
docker tag monipx:1.1.3 ghcr.io/amwanza-mwz/monipx:latest
docker push ghcr.io/amwanza-mwz/monipx:latest

# Push to Docker Hub
docker tag monipx:1.1.3 yourusername/monipx:latest
docker push yourusername/monipx:latest
```

### Verify Security
```bash
./verify-security.sh
```

---

## 📊 Image Size

```bash
docker images monipx:1.1.3
# Should be around 400-500MB
```

---

## ✅ Success Criteria

After pushing, you should be able to:
1. Pull the image from the registry
2. Run it without any local data
3. Create new SSH sessions
4. Connect to terminals
5. No sensitive data exposed

---

**Status**: ✅ READY TO PUSH  
**Date**: 2026-01-04  
**Version**: 1.1.3

