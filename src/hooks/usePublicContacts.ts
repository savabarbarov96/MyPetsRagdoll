import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { COMPANY, SOCIAL_LINKS } from '@/config/site';

type SocialKey = keyof typeof SOCIAL_LINKS;
const hosts: Record<SocialKey, string[]> = {facebook:['facebook.com','www.facebook.com'],instagram:['instagram.com','www.instagram.com'],tiktok:['tiktok.com','www.tiktok.com']};
export function resolvePublicSocialLinks(settings?: Record<string, unknown>) {
  return Object.fromEntries((Object.keys(SOCIAL_LINKS) as SocialKey[]).map(key => {
    const value = settings?.[`${key}_url`];
    if (typeof value !== 'string') return [key,SOCIAL_LINKS[key]];
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || !hosts[key].includes(url.hostname)) return [key,SOCIAL_LINKS[key]];
      // Preserve the owner's confirmed profile over these known legacy settings.
      if (key === 'instagram' && /^\/(radanovpride|bleuroi\.ragdoll|bleuroi_ragdol_british\.cattery)\/?$/i.test(url.pathname)) return [key,SOCIAL_LINKS[key]];
      return [key,url.href];
    } catch { return [key,SOCIAL_LINKS[key]]; }
  })) as Record<SocialKey,string>;
}
export function usePublicSocialLinks() {
  return resolvePublicSocialLinks(useQuery(api.siteSettings.getSocialMediaSettings));
}
export function usePublicLocation() {
  const settings = useQuery(api.siteSettings.getLocationSettings);
  const address = typeof settings?.establishment_address === 'string' && settings.establishment_address.trim() ? settings.establishment_address : COMPANY.address;
  return {address};
}
