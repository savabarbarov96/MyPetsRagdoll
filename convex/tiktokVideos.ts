import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all TikTok videos
export const getAllVideos = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tiktokVideos")
      .withIndex("by_sort_order")
      .collect();
  },
});

// Get active videos
export const getActiveVideos = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tiktokVideos")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get videos for a specific cat
export const getVideosByCat = query({
  args: { catId: v.optional(v.id("cats")) },
  handler: async (ctx, args) => {
    // Return empty array if no catId provided
    if (!args.catId) {
      return [];
    }
    return await ctx.db
      .query("tiktokVideos")
      .withIndex("by_cat_active", (q) => q.eq("catId", args.catId!).eq("isActive", true))
      .collect();
  },
});

// Get global videos (not associated with any cat)
export const getGlobalVideos = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tiktokVideos")
      .withIndex("by_cat_active", (q) => q.eq("catId", undefined).eq("isActive", true))
      .collect();
  },
});

// Get videos for main TikTok section (cat-specific + global fallback)
export const getVideosForMainSection = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;
    
    // First, get videos associated with cats
    const catVideos = await ctx.db
      .query("tiktokVideos")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => q.neq(q.field("catId"), undefined))
      .order("desc")
      .take(limit);

    // If we don't have enough cat videos, fill with global videos
    if (catVideos.length < limit) {
      const remaining = limit - catVideos.length;
      const globalVideos = await ctx.db
        .query("tiktokVideos")
        .withIndex("by_cat_active", (q) => q.eq("catId", undefined).eq("isActive", true))
        .order("desc")
        .take(remaining);
      
      return [...catVideos, ...globalVideos];
    }

    return catVideos;
  },
});

// Get video by ID
export const getVideoById = query({
  args: { id: v.optional(v.id("tiktokVideos")) },
  handler: async (ctx, args) => {
    // Return null if no id provided
    if (!args.id) {
      return null;
    }
    return await ctx.db.get(args.id!);
  },
});

// Create new TikTok video
export const createVideo = mutation({
  args: {
    catId: v.optional(v.id("cats")),
    videoUrl: v.string(),
    embedId: v.optional(v.string()),
    thumbnail: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    hashtags: v.array(v.string()),
    viewCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get the highest sort order and increment
    const lastVideo = await ctx.db
      .query("tiktokVideos")
      .withIndex("by_sort_order")
      .order("desc")
      .first();

    const sortOrder = lastVideo ? lastVideo.sortOrder + 1 : 1;

    const videoId = await ctx.db.insert("tiktokVideos", {
      ...args,
      isActive: args.isActive ?? true,
      sortOrder,
    });

    return await ctx.db.get(videoId);
  },
});

// Update TikTok video
export const updateVideo = mutation({
  args: {
    id: v.id("tiktokVideos"),
    catId: v.optional(v.id("cats")),
    videoUrl: v.optional(v.string()),
    embedId: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    viewCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

// Delete TikTok video
export const deleteVideo = mutation({
  args: { id: v.id("tiktokVideos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Toggle video active status
export const toggleVideoActive = mutation({
  args: { id: v.id("tiktokVideos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.id);
    if (!video) {
      throw new Error("Video not found");
    }

    await ctx.db.patch(args.id, { isActive: !video.isActive });
    return await ctx.db.get(args.id);
  },
});

// Bulk update video order
export const updateVideoOrder = mutation({
  args: {
    videoIds: v.array(v.id("tiktokVideos")),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (let i = 0; i < args.videoIds.length; i++) {
      const videoId = args.videoIds[i];
      await ctx.db.patch(videoId, { sortOrder: i + 1 });
      const updatedVideo = await ctx.db.get(videoId);
      results.push(updatedVideo);
    }
    
    return results;
  },
});

// Get video statistics
export const getVideoStatistics = query({
  handler: async (ctx) => {
    const allVideos = await ctx.db.query("tiktokVideos").collect();
    const activeVideos = allVideos.filter(v => v.isActive);
    const catVideos = allVideos.filter(v => v.catId);
    const globalVideos = allVideos.filter(v => !v.catId);
    
    const totalViews = allVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
    const totalLikes = allVideos.reduce((sum, v) => sum + (v.likeCount || 0), 0);

    return {
      total: allVideos.length,
      active: activeVideos.length,
      inactive: allVideos.length - activeVideos.length,
      catSpecific: catVideos.length,
      global: globalVideos.length,
      totalViews,
      totalLikes,
    };
  },
});