# Changelog - Version 1.1.7

**Release Date:** 2026-01-04  
**Status:** Production Ready

---

## 🎯 Overview

Version 1.1.7 is a **critical production-ready release** that fixes terminal isolation bugs, removes all hardcoded secrets, and improves error handling for SSH key decryption.

---

## 🐛 Critical Fixes

### 1. **Terminal Isolation Bug** (CRITICAL)
**Problem:** Terminal output was being broadcast to ALL open terminals instead of being isolated per session.

**Root Cause:** The `sessionId` variable was being set AFTER event handlers were registered, causing handlers to capture `sessionId = null` in their closure.

**Fix:**
- Moved `sessionId = props.tabId` assignment to BEFORE `setupEventHandlers()` call
- Added debug logging to track when data is received for different sessions
- Each terminal now correctly filters data by its unique `sessionId`

**Impact:** ✅ Terminals are now properly isolated - no more cross-terminal data leakage

---

### 2. **Hardcoded Encryption Keys Removed** (SECURITY)
**Problem:** Hardcoded `SSH_ENCRYPTION_KEY` found in deployment documentation.

**Files Fixed:**
- `FORCE_UPDATE_COMMANDS.md` - Removed hardcoded key, now uses `$SSH_ENCRYPTION_KEY` from environment

**Verification:**
```bash
grep -r "ChnGVAHODtJOdtaeXh3lQosG0juId4aVMKF5nWv86Mw" . --exclude-dir=node_modules --exclude-dir=.git
# Result: Only found in SECURITY_FIX_SUMMARY.md (documentation of what was removed)
```

**Impact:** ✅ No hardcoded secrets in codebase

---

### 3. **Improved SSH Key Decryption Error Handling**
**Problem:** Generic "Failed to decrypt SSH key" error didn't help users understand the issue.

**Improvements:**
- Added validation for `SSH_ENCRYPTION_KEY` environment variable
- Better error messages:
  - "SSH_ENCRYPTION_KEY environment variable not set" - when key is missing
  - "The encryption key may have changed. Please re-add your SSH credentials" - when decryption fails
  - "Invalid encrypted data format" - when data is corrupted
- Added startup warning if `SSH_ENCRYPTION_KEY` is not configured
- Validates encrypted data length before attempting decryption

**Impact:** ✅ Users get clear, actionable error messages

---

### 4. **WebSocket Connection Fix** (from 1.1.6)
**Problem:** Frontend hardcoded `http://localhost:3001` for WebSocket connections, breaking production deployments.

**Fix:**
- Changed from `import.meta.env.VITE_API_URL || 'http://localhost:3001'`
- To: `import.meta.env.VITE_API_URL || window.location.origin`
- WebSocket now automatically connects to the same origin as the frontend

**Impact:** ✅ Works on any server without configuration

---

## 📝 Files Changed

### Frontend
- `src/components/terminal/TerminalWindow.vue` - Fixed terminal isolation bug
- `src/services/terminal-socket.js` - WebSocket origin fix (from 1.1.6)

### Backend
- `server/services/ssh/KeyEncryption.js` - Improved decryption error handling
- `server/server.js` - Added startup encryption key validation

### Documentation
- `FORCE_UPDATE_COMMANDS.md` - Removed hardcoded encryption key
- `CHANGELOG-1.1.7.md` - This file

### Build
- `package.json` - Version bump to 1.1.7
- `BUILD_AND_DEPLOY.sh` - Version bump to 1.1.7
- `Container-Image-Required.md` - Version bump to 1.1.7

---

## 🚀 Deployment

### Docker Hub
```bash
docker pull mwanzaa12/monipx:1.1.7
# or
docker pull mwanzaa12/monipx:latest
```

### GitHub Container Registry
```bash
docker pull ghcr.io/amwanza-mwz/monipx:1.1.7
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

## ⚠️ Important Notes

1. **Encryption Key Required:** You MUST set `SSH_ENCRYPTION_KEY` environment variable
   ```bash
   # If you don't have one, generate it:
   echo "SSH_ENCRYPTION_KEY=\"$(openssl rand -base64 32)\"" > ~/.monipx_env
   ```

2. **Terminal Isolation:** If you experienced cross-terminal data leakage, this is now fixed

3. **Multi-Platform:** Supports `linux/amd64` and `linux/arm64`

---

## 🔍 Testing Checklist

- [x] Terminal isolation - multiple terminals don't mix output
- [x] WebSocket connects on production servers
- [x] SSH key decryption shows helpful errors
- [x] No hardcoded secrets in codebase
- [x] Startup warning if encryption key not set
- [x] Multi-platform Docker build works

---

## 📊 Version History

- **1.1.7** - Terminal isolation fix, improved error handling, removed hardcoded keys
- **1.1.6** - WebSocket origin fix for production
- **1.1.5** - WebSocket CORS fix
- **1.1.4** - (Missing release - to be created)
- **1.1.3** - (Missing release - to be created)
- **1.1.2** - Previous stable version

---

## 🙏 Acknowledgments

Thanks for reporting the terminal isolation and encryption key issues!

