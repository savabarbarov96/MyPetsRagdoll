import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get all announcements
export const getAllAnnouncements = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_sort_order", (q) => q.gt("sortOrder", -1))
      .collect();
  },
});

// Get published announcements only (for public site)
export const getPublishedAnnouncements = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

// Get latest published announcements with limit and optional fields
export const getLatestAnnouncements = query({
  args: {
    limit: v.optional(v.number()),
    includeContent: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 3;
    const includeContent = args.includeContent ?? true;

    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .take(limit);

    // For performance, optionally exclude content field for list views
    if (!includeContent) {
      return announcements.map(announcement => ({
        _id: announcement._id,
        title: announcement.title,
        featuredImage: announcement.featuredImage,
        publishedAt: announcement.publishedAt,
        slug: announcement.slug,
        metaDescription: announcement.metaDescription,
        updatedAt: announcement.updatedAt,
        sortOrder: announcement.sortOrder
      }));
    }

    return announcements;
  },
});

// Get announcement by ID
export const getAnnouncementById = query({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get announcement by slug (for SEO-friendly URLs)
export const getAnnouncementBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .first();
  },
});

// Generate unique slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim(); // Remove leading/trailing whitespace
};

// Create new announcement
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    featuredImage: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),
    isPublished: v.boolean(),
    sortOrder: v.number(),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate unique slug
    const baseSlug = generateSlug(args.title);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await ctx.db
      .query("announcements")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first()
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return await ctx.db.insert("announcements", {
      ...args,
      slug,
      publishedAt: args.isPublished ? now : 0,
      updatedAt: now,
    });
  },
});

// Update announcement
export const updateAnnouncement = mutation({
  args: {
    id: v.id("announcements"),
    title: v.string(),
    content: v.string(),
    featuredImage: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),
    isPublished: v.boolean(),
    sortOrder: v.number(),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    const existing = await ctx.db.get(id);

    if (!existing) {
      throw new Error("Announcement not found");
    }

    const now = Date.now();
    const updatePayload: typeof updateData & { slug?: string } = { ...updateData };

    // Update slug if title changed
    if (updateData.title !== existing.title) {
      const baseSlug = generateSlug(updateData.title);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug is unique (excluding current record)
      while (true) {
        const existingWithSlug = await ctx.db
          .query("announcements")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();

        if (!existingWithSlug || existingWithSlug._id === id) {
          break;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      updatePayload.slug = slug;
    }

    return await ctx.db.patch(id, {
      ...updatePayload,
      publishedAt: updateData.isPublished ? (existing.publishedAt || now) : 0,
      updatedAt: now,
    });
  },
});

// Delete announcement
export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Toggle publication status
export const toggleAnnouncementPublication = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);

    if (!announcement) {
      throw new Error("Announcement not found");
    }

    const now = Date.now();
    const isPublished = !announcement.isPublished;

    return await ctx.db.patch(args.id, {
      isPublished,
      publishedAt: isPublished ? (announcement.publishedAt || now) : 0,
      updatedAt: now,
    });
  },
});

// Update sort order for multiple announcements (optimized with batching)
export const updateSortOrder = mutation({
  args: { updates: v.array(v.object({ id: v.id("announcements"), sortOrder: v.number() })) },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Batch updates for better performance
    const promises = args.updates.map(({ id, sortOrder }) =>
      ctx.db.patch(id, { sortOrder, updatedAt: now })
    );

    return await Promise.all(promises);
  },
});

// Paginated announcements query for admin panel
export const getPaginatedAnnouncements = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null())
    }),
    publishedOnly: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    if (args.publishedOnly) {
      return await ctx.db
        .query("announcements")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .paginate(args.paginationOpts);
    } else {
      return await ctx.db
        .query("announcements")
        .withIndex("by_sort_order", (q) => q.gt("sortOrder", -1))
        .paginate(args.paginationOpts);
    }
  },
});

// Get announcement summaries (for performance-critical list views)
export const getAnnouncementSummaries = query({
  args: {
    limit: v.optional(v.number()),
    publishedOnly: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    let announcements;

    if (args.publishedOnly) {
      announcements = await ctx.db
        .query("announcements")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .order("desc")
        .take(limit);
    } else {
      announcements = await ctx.db
        .query("announcements")
        .order("desc")
        .take(limit);
    }

    // Return minimal data for list performance
    return announcements.map(announcement => ({
      _id: announcement._id,
      title: announcement.title,
      featuredImage: announcement.featuredImage,
      isPublished: announcement.isPublished,
      publishedAt: announcement.publishedAt,
      slug: announcement.slug,
      metaDescription: announcement.metaDescription,
      sortOrder: announcement.sortOrder
    }));
  },
});

