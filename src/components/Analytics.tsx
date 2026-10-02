import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useConsent } from '@/components/privacy/ConsentProvider';

type Pixel = ((...args: unknown[]) => void) & { queue: unknown[][]; callMethod?: (...args: unknown[]) => void; loaded: boolean; version: string; push?: Pixel };
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: Pixel;
  }
}
export default function Analytics() {
  const { analytics, marketing } = useConsent();
  const { pathname } = useLocation();
  const records = useQuery(api.siteSettings.getPublicTrackingSettings);
  const settings = Object.fromEntries((records || []).map(record => {
    let value: unknown = record.value;
    try { value = JSON.parse(record.value); } catch { /* Legacy unquoted setting. */ }
    return [record.key, value];
  }));
  const gaId = typeof settings?.google_analytics_id === 'string' && /^G-[A-Z0-9]+$/.test(settings.google_analytics_id) ? settings.google_analytics_id : undefined;
  const pixelId = typeof settings?.meta_pixel_id === 'string' && /^\d+$/.test(settings.meta_pixel_id) ? settings.meta_pixel_id : undefined;
  useEffect(() => {
    if (!analytics || !gaId) return;
    const flags = window as unknown as Record<string, unknown>;
    flags[`ga-disable-${gaId}`] = false;
    window.dataLayer ||= [];
    window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
    window.gtag('consent', 'default', {analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js', new Date());
    window.gtag('config', gaId, {send_page_view:false});
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    return () => { flags[`ga-disable-${gaId}`] = true; window.gtag?.('consent', 'update', {analytics_storage:'denied'}); script.remove(); };
  }, [analytics, gaId]);
  useEffect(() => {
    if (analytics && gaId) window.gtag?.('event', 'page_view', {page_path:pathname,page_location:window.location.origin+pathname,page_title:document.title});
  }, [analytics, gaId, pathname]);
  useEffect(() => {
    if (!marketing || !pixelId) return;
    const pixel: Pixel = Object.assign((...args: unknown[]) => { if (pixel.callMethod) pixel.callMethod(...args); else pixel.queue.push(args); }, {queue:[] as unknown[][],loaded:true,version:'2.0'});
    pixel.push = pixel;
    window.fbq = pixel;
    window.fbq('consent', 'grant');
    window.fbq('init', pixelId);
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    return () => { window.fbq?.('consent', 'revoke'); script.remove(); };
  }, [marketing, pixelId]);
  useEffect(() => { if (marketing && pixelId) window.fbq?.('track', 'PageView'); }, [marketing, pixelId, pathname]);
  return null;
}
