import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Query hooks for site settings
export const useAllSiteSettings = () => {
  return useQuery(api.siteSettings.getAllSettings);
};

export const useSettingsByType = (type: 'social_media' | 'contact_info' | 'site_content' | 'feature_toggle' | 'analytics' | 'seo' | 'location') => {
  return useQuery(api.siteSettings.getSettingsByType, { type });
};

export const useSettingByKey = (key: string) => {
  return useQuery(api.siteSettings.getSettingByKey, { key });
};

export const useSocialMediaSettings = () => {
  const settings = useQuery(api.siteSettings.getSocialMediaSettings);
  if (!settings) return settings;

  // Replace legacy profile URLs already stored in site settings.
  const instagramUrl = settings.instagram_url?.replace(
    /^https?:\/\/(?:www\.)?instagram\.com\/(?:radanovpride|bleuroi\.ragdoll)\/?(?:\?.*)?$/i,
    "https://www.instagram.com/bleuroi_cattery_ragdol_british/",
  );
  return { ...settings, instagram_url: instagramUrl };
};

export const useLocationSettings = () => {
  return useQuery(api.siteSettings.getLocationSettings);
};

// Mutation hooks for site settings
export const useUpsertSetting = () => {
  return useMutation(api.siteSettings.upsertSetting);
};

export const useUpdateSocialMediaSettings = () => {
  return useMutation(api.siteSettings.updateSocialMediaSettings);
};

export const useUpdateLocationSettings = () => {
  return useMutation(api.siteSettings.updateLocationSettings);
};

export const useDeleteSetting = () => {
  return useMutation(api.siteSettings.deleteSetting);
};

export const useInitializeDefaultSettings = () => {
  return useMutation(api.siteSettings.initializeDefaultSettings);
};

// Type exports
export type SiteSettingType = 'social_media' | 'contact_info' | 'site_content' | 'feature_toggle' | 'analytics' | 'seo' | 'location';

export type SiteSetting = {
  _id: Id<"siteSettings">;
  _creationTime: number;
  key: string;
  value: string;
  type: SiteSettingType;
  description?: string;
};

export type SocialMediaSettings = {
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
};

export type LocationSettings = {
  establishment_address?: string;
  establishment_coordinates?: string; // JSON string: {lat: number, lng: number}
  google_maps_url?: string;
  apple_maps_url?: string;
  location_display_name?: string;
};