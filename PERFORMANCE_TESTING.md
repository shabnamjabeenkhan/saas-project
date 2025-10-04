# Performance Testing Guide

This guide shows you how to measure and verify the performance improvements in your Kaizen app.

## 🚀 Quick Start

The app now includes built-in performance monitoring that automatically runs in development mode.

### 1. View Performance Metrics

When you run the app locally, open the browser console to see:

```
🚀 Performance Metrics
  📊 LCP (Largest Contentful Paint): 523 ms
  🎨 FCP (First Contentful Paint): 312 ms
  ⚡ TTFB (Time to First Byte): 45 ms
  📏 Custom Measurements
    Config Initialization: 2 ms
    App Component Init: 5 ms
  📦 Resource Loading
    app.css: 125ms
    root.js: 89ms
    Inter-font.woff2: 67ms
```

### 2. Save a Performance Baseline

Before making changes, save a baseline to compare against:

1. Open browser console
2. Run: `PerformanceMonitor.saveBaseline('before-optimization')`
3. Make your changes
4. Refresh the page
5. Run: `PerformanceMonitor.compareWithBaseline('before-optimization')`

You'll see a comparison like:
```
📊 Performance Comparison with "before-optimization"
  ✅ Config Initialization: 2ms (-8ms, -80.0%)
  ✅ App Component Init: 5ms (-15ms, -75.0%)
  ✅ Page Load Time: 1250ms (-450ms, -26.5%)
```

## 📊 Chrome DevTools Performance Profiling

### Method 1: Performance Tab

1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click the record button (or press Ctrl+E)
4. Refresh the page (Ctrl+R)
5. Stop recording after page loads
6. Analyze the flame chart

**What to look for:**
- Long tasks (> 50ms) shown in red
- Main thread blocking
- Layout shifts
- Paint events

### Method 2: Lighthouse

1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Configure:
   - Mode: Navigation
   - Device: Desktop
   - Categories: Performance only
4. Click "Analyze page load"

**Key Metrics:**
- **First Contentful Paint (FCP)**: Should be < 1.8s
- **Largest Contentful Paint (LCP)**: Should be < 2.5s
- **Time to Interactive (TTI)**: Should be < 3.8s
- **Total Blocking Time (TBT)**: Should be < 200ms

### Method 3: Network Throttling Test

1. Open DevTools > Network tab
2. Enable "Slow 3G" throttling
3. Refresh and observe:
   - Which resources block rendering?
   - What loads first?
   - Total load time

## 🔄 Before/After Comparison

### Using the Built-in Monitor

```javascript
// Before optimization
PerformanceMonitor.saveBaseline('original');

// After optimization  
PerformanceMonitor.compareWithBaseline('original');
```

### Manual Testing Checklist

| Metric | How to Measure | Good Target | 
|--------|---------------|-------------|
| Initial White Screen | Time until first paint | < 300ms |
| Navbar Response | Scroll and observe delay | < 16ms (instant) |
| Config Init Time | Check console metrics | < 5ms |
| Font Display | Time until text appears | < 500ms |
| Total Load Time | Network tab "Load" event | < 2s |

## 🎯 Specific Improvements to Verify

### 1. **Configuration Deferred Loading**
- Open console before page load
- Should NOT see config logs immediately
- Logs appear after main thread is free

### 2. **Navbar Scroll Performance**
- Open Performance tab
- Record while scrolling
- Look for:
  - No long tasks during scroll
  - Smooth 60fps (16.7ms per frame)
  - No layout thrashing

### 3. **Font Loading**
- Network tab > Filter by "Font"
- Should only load 4 weights (not all)
- Should use preload + async loading

### 4. **Reduced Blocking Time**
- Lighthouse > "Reduce JavaScript execution time"
- Should show reduction in:
  - Parse/compile time
  - Execution time

## 🛠️ Performance Debugging Commands

```javascript
// Get all performance entries
performance.getEntries()

// Get resource timing
performance.getEntriesByType('resource')

// Get navigation timing
performance.getEntriesByType('navigation')[0]

// Measure a specific operation
performance.mark('start-operation');
// ... do something ...
performance.mark('end-operation');
performance.measure('My Operation', 'start-operation', 'end-operation');

// Get the measurement
performance.getEntriesByName('My Operation')[0].duration
```

## 📈 Continuous Monitoring

Add this to your development workflow:

1. **Before each PR**: Save a baseline
2. **After changes**: Compare with baseline
3. **Set budgets**: 
   ```javascript
   // Add to your tests
   expect(performanceMetrics.fcp).toBeLessThan(1800);
   expect(performanceMetrics.lcp).toBeLessThan(2500);
   ```

## 🚨 Red Flags to Watch For

- Config initialization > 10ms
- Scroll handlers taking > 16ms
- Font files > 100kb each
- Main thread blocked > 50ms
- Layout shifts during scroll

## 💡 Pro Tips

1. **Test on real devices**: Use Chrome's CPU throttling (4x slowdown)
2. **Clear cache between tests**: Cmd+Shift+R for hard refresh
3. **Test both hot and cold starts**: First visit vs. repeat visit
4. **Monitor over time**: Performance can degrade with new features

Remember: The goal is not just absolute speed, but consistent, predictable performance that users can rely on.