import { requireAdmin } from "./lib/admin";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get the currently active hero video with resolved URLs
export const getActiveHeroVideo = query({
  handler: async (ctx) => {
    const video = await ctx.db
      .query("heroVideos")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!video) return null;

    // If the src starts with "convex://storage/", resolve the actual URL
    let resolvedSrc = video.src;
    if (video.src.startsWith("convex://storage/")) {
      const storageId = video.src.replace("convex://storage/", "") as Id<"_storage">;
      const url = await ctx.storage.getUrl(storageId);
      if (url) resolvedSrc = url;
    }

    // Same for thumbnail
    let resolvedThumbnail = video.thumbnailSrc;
    if (video.thumbnailSrc?.startsWith("convex://storage/")) {
      const thumbnailStorageId = video.thumbnailSrc.replace("convex://storage/", "") as Id<"_storage">;
      const thumbnailUrl = await ctx.storage.getUrl(thumbnailStorageId);
      if (thumbnailUrl) resolvedThumbnail = thumbnailUrl;
    }

    return {
      ...video,
      src: resolvedSrc,
      thumbnailSrc: resolvedThumbnail,
    };
  },
});

// Get all hero videos (for admin management) with resolved URLs
export const getAllHeroVideos = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const videos = await ctx.db
      .query("heroVideos")
      .withIndex("by_uploaded", (q) => q)
      .order("desc")
      .collect();

    // Resolve storage URLs for each video
    const resolvedVideos = await Promise.all(
      videos.map(async (video) => {
        let resolvedSrc = video.src;
        if (video.src.startsWith("convex://storage/")) {
          const storageId = video.src.replace("convex://storage/", "") as Id<"_storage">;
          const url = await ctx.storage.getUrl(storageId);
          if (url) resolvedSrc = url;
        }

        let resolvedThumbnail = video.thumbnailSrc;
        if (video.thumbnailSrc?.startsWith("convex://storage/")) {
          const thumbnailStorageId = video.thumbnailSrc.replace("convex://storage/", "") as Id<"_storage">;
          const thumbnailUrl = await ctx.storage.getUrl(thumbnailStorageId);
          if (thumbnailUrl) resolvedThumbnail = thumbnailUrl;
        }

        return {
          ...video,
          src: resolvedSrc,
          thumbnailSrc: resolvedThumbnail,
        };
      })
    );

    return resolvedVideos;
  },
});

// Add a new hero video
export const addHeroVideo = mutation({
  args: { sessionId: v.string(),
    src: v.string(),
    thumbnailSrc: v.optional(v.string()),
    alt: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    format: v.optional(v.string()),
    shouldAutoplay: v.optional(v.boolean()),
    shouldLoop: v.optional(v.boolean()),
    shouldMute: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const videoId = await ctx.db.insert("heroVideos", {
      src: input.src,
      thumbnailSrc: input.thumbnailSrc,
      alt: input.alt,
      title: input.title,
      description: input.description,
      isActive: false, // New videos are inactive by default
      duration: input.duration,
      fileSize: input.fileSize,
      format: input.format,
      uploadedAt: Date.now(),
      shouldAutoplay: input.shouldAutoplay ?? true,
      shouldLoop: input.shouldLoop ?? true,
      shouldMute: input.shouldMute ?? true,
    });

    return videoId;
  },
});

// Toggle a video's active status
export const toggleVideoActive = mutation({
  args: { sessionId: v.string(), id: v.id("heroVideos") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const video = await ctx.db.get(input.id);
    if (!video) {
      throw new Error("Video not found");
    }

    // If we're activating this video, deactivate all others first
    if (!video.isActive) {
      const activeVideos = await ctx.db
        .query("heroVideos")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      // Deactivate all currently active videos
      for (const activeVideo of activeVideos) {
        await ctx.db.patch(activeVideo._id, { isActive: false });
      }
    }

    // Toggle the target video
    await ctx.db.patch(input.id, { isActive: !video.isActive });

    return { success: true };
  },
});

// Update video settings
export const updateVideoSettings = mutation({
  args: { sessionId: v.string(),
    id: v.id("heroVideos"),
    alt: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    shouldAutoplay: v.optional(v.boolean()),
    shouldLoop: v.optional(v.boolean()),
    shouldMute: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const { id, ...updates } = input;
    
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error("No valid updates provided");
    }

    await ctx.db.patch(id, cleanUpdates);
    return { success: true };
  },
});

// Delete a hero video
export const deleteHeroVideo = mutation({
  args: { sessionId: v.string(), id: v.id("heroVideos") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const video = await ctx.db.get(input.id);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.delete(input.id);
    return { success: true };
  },
});

// Get video statistics (for admin dashboard)
export const getVideoStats = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const allVideos = await ctx.db.query("heroVideos").collect();
    const activeVideos = allVideos.filter(video => video.isActive);
    
    const totalSize = allVideos.reduce((sum, video) => sum + (video.fileSize || 0), 0);
    const totalDuration = allVideos.reduce((sum, video) => sum + (video.duration || 0), 0);

    return {
      totalVideos: allVideos.length,
      activeVideos: activeVideos.length,
      totalSizeBytes: totalSize,
      totalDurationSeconds: totalDuration,
      averageSizeBytes: allVideos.length > 0 ? totalSize / allVideos.length : 0,
      averageDurationSeconds: allVideos.length > 0 ? totalDuration / allVideos.length : 0,
    };
  },
});

// Activate a specific video by ID (deactivates others)
export const activateVideo = mutation({
  args: { sessionId: v.string(), id: v.id("heroVideos") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const video = await ctx.db.get(input.id);
    if (!video) {
      throw new Error("Video not found");
    }

    // Deactivate all currently active videos
    const activeVideos = await ctx.db
      .query("heroVideos")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    for (const activeVideo of activeVideos) {
      await ctx.db.patch(activeVideo._id, { isActive: false });
    }

    // Activate the target video
    await ctx.db.patch(input.id, { isActive: true });

    return { success: true };
  },
});