import { useOptionalAdminQuery } from "@/lib/adminConvex";
import { useAdminMutation, useAdminQuery } from "@/lib/adminConvex";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type AwardCategory = "best_in_show" | "championship" | "cattery_recognition" | "breeding_award" | "other";

export interface AwardData {
  _id: Id<"awards">;
  title: string;
  description: string;
  awardDate: number;
  awardingOrganization: string;
  category: AwardCategory;
  certificateImage: string;
  galleryImages: string[];
  associatedCatId?: Id<"cats">;
  isPublished: boolean;
  sortOrder: number;
  achievements?: string;
  updatedAt: number;
}

export interface AwardCategoryWithCount {
  key: string;
  label: string;
  count: number;
}

// Hook to get all awards (admin use)
export const useAllAwards = () => {
  return useAdminQuery(api.awards.getAllAwards);
};

// Hook to get published awards
export const usePublishedAwards = (limit?: number, category?: AwardCategory | "all") => {
  return useQuery(api.awards.getPublishedAwards, { limit, category });
};

// Hook to get awards by category
export const useAwardsByCategory = (category: AwardCategory) => {
  return useQuery(api.awards.getAwardsByCategory, { category });
};

// Hook to get single award by ID
export const useAwardById = (id: Id<"awards">) => {
  return useOptionalAdminQuery(api.awards.getAwardById, { id });
};

// Hook to get awards for a specific cat
export const useAwardsByCat = (catId: Id<"cats">) => {
  return useQuery(api.awards.getAwardsByCat, { catId });
};

// Hook to get award categories with counts
export const useAwardCategoriesWithCounts = () => {
  return useQuery(api.awards.getAwardCategoriesWithCounts);
};

// Create award mutation
export const useCreateAward = () => {
  return useAdminMutation(api.awards.createAward);
};

// Update award mutation
export const useUpdateAward = () => {
  return useAdminMutation(api.awards.updateAward);
};

// Toggle publication status mutation
export const useToggleAwardPublication = () => {
  return useAdminMutation(api.awards.toggleAwardPublication);
};

// Delete award mutation
export const useDeleteAward = () => {
  return useAdminMutation(api.awards.deleteAward);
};

// Update sort order mutation
export const useUpdateAwardSortOrder = () => {
  return useAdminMutation(api.awards.updateSortOrder);
};

// Utility function to format award date
export const formatAwardDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Utility function to get category label in Bulgarian
export const getCategoryLabel = (category: AwardCategory): string => {
  const labels: Record<AwardCategory, string> = {
    best_in_show: "Най-добър от изложбата",
    championship: "Шампионат",
    cattery_recognition: "Признание за развъдник", 
    breeding_award: "Награда за развъждане",
    other: "Други"
  };
  return labels[category];
};

// Utility function to get category color
export const getCategoryColor = (category: AwardCategory): string => {
  const colors: Record<AwardCategory, string> = {
    best_in_show: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    championship: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    cattery_recognition: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    breeding_award: "bg-green-500/10 text-green-700 border-green-500/20",
    other: "bg-gray-500/10 text-gray-700 border-gray-500/20"
  };
  return colors[category];
};