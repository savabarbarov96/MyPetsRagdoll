import { v, ConvexError } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { findAdminSession, requireAdmin } from "./lib/admin";

export const verifyAdmin = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => Boolean(await findAdminSession(ctx, args.sessionId)),
});

// All failed and successful login attempts consume this server-side budget.
export const consumeLoginAttempt = internalMutation({
  args: {},
  handler: async ctx => {
    const key = "admin-login";
    const now = Date.now();
    const existing = await ctx.db.query("submissionLimits").withIndex("by_key", q => q.eq("key", key)).first();
    if (existing && existing.windowEndsAt > now) {
      if (existing.count >= 20) return false;
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else if (existing) {
      await ctx.db.patch(existing._id, { count: 1, windowEndsAt: now + 15 * 60 * 1000 });
    } else {
      await ctx.db.insert("submissionLimits", { key, count: 1, windowEndsAt: now + 15 * 60 * 1000 });
    }
    return true;
  },
});

export const createSession = internalMutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    if (!/^admin_[a-f0-9]{64}$/.test(args.sessionId)) throw new ConvexError("Invalid session");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const sessions = await ctx.db.query("adminSessions").withIndex("by_validity", q => q.eq("isValid", true)).collect();
    for (const session of sessions) await ctx.db.patch(session._id, { isValid: false });
    await ctx.db.insert("adminSessions", { sessionId: args.sessionId, isValid: true, expiresAt, authVersion: 2 });
    return { sessionId: args.sessionId, expiresAt, success: true as const };
  },
});

export const validateSession = query({
  args: { sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const session = await findAdminSession(ctx, args.sessionId);
    return session ? { isValid: true, expiresAt: session.expiresAt } : { isValid: false };
  },
});

export const logout = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await findAdminSession(ctx, args.sessionId);
    if (session) await ctx.db.patch(session._id, { isValid: false });
    return { success: true };
  },
});

export const logoutAll = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const sessions = await ctx.db.query("adminSessions").withIndex("by_validity", q => q.eq("isValid", true)).collect();
    for (const session of sessions) await ctx.db.patch(session._id, { isValid: false });
    return { success: true, invalidatedSessions: sessions.length };
  },
});

export const getActiveSessions = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const sessions = await ctx.db.query("adminSessions").withIndex("by_validity", q => q.eq("isValid", true)).collect();
    return sessions.filter(s => s.authVersion === 2 && s.expiresAt > Date.now())
      .map(s => ({ expiresAt: s.expiresAt, createdAt: s._creationTime }));
  },
});

// Sessions have a fixed lifetime; log in again to renew them.
export const extendSession = mutation({
  args: { sessionId: v.string(), extensionDuration: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const session = await findAdminSession(ctx, args.sessionId);
    return { sessionId: args.sessionId, expiresAt: session!.expiresAt, success: true };
  },
});

export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async ctx => {
    const sessions = await ctx.db.query("adminSessions").withIndex("by_validity", q => q.eq("isValid", true)).collect();
    for (const session of sessions) if (session.expiresAt <= Date.now()) await ctx.db.patch(session._id, { isValid: false });
  },
});

export const cleanupSubmissionLimits = internalMutation({
  args: {},
  handler: async ctx => {
    const expired = await ctx.db.query("submissionLimits").withIndex("by_expiry", q => q.lt("windowEndsAt", Date.now())).take(500);
    for (const limit of expired) await ctx.db.delete(limit._id);
  },
});
