# Monitoring System - Quick Start Guide

## 🚀 Testing the Monitoring System

### Prerequisites
- Docker and Docker Compose installed
- Monipx application running

### Step 1: Start the Application

```bash
# Build and start with Docker Compose
docker-compose up --build

# Or if already built
docker-compose up
```

The application will:
1. Run database migrations (including monitoring tables)
2. Start the monitoring scheduler automatically
3. Begin monitoring any enabled monitors

### Step 2: Access the Monitoring Dashboard

1. Open your browser: `http://localhost:3000`
2. Login with your credentials
3. Navigate to **Monitoring** in the sidebar

### Step 3: Create Your First Monitor

#### Example 1: Monitor a Website (HTTP)

1. Click **Add Monitor**
2. Fill in the form:
   ```
   Name: Google Homepage
   Type: HTTPS
   Target: https://www.google.com
   Expected Status Code: 200
   Interval: 60 seconds
   Timeout: 5000 ms
   Enable Monitoring: ✓
   ```
3. Click **Create Monitor**

#### Example 2: Monitor a Local Service (Ping)

```
Name: Local Gateway
Type: Ping
Target: 192.168.1.1
Interval: 30 seconds
Enable Monitoring: ✓
```

#### Example 3: Monitor Docker Container

```
Name: Monipx Container
Type: Docker
Target: monipx-app
Docker Host: unix:///var/run/docker.sock
Interval: 60 seconds
Enable Monitoring: ✓
```

#### Example 4: Monitor Database

```
Name: PostgreSQL Database
Type: Database
Database Type: PostgreSQL
Target: localhost
Port: 5432
Database Name: postgres
Username: postgres
Password: your_password
Interval: 120 seconds
Enable Monitoring: ✓
```

### Step 4: View Real-time Updates

1. **Dashboard View**: Watch the stats cards update in real-time
2. **Monitor Cards**: See status indicators change (Green = Up, Red = Down)
3. **Uptime Bars**: Visual representation of recent checks
4. **Check Now**: Click the refresh button on any monitor for instant check

### Step 5: View Monitor Details

1. Click on any monitor card or name
2. You'll see:
   - **Current Status**: Up/Down/Unknown
   - **Uptime Percentage**: Overall reliability
   - **Response Time Chart**: Last 24 hours (switchable to 7d/30d)
   - **90-Day Timeline**: Visual uptime history
   - **Recent Checks Table**: Detailed check history

### Step 6: Organize with Groups

Create monitors in different groups:

```
Group: Production
- Production API
- Production Database
- Production Web Server

Group: Development
- Dev API
- Dev Database

Group: Infrastructure
- Gateway Router
- DNS Server
- Docker Host
```

Then filter by group on the dashboard!

## 🎯 Testing Scenarios

### Scenario 1: Test Down Detection

1. Create a monitor for a non-existent URL:
   ```
   Name: Test Down Monitor
   Type: HTTP
   Target: http://this-does-not-exist-12345.com
   Interval: 30 seconds
   ```
2. Watch it turn red (Down status)
3. View the error message in the detail view

### Scenario 2: Test Response Time Tracking

1. Create monitors for different services
2. Compare response times on the dashboard
3. View the response time chart in detail view
4. Watch for patterns over time

### Scenario 3: Test Real-time Updates

1. Open the monitoring dashboard
2. Open the same page in another browser tab
3. Click "Check Now" on a monitor in one tab
4. Watch both tabs update simultaneously via WebSocket

### Scenario 4: Test Docker Monitoring

1. Create a monitor for a running container
2. Stop the container: `docker stop container-name`
3. Watch the monitor status change to Down
4. Start the container: `docker start container-name`
5. Watch it recover to Up status

## 📊 Understanding the Dashboard

### Stats Cards
- **Up**: Number of monitors currently up
- **Down**: Number of monitors currently down
- **Unknown**: Monitors not yet checked or with errors
- **Avg Uptime**: Average uptime percentage across all monitors

### Monitor Card Elements
- **Status Indicator**: Circle icon (Green/Red/Yellow)
- **Type Badge**: Monitor type (HTTP, PING, TCP, etc.)
- **Group Badge**: Group name (if assigned)
- **Target**: The monitored endpoint/service
- **Uptime**: Percentage of successful checks
- **Response**: Average response time
- **Interval**: Check frequency
- **Uptime Bar**: 48 segments showing recent history

### Filters
- **All/Groups**: Filter by monitor group
- **Type**: Filter by monitor type
- **Status**: Filter by current status

## 🔍 Troubleshooting

### Monitor Shows "Unknown"
- Monitor hasn't been checked yet (wait for first interval)
- Click "Check Now" to force an immediate check

### Monitor Shows "Down" but Service is Up
- Check the target URL/IP is correct
- Verify timeout settings (increase if needed)
- Check expected status code (if HTTP/HTTPS)
- Review error message in detail view

### Docker Monitor Not Working
- Ensure Docker socket is accessible
- Check container name is exact
- Verify Docker host path

### Database Monitor Failing
- Verify credentials are correct
- Check database is accepting connections
- Ensure port is correct
- Test connection manually first

## 🎨 UI Features to Explore

1. **Responsive Design**: Try on mobile/tablet
2. **Dark Mode**: Check if your theme supports it
3. **Hover Effects**: Hover over uptime bars for details
4. **Sorting**: Monitors auto-sort by status
5. **Search**: Use browser search to find monitors
6. **Keyboard Navigation**: Tab through controls

## 📈 Monitoring Best Practices

1. **Set Appropriate Intervals**:
   - Critical services: 30-60 seconds
   - Normal services: 60-120 seconds
   - Low priority: 300-600 seconds

2. **Use Groups**:
   - Organize by environment (Prod, Dev, Staging)
   - Organize by service type (Web, Database, Infrastructure)
   - Organize by team/department

3. **Set Realistic Timeouts**:
   - Local services: 1000-3000ms
   - Remote services: 5000-10000ms
   - Slow services: 10000-30000ms

4. **Monitor What Matters**:
   - Critical user-facing services
   - Database availability
   - Infrastructure components
   - Third-party dependencies

## 🎉 Success Indicators

You'll know the monitoring system is working when:

✅ Dashboard shows real-time stats
✅ Monitor cards update automatically
✅ Charts display response time data
✅ History table shows check records
✅ Status changes are instant
✅ "Check Now" provides immediate feedback
✅ Groups help organize monitors
✅ Uptime percentages are calculated

## 🐛 Known Limitations

- Email notifications not yet implemented (Phase 4)
- Uptime timeline uses simulated data (will use real data once history builds up)
- Some advanced database features may require additional configuration

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs: `docker-compose logs -f`
3. Verify database migrations ran successfully
4. Ensure all dependencies are installed

---

**Ready to monitor your infrastructure!** 🚀

Start by creating a few test monitors and watch them come to life on the dashboard.

