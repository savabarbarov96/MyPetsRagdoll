import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component with automatic WebP support, multiple sizes, and lazy loading
 * Provides significant performance improvements for gallery images
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc = '/placeholder.svg',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  onLoad,
  onError
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate optimized image URLs for different sizes
  const optimizedSrcSet = useMemo(() => {
    if (!src || src.startsWith('/') || src.startsWith('data:')) {
      return undefined;
    }

    // For external URLs, try to add optimization parameters
    if (src.includes('unsplash.com') || src.includes('convex')) {
      const widths = [480, 768, 1024, 1280, 1920];
      return widths.map(w => {
        const optimizedUrl = new URL(src);
        optimizedUrl.searchParams.set('w', w.toString());
        optimizedUrl.searchParams.set('q', quality.toString());
        optimizedUrl.searchParams.set('auto', 'format');
        return `${optimizedUrl.toString()} ${w}w`;
      }).join(', ');
    }

    return undefined;
  }, [src, quality]);

  // Generate WebP alternatives if possible
  const webpSrc = useMemo(() => {
    if (!src || src.startsWith('data:')) return undefined;
    
    if (src.includes('unsplash.com')) {
      const webpUrl = new URL(src);
      webpUrl.searchParams.set('fm', 'webp');
      webpUrl.searchParams.set('q', quality.toString());
      return webpUrl.toString();
    }
    
    return undefined;
  }, [src, quality]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (!hasError && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
      onError?.();
    }
  }, [hasError, currentSrc, fallbackSrc, onError]);

  // Use picture element for WebP support with fallback
  if (webpSrc) {
    return (
      <picture className={cn('block', className)}>
        <source 
          srcSet={webpSrc} 
          type="image/webp"
          sizes={sizes}
        />
        <img
          src={currentSrc}
          srcSet={optimizedSrcSet}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
        />
      </picture>
    );
  }

  // Fallback to regular img with optimization
  return (
    <img
      src={currentSrc}
      srcSet={optimizedSrcSet}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      sizes={sizes}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default OptimizedImage;
