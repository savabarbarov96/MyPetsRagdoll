import React, { useEffect } from 'react';
import { useCriticalImagePreloader, useImagePreloader } from '@/hooks/useImagePreloader';

interface ImagePreloaderProps {
  criticalImages: string[];
  showProgress?: boolean;
  onComplete?: () => void;
  className?: string;
}

// Critical images that should be preloaded on app startup
export const CRITICAL_IMAGES = [
  '/hero-image.jpg',
  '/ragdoll-logo.png',
  '/radanov-pride-logo.png',
  '/favicon.ico'
];

export const ImagePreloader: React.FC<ImagePreloaderProps> = ({
  criticalImages,
  showProgress = false,
  onComplete,
  className = ''
}) => {
  const { isLoading, loadedCount, totalCount, progress } = useCriticalImagePreloader(criticalImages);

  useEffect(() => {
    if (!isLoading && onComplete) {
      onComplete();
    }
  }, [isLoading, onComplete]);

  if (!showProgress || !isLoading) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto">
          <img 
            src="/ragdoll-logo.png" 
            alt="Loading" 
            className="w-full h-full object-contain animate-pulse"
          />
        </div>
        
        <div className="space-y-2">
          <p className="text-gray-600 text-sm">Loading images...</p>
          
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-500">
            {loadedCount} of {totalCount} images loaded
          </p>
        </div>
      </div>
    </div>
  );
};

// HOC for wrapping components that need critical images preloaded
export const withImagePreloader = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  criticalImages: string[] = CRITICAL_IMAGES,
  showProgress: boolean = false
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { isLoading } = useCriticalImagePreloader(criticalImages);

    if (isLoading && showProgress) {
      return <ImagePreloader criticalImages={criticalImages} showProgress />;
    }

    return <WrappedComponent {...props} ref={ref} />;
  });
};

// Component for preloading images in the background without UI
export const BackgroundImagePreloader: React.FC<{ images: string[] }> = ({ images }) => {
  const { preloadImages } = useImagePreloader();

  useEffect(() => {
    if (images.length > 0) {
      preloadImages(images, {
        priority: 'low',
        fetchPriority: 'low',
        decoding: 'async'
      }).catch(error => {
        console.warn('Background image preloading failed:', error);
      });
    }
  }, [images, preloadImages]);

  return null;
};

// Hook for intersection-based image preloading
export const useIntersectionPreloader = (
  targetRef: React.RefObject<HTMLElement>,
  imagesToPreload: string[],
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  const { preloadImages } = useImagePreloader();

  useEffect(() => {
    const target = targetRef.current;
    if (!target || imagesToPreload.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          preloadImages(imagesToPreload, {
            priority: 'low',
            fetchPriority: 'low',
            decoding: 'async'
          }).catch(error => {
            console.warn('Intersection-based preloading failed:', error);
          });
          
          // Disconnect after first intersection
          observer.unobserve(target);
        }
      });
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [targetRef, imagesToPreload, preloadImages, options]);
};
