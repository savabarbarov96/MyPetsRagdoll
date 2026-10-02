import { publicCat } from "./lib/publicCat";
import { requireAdmin, findAdminSession } from "./lib/admin";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get all cats
export const getAllCats = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db.query("cats").collect();
  },
});

// Get displayed cats only
export const getDisplayedCats = query({
  handler: async (ctx) => {
    return (await ctx.db
      .query("cats")
      .withIndex("by_displayed", (q) => q.eq("isDisplayed", true))
      .collect()).map(publicCat);
  },
});

// Get cat by ID
export const getCatById = query({
  args: { sessionId: v.optional(v.string()), id: v.optional(v.id("cats")) },
  handler: async (ctx, args) => {
    // Return null if no id provided
    if (!args.id) {
      return null;
    }
    const record = await ctx.db.get(args.id!);
    if (!record) return null;
    const admin = await findAdminSession(ctx, args.sessionId);
    return record.isDisplayed || admin ? (admin ? record : publicCat(record)) : null;
  },
});

// Optimized search cats by various criteria using indexes
export const searchCats = query({
  args: { sessionId: v.string(),
    searchTerm: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    isDisplayed: v.optional(v.boolean()),
    category: v.optional(v.union(v.literal("kitten"), v.literal("adult"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const limit = input.limit || 100; // Default limit to prevent large responses
    
    // Use indexed queries when possible for better performance
    let cats;
    
    if (input.gender && input.isDisplayed !== undefined) {
      // Use compound index if available, otherwise filter
      if (input.isDisplayed) {
        cats = await ctx.db
          .query("cats")
          .withIndex("by_displayed", (q) => q.eq("isDisplayed", true))
          .filter((q) => q.eq(q.field("gender"), input.gender!))
          .take(limit);
      } else {
        cats = await ctx.db
          .query("cats")
          .withIndex("by_gender", (q) => q.eq("gender", input.gender!))
          .filter((q) => q.eq(q.field("isDisplayed"), false))
          .take(limit);
      }
    } else if (input.gender) {
      cats = await ctx.db
        .query("cats")
        .withIndex("by_gender", (q) => q.eq("gender", input.gender!))
        .take(limit);
    } else if (input.isDisplayed !== undefined) {
      cats = await ctx.db
        .query("cats")
        .withIndex("by_displayed", (q) => q.eq("isDisplayed", input.isDisplayed!))
        .take(limit);
    } else if (input.category && input.category !== "all") {
      cats = await ctx.db
        .query("cats")
        .withIndex("by_category", (q) => q.eq("category", input.category))
        .take(limit);
    } else {
      cats = await ctx.db.query("cats").take(limit);
    }

    // Apply search term filter if provided (this is done post-query for text search)
    if (input.searchTerm) {
      const term = input.searchTerm.toLowerCase();
      cats = cats.filter(cat => 
        cat.name.toLowerCase().includes(term) ||
        cat.subtitle.toLowerCase().includes(term) ||
        cat.color.toLowerCase().includes(term) ||
        cat.registrationNumber?.toLowerCase().includes(term) ||
        cat.description.toLowerCase().includes(term)
      );
    }

    return cats;
  },
});

// Create a new cat
export const createCat = mutation({
  args: { sessionId: v.string(),
    name: v.string(),
    subtitle: v.string(),
    image: v.string(),
    description: v.string(),
    age: v.string(),
    color: v.string(),
    status: v.string(),
    gallery: v.array(v.string()),
    gender: v.union(v.literal("male"), v.literal("female")),
    birthDate: v.string(),
    registrationNumber: v.optional(v.string()),
    isDisplayed: v.optional(v.boolean()),
    freeText: v.optional(v.string()),
    // Internal notes field (not displayed publicly)
    internalNotes: v.optional(v.string()),
    // New fields for gallery filtering
    category: v.optional(v.union(v.literal("kitten"), v.literal("adult"), v.literal("all"))),
    // Breed field
    breed: v.optional(v.union(v.literal("ragdoll"), v.literal("british"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const catId = await ctx.db.insert("cats", {
      ...input,
      isDisplayed: input.isDisplayed ?? true,
      breed: input.breed ?? "ragdoll",
    });
    return catId;
  },
});

// Update an existing cat
export const updateCat = mutation({
  args: { sessionId: v.string(),
    id: v.id("cats"),
    name: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    age: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    birthDate: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    isDisplayed: v.optional(v.boolean()),
    freeText: v.optional(v.string()),
    // Internal notes field (not displayed publicly)
    internalNotes: v.optional(v.string()),
    // New fields for gallery filtering
    category: v.optional(v.union(v.literal("kitten"), v.literal("adult"), v.literal("all"))),
    // Breed field
    breed: v.optional(v.union(v.literal("ragdoll"), v.literal("british"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const { id, ...updates } = input;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

// Delete a cat
export const deleteCat = mutation({
  args: { sessionId: v.string(), id: v.id("cats") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    // First, remove all pedigree connections involving this cat
    const parentConnections = await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_parent", (q) => q.eq("parentId", input.id))
      .collect();
    
    const childConnections = await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_child", (q) => q.eq("childId", input.id))
      .collect();

    // Delete all connections
    for (const connection of [...parentConnections, ...childConnections]) {
      await ctx.db.delete(connection._id);
    }

    // Delete any pedigree trees rooted at this cat
    const pedigreeTrees = await ctx.db
      .query("pedigreeTrees")
      .withIndex("by_root_cat", (q) => q.eq("rootCatId", input.id))
      .collect();

    for (const tree of pedigreeTrees) {
      await ctx.db.delete(tree._id);
    }

    // Finally, delete the cat
    await ctx.db.delete(input.id);
    return { success: true };
  },
});

// Toggle cat display status
export const toggleCatDisplay = mutation({
  args: { sessionId: v.string(), id: v.id("cats") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const cat = await ctx.db.get(input.id);
    if (!cat) {
      throw new Error("Cat not found");
    }

    await ctx.db.patch(input.id, { isDisplayed: !cat.isDisplayed });
    return await ctx.db.get(input.id);
  },
});

// Bulk update display status
export const bulkUpdateDisplay = mutation({
  args: { sessionId: v.string(),
    catIds: v.array(v.id("cats")),
    isDisplayed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const results = [];
    
    for (const catId of input.catIds) {
      await ctx.db.patch(catId, { isDisplayed: input.isDisplayed });
      const updatedCat = await ctx.db.get(catId);
      results.push(updatedCat);
    }
    
    return results;
  },
});

// Get cats by gender for breeding purposes
export const getCatsByGender = query({
  args: { sessionId: v.string(), gender: v.union(v.literal("male"), v.literal("female")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db
      .query("cats")
      .withIndex("by_gender", (q) => q.eq("gender", input.gender))
      .collect();
  },
});

// Get recent cats (last 10 added)
export const getRecentCats = query({
  args: { sessionId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const limit = input.limit || 10;
    return await ctx.db
      .query("cats")
      .order("desc")
      .take(limit);
  },
});

// Optimized cat statistics using indexed queries
export const getCatStatistics = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    // Use Promise.all to run queries in parallel for better performance
    const [allCatsCount, displayedCats, males, females] = await Promise.all([
      ctx.db.query("cats").collect().then(cats => cats.length),
      ctx.db.query("cats").withIndex("by_displayed", (q) => q.eq("isDisplayed", true)).collect(),
      ctx.db.query("cats").withIndex("by_gender", (q) => q.eq("gender", "male")).collect(),
      ctx.db.query("cats").withIndex("by_gender", (q) => q.eq("gender", "female")).collect()
    ]);

    // Calculate average age only from displayed cats to avoid fetching all cat data
    const averageAge = displayedCats.length > 0 ? 
      displayedCats.reduce((sum, cat) => {
        const age = parseFloat(cat.age) || 0;
        return sum + age;
      }, 0) / displayedCats.length : 0;

    return {
      total: allCatsCount,
      displayed: displayedCats.length,
      hidden: allCatsCount - displayedCats.length,
      males: males.length,
      females: females.length,
      averageAge: Math.round(averageAge * 100) / 100 // Round to 2 decimal places
    };
  },
});

// Get cats by category for gallery filtering
export const getCatsByCategory = query({
  args: { sessionId: v.string(), category: v.union(v.literal("kitten"), v.literal("adult"), v.literal("all")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    if (input.category === "all") {
      return await ctx.db.query("cats").collect();
    }
    
    return await ctx.db
      .query("cats")
      .withIndex("by_category", (q) => q.eq("category", input.category))
      .collect();
  },
});

// Optimized displayed cats by category using compound index
export const getDisplayedCatsByCategory = query({
  args: { 
    category: v.union(v.literal("kitten"), v.literal("adult"), v.literal("all")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50; // Default limit for performance
    
    if (args.category === "all") {
      return (await ctx.db
        .query("cats")
        .withIndex("by_displayed", (q) => q.eq("isDisplayed", true))
        .take(limit)).map(publicCat);
    }
    
    // Try to use compound index first for better performance
    const catsFromIndex = await ctx.db
      .query("cats")
      .withIndex("by_category_displayed", (q) => 
        q.eq("category", args.category).eq("isDisplayed", true)
      )
      .take(limit);
    
    // If we have enough results from the index, return them
    if (catsFromIndex.length >= Math.min(limit, 10)) {
      return catsFromIndex.map(publicCat);
    }
    
    // Fallback to age-based calculation for cats without category set
    const allDisplayedCats = await ctx.db
      .query("cats")
      .withIndex("by_displayed", (q) => q.eq("isDisplayed", true))
      .take(limit * 2); // Get more to account for filtering
    
    const currentDate = new Date();
    
    const filteredCats = allDisplayedCats.filter(cat => {
      // First check if category is explicitly set
      if (cat.category === args.category) {
        return true;
      }
      
      // Fallback to age-based calculation
      if (cat.birthDate) {
        const birthDate = new Date(cat.birthDate);
        const ageInYears = (currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (args.category === "kitten") {
          return ageInYears < 1 && !cat.category; // Only if category not set
        } else if (args.category === "adult") {
          return ageInYears >= 1 && !cat.category; // Only if category not set
        }
      }
      
      return false;
    });
    
    // Combine results and remove duplicates
    const combinedResults = [...catsFromIndex];
    filteredCats.forEach(cat => {
      if (!combinedResults.some(existing => existing._id === cat._id)) {
        combinedResults.push(cat);
      }
    });
    
    return combinedResults.slice(0, limit).map(publicCat);
  },
});

// Get displayed cats by gender and age for the new three-section layout
// Excludes British cats (they show on /british page)
export const getDisplayedCatsByGenderAndAge = query({
  args: {
    section: v.union(v.literal("male"), v.literal("female"), v.literal("kitten"))
  },
  handler: async (ctx, args) => {
    const allDisplayedCats = await ctx.db
      .query("cats")
      .withIndex("by_displayed", (q) => q.eq("isDisplayed", true))
      .collect();

    const currentDate = new Date();

    return allDisplayedCats.filter(cat => {
      // Exclude British cats from the Ragdoll homepage
      if (cat.breed === "british") return false;

      // Explicit category takes priority over age calculation
      const isExplicitKitten = cat.category === "kitten";
      const isExplicitAdult = cat.category === "adult";

      // Only use age calculation when category is not explicitly set
      let isKittenByAge = false;
      if (!isExplicitKitten && !isExplicitAdult && cat.birthDate) {
        const birthDate = new Date(cat.birthDate);
        const ageInYears = (currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        isKittenByAge = ageInYears < 1;
      }

      const isKitten = isExplicitKitten || (!isExplicitAdult && isKittenByAge);

      switch (args.section) {
        case "kitten":
          return isKitten;
        case "male":
          return cat.gender === "male" && !isKitten;
        case "female":
          return cat.gender === "female" && !isKitten;
        default:
          return false;
      }
    }).map(publicCat);
  },
});

// Get displayed cats by breed, gender and age — for breed-specific pages (e.g. /british)
export const getDisplayedCatsByBreedGenderAndAge = query({
  args: {
    section: v.union(v.literal("male"), v.literal("female"), v.literal("kitten")),
    breed: v.union(v.literal("ragdoll"), v.literal("british")),
  },
  handler: async (ctx, args) => {
    const breedCats = await ctx.db
      .query("cats")
      .withIndex("by_breed_displayed", (q) => q.eq("breed", args.breed).eq("isDisplayed", true))
      .collect();

    const currentDate = new Date();

    return breedCats.filter(cat => {
      // Explicit category takes priority over age calculation
      const isExplicitKitten = cat.category === "kitten";
      const isExplicitAdult = cat.category === "adult";

      // Only use age calculation when category is not explicitly set
      let isKittenByAge = false;
      if (!isExplicitKitten && !isExplicitAdult && cat.birthDate) {
        const birthDate = new Date(cat.birthDate);
        const ageInYears = (currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        isKittenByAge = ageInYears < 1;
      }

      const isKitten = isExplicitKitten || (!isExplicitAdult && isKittenByAge);

      switch (args.section) {
        case "kitten":
          return isKitten;
        case "male":
          return cat.gender === "male" && !isKitten;
        case "female":
          return cat.gender === "female" && !isKitten;
        default:
          return false;
      }
    }).map(publicCat);
  },
});

// Get all cats by breed (for admin)
export const getCatsByBreed = query({
  args: { sessionId: v.string(), breed: v.union(v.literal("ragdoll"), v.literal("british")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db
      .query("cats")
      .withIndex("by_breed", (q) => q.eq("breed", input.breed))
      .collect();
  },
});

// Migration: backfill existing cats with breed: "ragdoll"
export const migrateExistingCatsToRagdoll = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const allCats = await ctx.db.query("cats").collect();
    let migrated = 0;
    for (const cat of allCats) {
      if (!cat.breed) {
        await ctx.db.patch(cat._id, { breed: "ragdoll" });
        migrated++;
      }
    }
    return { migrated, total: allCats.length };
  },
});

// Bulk update category for existing cats (optimized)
export const bulkUpdateCategory = mutation({
  args: { sessionId: v.string(),
    catIds: v.array(v.id("cats")),
    category: v.optional(v.union(v.literal("kitten"), v.literal("adult"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    // Use Promise.all for parallel updates
    const updatePromises = input.catIds.map(catId =>
      ctx.db.patch(catId, { category: input.category })
    );
    
    await Promise.all(updatePromises);
    
    // Fetch updated cats in parallel
    const fetchPromises = input.catIds.map(catId => ctx.db.get(catId));
    const results = await Promise.all(fetchPromises);
    
    return results.filter(cat => cat !== null);
  },
});

// Paginated cats query for better performance on large datasets
export const getPaginatedCats = query({
  args: { sessionId: v.string(),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null())
    }),
    filters: v.optional(v.object({
      isDisplayed: v.optional(v.boolean()),
      gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
      category: v.optional(v.union(v.literal("kitten"), v.literal("adult"), v.literal("all")))
    }))
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    // Apply filters using indexes when possible
    if (input.filters?.isDisplayed !== undefined) {
      return await ctx.db
        .query("cats")
        .withIndex("by_displayed", (q) => 
          q.eq("isDisplayed", input.filters!.isDisplayed!)
        )
        .paginate(input.paginationOpts);
    } else if (input.filters?.gender) {
      return await ctx.db
        .query("cats")
        .withIndex("by_gender", (q) => 
          q.eq("gender", input.filters!.gender!)
        )
        .paginate(input.paginationOpts);
    } else if (input.filters?.category && input.filters.category !== "all") {
      return await ctx.db
        .query("cats")
        .withIndex("by_category", (q) => 
          q.eq("category", input.filters!.category!)
        )
        .paginate(input.paginationOpts);
    }
    
    return await ctx.db.query("cats").paginate(input.paginationOpts);
  },
});

// Get cats with minimal data for performance-critical lists
export const getCatsMinimal = query({
  args: {
    isDisplayed: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(100, Math.max(1, args.limit || 20));
    
    const cats = await ctx.db.query("cats").withIndex("by_displayed", q => q.eq("isDisplayed", true)).take(limit);

    // Return only essential fields for performance
    return cats.map(cat => ({
      _id: cat._id,
      name: cat.name,
      subtitle: cat.subtitle,
      image: cat.image,
      gender: cat.gender,
      isDisplayed: cat.isDisplayed,
      category: cat.category
    }));
  },
}); 