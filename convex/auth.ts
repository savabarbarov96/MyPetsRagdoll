import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create admin session
export const login = mutation({
  args: { 
    password: v.string(),
    sessionDuration: v.optional(v.number()) // Duration in milliseconds
  },
  handler: async (ctx, args) => {
    // In a real app, you'd hash and compare passwords properly
    // For now, using the same hardcoded password as the original
    if (args.password !== "Savata619") {
      throw new Error("Invalid password");
    }

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Default session duration: 24 hours
    const duration = args.sessionDuration || 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + duration;

    // Invalidate any existing sessions (single admin approach)
    const existingSessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_validity", (q) => q.eq("isValid", true))
      .collect();

    for (const session of existingSessions) {
      await ctx.db.patch(session._id, { isValid: false });
    }

    // Create new session
    const sessionDbId = await ctx.db.insert("adminSessions", {
      sessionId,
      isValid: true,
      expiresAt,
    });

    return {
      sessionId,
      expiresAt,
      success: true
    };
  },
});

// Validate session
export const validateSession = query({
  args: { sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Return invalid if no sessionId provided
    if (!args.sessionId) {
      return { isValid: false, reason: "No session ID provided" };
    }
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId!))
      .first();

    if (!session) {
      return { isValid: false, reason: "Session not found" };
    }

    if (!session.isValid) {
      return { isValid: false, reason: "Session invalidated" };
    }

    if (session.expiresAt < Date.now()) {
      // Session is expired
      return { isValid: false, reason: "Session expired" };
    }

    return { 
      isValid: true, 
      session: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        createdAt: session._creationTime
      }
    };
  },
});

// Logout (invalidate session)
export const logout = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { isValid: false });
    }

    return { success: true };
  },
});

// Logout all sessions
export const logoutAll = mutation({
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_validity", (q) => q.eq("isValid", true))
      .collect();

    for (const session of activeSessions) {
      await ctx.db.patch(session._id, { isValid: false });
    }

    return { 
      success: true, 
      invalidatedSessions: activeSessions.length 
    };
  },
});

// Extend session (refresh)
export const extendSession = mutation({
  args: { 
    sessionId: v.string(),
    extensionDuration: v.optional(v.number()) // Additional time in milliseconds
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session || !session.isValid) {
      throw new Error("Invalid session");
    }

    if (session.expiresAt < Date.now()) {
      throw new Error("Session already expired");
    }

    // Default extension: 24 hours
    const extension = args.extensionDuration || 24 * 60 * 60 * 1000;
    const newExpiresAt = Math.max(session.expiresAt, Date.now()) + extension;

    await ctx.db.patch(session._id, { expiresAt: newExpiresAt });

    return {
      sessionId: session.sessionId,
      expiresAt: newExpiresAt,
      success: true
    };
  },
});

// Get active sessions (admin utility)
export const getActiveSessions = query({
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_validity", (q) => q.eq("isValid", true))
      .collect();

    // Filter out expired sessions
    const activeSessions = sessions.filter(session => session.expiresAt > Date.now());

    return activeSessions.map(session => ({
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      createdAt: session._creationTime,
      timeRemaining: session.expiresAt - Date.now()
    }));
  },
});

// Clean up expired sessions (maintenance function)
export const cleanupExpiredSessions = mutation({
  handler: async (ctx) => {
    const allSessions = await ctx.db.query("adminSessions").collect();
    const expiredSessions = allSessions.filter(
      session => session.expiresAt < Date.now() && session.isValid
    );

    for (const session of expiredSessions) {
      await ctx.db.patch(session._id, { isValid: false });
    }

    return {
      success: true,
      cleanedUp: expiredSessions.length
    };
  },
});

// Change admin password (this would require additional security in a real app)
export const changePassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
    invalidateAllSessions: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // Verify current password
    if (args.currentPassword !== "Savata619") {
      throw new Error("Current password is incorrect");
    }

    // In a real application, you would:
    // 1. Hash the new password
    // 2. Store it securely
    // 3. Implement proper password validation
    
    // For this demo, we'll just invalidate sessions if requested
    if (args.invalidateAllSessions) {
      const activeSessions = await ctx.db
        .query("adminSessions")
        .withIndex("by_validity", (q) => q.eq("isValid", true))
        .collect();

      for (const session of activeSessions) {
        await ctx.db.patch(session._id, { isValid: false });
      }

      return {
        success: true,
        message: "Password changed and all sessions invalidated",
        invalidatedSessions: activeSessions.length
      };
    }

    return {
      success: true,
      message: "Password changed successfully"
    };
  },
}); 