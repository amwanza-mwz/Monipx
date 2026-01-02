# 🔧 Monitor Form Reset Fix - Group Not Persisting

## Issue
When creating a new monitor:
1. User selects a group from dropdown
2. Fills in monitor details
3. Clicks Save
4. Opens form again to add another monitor
5. **BUG**: Previously selected group still showing instead of being reset
6. User thinks group is selected but it's just old data

## Root Cause
The form was not being reset when:
- Modal closes
- Opening form for a new monitor (not editing)
- Switching between edit and add modes

**Problem Code**:
```javascript
const loadMonitorData = () => {
  if (props.monitor) {
    // Load monitor data for editing
    Object.keys(form.value).forEach(key => {
      form.value[key] = props.monitor[key];
    });
  }
  // ❌ No else clause to reset form for new monitor!
};
```

## Solution

### 1. Added resetForm Function
```javascript
const resetForm = () => {
  form.value = {
    name: '',
    type: '',
    target: '',
    description: '',
    group_name: '',  // ← Reset to empty
    port: null,
    interval: 60,
    timeout: 5000,
    enabled: true,
    // ... all other fields reset to defaults
  };
};
```

### 2. Reset Form When Opening for New Monitor
```javascript
const loadMonitorData = () => {
  if (props.monitor) {
    // Load monitor data for editing
    Object.keys(form.value).forEach(key => {
      form.value[key] = props.monitor[key];
    });
  } else {
    // ✅ Reset form for new monitor
    resetForm();
  }
};
```

### 3. Reset Form When Modal Closes
```javascript
watch(() => props.show, (newVal, oldVal) => {
  if (newVal) {
    // Modal opening
    loadGroups();
    showCustomGroup.value = false;
    loadMonitorData();
  } else if (oldVal && !newVal) {
    // ✅ Modal is closing, reset form for next time
    resetForm();
  }
});
```

## How It Works Now

### Scenario 1: Add Multiple Monitors
```
1. Click "Add Monitor"
   → Form is empty ✅
   
2. Select group "Production"
   Fill in details
   Click Save
   
3. Click "Add Monitor" again
   → Form is empty ✅
   → Group dropdown shows "No Group" ✅
   → Can select "Production" or create new ✅
```

### Scenario 2: Edit Then Add
```
1. Click "Edit" on existing monitor
   → Form loads with monitor data ✅
   → Group shows "Production" ✅
   
2. Close modal
   
3. Click "Add Monitor"
   → Form is empty ✅
   → No leftover data from edit ✅
```

### Scenario 3: Add, Cancel, Add Again
```
1. Click "Add Monitor"
   Select group "Production"
   Fill in some fields
   
2. Click Cancel
   
3. Click "Add Monitor" again
   → Form is empty ✅
   → No leftover data from cancelled form ✅
```

## Testing

### Before Fix ❌
```
Step 1: Add monitor with group "Production"
Step 2: Save
Step 3: Add another monitor
Result: Group dropdown shows "Production" (old data)
Issue: User thinks it's selected, but it's just not reset
```

### After Fix ✅
```
Step 1: Add monitor with group "Production"
Step 2: Save
Step 3: Add another monitor
Result: Group dropdown shows "No Group" (clean slate)
Benefit: User explicitly selects group for each monitor
```

## Files Modified

**src/components/MonitorForm.vue**
- Added `resetForm()` function
- Updated `loadMonitorData()` to reset form when no monitor (new mode)
- Updated `watch(props.show)` to reset form when modal closes
- Ensures clean state for each new monitor

## Benefits

✅ **Clean Slate**: Each new monitor starts with empty form  
✅ **No Confusion**: Users know exactly what they're selecting  
✅ **Proper State**: Form state matches UI state  
✅ **Edit Mode Works**: Editing still loads monitor data correctly  
✅ **Cancel Works**: Cancelling doesn't leave dirty data  

## Developer
Arnold Mwanza (@amwanza-mwz)

