# 🧪 Test Plan: Monitor Group Assignment Fix

## Quick Test (Manual)

### Prerequisites
1. Start the application:
   ```bash
   npm run dev
   ```
2. Login to the application
3. Navigate to Monitoring page

### Test 1: Create Monitor with Group ✅
**Expected:** Already working, but verify it still works

1. Click "Add Monitor"
2. Fill in:
   - Name: "Test Monitor 1"
   - Type: HTTP
   - Target: https://google.com
   - Group: "Production"
3. Click Save
4. **Verify:**
   - ✅ Monitor appears with "Production" badge
   - ✅ "Production" tab appears in group filters
   - ✅ Clicking "Production" tab shows the monitor

### Test 2: Edit Monitor - Assign Group (MAIN FIX) ✅
**Expected:** NOW WORKS (was broken before)

1. Create a monitor without a group:
   - Name: "Test Monitor 2"
   - Type: HTTP
   - Target: https://github.com
   - Group: (leave empty)
   - Click Save
2. **Verify:** Monitor has no group badge
3. Click on the monitor card
4. Click "Edit" button
5. In the group field, type or select: "Development"
6. Click Save
7. **Verify:**
   - ✅ Monitor now shows "Development" badge
   - ✅ "Development" tab appears in filters
   - ✅ Clicking "Development" shows this monitor
8. Edit the monitor again
9. **Verify:**
   - ✅ Group field shows "Development" (not empty!)

### Test 3: Change Monitor Group ✅
**Expected:** NOW WORKS (was broken before)

1. Edit "Test Monitor 1" (currently in "Production")
2. Change group to "Staging"
3. Click Save
4. **Verify:**
   - ✅ Badge changes from "Production" to "Staging"
   - ✅ "Staging" tab appears
   - ✅ Monitor no longer in "Production" filter
   - ✅ Monitor appears in "Staging" filter

### Test 4: Remove Group from Monitor ✅
**Expected:** NOW WORKS (was broken before)

1. Edit "Test Monitor 1" (currently in "Staging")
2. Clear the group field (delete all text)
3. Click Save
4. **Verify:**
   - ✅ No group badge shown
   - ✅ Monitor appears in "All" tab
   - ✅ Monitor does NOT appear in any group filter

### Test 5: Update Other Fields (Regression Test) ✅
**Expected:** All fields should save correctly

1. Edit any monitor
2. Change:
   - Description: "Updated description"
   - Interval: 120 seconds
   - Timeout: 10000 ms
3. Click Save
4. Edit again
5. **Verify:**
   - ✅ Description saved
   - ✅ Interval saved
   - ✅ Timeout saved

### Test 6: Database Verification (Advanced)

If you want to verify at the database level:

```bash
# Connect to database
sqlite3 server/database/monipx.db

# Check monitor groups
SELECT id, name, group_name FROM monitors;

# Should show:
# - Monitors with groups have group_name populated
# - Monitors without groups have group_name = NULL
```

## Expected Results Summary

### Before Fix ❌
- Creating monitor with group: ✅ Works
- Editing monitor to assign group: ❌ **BROKEN** (group not saved)
- Changing monitor group: ❌ **BROKEN** (group not updated)
- Removing monitor group: ❌ **BROKEN** (group not cleared)

### After Fix ✅
- Creating monitor with group: ✅ Works
- Editing monitor to assign group: ✅ **FIXED** (group saves correctly)
- Changing monitor group: ✅ **FIXED** (group updates correctly)
- Removing monitor group: ✅ **FIXED** (group clears correctly)

## Automated Test (Optional)

You can also test via API:

```bash
# Create a monitor without group
curl -X POST http://localhost:3001/api/monitors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Monitor",
    "type": "http",
    "target": "https://example.com",
    "interval": 60
  }'

# Note the returned ID (e.g., 5)

# Update to add group
curl -X PUT http://localhost:3001/api/monitors/5 \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "API Testing"
  }'

# Get monitor to verify
curl http://localhost:3001/api/monitors/5

# Should show: "group_name": "API Testing"
```

## Troubleshooting

### If group still not saving:
1. Check browser console for errors
2. Check server logs for errors
3. Verify database has `group_name` column:
   ```bash
   sqlite3 server/database/monipx.db "PRAGMA table_info(monitors);"
   ```
4. Restart the server to ensure new code is loaded

### If you see old behavior:
1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser cache
3. Restart development server

## Success Criteria

All tests pass ✅ = Fix is working correctly!

---

**Test Date:** 2026-01-02  
**Tester:** Arnold Mwanza  
**Status:** Ready for Testing

