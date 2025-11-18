import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  quality?: number;
  placeholderColor?: string;
}

/**
 * ProgressiveImage component with lazy loading, blur-up placeholder, and optimization
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur-up placeholder effect
 * - Automatic WebP conversion
 * - Responsive image sizing
 * - Error handling with fallback
 * - Loading skeleton animation
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  blurDataURL,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
  quality = 80,
  placeholderColor = '#f3f4f6'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(priority ? src : undefined);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate optimized srcSet
  const generateSrcSet = useCallback((originalSrc: string): string => {
    if (!originalSrc || originalSrc.startsWith('data:') || originalSrc.startsWith('/')) {
      return originalSrc;
    }

    // For Convex URLs or external services that support optimization
    if (originalSrc.includes('convex') || originalSrc.includes('unsplash')) {
      const widths = [320, 640, 768, 1024, 1280, 1920];
      return widths.map(w => {
        try {
          const optimizedUrl = new URL(originalSrc);
          optimizedUrl.searchParams.set('w', w.toString());
          optimizedUrl.searchParams.set('q', quality.toString());
          optimizedUrl.searchParams.set('auto', 'format');
          return `${optimizedUrl.toString()} ${w}w`;
        } catch {
          return `${originalSrc} ${w}w`;
        }
      }).join(', ');
    }

    return originalSrc;
  }, [quality]);

  // Generate WebP source if possible
  const generateWebPSrc = useCallback((originalSrc: string): string | undefined => {
    if (!originalSrc || originalSrc.startsWith('data:')) return undefined;
    
    try {
      if (originalSrc.includes('unsplash')) {
        const webpUrl = new URL(originalSrc);
        webpUrl.searchParams.set('fm', 'webp');
        webpUrl.searchParams.set('q', quality.toString());
        return webpUrl.toString();
      }
    } catch {
      return undefined;
    }
    
    return undefined;
  }, [quality]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setCurrentSrc(src);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [src, priority]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // Generate low-quality placeholder if not provided
  const placeholderDataURL = blurDataURL || `data:image/svg+xml;base64,${btoa(
    `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${placeholderColor}"/>
      <defs>
        <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.5" fill="#00000008"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grain)"/>
    </svg>`
  )}`;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        className
      )}
      style={{ width, height }}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
      )}
      
      {/* Blur placeholder */}
      {!hasError && (isLoading || !isInView) && (
        <img
          src={placeholderDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
          style={{ 
            opacity: isLoading ? 1 : 0,
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Main image */}
      {currentSrc && !hasError && (
        <picture>
          {/* WebP source */}
          {generateWebPSrc(currentSrc) && (
            <source
              srcSet={generateSrcSet(generateWebPSrc(currentSrc)!)}
              sizes={sizes}
              type="image/webp"
            />
          )}
          
          {/* Fallback image */}
          <img
            ref={imgRef}
            src={currentSrc}
            srcSet={generateSrcSet(currentSrc)}
            sizes={sizes}
            alt={alt}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-500',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            width={width}
            height={height}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Изображението не може да се зареди</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;
