import { useAdminMutation, useAdminQuery, useOptionalAdminQuery } from "@/lib/adminConvex";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Custom hooks for cat management
export const useCats = () => {
  return useAdminQuery(api.cats.getAllCats);
};

export const useDisplayedCats = () => {
  return useQuery(api.cats.getDisplayedCats);
};

export const useCatById = (id: Id<"cats"> | undefined) => {
  return useOptionalAdminQuery(api.cats.getCatById, id ? { id } : "skip");
};

export const useSearchCats = (searchTerm?: string, gender?: 'male' | 'female', isDisplayed?: boolean) => {
  return useAdminQuery(api.cats.searchCats, {
    searchTerm, 
    gender, 
    isDisplayed 
  });
};

export const useCatStatistics = () => {
  return useAdminQuery(api.cats.getCatStatistics);
};

export const useCatsByGender = (gender: 'male' | 'female') => {
  return useAdminQuery(api.cats.getCatsByGender, { gender });
};

export const useRecentCats = (limit?: number) => {
  return useAdminQuery(api.cats.getRecentCats, { limit });
};

// New category-based hooks for gallery filtering
export const useCatsByCategory = (category: 'kitten' | 'adult' | 'all') => {
  return useAdminQuery(api.cats.getCatsByCategory, { category });
};

export const useDisplayedCatsByCategory = (category: 'kitten' | 'adult' | 'all') => {
  return useQuery(api.cats.getDisplayedCatsByCategory, { category });
};

export const useDisplayedCatsByGenderAndAge = (section: 'male' | 'female' | 'kitten') => {
  return useQuery(api.cats.getDisplayedCatsByGenderAndAge, { section });
};

export const useDisplayedCatsByBreedGenderAndAge = (section: 'male' | 'female' | 'kitten', breed: 'ragdoll' | 'british') => {
  return useQuery(api.cats.getDisplayedCatsByBreedGenderAndAge, { section, breed });
};

export const useCatsByBreed = (breed?: 'ragdoll' | 'british') => {
  return useAdminQuery(api.cats.getCatsByBreed, breed ? { breed } : "skip");
};

// Mutation hooks
export const useCreateCat = () => {
  return useAdminMutation(api.cats.createCat);
};

export const useUpdateCat = () => {
  return useAdminMutation(api.cats.updateCat);
};

export const useDeleteCat = () => {
  return useAdminMutation(api.cats.deleteCat);
};

export const useToggleCatDisplay = () => {
  return useAdminMutation(api.cats.toggleCatDisplay);
};

export const useBulkUpdateDisplay = () => {
  return useAdminMutation(api.cats.bulkUpdateDisplay);
};

export const useBulkUpdateCategory = () => {
  return useAdminMutation(api.cats.bulkUpdateCategory);
};

// Pedigree hooks
export const usePedigreeConnections = () => {
  return useAdminQuery(api.pedigree.getAllConnections);
};

export const useParents = (catId: Id<"cats"> | undefined) => {
  return useOptionalAdminQuery(api.pedigree.getParents, catId ? { catId } : "skip");
};

export const useChildren = (catId: Id<"cats"> | undefined) => {
  return useOptionalAdminQuery(api.pedigree.getChildren, catId ? { catId } : "skip");
};

export const useFamilyTree = (rootCatId: Id<"cats"> | undefined, maxGenerations?: number) => {
  return useOptionalAdminQuery(
    api.pedigree.generateFamilyTree,
    rootCatId ? { rootCatId, maxGenerations } : "skip"
  );
};

export const useSavedPedigreeTrees = () => {
  return useAdminQuery(api.pedigree.getSavedPedigreeTrees);
};

export const usePedigreeTree = (treeId: Id<"pedigreeTrees"> | undefined) => {
  return useAdminQuery(api.pedigree.getPedigreeTree, treeId ? { treeId } : "skip");
};

export const useBreedingStatistics = () => {
  return useAdminQuery(api.pedigree.getBreedingStatistics);
};

// Pedigree mutation hooks
export const useAddConnection = () => {
  return useAdminMutation(api.pedigree.addConnection);
};

export const useRemoveConnection = () => {
  return useAdminMutation(api.pedigree.removeConnection);
};

export const useRemoveConnectionsByRelationship = () => {
  return useAdminMutation(api.pedigree.removeConnectionsByRelationship);
};

export const useSavePedigreeTree = () => {
  return useAdminMutation(api.pedigree.savePedigreeTree);
};

export const useDeletePedigreeTree = () => {
  return useAdminMutation(api.pedigree.deletePedigreeTree);
};

// Authentication hooks
export const useLogin = () => {
  return useAction(api.adminLogin.login);
};

export const useLogout = () => {
  return useMutation(api.auth.logout);
};

export const useValidateSession = (sessionId: string | undefined) => {
  // Skip validation calls when no session is present using the Convex "skip" sentinel.
  return useQuery(api.auth.validateSession, sessionId ? { sessionId } : "skip");
};

export const useExtendSession = () => {
  return useAdminMutation(api.auth.extendSession);
};

export const useActiveSessions = () => {
  return useAdminQuery(api.auth.getActiveSessions);
};

// Contact hooks
export const useSubmitContact = () => {
  return useMutation(api.contact.submitContact);
};

export const useAllContacts = () => {
  return useAdminQuery(api.contact.getAllContacts);
};

export const useContactsByStatus = (status: 'new' | 'read' | 'replied') => {
  return useAdminQuery(api.contact.getContactsByStatus, { status });
};

export const useContactStatistics = () => {
  return useAdminQuery(api.contact.getContactStatistics);
};

export const useUpdateContactStatus = () => {
  return useAdminMutation(api.contact.updateContactStatus);
};

export const useMarkContactAsRead = () => {
  return useAdminMutation(api.contact.markContactAsRead);
};

export const useMarkContactAsReplied = () => {
  return useAdminMutation(api.contact.markContactAsReplied);
};

export const useDeleteContact = () => {
  return useAdminMutation(api.contact.deleteContact);
};

// Type exports for convenience
export type { Id } from "../../convex/_generated/dataModel";
export type CatData = {
  _id: Id<"cats">;
  _creationTime: number;
  name: string;
  subtitle: string;
  image: string;
  description: string;
  age: string;
  color: string;
  status: string;
  gallery: string[];
  gender: 'male' | 'female';
  birthDate: string;
  registrationNumber?: string;
  isDisplayed: boolean;
  freeText?: string;
  // Internal notes field (not displayed publicly)
  internalNotes?: string;
  // New fields for gallery filtering
  category?: 'kitten' | 'adult' | 'all';
  // Breed field
  breed?: 'ragdoll' | 'british';
};

export type PedigreeConnection = {
  _id: Id<"pedigreeConnections">;
  _creationTime: number;
  parentId: Id<"cats">;
  childId: Id<"cats">;
  type: 'mother' | 'father';
};

export type ContactSubmission = {
  _id: Id<"contactSubmissions">;
  _creationTime: number;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'replied';
}; 
