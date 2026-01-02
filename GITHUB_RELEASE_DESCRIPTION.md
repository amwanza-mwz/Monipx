# 🚀 Monipx v1.1.0 - Major Feature & UI Update

**Release Date**: January 2, 2026  
**Developer**: Arnold Mwanza ([@amwanza-mwz](https://github.com/amwanza-mwz))

---

## ✨ What's New

### 🔐 Two-Factor Authentication (2FA)
- Support for Google Authenticator, Authy, and other TOTP apps
- Secure in-memory secret storage with auto-expiration
- Easy setup wizard with QR code scanning
- Enable/Disable from Settings → Security

### 👤 Enhanced User Profiles
- **Full Name Field** added to user accounts
- Better user identification across the platform
- Automatic database migration

### ⚙️ Modern Settings Page
- Stunning gradient header (pink to red)
- Sidebar navigation with 4 sections: General, Appearance, Security, About
- Smooth animations and transitions
- Fully responsive design

### 🔄 GitHub Update Checker
- Automatic update detection from GitHub releases
- One-click download for new versions
- Version comparison and notifications

---

## 🐛 Bug Fixes

### Dark Mode Fixes 🌙
- **Settings Header**: Now visible in dark mode (white text with shadow)
- **Form Text**: All helper text now visible
- **Time Displays**: Server time and intervals readable
- **Monitoring Graphs**: Complete dark mode support
  - Grid lines visible
  - Axis labels readable
  - Proper contrast throughout

### UI/UX Fixes
- Settings layout improved
- Favicon now shows Monipx logo
- Login security enhanced
- 2FA QR code generation fixed

---

## 🎨 UI/UX Improvements

- Modern gradient headers throughout
- Improved color scheme and contrast
- Better visual hierarchy
- Smooth page transitions
- Enhanced card designs
- Full dark mode support across ALL pages

---

## 🌍 Internationalization

- **English** (en) - Complete ✅
- **French** (fr) - Complete ✅
- Easy language switching

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

## 📊 Complete Feature List

### Network Monitoring
- Ping, HTTP/HTTPS, TCP, DNS, WebSocket monitoring
- Real-time status updates
- Uptime tracking
- Response time metrics
- Beautiful graphs with dark mode

### IP Management
- Subnet management
- IP address inventory
- DNS resolution (Forward & Reverse)
- MAC address tracking
- Network scanning

### User Management
- User authentication
- Two-factor authentication (NEW!)
- User profiles with names (NEW!)
- Password management

### Settings & Configuration
- Timezone configuration
- Theme switching (Light/Dark)
- Language selection (EN/FR)
- Update notifications (NEW!)

---

## 🔒 Security

- Two-factor authentication support
- Secure password hashing
- Session management
- CSRF protection
- Input validation
- SQL injection prevention
- XSS protection

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

