// Performance monitoring utility for measuring app startup time
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, number> = new Map();

  static mark(name: string) {
    if (typeof window === 'undefined') return;
    
    const time = performance.now();
    this.marks.set(name, time);
    
    // Also use native Performance API
    try {
      performance.mark(name);
    } catch (e) {
      // Ignore if mark already exists
    }
  }

  static measure(name: string, startMark: string, endMark?: string) {
    if (typeof window === 'undefined') return;
    
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    
    if (startTime && endTime) {
      const duration = endTime - (endMark ? endTime : performance.now()) + (startTime ? 0 : startTime);
      this.measures.set(name, endTime - startTime);
      
      // Also use native Performance API
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        // Ignore errors
      }
      
      return endTime - startTime;
    }
    
    return 0;
  }

  static logResults() {
    if (typeof window === 'undefined') return;
    
    console.group('🚀 Performance Metrics');
    
    // Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Log LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('📊 LCP (Largest Contentful Paint):', Math.round(lastEntry.startTime), 'ms');
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Log FCP (First Contentful Paint)
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        console.log('🎨 FCP (First Contentful Paint):', Math.round(fcp.startTime), 'ms');
      }
      
      // Log TTFB (Time to First Byte)
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const ttfb = navEntries[0].responseStart - navEntries[0].fetchStart;
        console.log('⚡ TTFB (Time to First Byte):', Math.round(ttfb), 'ms');
      }
    }
    
    // Custom measurements
    console.group('📏 Custom Measurements');
    this.measures.forEach((duration, name) => {
      console.log(`${name}:`, Math.round(duration), 'ms');
    });
    console.groupEnd();
    
    // Resource loading times
    console.group('📦 Resource Loading');
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const criticalResources = resources
      .filter(r => 
        r.name.includes('.js') || 
        r.name.includes('.css') || 
        r.name.includes('font')
      )
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    criticalResources.forEach(resource => {
      const name = resource.name.split('/').pop() || resource.name;
      console.log(`${name}: ${Math.round(resource.duration)}ms`);
    });
    console.groupEnd();
    
    console.groupEnd();
  }

  static startMonitoring() {
    if (typeof window === 'undefined') return;
    
    // Mark navigation start
    this.mark('app-init');
    
    // Monitor when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.mark('dom-ready');
        this.measure('DOM Load Time', 'app-init', 'dom-ready');
      });
    }
    
    // Monitor when page is fully loaded
    window.addEventListener('load', () => {
      this.mark('page-loaded');
      this.measure('Page Load Time', 'app-init', 'page-loaded');
      
      // Log results after a short delay to capture all metrics
      setTimeout(() => this.logResults(), 100);
    });
  }

  // Utility to compare before/after metrics
  static saveBaseline(name: string = 'baseline') {
    const metrics = {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
      timestamp: Date.now()
    };
    
    localStorage.setItem(`perf-${name}`, JSON.stringify(metrics));
    console.log(`✅ Performance baseline saved as "${name}"`);
  }

  static compareWithBaseline(name: string = 'baseline') {
    const saved = localStorage.getItem(`perf-${name}`);
    if (!saved) {
      console.error(`❌ No baseline found with name "${name}"`);
      return;
    }
    
    const baseline = JSON.parse(saved);
    console.group(`📊 Performance Comparison with "${name}"`);
    
    Object.entries(baseline.measures).forEach(([key, baselineValue]) => {
      const currentValue = this.measures.get(key);
      if (currentValue) {
        const diff = currentValue - (baselineValue as number);
        const percent = (diff / (baselineValue as number)) * 100;
        const emoji = diff < 0 ? '✅' : '❌';
        
        console.log(
          `${emoji} ${key}: ${Math.round(currentValue)}ms (${diff >= 0 ? '+' : ''}${Math.round(diff)}ms, ${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%)`
        );
      }
    });
    
    console.groupEnd();
  }
}

// Auto-start monitoring if in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  PerformanceMonitor.startMonitoring();
}