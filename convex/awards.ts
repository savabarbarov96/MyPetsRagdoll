import { requireAdmin, findAdminSession } from "./lib/admin";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all awards (admin use)
export const getAllAwards = query({
  args: { sessionId: v.string(),},
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db
      .query("awards")
      .order("desc")
      .collect();
  },
});

// Get published awards for public display
export const getPublishedAwards = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("best_in_show"), 
      v.literal("championship"), 
      v.literal("cattery_recognition"),
      v.literal("breeding_award"),
      v.literal("other"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("awards")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc");

    let awards = await query.collect();

    // Filter by category if specified
    if (args.category && args.category !== "all") {
      awards = awards.filter(award => award.category === args.category);
    }

    // Sort by award date descending, then by sort order
    awards.sort((a, b) => {
      // First sort by award date (most recent first)
      if (b.awardDate !== a.awardDate) {
        return b.awardDate - a.awardDate;
      }
      // Then by sort order (ascending)
      return a.sortOrder - b.sortOrder;
    });

    // Apply limit if specified
    if (args.limit) {
      awards = awards.slice(0, args.limit);
    }

    return awards;
  },
});

// Get awards by category
export const getAwardsByCategory = query({
  args: {
    category: v.union(
      v.literal("best_in_show"), 
      v.literal("championship"), 
      v.literal("cattery_recognition"),
      v.literal("breeding_award"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("awards")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .collect();
  },
});

// Get single award by ID
export const getAwardById = query({
  args: { sessionId: v.optional(v.string()), id: v.id("awards") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    return record && (record.isPublished || await findAdminSession(ctx, args.sessionId)) ? record : null;
  },
});

// Get awards associated with a specific cat
export const getAwardsByCat = query({
  args: { catId: v.id("cats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("awards")
      .withIndex("by_cat", (q) => q.eq("associatedCatId", args.catId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .collect();
  },
});

// Create new award
export const createAward = mutation({
  args: { sessionId: v.string(),
    title: v.string(),
    description: v.string(),
    awardDate: v.number(),
    awardingOrganization: v.string(),
    category: v.union(
      v.literal("best_in_show"), 
      v.literal("championship"), 
      v.literal("cattery_recognition"),
      v.literal("breeding_award"),
      v.literal("other")
    ),
    certificateImage: v.string(),
    galleryImages: v.optional(v.array(v.string())),
    associatedCatId: v.optional(v.id("cats")),
    achievements: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    // Get the highest sort order and add 1
    const awards = await ctx.db.query("awards").collect();
    const maxSortOrder = Math.max(...awards.map(a => a.sortOrder), 0);

    return await ctx.db.insert("awards", {
      title: input.title,
      description: input.description,
      awardDate: input.awardDate,
      awardingOrganization: input.awardingOrganization,
      category: input.category,
      certificateImage: input.certificateImage,
      galleryImages: input.galleryImages || [],
      associatedCatId: input.associatedCatId,
      isPublished: false, // Default to unpublished
      sortOrder: maxSortOrder + 1,
      achievements: input.achievements,
      updatedAt: Date.now(),
    });
  },
});

// Update award
export const updateAward = mutation({
  args: { sessionId: v.string(),
    id: v.id("awards"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    awardDate: v.optional(v.number()),
    awardingOrganization: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("best_in_show"), 
      v.literal("championship"), 
      v.literal("cattery_recognition"),
      v.literal("breeding_award"),
      v.literal("other")
    )),
    certificateImage: v.optional(v.string()),
    galleryImages: v.optional(v.array(v.string())),
    associatedCatId: v.optional(v.id("cats")),
    achievements: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const { id, ...updates } = input;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      cleanUpdates.updatedAt = Date.now();
    }

    return await ctx.db.patch(id, cleanUpdates);
  },
});

// Toggle award publication status
export const toggleAwardPublication = mutation({
  args: { sessionId: v.string(), id: v.id("awards") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const award = await ctx.db.get(input.id);
    if (!award) {
      throw new Error("Award not found");
    }

    await ctx.db.patch(input.id, {
      isPublished: !award.isPublished,
      updatedAt: Date.now(),
    });

    return !award.isPublished;
  },
});

// Delete award
export const deleteAward = mutation({
  args: { sessionId: v.string(), id: v.id("awards") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db.delete(input.id);
  },
});

// Update sort order
export const updateSortOrder = mutation({
  args: { sessionId: v.string(),
    id: v.id("awards"),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db.patch(input.id, {
      sortOrder: input.sortOrder,
      updatedAt: Date.now(),
    });
  },
});

// Get award categories with counts
export const getAwardCategoriesWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const awards = await ctx.db
      .query("awards")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    const categoryCounts = awards.reduce((acc, award) => {
      acc[award.category] = (acc[award.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categories = [
      { key: "all", label: "Всички", count: awards.length },
      { key: "best_in_show", label: "Най-добър от изложбата", count: categoryCounts.best_in_show || 0 },
      { key: "championship", label: "Шампионат", count: categoryCounts.championship || 0 },
      { key: "cattery_recognition", label: "Признание за развъдник", count: categoryCounts.cattery_recognition || 0 },
      { key: "breeding_award", label: "Награда за развъждане", count: categoryCounts.breeding_award || 0 },
      { key: "other", label: "Други", count: categoryCounts.other || 0 },
    ];

    return categories;
  },
});