# 📚 MoniPX Knowledge Base

## Architecture

### Tech Stack
- **Frontend:** Vue 3 + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** SQLite
- **Real-time:** Socket.IO
- **SSH:** ssh2 library
- **Containerization:** Docker

### Directory Structure
```
monipx/
├── src/              # Vue frontend
├── server/           # Node.js backend
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   ├── models/       # Database models
│   └── utils/        # Utilities
├── public/           # Static assets
├── dist/             # Built frontend
└── data/             # SQLite database
```

---

## Key Features

### 1. SSH Session Management
- Encrypted credential storage (AES-256-CBC)
- Multiple server support
- Session isolation
- Auto-reconnect

### 2. Real-time Terminal
- WebSocket-based terminal
- Full terminal emulation (xterm.js)
- Command history
- Multi-session support

### 3. System Monitoring
- CPU, Memory, Disk usage
- Network statistics
- Process monitoring
- Real-time charts (Chart.js)

### 4. Security
- SSH key encryption at rest
- Environment-based encryption keys
- Session-based authentication
- Secure WebSocket connections

---

## Database Schema

### ssh_sessions
```sql
CREATE TABLE ssh_sessions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER DEFAULT 22,
  username TEXT NOT NULL,
  password TEXT,           -- Encrypted
  private_key TEXT,        -- Encrypted
  passphrase TEXT,         -- Encrypted
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### active_terminal_sessions
```sql
CREATE TABLE active_terminal_sessions (
  id INTEGER PRIMARY KEY,
  session_id INTEGER,
  socket_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES ssh_sessions(id)
);
```

---

## API Endpoints

### Sessions
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/test` - Test connection

### Terminal
- `WebSocket /terminal` - Terminal connection
- `POST /api/terminal/connect` - Start terminal session
- `POST /api/terminal/disconnect` - Stop terminal session

### Monitoring
- `GET /api/monitoring/:sessionId/stats` - Get system stats
- `WebSocket /monitoring` - Real-time monitoring

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3001` | Server port |
| `SSH_ENCRYPTION_KEY` | **Yes** | - | 32-byte base64 encryption key |

---

## Encryption

### SSH Credentials
All SSH credentials are encrypted using AES-256-CBC:

```javascript
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(SSH_ENCRYPTION_KEY, 'salt', 32);
const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv(algorithm, key, iv);
const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
```

### Key Management
- Generate: `openssl rand -base64 32`
- Store in: `~/.monipx_env`
- **Never commit to git!**

---

## Docker

### Build
```bash
docker build -t monipx:1.1.3 .
```

### Run
```bash
docker run -d \
  --name monipx \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -e SSH_ENCRYPTION_KEY="your-key" \
  monipx:1.1.3
```

### Push to Registry
```bash
# Docker Hub
docker tag monipx:1.1.3 mwanzaa12/monipx:1.1.3
docker push mwanzaa12/monipx:1.1.3

# GHCR
docker tag monipx:1.1.3 ghcr.io/amwanza-mwz/monipx:1.1.3
docker push ghcr.io/amwanza-mwz/monipx:1.1.3
```

---

## Common Issues

### 1. "Failed to decrypt SSH key"
**Cause:** Encryption key mismatch  
**Fix:** Use the same key that encrypted the credentials
```bash
source ~/.monipx_env
docker restart monipx
```

### 2. Session connects to wrong server
**Cause:** Session isolation bug (fixed in v1.1.3)  
**Fix:** Update to latest version

### 3. Sidebar flashes on refresh
**Cause:** State management issue (fixed in v1.1.3)  
**Fix:** Update to latest version

---

## Development

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

---

## Version History

- **v1.1.7** - Terminal isolation fix, security improvements, error handling enhancements
- **v1.1.3** - Session isolation fix, sidebar flash fix, enhanced logging
- **v1.1.2** - Security improvements
- **v1.1.1** - Bug fixes
- **v1.1.0** - Initial release

---

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

## License

MIT License - See LICENSE file

---

**Last Updated:** 2026-01-04  
**Version:** 1.1.3

