# 🔐 Security Policy

## Overview

Monipx takes security seriously. This document outlines the security features, best practices, and how to report vulnerabilities.

## Security Features

### 1. **Authentication & Authorization** ✅
- **Initial Setup**: First-time setup wizard creates admin account
- **Password Hashing**: SHA-256 hashing for user passwords
- **2FA Support**: Time-based One-Time Password (TOTP) authentication
- **Session Management**: Client-side authentication state
- **Route Protection**: All routes require authentication except login/setup

### 2. **SSH Terminal Security** ✅
- **AES-256-GCM Encryption**: All SSH private keys and passwords encrypted at rest
- **Master Encryption Key**: Single environment variable (`SSH_ENCRYPTION_KEY`)
- **No Plaintext Storage**: Credentials never stored in plaintext
- **Secure Key Generation**: Built-in SSH key pair generation
- **Passphrase Support**: Optional passphrase protection for SSH keys

### 3. **Data Protection** ✅
- **Database Encryption**: Sensitive data encrypted before storage
- **Environment Variables**: Secrets stored in environment, not code
- **WAL Mode**: SQLite Write-Ahead Logging for data integrity
- **Foreign Keys**: Database referential integrity enforced

### 4. **Network Security** ✅
- **CORS Protection**: Configurable CORS in production
- **Input Validation**: All API endpoints validate input
- **SQL Injection Prevention**: Parameterized queries throughout
- **XSS Protection**: Vue.js automatic escaping
- **WebSocket Security**: Socket.IO with origin validation

### 5. **Docker Security** ✅
- **Non-Root User**: Container runs as `node` user
- **Volume Isolation**: Data and logs in separate volumes
- **Health Checks**: Container health monitoring
- **Minimal Base Image**: Alpine Linux for smaller attack surface

## Security Best Practices

### Production Deployment

#### 1. **Generate Secure Encryption Key** (CRITICAL)
```bash
# Generate a secure 32-byte hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. **Set Environment Variables**
```bash
# In .env file or docker-compose.yml
SSH_ENCRYPTION_KEY=your-generated-32-byte-hex-key-here
SESSION_SECRET=your-session-secret-here
NODE_ENV=production
```

#### 3. **Enable HTTPS**
- Use a reverse proxy (nginx, Caddy, Traefik)
- Obtain SSL/TLS certificates (Let's Encrypt)
- Redirect HTTP to HTTPS

#### 4. **Configure CORS**
```bash
# Restrict to your domain
CORS_ORIGIN=https://yourdomain.com
```

#### 5. **Enable 2FA**
- Navigate to Settings → Security
- Enable Two-Factor Authentication
- Scan QR code with authenticator app

#### 6. **Regular Backups**
```bash
# Backup database
docker cp monipx:/app/data/monipx.db ./backup-$(date +%Y%m%d).db

# Backup volumes
docker run --rm -v monipx_monipx-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
```

#### 7. **Update Regularly**
```bash
# Pull latest version
docker-compose pull
docker-compose up -d
```

### SSH Key Management

1. **Use SSH Keys Over Passwords**: More secure than password authentication
2. **Passphrase Protection**: Add passphrases to SSH keys
3. **Key Rotation**: Regularly rotate SSH keys
4. **Least Privilege**: Use keys with minimal required permissions
5. **Audit Logs**: Monitor SSH connection logs

### Network Monitoring

1. **Scan Intervals**: Don't set too aggressive (avoid network flooding)
2. **Monitor Credentials**: Encrypt monitor passwords
3. **Access Control**: Limit who can create/modify monitors
4. **Alert Thresholds**: Set appropriate thresholds to avoid false positives

## Known Security Considerations

### 1. **Default Encryption Key**
⚠️ **WARNING**: If `SSH_ENCRYPTION_KEY` is not set, a default insecure key is used.
- **Impact**: SSH keys and passwords can be decrypted
- **Mitigation**: ALWAYS set a secure key in production

### 2. **No Built-in HTTPS**
- **Impact**: Traffic not encrypted in transit
- **Mitigation**: Use reverse proxy with SSL/TLS

### 3. **Single User Authentication**
- **Impact**: Currently designed for single admin user
- **Mitigation**: Multi-user support planned for future release

### 4. **Client-Side Session Storage**
- **Impact**: Session state stored in localStorage
- **Mitigation**: Use HTTPS and secure cookies in production

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email: [Your security email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Updates

- Security patches are released as soon as possible
- Critical vulnerabilities announced in release notes
- Subscribe to GitHub releases for notifications

## Compliance

### Data Storage
- All data stored locally (self-hosted)
- No external data transmission
- Full control over your data

### Encryption Standards
- AES-256-GCM for data at rest
- SHA-256 for password hashing
- Industry-standard cryptographic libraries

## Security Checklist

Before deploying to production:

- [ ] Set secure `SSH_ENCRYPTION_KEY`
- [ ] Set secure `SESSION_SECRET`
- [ ] Enable HTTPS via reverse proxy
- [ ] Configure CORS for your domain
- [ ] Enable 2FA for admin account
- [ ] Set up regular database backups
- [ ] Review and limit network access
- [ ] Monitor application logs
- [ ] Keep Docker images updated
- [ ] Test disaster recovery procedures

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated**: 2026-01-03  
**Version**: 1.1.0

