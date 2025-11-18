import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../convex/_generated/api";

/**
 * Hook for optimized data usage that controls when secondary data is exposed to components
 * Loads all queries but only returns secondary data after initial render or user interaction
 */
export const useOptimizedQueries = () => {
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [shouldLoadSecondaryData, setShouldLoadSecondaryData] = useState(false);

  // Critical queries that must load immediately (Hero section)
  const heroImages = useQuery(api.heroImages.getActiveHeroImages);
  const activeHeroVideo = useQuery(api.heroVideos.getActiveHeroVideo);

  // Secondary queries - always load but control when they're enabled via shouldLoadSecondaryData
  const galleryCategories = useQuery(api.gallery.getGalleryCategoriesWithCounts);
  const tiktokVideos = useQuery(api.tiktokVideos.getVideosForMainSection, { limit: 6 });
  const announcements = useQuery(api.announcements.getLatestAnnouncements, { limit: 3 });

  // Mark initial load as complete when critical data is loaded
  useEffect(() => {
    if (heroImages !== undefined && !isInitialLoadComplete) {
      setIsInitialLoadComplete(true);
      // Delay secondary queries to improve perceived performance
      setTimeout(() => setShouldLoadSecondaryData(true), 100);
    }
  }, [heroImages, isInitialLoadComplete]);

  // Enable loading secondary data on user interaction
  const enableSecondaryQueries = () => {
    setShouldLoadSecondaryData(true);
  };

  return {
    // Critical data
    heroImages,
    activeHeroVideo,
    
    // Secondary data (available but usage controlled by shouldLoadSecondaryData)
    galleryCategories: shouldLoadSecondaryData ? galleryCategories : undefined,
    tiktokVideos: shouldLoadSecondaryData ? tiktokVideos : undefined,
    announcements: shouldLoadSecondaryData ? announcements : undefined,
    
    // Status
    isInitialLoadComplete,
    shouldLoadSecondaryData,
    enableSecondaryQueries
  };
};

/**
 * Hook for lazy-loaded gallery data that only fetches when needed
 */
export const useLazyGalleryData = (category: string = "all", enabled: boolean = false) => {
  return useQuery(
    api.gallery.getPublishedGalleryItems,
    enabled && category !== "all" ? { category } : {}
  );
};

/**
 * Hook for lazy-loaded cat data with pagination
 */
export const useLazyCatData = (category: string = "all", enabled: boolean = false, limit: number = 6) => {
  return useQuery(
    api.cats.getDisplayedCatsByCategory,
    { category, limit }
  );
};

export default useOptimizedQueries;
