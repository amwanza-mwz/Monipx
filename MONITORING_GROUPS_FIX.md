# 🔧 Monitoring Groups Duplicate & Filtering Fix

## Issues
1. Groups with the same name were showing as duplicates in the monitoring page
2. **CRITICAL**: Clicking on a group only showed 1 monitor instead of all monitors in that group
3. Group count showing wrong numbers
4. Adding monitors with "Production" and "Production " (with trailing space) created 2 groups
5. Case sensitivity and whitespace differences caused duplicate group names
6. Group dropdown showing wrong data structure

## Root Causes

### 1. **CRITICAL**: Group Filtering Not Trimming (Main Issue)
**Problem**: When filtering monitors by group, the comparison didn't trim whitespace

**Example**:
- Database has: "Production", "Production ", "Production"
- User clicks group: "Production" (trimmed in display)
- Filter compares: monitor.group_name !== "Production"
- Result: Only monitors with EXACT match "Production" shown (1 monitor)
- Missing: Monitors with "Production " (2 monitors)

**Before**:
```javascript
if (selectedGroup.value !== 'all' && monitor.group_name !== selectedGroup.value) {
  return false; // Strict comparison, no trimming!
}
```

**After**:
```javascript
if (selectedGroup.value !== 'all') {
  const monitorGroup = monitor.group_name ? monitor.group_name.trim() : '';
  const selectedGroupTrimmed = selectedGroup.value.trim();
  if (monitorGroup !== selectedGroupTrimmed) {
    return false; // Now compares trimmed values!
  }
}
```

### 2. Group Count Not Trimming
**Problem**: getGroupCount() was also doing strict comparison without trimming

**Before**:
```javascript
const getGroupCount = (group) => {
  return monitors.value.filter(m => m.group_name === group).length;
};
```

**After**:
```javascript
const getGroupCount = (group) => {
  const groupTrimmed = group.trim();
  return monitors.value.filter(m => {
    const monitorGroup = m.group_name ? m.group_name.trim() : '';
    return monitorGroup === groupTrimmed;
  }).length;
};
```

### 3. Whitespace Not Trimmed on Save
**Problem**: Group names with trailing/leading spaces were saved as-is to database

**Example**:
- Monitor 1: group_name = "Production"
- Monitor 2: group_name = "Production " (with space)
- Result: 2 separate groups displayed

### 4. Wrong Data Mapping in MonitorForm
**Problem**: Frontend was trying to map `g.group_name` but backend returns array of strings

**Before**:
```javascript
existingGroups.value = response.data.map(g => g.group_name);
// response.data = ['Production', 'Development']
// Trying to access g.group_name on strings = undefined
```

**After**:
```javascript
existingGroups.value = response.data;
// response.data is already an array of strings
```

## Solutions Applied

### 1. Trim Group Names on Save
**File**: `src/components/MonitorForm.vue`

Added trimming before saving:
```javascript
// Trim group name to prevent duplicates from whitespace
if (data.group_name) {
  data.group_name = data.group_name.trim();
}
```

### 2. Trim Group Names in Display
**File**: `src/views/Monitoring.vue`

Added trimming in groups computed property:
```javascript
const groups = computed(() => {
  const groupSet = new Set();
  monitors.value.forEach(m => {
    if (m.group_name) {
      // Trim whitespace to avoid duplicates from spacing differences
      const trimmedGroup = m.group_name.trim();
      if (trimmedGroup) {
        groupSet.add(trimmedGroup);
      }
    }
  });
  return Array.from(groupSet).sort();
});
```

### 3. Fixed Group Loading
**File**: `src/components/MonitorForm.vue`

Fixed data mapping:
```javascript
const loadGroups = async () => {
  try {
    const response = await api.get('/monitors/groups/list');
    // response.data is already an array of strings
    existingGroups.value = response.data;
  } catch (error) {
    console.error('Error loading groups:', error);
  }
};
```

## How It Works Now

### Backend (Already Correct)
```javascript
// server/models/Monitor.js
static async getAllGroups() {
  const result = await db.prepare(
    'SELECT DISTINCT group_name FROM monitors WHERE group_name IS NOT NULL ORDER BY group_name'
  ).all();
  return result.map(r => r.group_name); // Returns ['Production', 'Development']
}
```

### Frontend Flow
1. **User types group name**: "Production "
2. **On save**: Trimmed to "Production"
3. **Stored in DB**: "Production"
4. **On display**: Trimmed again for safety
5. **Result**: Only one "Production" group

## Testing

### Before Fix ❌
```
User adds 3 monitors:
- Monitor 1: group = "Production"
- Monitor 2: group = "Production " (with space)
- Monitor 3: group = "Production"

Result:
- 2 groups shown: "Production (1)" and "Production  (1)"
- Clicking "Production" shows only 1 monitor
- Missing 2 monitors!
```

### After Fix ✅
```
User adds 3 monitors:
- Monitor 1: group = "Production"
- Monitor 2: group = "Production " (with space)
- Monitor 3: group = "Production"

Result:
- 1 group shown: "Production (3)"
- Clicking "Production" shows all 3 monitors
- All monitors visible!
```

## Files Modified

1. **src/components/MonitorForm.vue**
   - Added group name trimming on save
   - Fixed group loading data mapping

2. **src/views/Monitoring.vue** (CRITICAL FIXES)
   - **Fixed filteredMonitors**: Now trims both monitor.group_name and selectedGroup for comparison
   - **Fixed getGroupCount**: Now trims group names before counting
   - Added group name trimming in groups computed property

## Additional Benefits

- Empty group names (just spaces) are now filtered out
- Consistent group naming across the app
- Better autocomplete suggestions
- Cleaner UI

## Developer
Arnold Mwanza (@amwanza-mwz)

