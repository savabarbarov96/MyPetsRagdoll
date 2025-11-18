import { useState, useEffect, useCallback } from 'react';

interface VideoPreloaderOptions {
  priority?: boolean;
  preloadAmount?: 'metadata' | 'auto' | 'none';
  quality?: 'low' | 'medium' | 'high';
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
}

/**
 * Hook for preloading videos and managing video loading state
 */
export const useVideoPreloader = (
  videoSrc: string,
  options: VideoPreloaderOptions = {}
) => {
  const { 
    priority = false, 
    preloadAmount = 'metadata',
    quality = 'medium'
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  // Preload video
  const preloadVideo = useCallback(async (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!src) {
        reject(new Error('No video source provided'));
        return;
      }

      setIsLoading(true);
      setHasError(false);
      setLoadProgress(0);

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = preloadAmount;
      video.muted = true; // Required for autoplay in many browsers

      // Track loading progress
      const handleProgress = () => {
        if (video.buffered.length > 0) {
          const loaded = video.buffered.end(0);
          const total = video.duration;
          if (total > 0) {
            setLoadProgress((loaded / total) * 100);
          }
        }
      };

      video.addEventListener('progress', handleProgress);

      video.addEventListener('loadedmetadata', () => {
        const videoMetadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: 0 // File size not available from video element
        };
        setMetadata(videoMetadata);
      });

      video.addEventListener('canplay', () => {
        setIsLoaded(true);
        setIsLoading(false);
        resolve();
      });

      video.addEventListener('error', (e) => {
        setHasError(true);
        setIsLoading(false);
        reject(new Error(`Video loading failed: ${video.error?.message || 'Unknown error'}`));
      });

      // Start loading
      video.src = src;
      video.load();
    });
  }, [preloadAmount]);

  // Auto preload if priority is set
  useEffect(() => {
    if (priority && videoSrc) {
      preloadVideo(videoSrc).catch(error => {
        console.warn('Video preloading failed:', error);
      });
    }
  }, [videoSrc, priority, preloadVideo]);

  // Generate optimized video URL based on quality
  const getOptimizedVideoUrl = useCallback((originalSrc: string): string => {
    if (!originalSrc) return originalSrc;

    // For external services that support quality parameters
    try {
      const url = new URL(originalSrc);
      
      // Add quality parameters based on settings
      switch (quality) {
        case 'low':
          url.searchParams.set('quality', '480p');
          url.searchParams.set('bitrate', '500k');
          break;
        case 'medium':
          url.searchParams.set('quality', '720p');
          url.searchParams.set('bitrate', '1000k');
          break;
        case 'high':
          url.searchParams.set('quality', '1080p');
          url.searchParams.set('bitrate', '2000k');
          break;
      }

      return url.toString();
    } catch {
      // If URL parsing fails, return original
      return originalSrc;
    }
  }, [quality]);

  return {
    isLoading,
    isLoaded,
    hasError,
    metadata,
    loadProgress,
    preloadVideo,
    optimizedSrc: getOptimizedVideoUrl(videoSrc)
  };
};

/**
 * Hook for managing multiple video preloading
 */
export const useMultipleVideoPreloader = (videoSources: string[]) => {
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());
  const [errorVideos, setErrorVideos] = useState<Set<string>>(new Set());

  const preloadVideo = useCallback(async (src: string): Promise<void> => {
    if (loadedVideos.has(src) || loadingVideos.has(src)) {
      return;
    }

    setLoadingVideos(prev => new Set(prev).add(src));
    setErrorVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(src);
      return newSet;
    });

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true;

      video.addEventListener('canplay', () => {
        setLoadedVideos(prev => new Set(prev).add(src));
        setLoadingVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        resolve();
      });

      video.addEventListener('error', () => {
        setErrorVideos(prev => new Set(prev).add(src));
        setLoadingVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        reject(new Error(`Failed to load video: ${src}`));
      });

      video.src = src;
      video.load();
    });
  }, [loadedVideos, loadingVideos]);

  const preloadAllVideos = useCallback(async (): Promise<void> => {
    const promises = videoSources.map(src => 
      preloadVideo(src).catch(error => {
        console.warn(`Failed to preload video: ${src}`, error);
      })
    );

    await Promise.allSettled(promises);
  }, [videoSources, preloadVideo]);

  return {
    loadedVideos,
    loadingVideos,
    errorVideos,
    preloadVideo,
    preloadAllVideos,
    isVideoLoaded: (src: string) => loadedVideos.has(src),
    isVideoLoading: (src: string) => loadingVideos.has(src),
    hasVideoError: (src: string) => errorVideos.has(src)
  };
};

export default useVideoPreloader;
