import { useOptionalAdminQuery } from "@/lib/adminConvex";
import { useAdminMutation, useAdminQuery } from "@/lib/adminConvex";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Query hooks for announcements
export const useAllAnnouncements = () => {
  return useAdminQuery(api.announcements.getAllAnnouncements);
};

export const usePublishedAnnouncements = () => {
  return useQuery(api.announcements.getPublishedAnnouncements);
};

export const useLatestAnnouncements = (limit?: number) => {
  return useQuery(api.announcements.getLatestAnnouncements, { limit });
};

export const useAnnouncementById = (id: Id<"announcements">) => {
  return useOptionalAdminQuery(api.announcements.getAnnouncementById, { id });
};

export const useAnnouncementBySlug = (slug: string) => {
  return useQuery(api.announcements.getAnnouncementBySlug, { slug });
};

// Mutation hooks for announcements
export const useCreateAnnouncement = () => {
  return useAdminMutation(api.announcements.createAnnouncement);
};

export const useUpdateAnnouncement = () => {
  return useAdminMutation(api.announcements.updateAnnouncement);
};

export const useDeleteAnnouncement = () => {
  return useAdminMutation(api.announcements.deleteAnnouncement);
};

export const useToggleAnnouncementPublication = () => {
  return useAdminMutation(api.announcements.toggleAnnouncementPublication);
};

export const useUpdateSortOrder = () => {
  return useAdminMutation(api.announcements.updateSortOrder);
};

// Type exports
export type AnnouncementData = {
  _id: Id<"announcements">;
  _creationTime: number;
  title: string;
  content: string;
  featuredImage?: string;
  isPublished: boolean;
  publishedAt: number;
  sortOrder: number;
  updatedAt: number;
  slug?: string;
  metaDescription?: string;
  metaKeywords?: string;
};

export type CreateAnnouncementData = {
  title: string;
  content: string;
  featuredImage?: string;
  isPublished: boolean;
  sortOrder: number;
  metaDescription?: string;
  metaKeywords?: string;
};

export type UpdateAnnouncementData = {
  id: Id<"announcements">;
  title: string;
  content: string;
  featuredImage?: string;
  isPublished: boolean;
  sortOrder: number;
  metaDescription?: string;
  metaKeywords?: string;
};