import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Custom metrics
  imageLoadTime?: number;
  queriesCount?: number;
  initialRenderTime?: number;
  totalLoadTime?: number;
}

/**
 * Hook to monitor performance improvements for the website
 * Tracks image loading, query optimization, and Core Web Vitals
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!window.performance || isMonitoring) return;

    setIsMonitoring(true);

    // Monitor Core Web Vitals
    const observeWebVitals = () => {
      // LCP - Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // CLS - Cumulative Layout Shift
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // FID - First Input Delay
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

        } catch (error) {
          console.warn('Performance monitoring not fully supported:', error);
        }
      }
    };

    // Monitor image loading performance
    const monitorImageLoading = () => {
      const images = document.querySelectorAll('img');
      let loadedImages = 0;
      let totalImages = images.length;
      const startTime = performance.now();

      if (totalImages === 0) {
        setMetrics(prev => ({ ...prev, imageLoadTime: 0 }));
        return;
      }

      const handleImageLoad = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
          const endTime = performance.now();
          setMetrics(prev => ({ ...prev, imageLoadTime: endTime - startTime }));
        }
      };

      images.forEach(img => {
        if (img.complete) {
          handleImageLoad();
        } else {
          img.addEventListener('load', handleImageLoad);
          img.addEventListener('error', handleImageLoad);
        }
      });
    };

    // Monitor initial render time
    const monitorInitialRender = () => {
      const navigationStart = performance.timing?.navigationStart || performance.timeOrigin;
      const domContentLoaded = performance.timing?.domContentLoadedEventEnd;
      
      if (navigationStart && domContentLoaded) {
        setMetrics(prev => ({ 
          ...prev, 
          initialRenderTime: domContentLoaded - navigationStart 
        }));
      }
    };

    // Monitor total load time
    const monitorTotalLoad = () => {
      window.addEventListener('load', () => {
        const navigationStart = performance.timing?.navigationStart || performance.timeOrigin;
        const loadComplete = performance.timing?.loadEventEnd || performance.now();
        
        setMetrics(prev => ({ 
          ...prev, 
          totalLoadTime: loadComplete - navigationStart 
        }));
      });
    };

    // Run monitoring
    observeWebVitals();
    monitorInitialRender();
    monitorTotalLoad();
    
    // Delay image monitoring to let initial load complete
    setTimeout(monitorImageLoading, 1000);

    // Count Convex queries (approximate)
    const countQueries = () => {
      // This is a rough estimate based on useQuery calls
      const scriptContent = document.documentElement.outerHTML;
      const queryMatches = scriptContent.match(/useQuery/g);
      setMetrics(prev => ({ 
        ...prev, 
        queriesCount: queryMatches?.length || 0 
      }));
    };
    
    setTimeout(countQueries, 2000);

  }, [isMonitoring]);

  // Performance scoring
  const getPerformanceScore = () => {
    if (!metrics.lcp || !metrics.cls) return null;

    let score = 100;
    
    // LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
    if (metrics.lcp > 4000) score -= 30;
    else if (metrics.lcp > 2500) score -= 15;
    
    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 10;
    
    // FID scoring (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
    if (metrics.fid && metrics.fid > 300) score -= 20;
    else if (metrics.fid && metrics.fid > 100) score -= 10;

    return Math.max(0, score);
  };

  return {
    metrics,
    performanceScore: getPerformanceScore(),
    isMonitoring
  };
};

export default usePerformanceMonitor;
