# Monipx - Project Specification

**Project Name:** Monipx  
**Organization:** MwzConnect  LLC
**Project Lead:** Arnold Mwanza, Lead Engineer  
**License:** Open Source (TBD)  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [API Design](#api-design)
7. [UI/UX Specifications](#uiux-specifications)
8. [Docker Configuration](#docker-configuration)
9. [Development Roadmap](#development-roadmap)
10. [Installation & Setup](#installation--setup)

---

## 🎯 Project Overview

Monipx is a self-hosted, open-source monitoring and IP address management tool that combines:

1. **IP Address Inventory Management** - Track and manage IP addresses within subnets
2. **Network Monitoring** - Monitor websites, applications, and servers via ping/HTTP checks
3. **Real-time Status Dashboard** - Visual representation of network connectivity

### Inspiration

Monipx is inspired by [Uptime Kuma](https://github.com/louislam/uptime-kuma), leveraging its proven technology stack and user-friendly interface design.

### Problem Statement

Companies often struggle with:
- Tracking which IPs in static subnets are connected
- Managing IP address inventory
- Monitoring network connectivity in real-time
- Having a unified dashboard for network management

---

## ✨ Features

### Core Features

#### 1. Multi-Subnet Management
- **Add Multiple Subnets**: Input and manage multiple subnets simultaneously
  - Support for different subnet sizes (e.g., `/24`, `/16`, `/8`)
  - Each subnet can have a custom name and description
  - Organize subnets by location, department, or purpose
- **Subnet Dashboard**: Unified view of all subnets with:
  - Quick status overview for each subnet
  - Total IPs per subnet
  - Connected/Disconnected counts
  - Last scan timestamp
- **Auto-discovery**: Automatically list all IP addresses in each subnet
- **Visual Status Indicators**: 
  - 🟢 Green = Connected
  - 🔴 Red = Not Connected
  - 🟡 Yellow = Unknown/Pending
- **Subnet Monitoring**: 
  - Monitor all subnets simultaneously
  - Scheduled scans for each subnet
  - Real-time status updates across all subnets
  - Bulk operations (scan all, pause all, etc.)
- **Subnet Comparison**: Compare status across multiple subnets
- **Subnet Grouping**: Group subnets by tags or categories

#### 2. IP Address Inventory
- **Complete IP List**: Display all IPs in a subnet (e.g., 255 IPs for /24)
- **Connection Status**: Real-time connection status for each IP
- **Manual Override**: Manually mark IPs as connected/disconnected
- **IP Details**: 
  - IP Address
  - Hostname (e.g., "server-01")
  - Domain (e.g., "example.com")
  - Subdomain (e.g., "www", "api", "mail")
  - Full Domain (e.g., "www.example.com" - auto-combined from subdomain + domain)
  - MAC Address (if available)
  - Last Seen timestamp
  - Connection Status
  - Notes/Comments
- **Domain Management**: 
  - Add/edit domain, hostname, or subdomain for any IP
  - Auto-resolve hostname to IP (reverse DNS lookup)
  - Auto-resolve domain to IP (forward DNS lookup)
  - Support for multiple subdomains per IP
  - Display full domain in IP list and details

#### 3. Network Monitoring (Uptime Kuma Style)
- **Multi-Subnet Monitoring**: 
  - Monitor IPs across multiple subnets simultaneously
  - Per-subnet monitoring configuration
  - Aggregate monitoring statistics across all subnets
  - Monitor specific IPs or entire subnets
- **Ping Monitoring**: Monitor hosts via ICMP ping
  - Monitor individual IPs from any subnet
  - Monitor entire subnets with batch ping
- **HTTP/HTTPS Monitoring**: Monitor websites and APIs
- **TCP Monitoring**: Monitor TCP ports
- **DNS Monitoring**: Monitor DNS records
- **WebSocket Monitoring**: Monitor WebSocket connections
- **Monitoring Intervals**: 
  - Configurable check intervals per subnet (default: 20 seconds)
  - Different intervals for different subnets
  - Per-monitor interval configuration
- **Uptime Statistics**: 
  - Track uptime percentage per subnet
  - Aggregate uptime across all subnets
  - Per-IP uptime tracking
- **Response Time Charts**: 
  - Visualize response times over time
  - Per-subnet charts
  - Aggregate charts for all subnets
- **Subnet Health Monitoring**: 
  - Overall subnet health score
  - Alert when subnet health drops below threshold
  - Track subnet availability trends

#### 4. Multi-Subnet Dashboard
- **Real-time Updates**: WebSocket-based live updates for all subnets
- **Unified Status Overview**: 
  - Quick view of all subnets and their status
  - Aggregate statistics across all subnets
  - Per-subnet status cards with key metrics
- **Subnet Overview Cards**: 
  - Each subnet displayed as a card
  - Shows: subnet name, total IPs, connected count, disconnected count
  - Color-coded health indicator
  - Quick actions (scan, view details, edit)
- **Charts & Graphs**: 
  - Visual representation of network health per subnet
  - Aggregate charts showing all subnets
  - Comparison charts between subnets
  - Historical trends per subnet
- **Filtering & Search**: 
  - Filter by subnet, status, or search by IP
  - Multi-select filters for complex queries
  - Save filter presets
- **Export Data**: 
  - Export IP inventory per subnet
  - Export all subnets data
  - Export monitoring data per subnet or aggregate
- **Subnet Switching**: 
  - Quick navigation between subnets
  - Side-by-side subnet comparison view
  - Tabbed interface for multiple subnet views

#### 5. Multi-Subnet Monitoring Workflows
- **Concurrent Monitoring**: 
  - Monitor multiple subnets simultaneously
  - Independent scan schedules per subnet
  - Per-subnet monitoring configuration
- **Subnet Health Tracking**:
  - Health score calculation per subnet
  - Aggregate health across all subnets
  - Health trend analysis over time
  - Alert thresholds per subnet
- **Bulk Operations**:
  - Scan all subnets at once
  - Pause/resume monitoring for multiple subnets
  - Bulk configuration updates
  - Export data from multiple subnets
- **Subnet Comparison**:
  - Compare health metrics across subnets
  - Identify patterns and anomalies
  - Performance benchmarking
- **Organizational Features**:
  - Tag subnets for grouping (e.g., "office", "datacenter", "remote")
  - Filter and view by tags
  - Role-based access (future enhancement)

#### 6. Notifications (Future Enhancement)
- **Email Notifications**: SMTP-based email alerts
- **Webhook Support**: Custom webhook integrations
- **Telegram/Discord**: Integration with messaging platforms
- **Multiple Notification Channels**: Support for 90+ notification services
- **Subnet-Specific Alerts**: Configure alerts per subnet

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vue.js** | 3.x | Progressive JavaScript framework for UI |
| **Vite** | Latest | Build tool and dev server |
| **Bootstrap** | 5.x | CSS framework for responsive design |
| **Socket.io Client** | Latest | Real-time WebSocket communication |
| **Chart.js** | Latest | Data visualization and charts |
| **Axios** | Latest | HTTP client for API calls |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | >= 20.4 | JavaScript runtime |
| **Express.js** | Latest | Web application framework |
| **Socket.io** | Latest | WebSocket server for real-time updates |
| **SQLite** | Latest | Lightweight database (can upgrade to PostgreSQL) |
| **node-ping** | Latest | ICMP ping functionality |
| **axios** | Latest | HTTP requests for monitoring |
| **dns** | Built-in | DNS resolution |
| **net** | Built-in | TCP connection testing |

### DevOps & Deployment

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **PM2** | Process management (optional, for non-Docker) |
| **Git** | Version control |

### Development Tools

| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting |
| **TypeScript** | Type safety (optional) |
| **Jest** | Testing framework |
| **Prettier** | Code formatting |

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Vue.js 3 Frontend (Vite)                 │   │
│  │  - Dashboard UI                                   │   │
│  │  - IP Inventory Management                        │   │
│  │  - Monitoring Configuration                      │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP REST API
                    │ WebSocket (Socket.io)
                    │
┌───────────────────▼─────────────────────────────────────┐
│              Node.js/Express Backend                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Routes                                      │   │
│  │  - /api/subnets                                  │   │
│  │  - /api/ips                                      │   │
│  │  - /api/monitors                                 │   │
│  │  - /api/status                                   │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Socket.io Server                                │   │
│  │  - Real-time status updates                      │   │
│  │  - Live monitoring results                       │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Monitoring Engine                               │   │
│  │  - Ping Workers                                  │   │
│  │  - HTTP Check Workers                            │   │
│  │  - TCP Check Workers                             │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│                  SQLite Database                         │
│  - Subnets                                               │
│  - IP Addresses                                          │
│  - Monitors                                              │
│  - Monitoring History                                    │
│  - Settings                                              │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
monipx/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── server/
│   ├── server.js              # Main server entry point
│   ├── routes/
│   │   ├── api/
│   │   │   ├── subnets.js
│   │   │   ├── ips.js
│   │   │   ├── monitors.js
│   │   │   └── status.js
│   │   └── index.js
│   ├── models/
│   │   ├── Subnet.js
│   │   ├── IPAddress.js
│   │   ├── Monitor.js
│   │   └── History.js
│   ├── services/
│   │   ├── monitoring/
│   │   │   ├── ping.js
│   │   │   ├── http.js
│   │   │   ├── tcp.js
│   │   │   └── dns.js
│   │   ├── subnet/
│   │   │   └── scanner.js
│   │   └── socket.js
│   ├── database/
│   │   ├── db.js
│   │   └── migrations/
│   └── utils/
│       ├── ip-utils.js
│       └── logger.js
├── src/
│   ├── main.js               # Vue app entry
│   ├── App.vue
│   ├── components/
│   │   ├── Dashboard.vue
│   │   ├── SubnetManager.vue
│   │   ├── IPInventory.vue
│   │   ├── MonitorList.vue
│   │   ├── StatusCard.vue
│   │   └── Charts/
│   │       ├── PingChart.vue
│   │       └── UptimeChart.vue
│   ├── views/
│   │   ├── Home.vue
│   │   ├── Subnets.vue
│   │   ├── Monitoring.vue
│   │   └── Settings.vue
│   ├── stores/              # Pinia stores
│   │   ├── subnet.js
│   │   ├── ip.js
│   │   └── monitor.js
│   ├── services/
│   │   ├── api.js
│   │   └── socket.js
│   └── assets/
│       ├── styles/
│       └── images/
├── public/
│   └── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── .dockerignore
├── .gitignore
├── README.md
└── PROJECT_SPECIFICATION.md
```

---

## 💾 Database Schema

### Tables

#### 1. `subnets`
```sql
CREATE TABLE subnets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subnet TEXT NOT NULL UNIQUE,  -- e.g., "192.168.1.0/24"
    cidr INTEGER NOT NULL,         -- e.g., 24
    network_address TEXT NOT NULL, -- e.g., "192.168.1.0"
    total_ips INTEGER NOT NULL,    -- e.g., 254 for /24
    description TEXT,              -- Optional description
    tags TEXT,                     -- JSON array of tags for grouping
    scan_enabled BOOLEAN DEFAULT 1, -- Enable/disable auto-scanning
    scan_interval INTEGER DEFAULT 300, -- Scan interval in seconds (default 5 min)
    monitoring_enabled BOOLEAN DEFAULT 1, -- Enable/disable monitoring
    health_threshold INTEGER DEFAULT 80, -- Health threshold percentage
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_scan_at DATETIME         -- Last scan timestamp
);
```

#### 2. `ip_addresses`
```sql
CREATE TABLE ip_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subnet_id INTEGER NOT NULL,
    ip_address TEXT NOT NULL,      -- e.g., "192.168.1.1"
    status TEXT DEFAULT 'unknown',  -- 'connected', 'disconnected', 'unknown'
    hostname TEXT,                 -- e.g., "server-01"
    domain TEXT,                   -- e.g., "example.com"
    subdomain TEXT,                -- e.g., "www", "api", "mail"
    full_domain TEXT,              -- e.g., "www.example.com" (subdomain + domain)
    mac_address TEXT,
    last_seen DATETIME,
    is_manual BOOLEAN DEFAULT 0,   -- true if manually set
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subnet_id) REFERENCES subnets(id) ON DELETE CASCADE,
    UNIQUE(subnet_id, ip_address)
);
```

#### 3. `monitors`
```sql
CREATE TABLE monitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,             -- 'ping', 'http', 'https', 'tcp', 'dns', 'websocket', 'subnet'
    target TEXT NOT NULL,           -- IP, URL, hostname, or subnet_id for subnet monitoring
    subnet_id INTEGER,              -- Optional: link to subnet for subnet-wide monitoring
    port INTEGER,                   -- For TCP/WebSocket
    interval INTEGER DEFAULT 20,    -- Check interval in seconds
    timeout INTEGER DEFAULT 5000,   -- Timeout in milliseconds
    enabled BOOLEAN DEFAULT 1,
    expected_status_code INTEGER,   -- For HTTP
    expected_keyword TEXT,          -- For HTTP keyword check
    notification_enabled BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subnet_id) REFERENCES subnets(id) ON DELETE SET NULL
);
```

#### 4. `monitoring_history`
```sql
CREATE TABLE monitoring_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id INTEGER NOT NULL,
    status TEXT NOT NULL,           -- 'up', 'down', 'unknown'
    response_time INTEGER,           -- Response time in ms
    status_code INTEGER,            -- HTTP status code
    error_message TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE INDEX idx_monitoring_history_monitor_checked 
ON monitoring_history(monitor_id, checked_at);
```

#### 5. `settings`
```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API Design

### REST API Endpoints

#### Subnets

- `GET /api/subnets` - Get all subnets
  - Query params: `?tags=tag1,tag2` (filter by tags)
  - Query params: `?status=active` (filter by status)
- `POST /api/subnets` - Create a new subnet
  ```json
  {
    "name": "Office Network",
    "subnet": "192.168.1.0/24",
    "description": "Main office network",
    "tags": ["office", "production"],
    "scan_interval": 300,
    "monitoring_enabled": true
  }
  ```
- `GET /api/subnets/:id` - Get subnet details with statistics
- `PUT /api/subnets/:id` - Update subnet
- `DELETE /api/subnets/:id` - Delete subnet
- `POST /api/subnets/:id/scan` - Trigger manual scan for a subnet
- `POST /api/subnets/scan-all` - Trigger scan for all enabled subnets
- `GET /api/subnets/:id/statistics` - Get subnet statistics (connected count, health, etc.)
- `GET /api/subnets/summary` - Get summary of all subnets (aggregate stats)
- `PUT /api/subnets/bulk` - Bulk update multiple subnets
  ```json
  {
    "ids": [1, 2, 3],
    "updates": {
      "scan_enabled": false,
      "monitoring_enabled": true
    }
  }
  ```

#### IP Addresses

- `GET /api/subnets/:subnetId/ips` - Get all IPs in a subnet
- `GET /api/ips/:id` - Get IP details
- `PUT /api/ips/:id` - Update IP status
  ```json
  {
    "status": "connected",
    "hostname": "server-01",
    "domain": "example.com",
    "subdomain": "www",
    "full_domain": "www.example.com",
    "notes": "Main server"
  }
  ```
- `POST /api/ips/:id/resolve` - Resolve hostname/domain to IP or reverse lookup
  ```json
  {
    "type": "forward",  // or "reverse"
    "target": "www.example.com"  // or "192.168.1.1"
  }
  ```
- `POST /api/subnets/:subnetId/scan` - Trigger subnet scan
- `GET /api/ips/:id/history` - Get IP connection history

#### Monitors

- `GET /api/monitors` - Get all monitors
- `POST /api/monitors` - Create a new monitor
  ```json
  {
    "name": "Google",
    "type": "http",
    "target": "https://www.google.com",
    "interval": 20
  }
  ```
- `GET /api/monitors/:id` - Get monitor details
- `PUT /api/monitors/:id` - Update monitor
- `DELETE /api/monitors/:id` - Delete monitor
- `GET /api/monitors/:id/history` - Get monitoring history
- `POST /api/monitors/:id/test` - Test monitor immediately

#### Status

- `GET /api/status` - Get overall system status
- `GET /api/status/dashboard` - Get dashboard summary
  ```json
  {
    "total_subnets": 5,
    "total_ips": 1270,
    "connected_ips": 850,
    "disconnected_ips": 420,
    "active_monitors": 25,
    "overall_uptime": 99.5,
    "subnets": [
      {
        "id": 1,
        "name": "Office Network",
        "total_ips": 254,
        "connected": 180,
        "disconnected": 74,
        "health_percentage": 70.9
      }
    ]
  }
  ```
- `GET /api/status/subnets` - Get status for all subnets
- `GET /api/status/subnets/:id` - Get status for specific subnet

### WebSocket Events

#### Client → Server

- `subscribe:subnet` - Subscribe to subnet updates
- `subscribe:monitor` - Subscribe to monitor updates
- `unsubscribe:subnet` - Unsubscribe from subnet
- `unsubscribe:monitor` - Unsubscribe from monitor

#### Server → Client

- `subnet:update` - Subnet status update (single subnet)
- `subnets:update` - Multiple subnet status updates
- `ip:update` - IP address status update
- `ips:update` - Multiple IP address status updates (for subnet scans)
- `monitor:result` - New monitoring result
- `monitor:status` - Monitor status change
- `subnet:scan:start` - Subnet scan started
- `subnet:scan:progress` - Subnet scan progress update
- `subnet:scan:complete` - Subnet scan completed
- `system:notification` - System notification

---

## 🎨 UI/UX Specifications

### Design Philosophy

- **Modern & Clean**: Inspired by Uptime Kuma's interface
- **Responsive**: Mobile-first design with Bootstrap 5
- **Real-time**: Live updates via WebSocket
- **Intuitive**: Easy-to-use interface for non-technical users
- **Fast**: Optimized performance with Vue 3 and Vite

### Color Scheme

- **Primary**: Bootstrap 5 default (can be customized)
- **Success/Connected**: `#28a745` (Green)
- **Danger/Disconnected**: `#dc3545` (Red)
- **Warning/Unknown**: `#ffc107` (Yellow)
- **Info**: `#17a2b8` (Blue)
- **Dark Mode**: Full dark mode support

### Key UI Components

#### 1. Multi-Subnet Dashboard
- **Header**: Navigation bar with logo and menu
- **Global Stats Cards**: 
  - Total Subnets (with breakdown by status)
  - Total IPs (across all subnets)
  - Connected IPs (aggregate)
  - Disconnected IPs (aggregate)
  - Active Monitors
  - Overall Uptime (aggregate)
- **Subnet Overview Section**:
  - Grid/List view of all subnets
  - Each subnet card shows:
    - Subnet name and CIDR notation
    - Total IPs in subnet
    - Connected/Disconnected counts with percentage
    - Health indicator (color-coded)
    - Last scan timestamp
    - Quick actions (View, Scan, Edit, Delete)
  - Sortable by: name, health, last scan, total IPs
  - Filterable by: tags, status, health threshold
- **Recent Activity**: Timeline of recent changes across all subnets
- **Quick Actions**: 
  - Add subnet button
  - Add monitor button
  - Scan all subnets button
  - Bulk operations menu
- **Subnet Comparison View**: 
  - Side-by-side comparison of selected subnets
  - Comparative charts and statistics

#### 2. Subnet Management Page
- **Subnet List View**: 
  - Table/cards showing all subnets
  - Bulk selection for operations
  - Group by tags or categories
  - Search and filter capabilities
  - Sort by various columns
- **Add Subnet Form**: 
  - Input for subnet notation
  - Optional description
  - Tags input (multi-select)
  - Scan interval configuration
  - Monitoring toggle
- **Subnet Details View**:
  - Subnet information panel
  - Statistics overview (connected/disconnected counts, health %)
  - IP address grid/list for this subnet
  - Visual status indicators
  - Filter and search options
  - Scan controls (manual scan, schedule scan)
  - Monitoring configuration for this subnet
  - Export options (export IP list, export statistics)
- **Multi-Subnet Operations**:
  - Select multiple subnets
  - Bulk enable/disable scanning
  - Bulk enable/disable monitoring
  - Bulk delete (with confirmation)
  - Export selected subnets data

#### 3. IP Inventory View
- **IP Grid**: Visual grid showing all IPs in subnet
- **IP List**: Detailed table view with columns:
  - IP Address
  - Status (with color indicator)
  - Hostname
  - Domain/Full Domain (e.g., "www.example.com")
  - Subdomain (if applicable)
  - Last Seen
  - Actions (Edit, Delete)
- **IP Edit Form**: 
  - IP Address (read-only)
  - Hostname input field
  - Domain input field
  - Subdomain input field (optional)
  - Full Domain display (auto-generated, read-only)
  - Status override
  - Notes/Comments
  - DNS resolution buttons (forward/reverse lookup)
- **Bulk Actions**: Select multiple IPs for bulk operations
- **Filters**: Filter by status, search by IP/hostname/domain

#### 4. Monitoring Page
- **Monitor List**: 
  - Cards showing all monitors
  - Group by subnet (if subnet-linked)
  - Filter by type, status, subnet
  - Search functionality
- **Monitor Card**:
  - Name
  - Type icon
  - Subnet badge (if linked to subnet)
  - Current status (Up/Down)
  - Uptime percentage
  - Response time
  - Last checked
  - Chart (mini)
- **Add Monitor Form**: 
  - Modal/form for creating monitors
  - Option to link to subnet
  - Option to monitor entire subnet
  - Monitor type selection
- **Monitor Details**: 
  - Full details
  - History chart
  - Response time graph
  - Event log
  - Subnet context (if applicable)
- **Subnet Monitoring View**:
  - View all monitors for a specific subnet
  - Aggregate statistics for subnet monitors
  - Subnet-wide health dashboard

#### 5. Settings Page
- **General Settings**: App configuration
- **Notification Settings**: Configure notifications
- **Appearance**: Theme selection (Light/Dark)
- **About**: Version and license information

### Responsive Breakpoints

- **Mobile**: < 576px
- **Tablet**: 576px - 992px
- **Desktop**: > 992px

---

## 🐳 Docker Configuration

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "server/server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  monipx:
    build: .
    container_name: monipx
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=3001
    networks:
      - monipx-network

networks:
  monipx-network:
    driver: bridge
```

### Data Persistence

- **Database**: `/app/data/monipx.db` (SQLite)
- **Logs**: `/app/logs/`
- **Config**: `/app/data/config.json` (optional)

---

## 🗺 Development Roadmap

### Phase 1: Foundation (MVP)
- [ ] Project setup and structure
- [ ] Docker configuration
- [ ] Database schema and migrations
- [ ] Basic API endpoints
- [ ] Vue 3 frontend setup
- [ ] Basic UI components

### Phase 2: Core Features
- [ ] Multi-subnet management (CRUD)
- [ ] Subnet dashboard with overview cards
- [ ] IP address listing and display per subnet
- [ ] Manual IP status override
- [ ] Basic monitoring (Ping)
- [ ] Subnet scanning functionality
- [ ] Real-time updates via WebSocket for all subnets
- [ ] Dashboard with aggregate statistics
- [ ] Subnet comparison view

### Phase 3: Advanced Monitoring
- [ ] HTTP/HTTPS monitoring
- [ ] TCP monitoring
- [ ] DNS monitoring
- [ ] WebSocket monitoring
- [ ] Monitoring history and charts
- [ ] Uptime statistics

### Phase 4: Enhanced Features
- [ ] Advanced subnet scanning (auto-discovery with scheduling)
- [ ] Subnet health monitoring and alerts
- [ ] Subnet grouping and tagging
- [ ] Bulk subnet operations
- [ ] IP connection history per subnet
- [ ] Export functionality (per subnet and aggregate)
- [ ] Advanced search and filtering across subnets
- [ ] Subnet monitoring dashboards
- [ ] Dark mode
- [ ] Multi-language support

### Phase 5: Notifications & Polish
- [ ] Email notifications
- [ ] Webhook support
- [ ] Telegram/Discord integration
- [ ] Advanced charts and visualizations
- [ ] Performance optimization
- [ ] Documentation

### Phase 6: Open Source Release
- [ ] Complete documentation
- [ ] GitHub repository setup
- [ ] License selection
- [ ] Contributing guidelines
- [ ] Release v1.0.0

---

## 📦 Installation & Setup

### Prerequisites

- Docker and Docker Compose installed
- Git (for cloning repository)

### Quick Start (Docker Compose)

```bash
# Clone repository
git clone https://github.com/mwzconnect/monipx.git
cd monipx

# Start application
docker compose up -d

# Access application
# Open http://localhost:3001 in your browser
```

### Manual Installation (Non-Docker)

```bash
# Clone repository
git clone https://github.com/mwzconnect/monipx.git
cd monipx

# Install dependencies
npm install

# Build frontend
npm run build

# Start server
node server/server.js

# Or use PM2
npm install -g pm2
pm2 start server/server.js --name monipx
```

### Configuration

Create `.env` file (optional):

```env
NODE_ENV=production
PORT=3001
DB_PATH=./data/monipx.db
LOG_LEVEL=info
```

### Update Instructions

```bash
# Pull latest changes
git pull

# Rebuild Docker container
docker compose down
docker compose up -d --build
```

---

## 📝 License

[To be determined - MIT, Apache 2.0, or GPL]

---

## 🤝 Contributing

[Contributing guidelines to be added]

---

## 📧 Contact

**Project Lead:** Arnold Mwanza  
**Organization:** MwzConnect  
**Email:** [To be added]  
**GitHub:** [To be added]

---

## 🙏 Acknowledgments

- Inspired by [Uptime Kuma](https://github.com/louislam/uptime-kuma) by Louis Lam
- Built with Vue.js, Node.js, and Bootstrap

---

**Last Updated:** 2025-01-27  
**Version:** 1.0.0

