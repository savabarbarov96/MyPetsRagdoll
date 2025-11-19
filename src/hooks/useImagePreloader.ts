import { useEffect, useCallback, useState } from 'react';

interface PreloadOptions {
  priority?: 'high' | 'low';
  crossOrigin?: 'anonymous' | 'use-credentials';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

interface PreloadedImage {
  src: string;
  loaded: boolean;
  error: boolean;
  element?: HTMLImageElement;
}

interface UseImagePreloaderReturn {
  preloadedImages: PreloadedImage[];
  preloadImage: (src: string, options?: PreloadOptions) => Promise<HTMLImageElement>;
  preloadImages: (srcs: string[], options?: PreloadOptions) => Promise<HTMLImageElement[]>;
  isPreloaded: (src: string) => boolean;
  clearCache: () => void;
}

// Global cache to persist across component re-renders
const globalImageCache = new Map<string, PreloadedImage>();

export const useImagePreloader = (): UseImagePreloaderReturn => {
  const [preloadedImages, setPreloadedImages] = useState<PreloadedImage[]>([]);

  // Sync local state with global cache on mount only
  useEffect(() => {
    setPreloadedImages(Array.from(globalImageCache.values()));
  }, []);

  const preloadImage = useCallback(async (src: string, options: PreloadOptions = {}): Promise<HTMLImageElement> => {
    // Check if already cached
    const cached = globalImageCache.get(src);
    if (cached?.loaded && cached.element) {
      return cached.element;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set up image properties for optimization
      if (options.crossOrigin) {
        img.crossOrigin = options.crossOrigin;
      }
      
      if (options.decoding) {
        img.decoding = options.decoding;
      }
      
      // Set fetchPriority if supported
      if ('fetchPriority' in img && options.fetchPriority) {
        (img as any).fetchPriority = options.fetchPriority;
      }
      
      img.onload = () => {
        const imageData: PreloadedImage = {
          src,
          loaded: true,
          error: false,
          element: img
        };
        
        globalImageCache.set(src, imageData);
        setPreloadedImages(Array.from(globalImageCache.values()));
        resolve(img);
      };
      
      img.onerror = () => {
        const imageData: PreloadedImage = {
          src,
          loaded: false,
          error: true
        };
        
        globalImageCache.set(src, imageData);
        setPreloadedImages(Array.from(globalImageCache.values()));
        reject(new Error(`Failed to preload image: ${src}`));
      };
      
      // Update cache with loading state
      const loadingData: PreloadedImage = {
        src,
        loaded: false,
        error: false
      };
      globalImageCache.set(src, loadingData);
      setPreloadedImages(Array.from(globalImageCache.values()));
      
      // Start loading
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (srcs: string[], options: PreloadOptions = {}): Promise<HTMLImageElement[]> => {
    const promises = srcs.map(src => preloadImage(src, options));
    
    try {
      return await Promise.all(promises);
    } catch (error) {
      // Continue with successful images even if some fail
      const results = await Promise.allSettled(promises);
      return results
        .filter((result): result is PromiseFulfilledResult<HTMLImageElement> => result.status === 'fulfilled')
        .map(result => result.value);
    }
  }, [preloadImage]);

  const isPreloaded = useCallback((src: string): boolean => {
    const cached = globalImageCache.get(src);
    return cached?.loaded || false;
  }, []);

  const clearCache = useCallback(() => {
    globalImageCache.clear();
    setPreloadedImages([]);
  }, []);

  return {
    preloadedImages,
    preloadImage,
    preloadImages,
    isPreloaded,
    clearCache
  };
};

// Hook for preloading critical images on app startup
export const useCriticalImagePreloader = (criticalImages: string[]) => {
  const { preloadImages, preloadedImages } = useImagePreloader();
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    const preloadCritical = async () => {
      setIsLoading(true);
      
      try {
        await preloadImages(criticalImages, {
          priority: 'high',
          fetchPriority: 'high',
          decoding: 'async'
        });
      } catch (error) {
        console.warn('Some critical images failed to preload:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (criticalImages.length > 0) {
      preloadCritical();
    }
  }, [criticalImages, preloadImages]);

  // Update loaded count
  useEffect(() => {
    const loaded = criticalImages.filter(src => 
      preloadedImages.find(img => img.src === src && img.loaded)
    ).length;
    setLoadedCount(loaded);
  }, [criticalImages, preloadedImages]);

  return {
    isLoading,
    loadedCount,
    totalCount: criticalImages.length,
    progress: criticalImages.length > 0 ? (loadedCount / criticalImages.length) * 100 : 100
  };
};

// Utility function to get responsive image sources
export const getResponsiveImageSources = (baseSrc: string): string[] => {
  const sources: string[] = [baseSrc];
  
  // Add WebP variants if supported
  if (baseSrc.includes('.jpg') || baseSrc.includes('.jpeg') || baseSrc.includes('.png')) {
    const webpSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    sources.unshift(webpSrc);
  }
  
  // Add different sizes for responsive images
  const sizes = ['320w', '640w', '768w', '1024w', '1280w'];
  sizes.forEach(size => {
    const responsiveSrc = baseSrc.replace(/(\.[^.]+)$/, `_${size}$1`);
    sources.push(responsiveSrc);
  });
  
  return sources;
};