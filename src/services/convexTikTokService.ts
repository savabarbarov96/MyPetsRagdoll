import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Query hooks for TikTok videos
export const useAllTikTokVideos = () => {
  return useQuery(api.tiktokVideos.getAllVideos);
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
  return useQuery(api.tiktokVideos.getVideoById, id ? { id } : {});
};

export const useTikTokVideoStatistics = () => {
  return useQuery(api.tiktokVideos.getVideoStatistics);
};

// Mutation hooks for TikTok videos
export const useCreateTikTokVideo = () => {
  return useMutation(api.tiktokVideos.createVideo);
};

export const useUpdateTikTokVideo = () => {
  return useMutation(api.tiktokVideos.updateVideo);
};

export const useDeleteTikTokVideo = () => {
  return useMutation(api.tiktokVideos.deleteVideo);
};

export const useToggleTikTokVideoActive = () => {
  return useMutation(api.tiktokVideos.toggleVideoActive);
};

export const useUpdateTikTokVideoOrder = () => {
  return useMutation(api.tiktokVideos.updateVideoOrder);
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