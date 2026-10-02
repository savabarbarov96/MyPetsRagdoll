import { useAdminMutation, useAdminQuery } from "@/lib/adminConvex";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Query hooks for site settings
export const useAllSiteSettings = () => {
  return useAdminQuery(api.siteSettings.getAllSettings);
};

export const useSettingsByType = (type: 'social_media' | 'contact_info' | 'site_content' | 'feature_toggle' | 'analytics' | 'seo' | 'location') => {
  return useAdminQuery(api.siteSettings.getSettingsByType, { type });
};

export const useSettingByKey = (key: string) => {
  return useAdminQuery(api.siteSettings.getSettingByKey, { key });
};

export const useSocialMediaSettings = () => {
  const settings = useQuery(api.siteSettings.getSocialMediaSettings);
  return settings;
};

export const useLocationSettings = () => {
  return useQuery(api.siteSettings.getLocationSettings);
};

// Mutation hooks for site settings
export const useUpsertSetting = () => {
  return useAdminMutation(api.siteSettings.upsertSetting);
};

export const useUpdateSocialMediaSettings = () => {
  return useAdminMutation(api.siteSettings.updateSocialMediaSettings);
};

export const useUpdateLocationSettings = () => {
  return useAdminMutation(api.siteSettings.updateLocationSettings);
};

export const useDeleteSetting = () => {
  return useAdminMutation(api.siteSettings.deleteSetting);
};

export const useInitializeDefaultSettings = () => {
  return useAdminMutation(api.siteSettings.initializeDefaultSettings);
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