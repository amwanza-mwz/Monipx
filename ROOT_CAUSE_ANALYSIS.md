# 🔍 ROOT CAUSE ANALYSIS - Terminal Connection Failures

## 📋 Summary

**Status**: Terminal was working → Session deletion fix → Terminal broke  
**Date**: 2026-01-04  
**Impact**: All terminal connections failing with "SSH session not found"

---

## 🐛 Root Causes Identified

### 1. **Container Using Wrong Encryption Key** ❌ CRITICAL
- **Problem**: Container is using default key `change-this-to-a-secure-32-byte-hex-key`
- **Your Key**: Stored in `~/.monipx_env` (different key)
- **Impact**: SSH sessions encrypted with your key cannot be decrypted by container
- **Result**: "SSH session not found" errors

### 2. **UI Caching Deleted Session** ❌ CRITICAL
- **Problem**: UI trying to connect to session ID 4 (deleted)
- **Database**: Only has sessions ID 2 and 3
- **Impact**: Connection attempts fail immediately
- **Cause**: Browser cache or localStorage holding stale data

### 3. **Internal IP in Database** ⚠️ SECURITY
- **Problem**: Session ID 3 contains IP `10.201.30.44`
- **Impact**: Internal network IP exposed in database
- **Risk**: If database is backed up/shared, IP is leaked

### 4. **Session Isolation Not Enforced** ⚠️ DESIGN
- **Problem**: No validation that session IDs are unique per user/environment
- **Impact**: Potential session hijacking or cross-contamination
- **Current**: All sessions share same encryption key

---

## 🔄 How It Broke

### Timeline:
1. ✅ **Before**: Terminal working with hardcoded encryption key
2. 🔧 **Change**: Removed hardcoded keys, moved to `~/.monipx_env`
3. 🐛 **Issue**: Container rebuilt WITHOUT passing `SSH_ENCRYPTION_KEY` env var
4. ❌ **Result**: Container uses default key, can't decrypt sessions
5. 🗑️ **User Action**: Deleted session ID 4 from UI
6. 💾 **Cache**: Browser still has session ID 4 in localStorage
7. ❌ **Final State**: UI tries to connect to deleted session with wrong key

### Why It Worked Before:
- Hardcoded key in `docker-compose.yml` was always passed to container
- No encryption key mismatches
- Sessions were never deleted (no cache issues)

### Why It Broke:
- `quick-rebuild.sh` and `restart-with-key.sh` don't pass `-e SSH_ENCRYPTION_KEY`
- Container defaults to insecure key
- Browser cache not cleared after session deletion

---

## 🛠️ The Fix

### Immediate Actions (Run These Now):

```bash
# 1. Fix encryption key and clear cache
./FIX_TERMINAL_NOW.sh

# 2. Remove internal IP from database
./REMOVE_IP_FROM_DB.sh

# 3. Verify security
./verify-security.sh
```

### What Each Script Does:

#### `FIX_TERMINAL_NOW.sh`
1. Stops container
2. Clears `active_terminal_sessions` table
3. Loads encryption key from `~/.monipx_env`
4. Rebuilds image (clean, no sensitive data)
5. Starts container with **correct** encryption key
6. Verifies key matches

#### `REMOVE_IP_FROM_DB.sh`
1. Shows current sessions
2. Deletes session ID 3 (10.201.30.44)
3. Confirms deletion

#### `verify-security.sh`
1. Checks for hardcoded keys (should find 0)
2. Verifies encryption key file exists
3. Confirms container using correct key
4. Validates .dockerignore and .gitignore

---

## 🔒 Session Isolation Requirements

### Current State:
- ❌ All sessions use same encryption key
- ❌ No per-session encryption
- ❌ No user-level isolation
- ✅ Sessions stored in database with unique IDs
- ✅ WebSocket sessions isolated by socket ID

### Recommended Improvements:

#### 1. **Per-Session Encryption** (Future Enhancement)
```javascript
// Instead of one global key, derive per-session keys
const sessionKey = deriveKey(MASTER_KEY, sessionId);
const encrypted = encrypt(data, sessionKey);
```

#### 2. **User-Level Isolation** (If Multi-User)
```sql
ALTER TABLE ssh_sessions ADD COLUMN user_id INTEGER;
CREATE INDEX idx_ssh_sessions_user ON ssh_sessions(user_id);
```

#### 3. **Session Validation**
```javascript
// Before connecting, verify session belongs to current user
if (session.user_id !== currentUser.id) {
  throw new Error('Unauthorized');
}
```

#### 4. **Cache Invalidation**
```javascript
// When session is deleted, clear from localStorage
localStorage.removeItem(`session_${sessionId}`);
// Broadcast to all tabs
broadcastChannel.postMessage({ type: 'SESSION_DELETED', id: sessionId });
```

---

## 📊 Current Database State

### SSH Sessions:
```
ID 2: MGMT-Switch (user@50.31.178.229)
ID 3: Test server (user@10.201.30.44)  ← REMOVE THIS
```

### Active Terminal Sessions:
```
(empty) ✅
```

### Encryption:
- **File**: `~/.monipx_env`
- **Container**: Using default key ❌
- **Match**: NO ❌

---

## ✅ Success Criteria

After running the fix scripts, you should have:

1. ✅ Container using correct encryption key
2. ✅ No internal IPs in database
3. ✅ No hardcoded keys in codebase
4. ✅ Terminal connections working
5. ✅ Browser cache cleared
6. ✅ All security checks passing

---

## 🚀 Testing Steps

### 1. Run Fix Scripts
```bash
./FIX_TERMINAL_NOW.sh
./REMOVE_IP_FROM_DB.sh
./verify-security.sh
```

### 2. Clear Browser Cache
- **Chrome**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- **Firefox**: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
- **Safari**: Cmd+Option+R

### 3. Test Terminal
1. Open http://localhost:3001 in **incognito/private window**
2. Go to **Secure Terminal**
3. Try connecting to session ID 2
4. If it fails: Delete and recreate the session

### 4. Verify Logs
```bash
docker logs -f monipx
```

Look for:
- ✅ `SSH connection established`
- ✅ `Terminal session created`
- ❌ NO "SSH session not found" errors

---

## 🔐 Security Checklist

- [ ] No hardcoded encryption keys in code
- [ ] No internal IPs in database
- [ ] No sensitive data in Docker images
- [ ] `.gitignore` excludes `~/.monipx_env`
- [ ] `.dockerignore` excludes `data/`, `*.db`, `backups/`
- [ ] Container using correct encryption key
- [ ] All sessions isolated by WebSocket
- [ ] Database has foreign key cascades

---

## 📝 Lessons Learned

1. **Always pass environment variables** when rebuilding containers
2. **Clear browser cache** after deleting sessions
3. **Validate encryption keys** before connecting
4. **Never hardcode** sensitive data
5. **Test in incognito mode** to avoid cache issues
6. **Implement cache invalidation** for deleted resources
7. **Add session ownership** for multi-user scenarios

---

**Next Steps**: Run `./FIX_TERMINAL_NOW.sh` and follow the on-screen instructions.

