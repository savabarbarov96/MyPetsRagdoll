import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Custom hooks for cat management
export const useCats = () => {
  return useQuery(api.cats.getAllCats);
};

export const useDisplayedCats = () => {
  return useQuery(api.cats.getDisplayedCats);
};

export const useCatById = (id: Id<"cats"> | undefined) => {
  return useQuery(api.cats.getCatById, id ? { id } : {});
};

export const useSearchCats = (searchTerm?: string, gender?: 'male' | 'female', isDisplayed?: boolean) => {
  return useQuery(api.cats.searchCats, { 
    searchTerm, 
    gender, 
    isDisplayed 
  });
};

export const useCatStatistics = () => {
  return useQuery(api.cats.getCatStatistics);
};

export const useCatsByGender = (gender: 'male' | 'female') => {
  return useQuery(api.cats.getCatsByGender, { gender });
};

export const useRecentCats = (limit?: number) => {
  return useQuery(api.cats.getRecentCats, { limit });
};

// New category-based hooks for gallery filtering
export const useCatsByCategory = (category: 'kitten' | 'adult' | 'all') => {
  return useQuery(api.cats.getCatsByCategory, { category });
};

export const useDisplayedCatsByCategory = (category: 'kitten' | 'adult' | 'all') => {
  return useQuery(api.cats.getDisplayedCatsByCategory, { category });
};

export const useDisplayedCatsByGenderAndAge = (section: 'male' | 'female' | 'kitten') => {
  return useQuery(api.cats.getDisplayedCatsByGenderAndAge, { section });
};

// Mutation hooks
export const useCreateCat = () => {
  return useMutation(api.cats.createCat);
};

export const useUpdateCat = () => {
  return useMutation(api.cats.updateCat);
};

export const useDeleteCat = () => {
  return useMutation(api.cats.deleteCat);
};

export const useToggleCatDisplay = () => {
  return useMutation(api.cats.toggleCatDisplay);
};

export const useBulkUpdateDisplay = () => {
  return useMutation(api.cats.bulkUpdateDisplay);
};

export const useBulkUpdateCategory = () => {
  return useMutation(api.cats.bulkUpdateCategory);
};

// Pedigree hooks
export const usePedigreeConnections = () => {
  return useQuery(api.pedigree.getAllConnections);
};

export const useParents = (catId: Id<"cats"> | undefined) => {
  return useQuery(api.pedigree.getParents, catId ? { catId } : {});
};

export const useChildren = (catId: Id<"cats"> | undefined) => {
  return useQuery(api.pedigree.getChildren, catId ? { catId } : {});
};

export const useFamilyTree = (rootCatId: Id<"cats"> | undefined, maxGenerations?: number) => {
  return useQuery(api.pedigree.generateFamilyTree, 
    rootCatId ? { rootCatId, maxGenerations } : null
  );
};

export const useSavedPedigreeTrees = () => {
  return useQuery(api.pedigree.getSavedPedigreeTrees);
};

export const usePedigreeTree = (treeId: Id<"pedigreeTrees"> | undefined) => {
  return useQuery(api.pedigree.getPedigreeTree, treeId ? { treeId } : {});
};

export const useBreedingStatistics = () => {
  return useQuery(api.pedigree.getBreedingStatistics);
};

// Pedigree mutation hooks
export const useAddConnection = () => {
  return useMutation(api.pedigree.addConnection);
};

export const useRemoveConnection = () => {
  return useMutation(api.pedigree.removeConnection);
};

export const useRemoveConnectionsByRelationship = () => {
  return useMutation(api.pedigree.removeConnectionsByRelationship);
};

export const useSavePedigreeTree = () => {
  return useMutation(api.pedigree.savePedigreeTree);
};

export const useDeletePedigreeTree = () => {
  return useMutation(api.pedigree.deletePedigreeTree);
};

// Authentication hooks
export const useLogin = () => {
  return useMutation(api.auth.login);
};

export const useLogout = () => {
  return useMutation(api.auth.logout);
};

export const useValidateSession = (sessionId: string | undefined) => {
  return useQuery(api.auth.validateSession, sessionId ? { sessionId } : {});
};

export const useExtendSession = () => {
  return useMutation(api.auth.extendSession);
};

export const useActiveSessions = () => {
  return useQuery(api.auth.getActiveSessions);
};

// Contact hooks
export const useSubmitContact = () => {
  return useMutation(api.contact.submitContact);
};

export const useAllContacts = () => {
  return useQuery(api.contact.getAllContacts);
};

export const useContactsByStatus = (status: 'new' | 'read' | 'replied') => {
  return useQuery(api.contact.getContactsByStatus, { status });
};

export const useContactStatistics = () => {
  return useQuery(api.contact.getContactStatistics);
};

export const useUpdateContactStatus = () => {
  return useMutation(api.contact.updateContactStatus);
};

export const useMarkContactAsRead = () => {
  return useMutation(api.contact.markContactAsRead);
};

export const useMarkContactAsReplied = () => {
  return useMutation(api.contact.markContactAsReplied);
};

export const useDeleteContact = () => {
  return useMutation(api.contact.deleteContact);
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