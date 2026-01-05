# 🔑 GitHub Personal Access Token Setup

## Create GitHub Token

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/tokens
   - Or: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token (Classic)**
   - Click "Generate new token" → "Generate new token (classic)"
   - Note: "Monipx Docker Registry Access"

3. **Select Scopes**
   - ✅ `write:packages` - Upload packages to GitHub Package Registry
   - ✅ `read:packages` - Download packages from GitHub Package Registry
   - ✅ `delete:packages` - Delete packages from GitHub Package Registry

4. **Generate Token**
   - Click "Generate token"
   - **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

5. **Save Token Securely**
   ```bash
   # Save to environment variable
   export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   
   # Or save to file (for reuse)
   echo "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" > ~/.github_token
   chmod 600 ~/.github_token
   ```

## Login to GitHub Container Registry

### Option 1: Using Token Directly
```bash
echo "YOUR_TOKEN_HERE" | docker login ghcr.io -u amwanza-mwz --password-stdin
```

### Option 2: Using Environment Variable
```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo $GITHUB_TOKEN | docker login ghcr.io -u amwanza-mwz --password-stdin
```

### Option 3: Using Saved File
```bash
cat ~/.github_token | docker login ghcr.io -u amwanza-mwz --password-stdin
```

## Verify Login
```bash
docker login ghcr.io -u amwanza-mwz
# Paste token when prompted
# Should see: "Login Succeeded"
```

## Then Run Build Script Again
```bash
./BUILD_AND_PUSH_MULTIPLATFORM.sh
```

---

**Token Format**: `ghp_` followed by 36 characters  
**Example**: `ghp_1234567890abcdefghijklmnopqrstuvwxyz`

