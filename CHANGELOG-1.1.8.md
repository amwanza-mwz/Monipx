# Changelog - Version 1.1.8

**Release Date:** 2026-01-05  
**Status:** Production Ready

---

## 🎯 Overview

Version 1.1.8 is a **UX improvement release** that fixes terminal color readability issues when pasting text, making the terminal experience more user-friendly.

---

## 🎨 Improvements

### 1. **Terminal Selection Color Fix** (UX)
**Problem:** When pasting text in the terminal, a yellow/pink color overlay made it impossible to read the pasted content.

**Root Cause:** The terminal selection color was set to `rgba(255, 38, 103, 0.3)` (pink/red with 30% opacity), which created poor contrast with pasted text.

**Fix:**
- Changed selection color from pink (`rgba(255, 38, 103, 0.3)`) to subtle blue (`rgba(83, 189, 250, 0.25)`)
- Added `selectionForeground: '#ffffff'` to ensure white text on selection background
- Reduced opacity from 30% to 25% for better readability

**Impact:** ✅ Pasted text is now clearly visible with excellent contrast

---

## 📝 Files Changed

### Frontend
- `src/components/terminal/TerminalWindow.vue` - Updated terminal theme selection colors

### Build
- `package.json` - Version bump to 1.1.8
- `BUILD_AND_PUSH_MULTIPLATFORM.sh` - Version bump to 1.1.8

---

## 🚀 Deployment

### Docker Hub
```bash
docker pull mwanzaa12/monipx:1.1.8
# or
docker pull mwanzaa12/monipx:latest
```

### GitHub Container Registry
```bash
docker pull ghcr.io/amwanza-mwz/monipx:1.1.8
# or
docker pull ghcr.io/amwanza-mwz/monipx:latest
```

### Update Command
```bash
# Backup your database
docker cp monipx:/app/data/monipx.db ~/monipx-backups/monipx-backup-$(date +%Y%m%d).db

# Stop and remove old container
docker stop monipx && docker rm monipx

# Pull latest image
docker pull mwanzaa12/monipx:latest

# Start new container
docker run -d --name monipx --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" \
  mwanzaa12/monipx:latest
```

---

## 🔍 Testing Checklist

- [x] Terminal selection color is readable
- [x] Pasted text is clearly visible
- [x] No yellow overlay on paste
- [x] White text on blue selection background
- [x] Multi-platform Docker build ready

---

## 📊 Version History

- **1.1.8** - Terminal selection color fix for better paste readability
- **1.1.7** - Terminal isolation fix, improved error handling, removed hardcoded keys
- **1.1.6** - WebSocket origin fix for production
- **1.1.5** - WebSocket CORS fix

---

## 🙏 Acknowledgments

Thanks for reporting the terminal color readability issue!

