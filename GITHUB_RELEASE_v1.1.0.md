# 🚀 Monipx v1.1.0 - Major Feature & UI Update

**Release Date**: January 2, 2026  
**Type**: Major Feature Release  
**Developer**: Arnold Mwanza ([@amwanza-mwz](https://github.com/amwanza-mwz))

---

## 🎉 What's New

### 🔐 Two-Factor Authentication (2FA)
Complete 2FA implementation with QR code generation!
- ✅ Support for Google Authenticator, Authy, and other TOTP apps
- ✅ Secure in-memory secret storage with auto-expiration (10 min)
- ✅ Easy setup wizard with QR code scanning
- ✅ Enable/Disable from Settings → Security
- ✅ Comprehensive error handling and logging

### 👤 Enhanced User Profiles
- ✅ **Full Name Field** added to user accounts
- ✅ Better user identification across the platform
- ✅ Automatic database migration (no manual steps!)
- ✅ Full i18n support (English & French)

### ⚙️ Modern Settings Page
Complete redesign with beautiful UI!
- ✅ Stunning gradient header (pink to red)
- ✅ Sidebar navigation with 4 sections:
  - 🌐 **General**: Timezone configuration
  - 🎨 **Appearance**: Theme & Language
  - 🔒 **Security**: Account & 2FA
  - ℹ️ **About**: Version & Updates
- ✅ Smooth animations and transitions
- ✅ Fully responsive design
- ✅ Perfect dark mode support

### 🔄 GitHub Update Checker
- ✅ Automatic update detection from GitHub releases
- ✅ One-click download for new versions
- ✅ Version comparison and notifications
- ✅ Direct link to release notes

---

## 🐛 Critical Bug Fixes

### Dark Mode Fixes 🌙
- ✅ **Settings Header**: Now visible in dark mode (white text with shadow)
- ✅ **Form Text**: All helper text now visible
- ✅ **Time Displays**: Server time and intervals readable
- ✅ **Monitoring Graphs**: Complete dark mode support
  - Grid lines visible
  - Axis labels readable
  - Proper contrast throughout
- ✅ **Small Text**: All small text elements visible

### UI/UX Fixes
- ✅ **Settings Layout**: Removed duplicate titles
- ✅ **Favicon**: Now shows Monipx logo in browser tab
- ✅ **Login Security**: Fixed sidebar flash on page refresh
- ✅ **Monitoring Preview**: Added missing route for monitor details
- ✅ **2FA QR Code**: Fixed generation (removed session dependency)

---

## 🎨 UI/UX Improvements

### Design Enhancements
- Modern gradient headers throughout
- Improved color scheme and contrast
- Better visual hierarchy
- Smooth page transitions
- Enhanced card designs
- Professional typography

### Dark Mode
- Full dark mode support across ALL pages
- Optimized contrast for readability
- Consistent theming
- Smooth theme transitions
- Chart.js integration with theme switching

### Responsive Design
- Mobile-friendly layouts
- Tablet optimization
- Desktop-first approach
- Flexible grid systems

---

## 🌍 Internationalization

### Language Support
- **English** (en) - Complete ✅
- **French** (fr) - Complete ✅
- Easy language switching
- Full translation coverage for all new features

---

## 🗄️ Database Changes

### New Migrations (Auto-run on startup)
- `003_add_2fa_to_users.js` - 2FA support
- `004_add_name_to_users.js` - User name field

**Note**: No manual intervention required! Migrations run automatically.

---

## 📦 Installation & Upgrade

### New Installation
```bash
git clone https://github.com/amwanza-mwz/Monipx.git
cd Monipx
npm install
npm run dev
```

### Upgrading from v1.0.0
```bash
git pull origin main
npm install
npm run dev  # Migrations run automatically!
```

---

## 🔧 Technical Improvements

### Backend
- Improved API error handling
- Better logging for debugging
- Enhanced monitoring checker
- Optimized database queries
- Secure 2FA implementation with in-memory storage

### Frontend
- Vue 3 Composition API best practices
- Better state management
- Improved component structure
- Enhanced routing
- Optimized bundle size
- Reactive theme switching

---

## 📊 Complete Feature List

### Network Monitoring
- ✅ Ping monitoring
- ✅ HTTP/HTTPS monitoring
- ✅ TCP port monitoring
- ✅ DNS monitoring
- ✅ WebSocket monitoring
- ✅ Real-time status updates
- ✅ Uptime tracking
- ✅ Response time metrics
- ✅ Beautiful graphs with dark mode

### IP Management
- ✅ Subnet management
- ✅ IP address inventory
- ✅ DNS resolution (Forward & Reverse)
- ✅ MAC address tracking
- ✅ Network scanning
- ✅ Status monitoring

### User Management
- ✅ User authentication
- ✅ Two-factor authentication (NEW!)
- ✅ User profiles with names (NEW!)
- ✅ Password management
- ✅ Session handling

### Settings & Configuration
- ✅ Timezone configuration
- ✅ Theme switching (Light/Dark)
- ✅ Language selection (EN/FR)
- ✅ Update notifications (NEW!)
- ✅ Modern UI (NEW!)

---

## 🔒 Security

- Two-factor authentication support
- Secure password hashing
- Session management
- CSRF protection
- Input validation
- SQL injection prevention
- XSS protection
- Secure 2FA secret handling

---

## 📝 Known Issues

None at this time! 🎉

---

## 🙏 Acknowledgments

Special thanks to the open-source community!

---

## 📧 Support & Contact

**Developer**: Arnold Mwanza  
**Email**: arnold_mwanza@mwzconnect.com  
**GitHub**: [@amwanza-mwz](https://github.com/amwanza-mwz)  
**Repository**: [Monipx](https://github.com/amwanza-mwz/Monipx)

---

## 📄 License

MIT License

---

**Full Changelog**: https://github.com/amwanza-mwz/Monipx/compare/v1.0.0...v1.1.0

