import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get all cats
export const getAllCats = query({
  handler: async (ctx) => {
    return await ctx.db.query("cats").collect();
  },
});

// Get displayed cats only
export const getDisplayedCats = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("cats")
      .withIndex("by_displayed", (q) => q.eq("isDisplayed", true))
      .collect();
  },
});

// Get cat by ID
export const getCatById = query({
  args: { id: v.optional(v.id("cats")) },
  handler: async (ctx, args) => {
    // Return null if no id provided
    if (!args.id) {
      return null;
    }
    return await ctx.db.get(args.id!);
  },
});

// Optimized search cats by various criteria using indexes
export const searchCats = query({
  args: {
    searchTerm: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    isDisplayed: v.optional(v.boolean()),
    category: v.optional(v.union(v.literal("kitten"), v.literal("adult"), v.literal("all"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100; // Default limit to prevent large responses
    
    // Use indexed queries when possible for better performance
    let cats;
    
    if (args.gender && args.isDisplayed !== undefined) {
      // Use compound index if available, otherwise filter
      if (args.isDisplayed) {
        cats = await ctx.db
          .query("cats")
          .withIndex("by_displayed", (q) => q.eq("isDisplayed", true))
          .filter((q) => q.eq(q.field("gender"), args.gender!))
          .take(limit);
      } else {
        cats = await ctx.db
          .query("cats")
          .withIndex("by_gender", (q) => q.eq("gender", args.gender!))
          .filter((q) => q.eq(q.field("isDisplayed"), false))
          .take(limit);
      }
    } else if (args.gender) {
      cats = await ctx.db
        .query("cats")
        .withIndex("by_gender", (q) => q.eq("gender", args.gender!))
        .take(limit);
    } else if (args.isDisplayed !== undefined) {
      cats = await ctx.db
        .query("cats")
        .withIndex("by_displayed", (q) => q.eq("isDisplayed", args.isDisplayed!))
        .take(limit);
    } else if (args.category && args.category !== "all") {
      cats = await ctx.db
        .query("cats")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .take(limit);
    } else {
      cats = await ctx.db.query("cats").take(limit);
    }

    // Apply search term filter if provided (this is done post-query for text search)
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
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
  args: {
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
  },
  handler: async (ctx, args) => {
    const catId = await ctx.db.insert("cats", {
      ...args,
      isDisplayed: args.isDisplayed ?? true,
    });
    return catId;
  },
});

// Update an existing cat
export const updateCat = mutation({
  args: {
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

// Delete a cat
export const deleteCat = mutation({
  args: { id: v.id("cats") },
  handler: async (ctx, args) => {
    // First, remove all pedigree connections involving this cat
    const parentConnections = await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect();
    
    const childConnections = await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_child", (q) => q.eq("childId", args.id))
      .collect();

    // Delete all connections
    for (const connection of [...parentConnections, ...childConnections]) {
      await ctx.db.delete(connection._id);
    }

    // Delete any pedigree trees rooted at this cat
    const pedigreeTrees = await ctx.db
      .query("pedigreeTrees")
      .withIndex("by_root_cat", (q) => q.eq("rootCatId", args.id))
      .collect();

    for (const tree of pedigreeTrees) {
      await ctx.db.delete(tree._id);
    }

    // Finally, delete the cat
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Toggle cat display status
export const toggleCatDisplay = mutation({
  args: { id: v.id("cats") },
  handler: async (ctx, args) => {
    const cat = await ctx.db.get(args.id);
    if (!cat) {
      throw new Error("Cat not found");
    }

    await ctx.db.patch(args.id, { isDisplayed: !cat.isDisplayed });
    return await ctx.db.get(args.id);
  },
});

// Bulk update display status
export const bulkUpdateDisplay = mutation({
  args: {
    catIds: v.array(v.id("cats")),
    isDisplayed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const catId of args.catIds) {
      await ctx.db.patch(catId, { isDisplayed: args.isDisplayed });
      const updatedCat = await ctx.db.get(catId);
      results.push(updatedCat);
    }
    
    return results;
  },
});

// Get cats by gender for breeding purposes
export const getCatsByGender = query({
  args: { gender: v.union(v.literal("male"), v.literal("female")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cats")
      .withIndex("by_gender", (q) => q.eq("gender", args.gender))
      .collect();
  },
});

// Get recent cats (last 10 added)
export const getRecentCats = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("cats")
      .order("desc")
      .take(limit);
  },
});

// Optimized cat statistics using indexed queries
export const getCatStatistics = query({
  handler: async (ctx) => {
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
  args: { category: v.union(v.literal("kitten"), v.literal("adult"), v.literal("all")) },
  handler: async (ctx, args) => {
    if (args.category === "all") {
      return await ctx.db.query("cats").collect();
    }
    
    return await ctx.db
      .query("cats")
      .withIndex("by_category", (q) => q.eq("category", args.category))
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
      return await ctx.db
        .query("cats")
        .withIndex("by_displayed", (q) => q.eq("isDisplayed", true))
        .take(limit);
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
      return catsFromIndex;
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
    
    return combinedResults.slice(0, limit);
  },
});

// Get displayed cats by gender and age for the new three-section layout
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
      // Calculate age first
      let ageInYears = 0;
      if (cat.birthDate) {
        const birthDate = new Date(cat.birthDate);
        ageInYears = (currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      }
      
      switch (args.section) {
        case "kitten":
          // Kittens: all cats below 1 year (both genders)
          return ageInYears < 1 || (!cat.birthDate && cat.category === "kitten");
        case "male":
          // Males: male cats 1 year and older
          return cat.gender === "male" && (ageInYears >= 1 || (!cat.birthDate && cat.category !== "kitten"));
        case "female":
          // Females: female cats 1 year and older
          return cat.gender === "female" && (ageInYears >= 1 || (!cat.birthDate && cat.category !== "kitten"));
        default:
          return false;
      }
    });
  },
});

// Bulk update category for existing cats (optimized)
export const bulkUpdateCategory = mutation({
  args: {
    catIds: v.array(v.id("cats")),
    category: v.optional(v.union(v.literal("kitten"), v.literal("adult"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    // Use Promise.all for parallel updates
    const updatePromises = args.catIds.map(catId => 
      ctx.db.patch(catId, { category: args.category })
    );
    
    await Promise.all(updatePromises);
    
    // Fetch updated cats in parallel
    const fetchPromises = args.catIds.map(catId => ctx.db.get(catId));
    const results = await Promise.all(fetchPromises);
    
    return results.filter(cat => cat !== null);
  },
});

// Paginated cats query for better performance on large datasets
export const getPaginatedCats = query({
  args: {
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
    // Apply filters using indexes when possible
    if (args.filters?.isDisplayed !== undefined) {
      return await ctx.db
        .query("cats")
        .withIndex("by_displayed", (q) => 
          q.eq("isDisplayed", args.filters!.isDisplayed!)
        )
        .paginate(args.paginationOpts);
    } else if (args.filters?.gender) {
      return await ctx.db
        .query("cats")
        .withIndex("by_gender", (q) => 
          q.eq("gender", args.filters!.gender!)
        )
        .paginate(args.paginationOpts);
    } else if (args.filters?.category && args.filters.category !== "all") {
      return await ctx.db
        .query("cats")
        .withIndex("by_category", (q) => 
          q.eq("category", args.filters!.category!)
        )
        .paginate(args.paginationOpts);
    }
    
    return await ctx.db.query("cats").paginate(args.paginationOpts);
  },
});

// Get cats with minimal data for performance-critical lists
export const getCatsMinimal = query({
  args: {
    isDisplayed: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let cats;
    
    if (args.isDisplayed !== undefined) {
      cats = await ctx.db
        .query("cats")
        .withIndex("by_displayed", (q) => 
          q.eq("isDisplayed", args.isDisplayed!)
        )
        .take(limit);
    } else {
      cats = await ctx.db.query("cats").take(limit);
    }
    
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