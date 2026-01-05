# 🚀 Build & Push Instructions for v1.1.8

## ✅ GitHub Push Complete!

Code has been successfully pushed to GitHub:
- Repository: https://github.com/amwanza-mwz/Monipx
- Commit: Release v1.1.8 - Terminal selection color fix

---

## 📦 Next: Build & Push Docker Images

### Step 1: Set GitHub Token

You'll need a GitHub Personal Access Token with `write:packages` scope.

```bash
export GITHUB_TOKEN='your_github_token_here'
```

**To create a token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `write:packages`, `read:packages`
4. Copy the token

---

### Step 2: Run Build Script

```bash
./BUILD_AND_PUSH_MULTIPLATFORM.sh
```

**What it will do:**
1. ✅ Verify Docker Buildx
2. ✅ Create multi-platform builder (monipx-builder)
3. ✅ Verify .dockerignore
4. ✅ Login to Docker Hub (will prompt for credentials)
   - Username: `mwanzaa12`
   - Password: Your Docker Hub password
5. ✅ Login to GitHub Container Registry (uses $GITHUB_TOKEN)
6. ✅ Build for `linux/amd64` and `linux/arm64`
7. ✅ Push to both registries
8. ✅ Verify manifests

**Time:** ~5-10 minutes

---

### Step 3: Verify Images

After build completes, verify:

```bash
# Check Docker Hub
docker manifest inspect mwanzaa12/monipx:1.1.8

# Check GitHub Container Registry
docker manifest inspect ghcr.io/amwanza-mwz/monipx:1.1.8
```

---

### Step 4: Create GitHub Release

```bash
# Make sure GITHUB_TOKEN is still set
export GITHUB_TOKEN='your_github_token_here'

# Create the release
./create-github-release-v1.1.8.sh
```

This will:
- Create tag `v1.1.8`
- Create release on GitHub
- Attach release notes
- Mark as latest release

---

## 📝 Published Images

After successful build, images will be available at:

### Docker Hub
- `mwanzaa12/monipx:1.1.8`
- `mwanzaa12/monipx:latest`

### GitHub Container Registry
- `ghcr.io/amwanza-mwz/monipx:1.1.8`
- `ghcr.io/amwanza-mwz/monipx:latest`

### Platforms
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit - Apple Silicon, Raspberry Pi, AWS Graviton)

---

## 🧪 Test on Ubuntu

Once images are pushed:

```bash
# Pull the new image
docker pull mwanzaa12/monipx:1.1.8

# Backup database
docker cp monipx:/app/data/monipx.db ~/monipx-backups/monipx-backup-$(date +%Y%m%d).db

# Stop and remove old container
docker stop monipx && docker rm monipx

# Start new container
docker run -d --name monipx --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" \
  mwanzaa12/monipx:1.1.8

# Verify
docker logs monipx
```

---

## ✅ Testing Checklist

- [ ] Terminal opens successfully
- [ ] Paste text in terminal - should see subtle blue selection
- [ ] Pasted text is clearly readable (white on blue)
- [ ] No yellow overlay covering text
- [ ] SSH connections work
- [ ] Multiple terminals don't mix output

---

**Ready to build! 🚀**

Run: `./BUILD_AND_PUSH_MULTIPLATFORM.sh`

