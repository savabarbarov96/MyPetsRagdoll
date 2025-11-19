import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useTrackPageVisit,
  detectDeviceType,
  getOrCreateSessionId,
} from '@/services/convexAnalyticsService';

/**
 * VisitorTracker component
 * Tracks page visits for analytics by monitoring route changes
 */
const VisitorTracker = () => {
  const location = useLocation();
  const trackPageVisit = useTrackPageVisit();
  const lastTrackedPath = useRef<string>('');

  // Stable tracking function to prevent re-renders
  const trackVisit = useCallback((path: string) => {
    trackPageVisit({
      path,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      sessionId: getOrCreateSessionId(),
      deviceType: detectDeviceType(),
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    }).catch((error) => {
      // Silently fail - don't block user experience if tracking fails
      console.error('Failed to track page visit:', error);
    });
  }, [trackPageVisit]);

  useEffect(() => {
    // Get current path
    const currentPath = location.pathname;

    // Don't track admin routes
    if (currentPath.startsWith('/admin')) {
      return;
    }

    // Only track if the path has changed
    if (lastTrackedPath.current !== currentPath) {
      trackVisit(currentPath);
      lastTrackedPath.current = currentPath;
    }
  }, [location.pathname, trackVisit]);

  // This component doesn't render anything
  return null;
};

export default VisitorTracker;
