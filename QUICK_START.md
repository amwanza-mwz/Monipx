# 🚀 Monipx Quick Start

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Run Database Migrations

```bash
node server/database/migrate.js
```

You should see:
```
📦 Database initialized: ./data/monipx.db
🔄 Running database migrations...
✅ Migration 001_initial_schema completed
✅ All migrations completed
```

## Step 3: Start Development Server

```bash
npm run dev
```

This starts:
- ✅ Backend API: http://localhost:3001
- ✅ Frontend: http://localhost:5173

## Step 4: Open in Browser

Open: **http://localhost:5173**

---

## 🧪 Quick Test

### 1. Test Theme
- Click the moon/sun icon in navbar
- Theme should switch

### 2. Test Language
- Go to Settings
- Change language to French
- All text should change

### 3. Create Your First Subnet
- Go to Subnets page
- Click "Add Subnet"
- Enter:
  - **Name**: My Network
  - **Subnet**: 192.168.1.0/24
- Click "Create Subnet"
- ✅ 254 IPs automatically created!

### 4. View IPs
- Click "View" on the subnet
- See all 254 IP addresses
- Click "Edit" on any IP
- Add hostname, domain, subdomain
- ✅ Full domain auto-generates!

---

## 🐳 Docker Alternative

If you prefer Docker:

```bash
docker compose up -d
```

Access at: http://localhost:3001

---

## ❓ Troubleshooting

**Port in use?**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Database errors?**
```bash
rm -rf data/monipx.db
node server/database/migrate.js
```

**Module errors?**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Ready to test! 🎉**

