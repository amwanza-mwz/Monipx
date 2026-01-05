# 🚀 Monipx v1.1.8 Release Instructions

**Release Date:** January 5, 2026  
**Status:** Ready to Build & Push

---

## ✅ What's Been Done

### 1. Version Updates
- ✅ `package.json` - Updated to 1.1.8
- ✅ `BUILD_AND_PUSH_MULTIPLATFORM.sh` - Updated to 1.1.8
- ✅ `BUILD_AND_DEPLOY.sh` - Updated to 1.1.8
- ✅ `Container-Image-Required.md` - Updated to 1.1.8

### 2. Code Changes
- ✅ Fixed terminal selection color in `src/components/terminal/TerminalWindow.vue`
  - Changed from pink `rgba(255, 38, 103, 0.3)` to blue `rgba(83, 189, 250, 0.25)`
  - Added `selectionForeground: '#ffffff'` for better readability

### 3. Documentation
- ✅ Created `CHANGELOG-1.1.8.md`
- ✅ Created `GITHUB_RELEASE_v1.1.8.md`
- ✅ Created `create-github-release-v1.1.8.sh`
- ✅ Removed old `CHANGELOG-1.1.7.md`

---

## 🚀 Next Steps - Build & Push

### Step 1: Build and Push Multi-Platform Images

Run the automated script:

```bash
./BUILD_AND_PUSH_MULTIPLATFORM.sh
```

This will:
1. ✅ Verify Docker Buildx
2. ✅ Create/use multi-platform builder
3. ✅ Verify .dockerignore
4. ✅ Login to Docker Hub (you'll be prompted)
5. ✅ Login to GitHub Container Registry (you'll be prompted for token)
6. ✅ Build for linux/amd64 and linux/arm64
7. ✅ Push to both registries
8. ✅ Verify manifests

**What you'll need:**
- Docker Hub credentials (username: mwanzaa12)
- GitHub Personal Access Token with `write:packages` scope

**Time:** ~5-10 minutes

---

### Step 2: Create GitHub Release

After images are pushed, create the GitHub release:

```bash
# Set your GitHub token
export GITHUB_TOKEN='your_github_token_here'

# Create the release
./create-github-release-v1.1.8.sh
```

This will:
1. ✅ Create tag v1.1.8
2. ✅ Create release on GitHub
3. ✅ Attach release notes from GITHUB_RELEASE_v1.1.8.md
4. ✅ Mark as latest release

---

### Step 3: Test on Ubuntu Server

Once images are pushed, test on your Ubuntu server:

```bash
# Pull the new image
docker pull mwanzaa12/monipx:1.1.8

# Or from GitHub
docker pull ghcr.io/amwanza-mwz/monipx:1.1.8

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
```

---

## 🧪 Testing Checklist

After deployment, verify:

- [ ] Terminal opens successfully
- [ ] Paste text in terminal - should see subtle blue selection
- [ ] Pasted text is clearly readable (white on blue)
- [ ] No yellow overlay covering text
- [ ] SSH connections work
- [ ] Multiple terminals don't mix output

---

## 📦 Published Images

After build completes, images will be available at:

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

## 🔑 GitHub Token Setup

If you don't have a GitHub token:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
   - ✅ `read:packages` (Download packages from GitHub Package Registry)
4. Generate and copy the token
5. Export it: `export GITHUB_TOKEN='your_token_here'`

---

## 📝 Summary

**What's New in v1.1.8:**
- Fixed terminal selection color for better paste readability
- Changed from pink/yellow overlay to subtle blue
- Added white foreground text for excellent contrast

**Ready to:**
1. Build multi-platform images
2. Push to Docker Hub and GitHub
3. Create GitHub release
4. Deploy to Ubuntu server

---

**Let's build and push! 🚀**

