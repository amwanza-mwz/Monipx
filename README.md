# Monipx

**Self-hosted network monitoring & IP inventory tool with SSH terminal - Track subnets, monitor uptime**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.4-green.svg)](https://nodejs.org/)
[![Docker Hub](https://img.shields.io/badge/docker%20hub-mwanzaa12%2Fmonipx-blue)](https://hub.docker.com/r/mwanzaa12/monipx)
[![GHCR](https://img.shields.io/badge/ghcr-amwanza--mwz%2Fmonipx-blue)](https://github.com/amwanza-mwz/monipx/pkgs/container/monipx)

A powerful, self-hosted solution for managing IP addresses across multiple subnets and monitoring network resources in real-time. Perfect for network administrators, IT teams, and anyone managing multiple servers or network segments.

## 🎯 Key Features

- **Multi-Subnet IP Management** - Track and manage IPs across multiple subnets (/24, /16, /8) with automatic discovery
- **Real-Time Network Monitoring** - Monitor uptime with Ping, HTTP/HTTPS, TCP, DNS, and WebSocket support
- **Secure SSH Terminal** - Built-in multi-tab terminal with AES-256-GCM encryption and session management
- **Beautiful Dashboard** - Modern Vue 3 UI with dark mode, real-time updates, and responsive design
- **Uptime Statistics** - Track availability, response times, charts, and network health metrics

## 🚀 Quick Start

```bash
docker run -d --name monipx --restart=unless-stopped \
  -p 3000:3000 -p 3001:3001 \
  -v monipx-data:/app/data \
  -e NODE_ENV=production \
  -e "SSH_ENCRYPTION_KEY=$(openssl rand -base64 32)" \
  mwanzaa12/monipx:latest
```

**Access:** http://localhost:3000

**Platforms:** linux/amd64, linux/arm64 (Mac M1/M2, Raspberry Pi)

**Latest Version:** v1.1.7 | [Release Notes](https://github.com/amwanza-mwz/Monipx/releases/tag/v1.1.7)

---

## 📚 Documentation

**Quick Links:**
- ⚡ **[Quick Install Guide](QUICK_INSTALL.md)** - Get running in 2 minutes
- 🚀 **[Quick Start Guide](QUICK_START.md)** - 5-minute deployment
- 📖 **[Production Deployment Guide](MY_DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide
- 📚 **[Knowledge Base](KNOWLEDGE_BASE.md)** - Complete technical reference
- 🗺️ **[Documentation Index](00_START_HERE.md)** - Start here for all documentation

**Docker Images:**
- Docker Hub: `docker pull mwanzaa12/monipx:latest`
- GitHub Container Registry: `docker pull ghcr.io/amwanza-mwz/monipx:latest`

---

## 📖 Project History

**Monipx** was born out of a real-world problem faced at **MwzConnect**. As a company managing multiple static subnets, it became increasingly difficult to track which IP addresses were connected and which were not. The challenge of maintaining an accurate IP inventory across different network segments led to the creation of this tool.

**Arnold Mwanza**, a passionate open-source developer and Lead Engineer at MwzConnect, decided to build Monipx to solve this problem. The project combines the best features of network monitoring tools like Uptime Kuma with specialized IP address inventory management, making it easier for network administrators and IT teams to track and monitor their network infrastructure.

This project is a testament to solving real problems with open-source solutions, built with modern technologies and a focus on user experience.

---

## 📸 Screenshot

![Monipx Dashboard](HomePage.png)

*Monipx Dashboard showing real-time subnet monitoring, IP inventory, and network health statistics*

---

## ✨ Features

### 🎯 Multi-Subnet IP Address Management
- **Multiple Subnet Management**: Add and manage multiple subnets simultaneously
  - Support for different subnet sizes (`/24`, `/16`, `/8`, etc.)
  - Automatically lists all IPs in a subnet (e.g., 1-254 for `/24`)
  - Organize subnets by tags or categories
  - Per-subnet configuration and monitoring
- **Subnet Dashboard**: Unified view of all subnets with health indicators
- **Auto-discovery**: Automatically list all IP addresses in each subnet
- **Visual Status Indicators**: 
  - 🟢 Green = Connected
  - 🔴 Red = Not Connected
  - 🟡 Yellow = Unknown
- **Manual Override**: Manually change IP connection status
- **IP Inventory**: Complete inventory of all IPs across all subnets with details (hostname, domain, subdomain, MAC, last seen)
- **Domain/Hostname Support**: Associate domain, hostname, or subdomain with IP addresses
- **DNS Resolution**: Forward and reverse DNS lookup capabilities
- **Bulk Operations**: Scan, monitor, or configure multiple subnets at once

### 📊 Network Monitoring
- **Subnet Scanning**: Ping all IPs in a subnet to detect connected devices
- **Real-time Updates**: Live status updates via WebSocket
- **Multiple Monitor Types**:
  - ✅ Ping monitoring
  - ✅ HTTP/HTTPS monitoring with status code validation
  - ✅ TCP port monitoring
  - ✅ DNS resolution monitoring
  - ✅ WebSocket connection monitoring
- **Monitor Groups**: Organize monitors into collapsible groups
- **Subnet Health Tracking**: Health scores and trends per subnet
- **Uptime Statistics**: Track uptime percentage and availability
- **Response Time Tracking**: Monitor network performance with graphs
- **Configurable Intervals**: Set custom scan and monitoring intervals
- **Alert Thresholds**: Configure custom alert conditions
- **Status History**: Track monitor status changes over time
- **Charts & Graphs**: Beautiful visualizations with dark mode support

### 🔐 Secure SSH Terminal (NEW in v1.1.0)
- **Multi-Tab Terminal**: Open multiple SSH sessions in tabs with beautiful modern UI
- **Session Management**:
  - Save and organize SSH sessions by groups
  - Beautiful session sidebar with search functionality
  - Group management with expandable/collapsible groups
  - Session state persisted across page refreshes
- **SSH Key Authentication**:
  - Secure key-based authentication with AES-256-GCM encryption
  - Password authentication support with encrypted storage
  - Passphrase support for double encryption of SSH keys
- **Key Management**:
  - Upload existing SSH keys (RSA, ED25519, ECDSA)
  - Generate new SSH keys (RSA 2048/4096, ED25519)
  - Manage multiple keys with descriptions
  - Secure key storage with encryption
- **Real-time Terminal**:
  - Full xterm.js terminal with WebSocket communication
  - Multiple color schemes (Dracula, Monokai, Solarized Dark/Light, etc.)
  - Configurable terminal types (xterm-256color, xterm, vt100, etc.)
  - Copy/paste support
  - Scrollback buffer
- **Connection Features**:
  - Auto-reconnect on disconnect
  - Configurable keep-alive to prevent timeouts
  - Connection logging with timestamps and statistics
  - Session status indicators (connected, disconnected, error)
- **Security**:
  - All credentials encrypted at rest with AES-256-GCM
  - Secure WebSocket communication
  - No plaintext storage of passwords or keys
  - Environment-based encryption key management

### 🎨 Modern UI/UX
- **Beautiful Interface**: Built with Vue 3 and Bootstrap 5
- **Collapsible Sidebar**: Modern navigation menu that can collapse/expand with state persistence
- **Real-time Dashboard**: Live updates without page refresh via WebSocket
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark Mode**: Full dark mode support with improved styling and contrast
- **Internationalization**: Support for multiple languages (English, French)
- **Modern Components**:
  - Beautiful session list with modern cards
  - Action buttons with hover effects
  - Search functionality across all views
  - Loading states and animations
  - Toast notifications for user feedback

---

## ⚡ Quick Installation (Fastest Way!)

**Get Monipx running on Ubuntu in 2 minutes!**

### Step 1: Generate Encryption Key

Copy and paste **BOTH lines** into your Ubuntu terminal:

```bash
export SSH_ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "SSH_ENCRYPTION_KEY=$SSH_ENCRYPTION_KEY" > ~/.monipx_env
```

Verify it was created:
```bash
cat ~/.monipx_env
```

### Step 2: Pull Docker Image

```bash
docker pull mwanzaa12/monipx:latest
```

### Step 3: Start Monipx

```bash
docker run -d \
  --name monipx \
  --restart=unless-stopped \
  -p 3000:3000 \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e "SSH_ENCRYPTION_KEY=$(cat ~/.monipx_env | cut -d'=' -f2)" \
  mwanzaa12/monipx:latest
```

### Step 4: Access Monipx

Open your browser: **`http://YOUR_SERVER_IP:3001`**

**Example:** `http://192.168.1.100:3001`

**📖 Full Quick Install Guide:** [QUICK_INSTALL.md](QUICK_INSTALL.md)

---

## 🚀 Alternative Installation Methods

### Docker Compose (For Development)

```bash
# Clone the repository
git clone https://github.com/mwzconnect/monipx.git
cd monipx

# Generate a secure SSH encryption key
export SSH_ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "SSH_ENCRYPTION_KEY=$SSH_ENCRYPTION_KEY" > .env

# Start the application
docker-compose up -d --build

# View logs
docker-compose logs -f
```

Access Monipx at `http://localhost:3000`

**⚠️ IMPORTANT**: The `SSH_ENCRYPTION_KEY` encrypts SSH credentials in the database. Keep it safe!

---

## 🖥️ Ubuntu Server Deployment Guide

> 📘 **Quick Deploy**: Use our automated deployment script!
> ```bash
> curl -fsSL https://raw.githubusercontent.com/amwanza-mwz/Monipx/main/deploy-ubuntu.sh | bash
> ```
>
> 📖 **Full Guide**: See [UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md) for detailed instructions

### Prerequisites

Before deploying on Ubuntu server, ensure you have:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
# Or run: newgrp docker

# Verify Docker installation
docker --version
docker ps
```

### Step-by-Step Deployment

#### Option 1: Quick Deploy with Docker Run (Recommended)

```bash
# 1. Generate a secure encryption key
export SSH_ENCRYPTION_KEY=$(openssl rand -base64 32)

# 2. Save the key for future use (IMPORTANT!)
echo "SSH_ENCRYPTION_KEY=$SSH_ENCRYPTION_KEY" >> ~/.monipx_env
echo "⚠️  IMPORTANT: Save this key! Stored in ~/.monipx_env"

# 3. Pull and run Monipx from Docker Hub
docker run -d \
  --name monipx \
  --restart=unless-stopped \
  -p 3000:3000 \
  -p 3001:3001 \
  -v monipx-data:/app/data \
  -v monipx-logs:/app/logs \
  -e NODE_ENV=production \
  -e SSH_ENCRYPTION_KEY=$SSH_ENCRYPTION_KEY \
  mwanzaa12/monipx:latest

# 4. Check if container is running
docker ps | grep monipx

# 5. View logs
docker logs -f monipx
```

**Access your server:**
- Web Interface: `http://YOUR_SERVER_IP:3000`
- WebSocket: `ws://YOUR_SERVER_IP:3001`

#### Option 2: Deploy with Docker Compose (Production)

```bash
# 1. Create a directory for Monipx
mkdir -p ~/monipx && cd ~/monipx

# 2. Generate encryption key
export SSH_ENCRYPTION_KEY=$(openssl rand -base64 32)

# 3. Create .env file
cat > .env << EOF
NODE_ENV=production
SSH_ENCRYPTION_KEY=$SSH_ENCRYPTION_KEY
PORT=3000
WS_PORT=3001
EOF

# 4. Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  monipx:
    image: mwanzaa12/monipx:latest
    container_name: monipx
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - monipx-data:/app/data
      - monipx-logs:/app/logs
    environment:
      - NODE_ENV=${NODE_ENV}
      - SSH_ENCRYPTION_KEY=${SSH_ENCRYPTION_KEY}
      - PORT=${PORT}
      - WS_PORT=${WS_PORT}
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  monipx-data:
    driver: local
  monipx-logs:
    driver: local
EOF

# 5. Start Monipx
docker-compose up -d

# 6. Check status
docker-compose ps
docker-compose logs -f
```

### Firewall Configuration

If you have UFW (Uncomplicated Firewall) enabled:

```bash
# Allow HTTP port (3000)
sudo ufw allow 3000/tcp

# Allow WebSocket port (3001)
sudo ufw allow 3001/tcp

# Check firewall status
sudo ufw status
```

### Setting Up Reverse Proxy with Nginx (Optional)

For production with a domain name:

```bash
# 1. Install Nginx
sudo apt install nginx -y

# 2. Create Nginx configuration
sudo nano /etc/nginx/sites-available/monipx

# 3. Add this configuration:
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket endpoint
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# 4. Enable the site
sudo ln -s /etc/nginx/sites-available/monipx /etc/nginx/sites-enabled/

# 5. Test Nginx configuration
sudo nginx -t

# 6. Restart Nginx
sudo systemctl restart nginx

# 7. (Optional) Install SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Useful Management Commands

```bash
# View logs
docker logs -f monipx

# Restart container
docker restart monipx

# Stop container
docker stop monipx

# Start container
docker start monipx

# Backup data
docker run --rm -v monipx-data:/data -v $(pwd):/backup ubuntu tar czf /backup/monipx-backup-$(date +%Y%m%d).tar.gz /data

# Restore data
docker run --rm -v monipx-data:/data -v $(pwd):/backup ubuntu tar xzf /backup/monipx-backup-YYYYMMDD.tar.gz -C /
```

### 🔄 Update to Latest Version

To update your existing Monipx installation to the latest version:

#### Quick Update (One Command)

```bash
docker stop monipx && docker rm monipx && docker pull mwanzaa12/monipx:latest && docker run -d --name monipx --restart unless-stopped -p 3001:3001 -v monipx-data:/app/data -v monipx-logs:/app/logs -e NODE_ENV=production -e SSH_ENCRYPTION_KEY="YOUR_KEY_HERE" mwanzaa12/monipx:latest
```

⚠️ **Important:** Replace `YOUR_KEY_HERE` with your actual SSH encryption key from `~/.monipx_env`

#### Step-by-Step Update

1. **Retrieve your encryption key:**
   ```bash
   cat ~/.monipx_env
   ```
   Copy the key value for use in step 4.

2. **Pull the latest image:**
   ```bash
   docker pull mwanzaa12/monipx:latest
   ```

3. **Stop and remove old container:**
   ```bash
   docker stop monipx
   docker rm monipx
   ```
   *Note: Your data is safe in Docker volumes*

4. **Start new container with same volumes:**
   ```bash
   docker run -d \
     --name monipx \
     --restart unless-stopped \
     -p 3001:3001 \
     -v monipx-data:/app/data \
     -v monipx-logs:/app/logs \
     -e NODE_ENV=production \
     -e SSH_ENCRYPTION_KEY="$(cat ~/.monipx_env | cut -d'=' -f2)" \
     mwanzaa12/monipx:latest
   ```

5. **Verify the update:**
   ```bash
   docker logs -f monipx
   ```
   Check the logs for successful startup and verify the version.

**✅ Your data is preserved!** All monitors, SSH sessions, and settings are stored in the `monipx-data` volume and will be available in the updated version.

**📦 Available Versions:**
- Latest stable: `mwanzaa12/monipx:latest`
- Specific version: `mwanzaa12/monipx:v1.1.7`
- View all releases: [GitHub Releases](https://github.com/amwanza-mwz/Monipx/releases)

### Troubleshooting

```bash
# Check if container is running
docker ps -a | grep monipx

# View container logs
docker logs monipx

# Check container resource usage
docker stats monipx

# Enter container shell
docker exec -it monipx sh

# Check port bindings
sudo netstat -tulpn | grep -E '3000|3001'

# Restart Docker service
sudo systemctl restart docker
```

---

## 📦 Docker Images

**Available on Multiple Registries:**
- 🐳 **Docker Hub**: [`mwanzaa12/monipx`](https://hub.docker.com/r/mwanzaa12/monipx)
- 📦 **GitHub Container Registry**: [`ghcr.io/amwanza-mwz/monipx`](https://github.com/amwanza-mwz/Monipx/pkgs/container/monipx)

**Features:**
- ✅ Multi-architecture support (amd64, arm64)
- ✅ Automatic builds with GitHub Actions
- ✅ Published to both Docker Hub and GHCR
- ✅ Semantic versioning (latest, v1.1.0, 1.1, 1)

**Pull Commands:**
```bash
# From Docker Hub (Recommended)
docker pull mwanzaa12/monipx:latest
docker pull mwanzaa12/monipx:v1.1.7

# From GitHub Container Registry
docker pull ghcr.io/amwanza-mwz/monipx:latest
docker pull ghcr.io/amwanza-mwz/monipx:v1.1.7
```

---

### Non-Docker Installation

**Requirements:**
- Node.js >= 20.4
- npm or yarn
- Git

```bash
# Clone the repository
git clone https://github.com/mwzconnect/monipx.git
cd monipx

# Install dependencies
npm install

# Build frontend
npm run build

# Start server
npm start

# Or for development
npm run dev
```

---

## 📖 Documentation

For complete project documentation, see [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md)

The specification includes:
- Detailed feature list
- Technology stack
- Architecture design
- Database schema
- API documentation
- UI/UX specifications
- Development roadmap

---

## 🛠 Technology Stack

- **Frontend**: 
  - Vue.js 3 (Composition API)
  - Vite (Build tool)
  - Bootstrap 5 (UI framework)
  - Vue Router (Routing)
  - Pinia (State management)
  - Vue I18n (Internationalization)
  - Socket.io Client (Real-time updates)
  - Bootstrap Icons (Icons)

- **Backend**: 
  - Node.js 20+
  - Express.js (Web framework)
  - Socket.io (WebSocket server)
  - SQLite (Database)
  - Winston (Logging)

- **Containerization**: 
  - Docker
  - Docker Compose

---

## 🎯 Use Cases

1. **Network Administrators**: 
   - Track which IPs in static subnets are connected
   - Monitor network health across different locations
   - Manage IP inventory efficiently
   
2. **IT Teams**: 
   - Monitor websites and servers
   - Track subnet health and availability
   - Maintain accurate IP address inventory
   
3. **DevOps**: 
   - Real-time network health monitoring
   - Track infrastructure across different subnets
   - Monitor cloud and on-premise networks
   
4. **Small to Enterprise Businesses**: 
   - Simple IP address inventory management
   - Multi-location network monitoring
   - Centralized dashboard for all network resources

---

## 🗺 Roadmap

### ✅ Version 1.0 (Current)
- [x] Project specification and architecture
- [x] Basic infrastructure setup
- [x] Subnet management (CRUD operations)
- [x] IP inventory display (all IPs 1-254 for /24)
- [x] Subnet scanning (ping all IPs)
- [x] Manual IP status override
- [x] Domain/hostname/subdomain support
- [x] DNS resolution (forward/reverse)
- [x] Real-time updates via WebSocket
- [x] Dashboard with statistics
- [x] Beautiful UI with collapsible sidebar
- [x] Dark mode support
- [x] Internationalization (English, French)
- [x] Docker containerization
- [x] Admin user creation on first run

### ✅ Version 1.1.0 (Current)
- [x] Secure SSH Terminal with multi-tab support
- [x] SSH Session Management with groups
- [x] SSH Key Management (upload, generate, encrypt)
- [x] Real-time terminal with xterm.js
- [x] Password and key-based authentication
- [x] AES-256-GCM encryption for credentials
- [x] Connection logging and statistics
- [x] Multiple terminal color schemes
- [x] Session state persistence
- [x] Auto-reconnect and keep-alive
- [x] Beautiful modern UI for terminal
- [x] Search functionality for sessions
- [x] HTTP/HTTPS monitoring
- [x] TCP monitoring
- [x] DNS monitoring
- [x] WebSocket monitoring
- [x] Charts and graphs for monitoring
- [x] Monitor groups and organization

### 🔄 Version 1.2 (Planned)
- [ ] Notification system (email, webhook, Slack, Discord)
- [ ] Export functionality (CSV, JSON, PDF)
- [ ] Advanced alerting rules
- [ ] Status pages
- [ ] Multi-user support with roles
- [ ] API authentication with tokens

### 🚀 Future Versions
- [ ] Multi-user support with roles
- [ ] API authentication
- [ ] Plugin system
- [ ] Advanced reporting

See [TASKS_V1.md](./TASKS_V1.md) for detailed task breakdown.

---

## 🤝 Contributing

Monipx is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Uptime Kuma](https://github.com/louislam/uptime-kuma) by Louis Lam
- Built with modern web technologies
- Thanks to all contributors and the open-source community

---

## 👤 Author

**Arnold Mwanza**

- Lead Engineer at MwzConnect
- Passionate about open-source development
- GitHub: [@mwzconnect](https://github.com/mwzconnect)

**Organization:** [MwzConnect](https://github.com/mwzconnect)

---

## ⭐ Star History

If you find Monipx useful, please consider giving it a ⭐ on GitHub!

---

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Status**: ✅ Active Development | 🚀 Ready for Production Use

**Version**: 1.1.7

---

*Built with ❤️ by Arnold Mwanza for the open-source community*
