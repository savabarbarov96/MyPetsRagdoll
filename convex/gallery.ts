import { requireAdmin } from "./lib/admin";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all published gallery items
export const getPublishedGalleryItems = query({
  args: { category: v.optional(v.union(v.literal("award"), v.literal("certificate"), v.literal("photo"), v.literal("trophy"), v.literal("achievement"))) },
  handler: async (ctx, args) => {
    let items;
    
    if (args.category) {
      // Query by specific category - TypeScript now knows args.category is defined
      const category = args.category; // Extract to ensure type safety
      items = await ctx.db
        .query("gallery")
        .withIndex("by_published_category", (q) => 
          q.eq("isPublished", true).eq("category", category)
        )
        .order("desc")
        .collect();
    } else {
      // Query all published items
      items = await ctx.db
        .query("gallery")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .order("desc")
        .collect();
    }

    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Query to get all gallery items (for admin)
export const getAllGalleryItems = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db
      .query("gallery")
      .order("desc")
      .collect();
  },
});

// Query to get gallery categories with counts
export const getGalleryCategoriesWithCounts = query({
  handler: async (ctx) => {
    const allItems = await ctx.db
      .query("gallery")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    const categoryCounts = allItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categories = [
      { key: "all", label: "Всички", count: allItems.length },
      { key: "award", label: "Награди", count: categoryCounts.award || 0 },
      { key: "certificate", label: "Сертификати", count: categoryCounts.certificate || 0 },
      { key: "photo", label: "Снимки", count: categoryCounts.photo || 0 },
      { key: "trophy", label: "Трофеи", count: categoryCounts.trophy || 0 },
      { key: "achievement", label: "Постижения", count: categoryCounts.achievement || 0 },
    ];

    return categories.filter(cat => cat.key === "all" || cat.count > 0);
  },
});

// Mutation to create a new gallery item
export const createGalleryItem = mutation({
  args: { sessionId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    category: v.union(v.literal("award"), v.literal("certificate"), v.literal("photo"), v.literal("trophy"), v.literal("achievement")),
    date: v.optional(v.string()),
    associatedCatId: v.optional(v.id("cats")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    // Get the highest sort order and add 1
    const existingItems = await ctx.db.query("gallery").collect();
    const maxSortOrder = Math.max(0, ...existingItems.map(item => item.sortOrder));

    return await ctx.db.insert("gallery", {
      ...input,
      isPublished: true,
      sortOrder: maxSortOrder + 1,
      uploadedAt: Date.now(),
    });
  },
});

// Mutation to update a gallery item
export const updateGalleryItem = mutation({
  args: { sessionId: v.string(),
    id: v.id("gallery"),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    category: v.union(v.literal("award"), v.literal("certificate"), v.literal("photo"), v.literal("trophy"), v.literal("achievement")),
    date: v.optional(v.string()),
    associatedCatId: v.optional(v.id("cats")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const { id, ...updateData } = input;
    return await ctx.db.patch(id, updateData);
  },
});

// Mutation to toggle publication status
export const toggleGalleryItemPublication = mutation({
  args: { sessionId: v.string(), id: v.id("gallery") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const item = await ctx.db.get(input.id);
    if (!item) throw new Error("Gallery item not found");

    return await ctx.db.patch(input.id, {
      isPublished: !item.isPublished,
    });
  },
});

// Mutation to delete a gallery item
export const deleteGalleryItem = mutation({
  args: { sessionId: v.string(), id: v.id("gallery") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db.delete(input.id);
  },
});

// Mutation to update sort order
export const updateGalleryItemSortOrder = mutation({
  args: { sessionId: v.string(),
    id: v.id("gallery"),
    newSortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db.patch(input.id, {
      sortOrder: input.newSortOrder,
    });
  },
});