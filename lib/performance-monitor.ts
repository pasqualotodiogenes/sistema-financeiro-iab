// Performance monitoring utilities
interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: Date;
  type: 'navigation' | 'api' | 'cache';
  cacheStatus?: 'HIT' | 'MISS' | 'BYPASS';
}

class PerformanceMonitor {
  private entries: PerformanceEntry[] = [];
  private startTimes = new Map<string, number>();

  start(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  end(name: string, type: PerformanceEntry['type'] = 'navigation', cacheStatus?: PerformanceEntry['cacheStatus']): PerformanceEntry {
    const startTime = this.startTimes.get(name) || 0;
    const endTime = performance.now();
    const duration = endTime - startTime;

    const entry: PerformanceEntry = {
      name,
      startTime,
      endTime,
      duration,
      timestamp: new Date(),
      type,
      cacheStatus
    };

    this.entries.push(entry);
    this.startTimes.delete(name);

    // Log to console for debugging (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Performance [${type}]: ${name} - ${duration.toFixed(2)}ms ${cacheStatus ? `(${cacheStatus})` : ''}`)
    };

    return entry;
  }

  getEntries(type?: PerformanceEntry['type']): PerformanceEntry[] {
    return type ? this.entries.filter(e => e.type === type) : this.entries;
  }

  getAverageTime(name: string): number {
    const matchingEntries = this.entries.filter(e => e.name === name);
    if (matchingEntries.length === 0) return 0;
    
    const total = matchingEntries.reduce((sum, entry) => sum + entry.duration, 0);
    return total / matchingEntries.length;
  }

  getCacheHitRate(): number {
    const cacheEntries = this.entries.filter(e => e.cacheStatus);
    if (cacheEntries.length === 0) return 0;
    
    const hits = cacheEntries.filter(e => e.cacheStatus === 'HIT').length;
    return (hits / cacheEntries.length) * 100;
  }

  clear(): void {
    this.entries = [];
    this.startTimes.clear();
  }

  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  // Generate performance report
  generateReport(): {
    summary: {
      totalEntries: number;
      averageNavigationTime: number;
      averageApiTime: number;
      cacheHitRate: number;
    };
    entries: PerformanceEntry[];
  } {
    const navigationEntries = this.getEntries('navigation');
    const apiEntries = this.getEntries('api');

    return {
      summary: {
        totalEntries: this.entries.length,
        averageNavigationTime: navigationEntries.reduce((sum, e) => sum + e.duration, 0) / navigationEntries.length || 0,
        averageApiTime: apiEntries.reduce((sum, e) => sum + e.duration, 0) / apiEntries.length || 0,
        cacheHitRate: this.getCacheHitRate()
      },
      entries: this.entries
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const measureNavigation = (name: string, fn: () => Promise<void> | void) => {
    performanceMonitor.start(name);
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        performanceMonitor.end(name, 'navigation');
      });
    } else {
      performanceMonitor.end(name, 'navigation');
      return result;
    }
  };

  const measureApi = async (name: string, apiFn: () => Promise<Response>) => {
    performanceMonitor.start(name);
    try {
      const result = await apiFn();
      // Try to detect cache status from response headers
      const cacheStatus = result?.headers?.get?.('x-cache-status') || 'BYPASS';
      performanceMonitor.end(name, 'api', cacheStatus as 'HIT' | 'MISS' | 'BYPASS');
      return result;
    } catch (error) {
      performanceMonitor.end(name, 'api', 'BYPASS');
      throw error;
    }
  };

  return {
    measureNavigation,
    measureApi,
    getReport: () => performanceMonitor.generateReport(),
    clear: () => performanceMonitor.clear(),
    monitor: performanceMonitor
  };
}