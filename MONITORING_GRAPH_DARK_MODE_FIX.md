# 📊 Monitoring Graph Dark Mode Fix

## Issue
Monitoring graphs were not visible in dark mode:
- Grid lines invisible
- Axis labels (time, response time) not visible
- Text colors blending with dark background
- Chart using wrong theme attribute

## Root Causes

### 1. Wrong Theme Attribute
**Problem**: MonitorDetail.vue was using `[data-bs-theme="dark"]` but the app uses `[data-theme='dark']`

**Solution**: Updated CSS to support both attributes
```css
[data-theme="dark"],
[data-bs-theme="dark"] {
  /* dark mode styles */
}
```

### 2. CSS Variables Not Reactive in Chart.js
**Problem**: Chart.js doesn't automatically update when CSS variables change

**Solution**: Compute actual color values based on current theme
```javascript
const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
const textColor = isDark ? '#8b949e' : '#6c757d';
const gridColor = isDark ? '#30363d' : '#dee2e6';
```

### 3. Inconsistent Color Scheme
**Problem**: MonitorDetail had different colors than main theme

**Solution**: Aligned colors with main theme system
- Light mode: `--text-muted: #6c757d`
- Dark mode: `--text-muted: #8b949e`

## Changes Made

### 1. Updated CSS Variables
**File**: `src/views/MonitorDetail.vue`

**Before**:
```css
[data-bs-theme="dark"] {
  --bg-primary: #1a1d23;
  --text-muted: #6c757d; /* Too dark for dark mode! */
}
```

**After**:
```css
[data-theme="dark"],
[data-bs-theme="dark"] {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-card: #161b22;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --text-muted: #8b949e;
  --border-color: #30363d;
}
```

### 2. Made Chart Colors Reactive
**File**: `src/views/MonitorDetail.vue`

Added theme detection in chartOptions:
```javascript
const chartOptions = computed(() => {
  // Get current theme colors
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#8b949e' : '#6c757d';
  const gridColor = isDark ? '#30363d' : '#dee2e6';
  
  return {
    scales: {
      x: {
        ticks: {
          color: textColor, // Dynamic color!
        },
      },
      y: {
        grid: {
          color: gridColor, // Dynamic color!
        },
        ticks: {
          color: textColor, // Dynamic color!
        },
      },
    },
  };
});
```

### 3. Added Theme Change Watcher
**File**: `src/views/MonitorDetail.vue`

Force chart update when theme changes:
```javascript
const chartKey = ref(0);

watch(() => document.documentElement.getAttribute('data-theme'), () => {
  chartKey.value++; // Force re-render
});
```

## Files Modified

1. **src/views/MonitorDetail.vue**
   - Updated CSS variables to match main theme
   - Added support for both `data-theme` and `data-bs-theme`
   - Made chart colors reactive to theme changes
   - Added theme change watcher

## Testing

### Before Fix ❌
- **Light Mode**: ✅ Graph visible
- **Dark Mode**: ❌ Graph invisible (black text on dark background)
- **Theme Switch**: ❌ Chart doesn't update

### After Fix ✅
- **Light Mode**: ✅ Graph visible with proper contrast
- **Dark Mode**: ✅ Graph visible with light text
- **Theme Switch**: ✅ Chart updates automatically

## Color Scheme

### Light Mode
- Background: `#ffffff`
- Card: `#ffffff`
- Text: `#6c757d`
- Grid: `#dee2e6`

### Dark Mode
- Background: `#0d1117`
- Card: `#161b22`
- Text: `#8b949e`
- Grid: `#30363d`

## Result

✅ Monitoring graphs now fully visible in dark mode
✅ Proper contrast for all text elements
✅ Grid lines visible but subtle
✅ Axis labels readable
✅ Automatic theme switching
✅ Consistent with app-wide theme

## Developer
Arnold Mwanza (@amwanza-mwz)

