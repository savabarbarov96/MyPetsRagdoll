import React, { useEffect } from 'react';

/**
 * PerformanceOptimizer component that applies various performance optimizations
 * This component should be included in the root of the application
 */
export const PerformanceOptimizer: React.FC = () => {
  useEffect(() => {
    // 1. Preload critical resources
    const preloadCriticalResources = () => {
      // Preload critical fonts
      const criticalFonts = [
        '/assets/fonts/Perun-Regular.ttf'
      ];

      criticalFonts.forEach(font => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/ttf';
        link.href = font;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });

      // Preload critical images
      const criticalImages = [
        '/hero-image.jpg',
        '/ragdoll-logo.png',
        '/featured-cat-1.jpg',
        '/featured-cat-2.jpg'
      ];

      criticalImages.forEach(image => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = image;
        document.head.appendChild(link);
      });
    };

    // 2. Optimize images already in the DOM
    const optimizeExistingImages = () => {
      const images = document.querySelectorAll('img:not([loading])');
      images.forEach((img, index) => {
        // Add lazy loading to images not in viewport
        if (index > 2) { // Skip first 3 images (likely above fold)
          img.setAttribute('loading', 'lazy');
        }
        // Add decoding async for better performance
        img.setAttribute('decoding', 'async');
      });
    };

    // 3. Implement intersection observer for performance monitoring
    const setupPerformanceObserver = () => {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Element is visible, ensure it's optimized
              const element = entry.target as HTMLElement;
              
              // Add GPU acceleration hint for animated elements
              if (element.classList.contains('animate-') || 
                  element.style.animation || 
                  element.style.transform) {
                element.style.willChange = 'transform';
                element.style.transform = 'translateZ(0)';
              }
            }
          });
        }, {
          threshold: 0.1,
          rootMargin: '50px'
        });

        // Observe animated elements
        document.querySelectorAll('.animate-, [data-animate]').forEach(el => {
          observer.observe(el);
        });
      }
    };

    // 4. Optimize video elements
    const optimizeVideos = () => {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        // Add performance attributes if not already set
        if (!video.hasAttribute('preload')) {
          video.setAttribute('preload', 'metadata');
        }
        if (!video.hasAttribute('disablePictureInPicture')) {
          video.setAttribute('disablePictureInPicture', 'true');
        }
        if (!video.hasAttribute('disableRemotePlayback')) {
          video.setAttribute('disableRemotePlayback', 'true');
        }
        
        // Optimize video for mobile
        if (window.innerWidth <= 768) {
          video.setAttribute('playsinline', 'true');
        }
      });
    };

    // 5. Setup service worker for caching (if available)
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('ServiceWorker registered successfully');
        } catch (error) {
          console.log('ServiceWorker registration failed');
        }
      }
    };

    // 6. Optimize CSS animations for performance
    const optimizeAnimations = () => {
      // Add will-change to elements with transforms
      const style = document.createElement('style');
      style.textContent = `
        .animate-spin,
        .animate-pulse,
        .animate-bounce,
        [data-animate="true"] {
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        
        /* Optimize scroll performance */
        .scroll-smooth {
          scroll-behavior: smooth;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .scroll-smooth {
            scroll-behavior: auto;
          }
        }
      `;
      document.head.appendChild(style);
    };

    // 7. Memory cleanup for long-running sessions
    const setupMemoryCleanup = () => {
      let cleanupInterval: NodeJS.Timeout;
      
      const cleanup = () => {
        // Remove inactive event listeners
        const inactiveElements = document.querySelectorAll('[data-inactive="true"]');
        inactiveElements.forEach(el => {
          el.remove();
        });

        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      };

      cleanupInterval = setInterval(cleanup, 300000); // Every 5 minutes

      return () => clearInterval(cleanupInterval);
    };

    // Run optimizations
    const runOptimizations = async () => {
      preloadCriticalResources();
      optimizeExistingImages();
      setupPerformanceObserver();
      optimizeVideos();
      optimizeAnimations();
      await registerServiceWorker();
      
      const cleanupMemory = setupMemoryCleanup();
      
      return cleanupMemory;
    };

    let cleanup: (() => void) | undefined;
    
    // Run optimizations after initial render
    const timer = setTimeout(async () => {
      cleanup = await runOptimizations();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Log long tasks that might affect user experience
          if (entry.entryType === 'longtask') {
            console.warn('Long task detected:', entry.duration, 'ms');
          }
          
          // Log layout shifts
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            console.warn('Layout shift detected:', entry.value);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['longtask', 'layout-shift'] });
      } catch (e) {
        // Observer not supported
      }

      return () => observer.disconnect();
    }
  }, []);

  // This component doesn't render anything visible
  return null;
};

// Critical CSS inlining helper
export const inlineCSS = (css: string) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

// Resource hints helper
export const addResourceHint = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

export default PerformanceOptimizer;
