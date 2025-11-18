export const performanceConfig = {
  // CDN Configuration
  cdnUrl: import.meta.env.VITE_CDN_URL || '',
  
  // Image Preloading
  criticalImages: [
    '/hero-image.jpg',
    '/ragdoll-logo.png',
    '/radanov-pride-logo.png',
    '/favicon.ico'
  ],
  
  backgroundImages: [
    '/featured-cat-1.jpg',
    '/featured-cat-2.jpg',
    '/model-cat-1.jpg',
    '/model-cat-2.jpg',
    '/model-cat-3.jpg'
  ],
  
  // Service Worker Cache Settings
  cacheSettings: {
    staticCacheDuration: parseInt(import.meta.env.VITE_STATIC_CACHE_DURATION) || 30 * 24 * 60 * 60 * 1000, // 30 days
    dynamicCacheDuration: parseInt(import.meta.env.VITE_DYNAMIC_CACHE_DURATION) || 24 * 60 * 60 * 1000, // 1 day
    imageCacheDuration: parseInt(import.meta.env.VITE_IMAGE_CACHE_DURATION) || 7 * 24 * 60 * 60 * 1000, // 7 days
    apiCacheDuration: parseInt(import.meta.env.VITE_API_CACHE_DURATION) || 5 * 60 * 1000, // 5 minutes
  },
  
  // Performance Features
  features: {
    enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    enableWebP: import.meta.env.VITE_ENABLE_WEBP !== 'false', // Default to true
    enableResponsiveImages: import.meta.env.VITE_ENABLE_RESPONSIVE_IMAGES !== 'false', // Default to true
    enableServiceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER !== 'false', // Default to true
  },
  
  // Query Optimization
  queryLimits: {
    defaultPageSize: 20,
    maxPageSize: 100,
    catsListLimit: 50,
    announcementsLimit: 10,
    galleryLimit: 12,
  },
  
  // Image Optimization
  imageSettings: {
    lazyLoadThreshold: 0.1,
    preloadRootMargin: '100px',
    maxPreloadImages: 12,
    webpQuality: 85,
    jpegQuality: 80,
  },
  
  // Network Optimization
  network: {
    retryAttempts: 3,
    retryDelay: 1000,
    timeoutDuration: 10000,
    prefetchDelay: 2000,
  }
} as const;

export type PerformanceConfig = typeof performanceConfig;
