import { v } from "convex/values";
import { internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Define the image mapping for migration
const IMAGE_MAPPINGS = [
  // Public directory images
  { localPath: "/model-cat-1.jpg", filename: "model-cat-1.jpg", type: "general" as const },
  { localPath: "/model-cat-2.jpg", filename: "model-cat-2.jpg", type: "general" as const },
  { localPath: "/model-cat-3.jpg", filename: "model-cat-3.jpg", type: "general" as const },
  { localPath: "/featured-cat-1.jpg", filename: "featured-cat-1.jpg", type: "general" as const },
  { localPath: "/featured-cat-2.jpg", filename: "featured-cat-2.jpg", type: "general" as const },
  { localPath: "/istockphoto-1092493548-612x612.jpg", filename: "istockphoto-1092493548-612x612.jpg", type: "general" as const },
  
  // Assets directory images (these will be downloaded from public URLs or need manual upload)
  { localPath: "/66971fa7-cedb-4c2f-8201-1eafd603c1fc.jpg", filename: "66971fa7-cedb-4c2f-8201-1eafd603c1fc.jpg", type: "gallery" as const },
  { localPath: "/9274d091-96de-4d71-abd1-fe6214ea8876.jpg", filename: "9274d091-96de-4d71-abd1-fe6214ea8876.jpg", type: "gallery" as const },
  { localPath: "/9d5287f5-363d-4d3a-b4dc-71c870262ada.jpg", filename: "9d5287f5-363d-4d3a-b4dc-71c870262ada.jpg", type: "gallery" as const },
  { localPath: "/a331a930-e6fc-44b2-9062-2a759286cfa8.jpg", filename: "a331a930-e6fc-44b2-9062-2a759286cfa8.jpg", type: "gallery" as const },
  { localPath: "/b44e0f3b-584c-4942-8c19-35d2c7f11fbd.jpg", filename: "b44e0f3b-584c-4942-8c19-35d2c7f11fbd.jpg", type: "gallery" as const },
  { localPath: "/cbec1a69-b126-4aba-acf0-b6114d2e3ebe.jpg", filename: "cbec1a69-b126-4aba-acf0-b6114d2e3ebe.jpg", type: "gallery" as const },
  { localPath: "/d67ac1c2-b1ee-41ba-9d99-80263f5e4aa9.jpg", filename: "d67ac1c2-b1ee-41ba-9d99-80263f5e4aa9.jpg", type: "gallery" as const },
  { localPath: "/f2b3bb38-716b-455d-afd6-9883f9d335e4.jpg", filename: "f2b3bb38-716b-455d-afd6-9883f9d335e4.jpg", type: "gallery" as const },
  { localPath: "/hero-cats-modern.jpg", filename: "hero-cats-modern.jpg", type: "general" as const },
  { localPath: "/hero-maine-coon.jpg", filename: "hero-maine-coon.jpg", type: "general" as const },
];


interface UploadResult {
  success: boolean; filename: string; storageId?: Id<"_storage">; storageUrl?: string;
  imageId?: Id<"images">; originalPath: string; error?: string;
}
interface MigrationResult {
  total: number; successful: number; failed: number;
  results: Array<UploadResult & { mapping: (typeof IMAGE_MAPPINGS)[number] }>;
  urlMappings: Record<string, string>;
}
interface UpdateResult {
  updatedCount: number; totalCats: number;
  updatedCats: Array<{ id: Id<"cats">; name: string; oldImage: string; newImage: string; oldGallery: string[]; newGallery: string[] }>;
}
interface MigrationStatus {
  totalCats: number; catsWithLocalPaths: number; allMigrated: boolean;
  catsNeedingMigration: Array<{ id: Id<"cats">; name: string; hasLocalImage: boolean; hasLocalGallery: boolean; localImage: string | null; localGalleryImages: string[] }>;
}

// Upload a single image from a public URL or local path
export const uploadImageFromUrl = internalAction({
  args: {
    imageUrl: v.string(),
    filename: v.string(),
    imageType: v.union(v.literal("profile"), v.literal("gallery"), v.literal("general"), v.literal("news")),
    associatedCatId: v.optional(v.id("cats"))
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    filename: string;
    storageId?: Id<"_storage">;
    storageUrl?: string;
    imageId?: Id<"images">;
    originalPath: string;
    error?: string;
  }> => {
    try {
      // Try to fetch the image from public folder first (if running locally)
      let imageUrl = args.imageUrl;
      
      // If it's a local path, convert it to public URL
      if (imageUrl.startsWith('/')) {
        // Assuming local dev server is running on localhost:5173 (Vite default)
        imageUrl = `http://localhost:5173${imageUrl}`;
      }

      console.log(`Fetching image from: ${imageUrl}`);
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log(`Successfully fetched ${args.filename}, size: ${blob.size} bytes`);

      // Store the file in Convex storage
      const storageId = await ctx.storage.store(blob);
      console.log(`Stored ${args.filename} with storage ID: ${storageId}`);

      // Save metadata
      const result: Id<"images"> = await ctx.runMutation(internal.files.saveImageMetadata, {
        storageId,
        filename: args.filename,
        associatedCatId: args.associatedCatId,
        imageType: args.imageType,
      });

      const storageUrl = await ctx.storage.getUrl(storageId);
      
      return {
        success: true,
        filename: args.filename,
        storageId,
        storageUrl: storageUrl || undefined,
        imageId: result,
        originalPath: args.imageUrl
      };

    } catch (error) {
      console.error(`Failed to upload ${args.filename}:`, error);
      return {
        success: false,
        filename: args.filename,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalPath: args.imageUrl
      };
    }
  },
});

// Migrate all images from local paths to Convex storage
export const migrateAllImages = internalAction({
  handler: async (ctx): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: MigrationResult["results"];
    urlMappings: Record<string, string>;
  }> => {
    const results: MigrationResult["results"] = [];
    
    console.log(`Starting migration of ${IMAGE_MAPPINGS.length} images...`);
    
    for (const mapping of IMAGE_MAPPINGS) {
      const result = await ctx.runAction(internal.imageMigration.uploadImageFromUrl, {
        imageUrl: mapping.localPath,
        filename: mapping.filename,
        imageType: mapping.type,
      });
      
      results.push({
        ...result,
        mapping: mapping
      });
      
      // Add a small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Migration completed: ${successful.length} successful, ${failed.length} failed`);
    
    if (failed.length > 0) {
      console.log('Failed migrations:', failed);
    }
    
    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results,
      urlMappings: successful.reduce((acc: Record<string, string>, result: UploadResult) => {
        if (result.storageUrl && result.originalPath) {
          acc[result.originalPath] = result.storageUrl;
        }
        return acc;
      }, {} as Record<string, string>)
    };
  },
});

// Update cat records to use new storage URLs
export const updateCatImagesWithStorageUrls = internalMutation({
  args: {
    urlMappings: v.record(v.string(), v.string()) // Record<string, string> - maps old paths to new URLs
  },
  handler: async (ctx, args) => {
    const cats = await ctx.db.query("cats").collect();
    const updatedCats = [];
    
    for (const cat of cats) {
      let updated = false;
      let newImage = cat.image;
      let newGallery = [...cat.gallery];
      
      // Update main image if it's a local path
      if ((args.urlMappings as Record<string, string>)[cat.image]) {
        newImage = (args.urlMappings as Record<string, string>)[cat.image];
        updated = true;
      }
      
      // Update gallery images
      newGallery = cat.gallery.map((galleryImage: string) => {
        if ((args.urlMappings as Record<string, string>)[galleryImage]) {
          updated = true;
          return (args.urlMappings as Record<string, string>)[galleryImage];
        }
        return galleryImage;
      });
      
      if (updated) {
        await ctx.db.patch(cat._id, {
          image: newImage,
          gallery: newGallery
        });
        
        updatedCats.push({
          id: cat._id,
          name: cat.name,
          oldImage: cat.image,
          newImage: newImage,
          oldGallery: cat.gallery,
          newGallery: newGallery
        });
      }
    }
    
    return {
      updatedCount: updatedCats.length,
      totalCats: cats.length,
      updatedCats: updatedCats
    };
  },
});

// Complete migration workflow
export const runFullImageMigration = internalAction({
  args: {},
  handler: async (ctx, args): Promise<{
    uploadResults: MigrationResult;
    updateResults: UpdateResult;
    summary: {
      imagesUploaded: number;
      imagesFailed: number;
      catsUpdated: number;
      totalCats: number;
    };
  }> => {
    console.log("Starting full image migration...");
    
    // Step 1: Upload all images to Convex storage
    const uploadResults: MigrationResult = await ctx.runAction(internal.imageMigration.migrateAllImages);
    
    if (uploadResults.failed > 0) {
      console.warn(`${uploadResults.failed} images failed to upload. Continuing with partial migration...`);
    }
    
    // Step 2: Update cat records with new storage URLs
    const updateResults: UpdateResult = await ctx.runMutation(internal.imageMigration.updateCatImagesWithStorageUrls, {
      urlMappings: uploadResults.urlMappings
    });
    
    console.log("Full migration completed!");
    
    return {
      uploadResults,
      updateResults,
      summary: {
        imagesUploaded: uploadResults.successful,
        imagesFailed: uploadResults.failed,
        catsUpdated: updateResults.updatedCount,
        totalCats: updateResults.totalCats
      }
    };
  },
});

// Get migration status - check which images are still using local paths
export const getMigrationStatus = internalAction({
  args: {},
  handler: async (ctx, args): Promise<{
    totalCats: number;
    catsWithLocalPaths: number;
    allMigrated: boolean;
    catsNeedingMigration: MigrationStatus["catsNeedingMigration"];
  }> => {
    const cats: Doc<"cats">[] = await ctx.runQuery(internal.imageMigration.getMigrationCats, {});
    const localPathCats: MigrationStatus["catsNeedingMigration"] = [];
    
    for (const cat of cats) {
      const hasLocalImage = cat.image.startsWith('/') && !cat.image.startsWith('http');
      const hasLocalGallery = cat.gallery.some((img: string) => img.startsWith('/') && !img.startsWith('http'));
      
      if (hasLocalImage || hasLocalGallery) {
        localPathCats.push({
          id: cat._id,
          name: cat.name,
          hasLocalImage,
          hasLocalGallery,
          localImage: hasLocalImage ? cat.image : null,
          localGalleryImages: cat.gallery.filter((img: string) => img.startsWith('/') && !img.startsWith('http'))
        });
      }
    }
    
    return {
      totalCats: cats.length,
      catsWithLocalPaths: localPathCats.length,
      allMigrated: localPathCats.length === 0,
      catsNeedingMigration: localPathCats
    };
  },
});
export const getMigrationCats = internalQuery({ args: {}, handler: async ctx => ctx.db.query("cats").collect() });
