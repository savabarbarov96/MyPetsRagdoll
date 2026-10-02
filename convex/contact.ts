import { requireAdmin } from "./lib/admin";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit a contact form
export const submitContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const contactId = await ctx.db.insert("contactSubmissions", {
      name: args.name,
      email: args.email,
      message: args.message,
      status: "new",
    });

    return contactId;
  },
});

// Get all contact submissions (admin)
export const getAllContacts = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db
      .query("contactSubmissions")
      .order("desc")
      .collect();
  },
});

// Get contacts by status
export const getContactsByStatus = query({
  args: { sessionId: v.string(),
    status: v.union(
      v.literal("new"), 
      v.literal("read"), 
      v.literal("replied")
    ) 
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db
      .query("contactSubmissions")
      .withIndex("by_status", (q) => q.eq("status", input.status))
      .order("desc")
      .collect();
  },
});

// Update contact status
export const updateContactStatus = mutation({
  args: { sessionId: v.string(),
    contactId: v.id("contactSubmissions"),
    status: v.union(
      v.literal("new"), 
      v.literal("read"), 
      v.literal("replied")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    await ctx.db.patch(input.contactId, { status: input.status });
    return await ctx.db.get(input.contactId);
  },
});

// Mark contact as read
export const markContactAsRead = mutation({
  args: { sessionId: v.string(), contactId: v.id("contactSubmissions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    await ctx.db.patch(input.contactId, { status: "read" });
    return await ctx.db.get(input.contactId);
  },
});

// Mark contact as replied
export const markContactAsReplied = mutation({
  args: { sessionId: v.string(), contactId: v.id("contactSubmissions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    await ctx.db.patch(input.contactId, { status: "replied" });
    return await ctx.db.get(input.contactId);
  },
});

// Delete contact submission
export const deleteContact = mutation({
  args: { sessionId: v.string(), contactId: v.id("contactSubmissions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    await ctx.db.delete(input.contactId);
    return { success: true };
  },
});

// Get contact statistics
export const getContactStatistics = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const allContacts = await ctx.db.query("contactSubmissions").collect();
    
    const newContacts = allContacts.filter(c => c.status === "new");
    const readContacts = allContacts.filter(c => c.status === "read");
    const repliedContacts = allContacts.filter(c => c.status === "replied");

    return {
      total: allContacts.length,
      new: newContacts.length,
      read: readContacts.length,
      replied: repliedContacts.length,
      responseRate: allContacts.length > 0 ? 
        (repliedContacts.length / allContacts.length) * 100 : 0
    };
  },
});

// Bulk update contact status
export const bulkUpdateContactStatus = mutation({
  args: { sessionId: v.string(),
    contactIds: v.array(v.id("contactSubmissions")),
    status: v.union(
      v.literal("new"), 
      v.literal("read"), 
      v.literal("replied")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const results = [];
    
    for (const contactId of input.contactIds) {
      await ctx.db.patch(contactId, { status: input.status });
      const updatedContact = await ctx.db.get(contactId);
      results.push(updatedContact);
    }
    
    return results;
  },
}); 