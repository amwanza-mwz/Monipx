# Monipx Testing Guide

## 🚀 Quick Start Testing

### Prerequisites Check

1. **Node.js Version**
   ```bash
   node --version
   # Should be >= 20.4.0
   ```

2. **npm Version**
   ```bash
   npm --version
   # Should be >= 10.0.0
   ```

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Database Migrations**
   ```bash
   node server/database/migrate.js
   ```

### Development Mode

Start both backend and frontend:
```bash
npm run dev
```

This will start:
- Backend server on: http://localhost:3001
- Frontend dev server on: http://localhost:5173

Access the application at: **http://localhost:5173**

---

## ✅ Testing Checklist

### 1. Basic Application Load

- [ ] Application loads without errors
- [ ] Navigation bar appears
- [ ] Dashboard page displays
- [ ] No console errors in browser

### 2. Theme Switching

- [ ] Click theme toggle button in navbar
- [ ] Theme switches between light and dark
- [ ] Theme persists after page refresh
- [ ] All UI elements visible in both themes

### 3. Language Switching

- [ ] Go to Settings page
- [ ] Change language from English to French
- [ ] All text changes to French
- [ ] Language persists after page refresh
- [ ] Change back to English

### 4. Dashboard

- [ ] Dashboard shows statistics cards
- [ ] All values display correctly (should be 0 initially)
- [ ] No errors in console

### 5. Subnet Management

#### Create Subnet
- [ ] Go to Subnets page
- [ ] Click "Add Subnet" button
- [ ] Fill in form:
  - Name: "Test Network"
  - Subnet: "192.168.1.0/24"
  - Description: "Test subnet"
- [ ] Click "Create Subnet"
- [ ] Subnet appears in list
- [ ] All 254 IPs are automatically generated

#### View Subnet Details
- [ ] Click "View" on a subnet card
- [ ] Subnet details page loads
- [ ] Statistics display correctly
- [ ] IP address list shows all IPs

#### Edit Subnet
- [ ] Click "Edit" on a subnet card
- [ ] Edit form opens with current values
- [ ] Change description
- [ ] Save changes
- [ ] Changes reflect in subnet list

#### Edit IP Address
- [ ] Go to subnet details page
- [ ] Click "Edit" on any IP address
- [ ] IP form opens
- [ ] Fill in:
  - Status: "Connected"
  - Hostname: "server-01"
  - Domain: "example.com"
  - Subdomain: "www"
- [ ] Full Domain auto-generates as "www.example.com"
- [ ] Save changes
- [ ] Changes reflect in IP list

#### DNS Resolution
- [ ] Open IP edit form
- [ ] Enter a domain (e.g., "google.com")
- [ ] Click "Forward DNS" button
- [ ] DNS resolves and shows IP address
- [ ] Enter an IP address
- [ ] Click "Reverse DNS" button
- [ ] DNS resolves and shows hostname (if available)

#### Scan Subnet
- [ ] Click "Scan" button on subnet card
- [ ] Scan initiates (may take a moment)
- [ ] Last scan timestamp updates

#### Delete Subnet
- [ ] Click "Delete" on a subnet card
- [ ] Confirm deletion
- [ ] Subnet is removed from list
- [ ] All associated IPs are deleted (cascade)

### 6. API Testing

Test API endpoints directly:

```bash
# Health check
curl http://localhost:3001/health

# Get all subnets
curl http://localhost:3001/api/subnets

# Get dashboard status
curl http://localhost:3001/api/status/dashboard

# Create subnet
curl -X POST http://localhost:3001/api/subnets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Network",
    "subnet": "10.0.0.0/24"
  }'
```

### 7. Database Testing

Check database directly:
```bash
# If using SQLite
sqlite3 data/monipx.db

# Then run SQL queries:
.tables
SELECT * FROM subnets;
SELECT COUNT(*) FROM ip_addresses;
SELECT * FROM ip_addresses WHERE subnet_id = 1 LIMIT 10;
```

### 8. WebSocket Testing

- [ ] Open browser console
- [ ] Create a new subnet
- [ ] Check for WebSocket events in console
- [ ] Real-time updates should work

### 9. Responsive Design

- [ ] Test on mobile viewport (resize browser)
- [ ] Test on tablet viewport
- [ ] All components should be responsive
- [ ] Navigation should work on mobile

### 10. Error Handling

- [ ] Try creating subnet with invalid CIDR (e.g., "invalid")
- [ ] Error message should display
- [ ] Try editing non-existent subnet
- [ ] 404 error should be handled gracefully

---

## 🐛 Common Issues & Solutions

### Issue: Port Already in Use

**Solution:**
```bash
# Change port in .env file
PORT=3002
```

### Issue: Database Migration Fails

**Solution:**
```bash
# Delete database and re-run migrations
rm -rf data/monipx.db
node server/database/migrate.js
```

### Issue: Frontend Can't Connect to Backend

**Solution:**
- Check if backend is running on port 3001
- Check CORS settings in server.js
- Check vite.config.js proxy settings

### Issue: Module Not Found Errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Vue Components Not Rendering

**Solution:**
- Check browser console for errors
- Verify all components are imported correctly
- Check Vue DevTools extension

---

## 📊 Expected Test Results

### Initial State (No Data)
- Dashboard shows all zeros
- Subnets page shows "No subnets found"
- No errors in console

### After Creating Subnet
- Subnet appears in list
- Statistics show correct counts
- IP list shows all IPs (254 for /24)
- All IPs have status "unknown" initially

### After Editing IP
- IP status changes
- Domain/hostname fields populated
- Full domain auto-generated
- Changes persist after refresh

---

## 🔍 Debugging Tips

1. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API calls

2. **Check Server Logs**
   - Server logs appear in terminal
   - Look for error messages
   - Check database connection

3. **Check Database**
   ```bash
   sqlite3 data/monipx.db
   .tables
   SELECT * FROM subnets;
   ```

4. **Test API Directly**
   - Use curl or Postman
   - Test each endpoint individually
   - Check response status codes

---

## ✅ Success Criteria

All tests pass if:
- ✅ Application loads without errors
- ✅ Can create, view, edit, delete subnets
- ✅ Can edit IP addresses with domain/hostname
- ✅ DNS resolution works
- ✅ Theme switching works
- ✅ Language switching works
- ✅ All data persists to database
- ✅ No mock data, everything is real
- ✅ Responsive design works

---

## 📝 Test Data Examples

### Subnet Examples
```
192.168.1.0/24    - 254 IPs
10.0.0.0/24       - 254 IPs
172.16.0.0/16   - 65,534 IPs (large!)
192.168.0.0/28   - 14 IPs (small)
```

### IP Edit Examples
```
Hostname: server-01
Domain: example.com
Subdomain: www
Full Domain: www.example.com (auto-generated)

Hostname: router-main
Domain: company.local
Subdomain: (empty)
Full Domain: company.local (auto-generated)
```

---

**Happy Testing! 🎉**

If you encounter any issues, check the console logs and database state.

