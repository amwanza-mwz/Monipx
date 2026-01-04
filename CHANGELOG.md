# Changelog

All notable changes to Monipx will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.7] - 2026-01-04

### 🐛 Critical Fixes

#### Terminal Isolation Bug (CRITICAL)
- **Fixed:** Terminal output was being broadcast to ALL open terminals instead of being isolated per session
- **Root Cause:** The `sessionId` variable was being set AFTER event handlers were registered
- **Solution:** Moved `sessionId = props.tabId` assignment to BEFORE `setupEventHandlers()` call
- **Impact:** ✅ Terminals are now properly isolated - no more cross-terminal data leakage

#### Security Improvements
- **Removed:** All hardcoded encryption keys from documentation
- **Improved:** SSH key decryption error handling with clear, actionable messages
- **Added:** Startup validation for `SSH_ENCRYPTION_KEY` environment variable
- **Added:** Better error messages for missing or invalid encryption keys

#### WebSocket Connection Fix
- **Fixed:** Frontend WebSocket connection now uses `window.location.origin` instead of hardcoded localhost
- **Impact:** Works on any server without configuration changes

### 📝 Documentation Updates
- Removed hardcoded secrets from `FORCE_UPDATE_COMMANDS.md`
- Added comprehensive error handling documentation
- Updated deployment guides with proper environment variable usage

### 🔍 Files Changed
- `src/components/terminal/TerminalWindow.vue` - Terminal isolation fix
- `src/services/terminal-socket.js` - WebSocket origin fix
- `server/services/ssh/KeyEncryption.js` - Improved error handling
- `server/server.js` - Added encryption key validation
- `package.json` - Version bump to 1.1.7

### ⚠️ Important Notes
1. **Encryption Key Required:** You MUST set `SSH_ENCRYPTION_KEY` environment variable
2. **Terminal Isolation:** If you experienced cross-terminal data leakage, this is now fixed
3. **Multi-Platform:** Supports `linux/amd64` and `linux/arm64`

### 🚀 Deployment
```bash
# Update to latest version
docker pull mwanzaa12/monipx:latest
docker stop monipx && docker rm monipx
docker run -d --name monipx --restart unless-stopped \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" \
  mwanzaa12/monipx:latest
```

---

## [1.1.0] - 2026-01-03

### 🎉 Major Features Added

#### Secure SSH Terminal
- **Full SSH Terminal Integration**: Connect to remote servers directly from the web interface
- **Session Management**: Create, edit, clone, and organize SSH sessions
- **Group Organization**: Organize sessions into collapsible groups
- **Multiple Authentication Methods**: Support for SSH keys and password authentication
- **SSH Key Management**: Upload, generate, and manage SSH keys with passphrase support
- **Real-time Terminal**: Full xterm.js terminal with search, copy/paste, and web links
- **Connection Logging**: Track all SSH connections with detailed logs
- **Auto-reconnect**: Automatic reconnection on connection loss

### 🔐 Security Enhancements
- **AES-256-GCM Encryption**: All SSH private keys and passwords encrypted at rest
- **Master Encryption Key**: Environment-based encryption key management
- **2FA Support**: Two-Factor Authentication with TOTP
- **Secure Key Storage**: No plaintext credentials stored in database
- **Password Hashing**: SHA-256 hashing for user passwords
- **Input Validation**: Comprehensive validation on all API endpoints
- **CORS Protection**: Configurable CORS for production deployments

### 🎨 UI/UX Improvements
- **Modern Sidebar Design**: Redesigned navigation with pink accent color (#ff2667)
- **Dark Mode Enhancements**: Improved dark mode support across all components
- **Session Icons**: Pink terminal icons for sessions, blue folder icons for groups
- **Responsive Design**: Better mobile and tablet support
- **Loading States**: Improved loading indicators and error messages
- **Form Validation**: Real-time validation with helpful error messages

### 📊 Monitoring Improvements
- **Group Management**: Organize monitors into groups
- **Enhanced Graphs**: Better chart visualization with dark mode support
- **Monitor Details**: Improved monitor detail page with statistics
- **Quick Actions**: Clone, edit, and delete monitors easily
- **Status Indicators**: Clear visual status for all monitors

### 🐛 Bug Fixes
- Fixed group dropdown not showing in session form
- Fixed session selection not persisting after edit
- Fixed dark mode graph rendering issues
- Fixed monitor form not resetting after save
- Fixed SSH key passphrase handling
- Fixed database migration issues
- Fixed WebSocket connection stability

### 📚 Documentation
- Added comprehensive SECURITY.md
- Updated README with SSH terminal documentation
- Added secure terminal quickstart guide
- Improved API documentation
- Added encryption and security documentation

### 🔧 Technical Improvements
- **Database**: SQLite with WAL mode for better concurrency
- **WebSocket**: Socket.IO for real-time updates
- **Docker**: Optimized Docker image with health checks
- **API**: RESTful API with consistent error handling
- **Logging**: Structured logging with Winston
- **Testing**: Improved error handling and validation

### 📦 Dependencies
- Added `ssh2` for SSH connections
- Added `xterm` and addons for terminal emulation
- Added `speakeasy` for 2FA support
- Added `qrcode` for 2FA QR code generation
- Updated all dependencies to latest stable versions

### 🐳 Docker & Deployment
- **GitHub Container Registry**: Automatic builds and publishing
- **Multi-architecture Support**: amd64 and arm64
- **Automated CI/CD**: GitHub Actions workflow for Docker builds
- **Pre-built Images**: Available at `ghcr.io/amwanza-mwz/monipx`
- **Version Tags**: Both `latest` and semantic versioning (e.g., `v1.1.0`)
- **One-command Deployment**: `docker run -d -p 3001:3001 ghcr.io/amwanza-mwz/monipx:latest`

### 🚀 Performance
- Optimized database queries with indexes
- Improved WebSocket connection handling
- Better memory management for terminal sessions
- Reduced Docker image size
- Faster build times with layer caching

---

## [1.0.0] - 2025-12-15

### Initial Release

#### Core Features
- **IP Address Inventory**: Track and manage IP addresses across subnets
- **Subnet Management**: Create and manage network subnets with CIDR notation
- **Network Monitoring**: Monitor hosts with ping, HTTP, HTTPS, and TCP checks
- **Real-time Updates**: WebSocket-based real-time status updates
- **Dashboard**: Overview of network status and statistics
- **Dark Mode**: Full dark mode support
- **Docker Support**: Easy deployment with Docker Compose

#### Authentication
- Initial setup wizard
- Admin account creation
- Basic authentication

#### Monitoring
- Multiple monitor types (ping, HTTP, HTTPS, TCP)
- Configurable check intervals
- Status history tracking
- Uptime statistics
- Alert thresholds

#### UI/UX
- Modern, responsive design
- Bootstrap 5 UI framework
- Chart.js for visualizations
- Vue 3 with Composition API
- Vue Router for navigation
- Pinia for state management

---

## Version History

- **v1.1.7** (2026-01-04) - Terminal Isolation Fix, Security Improvements & Error Handling
- **v1.1.0** (2026-01-03) - Secure SSH Terminal & Security Enhancements
- **v1.0.0** (2025-12-15) - Initial Release

---

**Note**: For security vulnerabilities, please see [SECURITY.md](SECURITY.md)

