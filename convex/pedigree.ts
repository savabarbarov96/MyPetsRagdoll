import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Type for tree nodes that extends cat documents with tree-specific properties
type TreeNode = Doc<"cats"> & {
  generation: number;
  position: { x: number; y: number };
  motherId?: Id<"cats">;
  fatherId?: Id<"cats">;
};

// Get all pedigree connections
export const getAllConnections = query({
  handler: async (ctx) => {
    return await ctx.db.query("pedigreeConnections").collect();
  },
});

// Get connections for a specific cat as parent
export const getConnectionsByParent = query({
  args: { parentId: v.id("cats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});

// Get connections for a specific cat as child
export const getConnectionsByChild = query({
  args: { childId: v.id("cats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();
  },
});

// Get parents of a specific cat
export const getParents = query({
  args: { catId: v.optional(v.id("cats")) },
  handler: async (ctx, args) => {
    // Return empty result if no catId provided
    if (!args.catId) {
      return { mother: null, father: null };
    }
    const connections = await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_child", (q) => q.eq("childId", args.catId!))
      .collect();

    let mother = null;
    let father = null;

    for (const connection of connections) {
      const parent = await ctx.db.get(connection.parentId);
      if (connection.type === "mother") {
        mother = parent;
      } else if (connection.type === "father") {
        father = parent;
      }
    }

    return { mother, father };
  },
});

// Get children of a specific cat
export const getChildren = query({
  args: { catId: v.optional(v.id("cats")) },
  handler: async (ctx, args) => {
    // Return empty array if no catId provided
    if (!args.catId) {
      return [];
    }
    const connections = await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_parent", (q) => q.eq("parentId", args.catId!))
      .collect();

    const children = [];
    for (const connection of connections) {
      const child = await ctx.db.get(connection.childId);
      if (child) {
        children.push({
          ...child,
          relationshipType: connection.type
        });
      }
    }

    return children;
  },
});

// Add a parent-child connection
export const addConnection = mutation({
  args: {
    parentId: v.id("cats"),
    childId: v.id("cats"),
    type: v.union(v.literal("mother"), v.literal("father")),
  },
  handler: async (ctx, args) => {
    // Validate: prevent self-parenting
    if (args.parentId === args.childId) {
      throw new Error("Cat cannot be parent of itself");
    }

    // Check if parent and child exist
    const parent = await ctx.db.get(args.parentId);
    const child = await ctx.db.get(args.childId);
    
    if (!parent || !child) {
      throw new Error("Parent or child cat not found");
    }

    // Remove existing connection of the same type for this child
    const existingConnections = await ctx.db
      .query("pedigreeConnections")
      .withIndex("by_child_type", (q) => 
        q.eq("childId", args.childId).eq("type", args.type)
      )
      .collect();

    for (const connection of existingConnections) {
      await ctx.db.delete(connection._id);
    }

    // Create new connection
    const connectionId = await ctx.db.insert("pedigreeConnections", {
      parentId: args.parentId,
      childId: args.childId,
      type: args.type,
    });

    return connectionId;
  },
});

// Remove a specific connection
export const removeConnection = mutation({
  args: { connectionId: v.id("pedigreeConnections") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.connectionId);
    return { success: true };
  },
});

// Remove all connections for a specific parent-child relationship
export const removeConnectionsByRelationship = mutation({
  args: {
    parentId: v.id("cats"),
    childId: v.id("cats"),
    type: v.optional(v.union(v.literal("mother"), v.literal("father"))),
  },
  handler: async (ctx, args) => {
    let connections;
    
    if (args.type) {
      connections = await ctx.db
        .query("pedigreeConnections")
        .withIndex("by_child_type", (q) => 
          q.eq("childId", args.childId).eq("type", args.type!)
        )
        .filter((q) => q.eq(q.field("parentId"), args.parentId))
        .collect();
    } else {
      const parentConnections = await ctx.db
        .query("pedigreeConnections")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
        .collect();
      
      connections = parentConnections.filter(c => c.childId === args.childId);
    }

    for (const connection of connections) {
      await ctx.db.delete(connection._id);
    }

    return { deletedCount: connections.length };
  },
});

// Generate a complete family tree for a cat
export const generateFamilyTree = query({
  args: { 
    rootCatId: v.optional(v.id("cats")),
    maxGenerations: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Return empty tree if no rootCatId provided
    if (!args.rootCatId) {
      return {
        id: "empty_tree",
        rootCatId: null,
        nodes: [],
        connections: [],
        name: "Empty Tree",
        description: "No root cat specified",
        generationCount: 0,
      };
    }
    const maxGen = args.maxGenerations || 5;
    const rootCat = await ctx.db.get(args.rootCatId!);
    
    if (!rootCat) {
      throw new Error("Root cat not found");
    }

    const nodes: TreeNode[] = [];
    const visited = new Set<string>();

    const addCatToTree = async (catId: Id<"cats">, generation: number, x: number, y: number) => {
      if (visited.has(catId) || generation > maxGen) return;
      visited.add(catId);

      const cat = await ctx.db.get(catId);
      if (!cat) return;

      // Get parents
      const parentConnections = await ctx.db
        .query("pedigreeConnections")
        .withIndex("by_child", (q) => q.eq("childId", catId))
        .collect();

      let motherId = undefined;
      let fatherId = undefined;

      for (const connection of parentConnections) {
        if (connection.type === "mother") {
          motherId = connection.parentId;
        } else if (connection.type === "father") {
          fatherId = connection.parentId;
        }
      }

      const node = {
        ...cat,
        generation,
        position: { x, y },
        motherId,
        fatherId,
      };

      nodes.push(node);

      // Recursively add parents
      if (motherId && generation < maxGen) {
        await addCatToTree(motherId, generation + 1, x - 200, y - 150);
      }
      if (fatherId && generation < maxGen) {
        await addCatToTree(fatherId, generation + 1, x + 200, y - 150);
      }
    };

    await addCatToTree(args.rootCatId!, 0, 0, 0);

    // Get relevant connections
    const relevantConnections = await ctx.db.query("pedigreeConnections").collect();
    const treeConnections = relevantConnections.filter(conn => 
      visited.has(conn.parentId) && visited.has(conn.childId)
    );

    return {
      id: `tree_${args.rootCatId!}`,
      rootCatId: args.rootCatId!,
      nodes,
      connections: treeConnections,
      name: `${rootCat.name} Pedigree`,
      description: `Family tree for ${rootCat.name}`,
      generationCount: Math.max(...nodes.map(n => n.generation)) + 1,
    };
  },
});

// Save a pedigree tree
export const savePedigreeTree = mutation({
  args: {
    rootCatId: v.id("cats"),
    name: v.string(),
    description: v.string(),
    treeData: v.string(), // JSON stringified tree data
  },
  handler: async (ctx, args) => {
    // Check if a tree already exists for this root cat
    const existingTree = await ctx.db
      .query("pedigreeTrees")
      .withIndex("by_root_cat", (q) => q.eq("rootCatId", args.rootCatId))
      .first();

    if (existingTree) {
      // Update existing tree
      await ctx.db.patch(existingTree._id, {
        name: args.name,
        description: args.description,
        treeData: args.treeData,
      });
      return existingTree._id;
    } else {
      // Create new tree
      const treeId = await ctx.db.insert("pedigreeTrees", {
        rootCatId: args.rootCatId,
        name: args.name,
        description: args.description,
        treeData: args.treeData,
      });
      return treeId;
    }
  },
});

// Get saved pedigree trees
export const getSavedPedigreeTrees = query({
  handler: async (ctx) => {
    const trees = await ctx.db.query("pedigreeTrees").collect();
    
    // Enhance with root cat data
    const enhancedTrees = [];
    for (const tree of trees) {
      const rootCat = await ctx.db.get(tree.rootCatId);
      enhancedTrees.push({
        ...tree,
        rootCat,
      });
    }
    
    return enhancedTrees;
  },
});

// Get a specific saved pedigree tree
export const getPedigreeTree = query({
  args: { treeId: v.optional(v.id("pedigreeTrees")) },
  handler: async (ctx, args) => {
    // Return null if no treeId provided
    if (!args.treeId) {
      return null;
    }
    const tree = await ctx.db.get(args.treeId!);
    if (!tree) return null;

    const rootCat = await ctx.db.get(tree.rootCatId);
    return {
      ...tree,
      rootCat,
    };
  },
});

// Delete a saved pedigree tree
export const deletePedigreeTree = mutation({
  args: { treeId: v.id("pedigreeTrees") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.treeId);
    return { success: true };
  },
});

// Get breeding statistics
export const getBreedingStatistics = query({
  handler: async (ctx) => {
    const connections = await ctx.db.query("pedigreeConnections").collect();
    const allCats = await ctx.db.query("cats").collect();

    const parents = new Set();
    const offspring = new Set();

    connections.forEach(conn => {
      parents.add(conn.parentId);
      offspring.add(conn.childId);
    });

    const breeding_males = allCats.filter(cat => 
      cat.gender === "male" && parents.has(cat._id)
    ).length;

    const breeding_females = allCats.filter(cat => 
      cat.gender === "female" && parents.has(cat._id)
    ).length;

    return {
      totalConnections: connections.length,
      uniqueParents: parents.size,
      uniqueOffspring: offspring.size,
      breedingMales: breeding_males,
      breedingFemales: breeding_females,
      orphanCats: allCats.length - offspring.size, // Cats with no recorded parents
    };
  },
}); 