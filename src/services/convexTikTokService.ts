import { useOptionalAdminQuery } from "@/lib/adminConvex";
import { useAdminMutation, useAdminQuery } from "@/lib/adminConvex";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Query hooks for TikTok videos
export const useAllTikTokVideos = () => {
  return useAdminQuery(api.tiktokVideos.getAllVideos);
};

export const useActiveTikTokVideos = () => {
  return useQuery(api.tiktokVideos.getActiveVideos);
};

export const useTikTokVideosByCat = (catId: Id<"cats"> | string | undefined) => {
  // Skip the query if catId is a fallback ID (string) or undefined
  const isValidConvexId = catId && typeof catId === 'string' && !catId.startsWith('fallback-');
  return useQuery(api.tiktokVideos.getVideosByCat, isValidConvexId ? { catId: catId as Id<"cats"> } : {});
};

export const useGlobalTikTokVideos = () => {
  return useQuery(api.tiktokVideos.getGlobalVideos);
};

export const useTikTokVideosForMainSection = (limit?: number) => {
  return useQuery(api.tiktokVideos.getVideosForMainSection, { limit });
};

export const useTikTokVideoById = (id: Id<"tiktokVideos"> | undefined) => {
  return useOptionalAdminQuery(api.tiktokVideos.getVideoById, id ? { id } : {});
};

export const useTikTokVideoStatistics = () => {
  return useAdminQuery(api.tiktokVideos.getVideoStatistics);
};

// Mutation hooks for TikTok videos
export const useCreateTikTokVideo = () => {
  return useAdminMutation(api.tiktokVideos.createVideo);
};

export const useUpdateTikTokVideo = () => {
  return useAdminMutation(api.tiktokVideos.updateVideo);
};

export const useDeleteTikTokVideo = () => {
  return useAdminMutation(api.tiktokVideos.deleteVideo);
};

export const useToggleTikTokVideoActive = () => {
  return useAdminMutation(api.tiktokVideos.toggleVideoActive);
};

export const useUpdateTikTokVideoOrder = () => {
  return useAdminMutation(api.tiktokVideos.updateVideoOrder);
};

// Type exports
export type TikTokVideoData = {
  _id: Id<"tiktokVideos">;
  _creationTime: number;
  catId?: Id<"cats">;
  videoUrl: string;
  embedId?: string;
  thumbnail: string;
  title: string;
  description?: string;
  hashtags: string[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  isActive: boolean;
  sortOrder: number;
};

export type TikTokVideoFormData = {
  catId?: Id<"cats">;
  videoUrl: string;
  embedId?: string;
  thumbnail: string;
  title: string;
  description?: string;
  hashtags: string[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  isActive?: boolean;
};

export type TikTokVideoStatistics = {
  total: number;
  active: number;
  inactive: number;
  catSpecific: number;
  global: number;
  totalViews: number;
  totalLikes: number;
};