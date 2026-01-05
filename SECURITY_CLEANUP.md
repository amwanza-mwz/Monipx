# Security Cleanup - Removed Hardcoded IPs and Keys

## Changes Made (2026-01-04)

### 🔒 Removed Hardcoded Encryption Keys

**Files Modified:**

1. **`quick-rebuild.sh`**
   - ❌ **REMOVED**: Hardcoded encryption key (32-byte base64 string)
   - ✅ **NOW**: Loads key from `~/.monipx_env` or generates a new one
   - **Impact**: More secure, keys are not stored in version control

2. **`restart-with-key.sh`**
   - ❌ **REMOVED**: Hardcoded encryption key (plaintext string)
   - ✅ **NOW**: Requires `~/.monipx_env` file with encryption key
   - **Impact**: Prevents accidental key exposure in git commits

### 🌐 Removed Hardcoded IP Addresses

**Files Modified:**

1. **`README.md`**
   - ❌ **REMOVED**: Example IP `10.201.30.23:3000`
   - ✅ **NOW**: Generic example `192.168.1.100:3001`
   - **Impact**: No specific internal network IPs exposed

2. **`backups/monipx-backup-20260103-230222.db`**
   - ❌ **DELETED**: Database backup containing IP `10.201.30.44`
   - **Impact**: Removed potential sensitive network information

### 📝 Updated .gitignore

Added the following to prevent future exposure:
```
*.db-shm
*.db-wal
backups/
```

---

## 🔐 How to Set Up Encryption Key

### Option 1: Generate a New Key (Recommended for New Installations)

```bash
# Generate a secure random key
echo "SSH_ENCRYPTION_KEY=\"$(openssl rand -base64 32)\"" > ~/.monipx_env

# Verify it was created
cat ~/.monipx_env
```

### Option 2: Use an Existing Key (If You Have SSH Sessions)

If you already have SSH sessions saved in the database, you **MUST** use the same encryption key that was used to encrypt them.

```bash
# Create the file with your existing key
echo 'SSH_ENCRYPTION_KEY="your-existing-key-here"' > ~/.monipx_env

# Set proper permissions
chmod 600 ~/.monipx_env
```

⚠️ **WARNING**: If you use a different key than what was used to encrypt existing SSH sessions, those sessions will be **unrecoverable** and you'll need to delete and recreate them.

---

## 🚨 Important Security Notes

### 1. **Never Commit Sensitive Files**

The following files should **NEVER** be committed to git:
- `~/.monipx_env` (contains encryption key)
- `data/*.db` (contains encrypted credentials)
- `backups/*.db` (database backups)
- `.env` (environment variables)

### 2. **Encryption Key Management**

- **Keep it safe**: Store `~/.monipx_env` securely
- **Backup**: Keep a secure backup of your encryption key
- **Don't share**: Never share your encryption key in chat, email, or version control
- **Rotate regularly**: Consider rotating keys periodically (requires re-creating SSH sessions)

### 3. **Database Backups**

If you need to backup your database:

```bash
# Create a backup
docker cp monipx:/app/data/monipx.db ./backup-$(date +%Y%m%d).db

# Store it securely (NOT in the git repository)
mv backup-*.db ~/secure-backups/
```

### 4. **Clean Up Old Containers**

If you had containers running with hardcoded keys, remove them:

```bash
# Stop and remove old containers
docker stop monipx
docker rm monipx

# Remove old images
docker rmi monipx:1.1.3

# Rebuild with new secure configuration
./quick-rebuild.sh
```

---

## 🔍 Verify Security

### Check for Hardcoded Secrets

```bash
# Search for potential hardcoded keys (should return nothing)
grep -r "SSH_ENCRYPTION_KEY=" . --exclude-dir=node_modules --exclude-dir=.git | grep -v ".example" | grep -v ".md"

# Search for hardcoded IPs (should only show examples)
grep -r "10\.201\." . --exclude-dir=node_modules --exclude-dir=.git
```

### Verify Encryption Key is Loaded

```bash
# Check if ~/.monipx_env exists
ls -la ~/.monipx_env

# Verify container is using the key
docker exec monipx printenv SSH_ENCRYPTION_KEY
```

---

## 📚 Additional Resources

- [SECURITY.md](SECURITY.md) - Full security documentation
- [.env.example](.env.example) - Environment variable template
- [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md) - Encryption details

---

**Last Updated**: 2026-01-04  
**Version**: 1.1.3

