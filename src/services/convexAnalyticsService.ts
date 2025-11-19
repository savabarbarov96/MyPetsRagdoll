import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export interface AnalyticsSummary {
  today: {
    real: number;
    synthetic: number;
    total: number;
  };
  last7Days: {
    real: number;
    synthetic: number;
    total: number;
  };
  last30Days: {
    real: number;
    synthetic: number;
    total: number;
  };
  allTime: {
    real: number;
    synthetic: number;
    total: number;
  };
}

export interface DailyStat {
  date: string;
  real: number;
  synthetic: number;
  total: number;
  pageViews: number;
}

export interface PageStat {
  path: string;
  views: number;
  uniqueVisitors: number;
}

export interface DeviceStat {
  device: DeviceType;
  count: number;
}

// Hook to get analytics summary
export const useAnalyticsSummary = () => {
  return useQuery(api.analytics.getAnalyticsSummary);
};

// Hook to get daily stats
export const useDailyStats = (days?: number) => {
  return useQuery(api.analytics.getDailyStats, days ? { days } : {});
};

// Hook to get page stats
export const usePageStats = (path?: string) => {
  return useQuery(api.analytics.getPageStats, path ? { path } : {});
};

// Hook to get device stats
export const useDeviceStats = () => {
  return useQuery(api.analytics.getDeviceStats);
};

// Hook to track page visit
export const useTrackPageVisit = () => {
  return useMutation(api.analytics.trackPageVisit);
};

// Helper function to detect device type
export const detectDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  // Check for tablet
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
    return 'tablet';
  }

  // Check for mobile
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua) || width < 768) {
    return 'mobile';
  }

  // Otherwise it's desktop
  return 'desktop';
};

// Helper function to generate session ID
export const getOrCreateSessionId = (): string => {
  const SESSION_KEY = 'visitor_session_id';
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  if (typeof window === 'undefined') return generateSessionId();

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const { id, timestamp } = JSON.parse(stored);
      const now = Date.now();

      // Check if session is still valid (within 30 minutes)
      if (now - timestamp < SESSION_DURATION) {
        // Update timestamp to extend session
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id, timestamp: now }));
        return id;
      }
    }
  } catch (e) {
    // LocalStorage might not be available
  }

  // Generate new session ID
  const newId = generateSessionId();
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: newId, timestamp: Date.now() }));
  } catch (e) {
    // Ignore localStorage errors
  }

  return newId;
};

// Helper function to generate a unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to format date for display
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  return date.toLocaleDateString('bg-BG', options);
};

// Helper function to format short date
export const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short'
  };
  return date.toLocaleDateString('bg-BG', options);
};

// Helper function to get device label in Bulgarian
export const getDeviceLabel = (device: DeviceType): string => {
  const labels = {
    mobile: "Мобилен",
    tablet: "Таблет",
    desktop: "Десктоп",
    unknown: "Неизвестен"
  };
  return labels[device] || device;
};

// Helper function to get page label
export const getPageLabel = (path: string): string => {
  const labels: Record<string, string> = {
    '/': 'Начало',
    '/about': 'За нас',
    '/news': 'Новини',
    '/admin': 'Админ',
  };

  // Check for dynamic routes
  if (path.startsWith('/news/')) {
    return 'Новина';
  }
  if (path.startsWith('/cat/')) {
    return 'Котка';
  }

  return labels[path] || path;
};
