import { v, ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/admin";
import { normalizeEmail, normalizePhone, optionalText, normalizeContextUrl } from "./lib/waitingValidation";

const status = v.union(v.literal("new"), v.literal("contacted"), v.literal("closed"));

export const submit = mutation({
  args: {
    email: v.optional(v.string()), phone: v.optional(v.string()), name: v.optional(v.string()),
    preferences: v.optional(v.string()), followUpConsent: v.literal(true), noticeVersion: v.literal("2026-10-02"),
    context: v.optional(v.object({ catId: v.optional(v.id("cats")), label: v.optional(v.string()), url: v.string() })),
    honeypot: v.string(), startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.honeypot || !Number.isFinite(args.startedAt) || now - args.startedAt < 1500 || now - args.startedAt > 24 * 60 * 60 * 1000) {
      throw new ConvexError("SUBMISSION_REJECTED");
    }
    let email: string | undefined, phone: string | undefined, name: string | undefined, preferences: string | undefined;
    let context: typeof args.context;
    try {
      email = normalizeEmail(args.email);
      phone = normalizePhone(args.phone);
      if (!email && !phone) throw new Error("CONTACT_REQUIRED");
      name = optionalText(args.name, 100, "NAME_TOO_LONG");
      preferences = optionalText(args.preferences, 1000, "PREFERENCES_TOO_LONG");
      if (args.context) context = { ...args.context, label: optionalText(args.context.label, 160, "INVALID_CONTEXT"), url: normalizeContextUrl(args.context.url) };
    } catch (error) {
      throw new ConvexError(error instanceof Error ? error.message : "INVALID_INPUT");
    }
    if (context?.catId) {
      const cat = await ctx.db.get(context.catId);
      if (!cat?.isDisplayed) throw new ConvexError("INVALID_CONTEXT");
      context.label = cat.name;
    }
    // A global transactional budget also limits clients that rotate identifiers.
    const key = "waiting-list-hour";
    const limit = await ctx.db.query("submissionLimits").withIndex("by_key", q => q.eq("key", key)).first();
    if (limit && limit.windowEndsAt > now) {
      if (limit.count >= 100) throw new ConvexError("RATE_LIMITED");
      await ctx.db.patch(limit._id, { count: limit.count + 1 });
    } else if (limit) {
      await ctx.db.patch(limit._id, { count: 1, windowEndsAt: now + 60 * 60 * 1000 });
    } else {
      await ctx.db.insert("submissionLimits", { key, count: 1, windowEndsAt: now + 60 * 60 * 1000 });
    }
    for (const contact of [email && `email:${email}`, phone && `phone:${phone}`].filter((value): value is string => Boolean(value))) {
      // Only salted digests appear in the throttle table, never raw contact details.
      const salt = process.env.ADMIN_PASSWORD_HASH ?? "waiting-list-rate-v1";
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${contact}`));
      const contactKey = "waiting-contact:" + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      const budget = await ctx.db.query("submissionLimits").withIndex("by_key", q => q.eq("key", contactKey)).first();
      if (budget && budget.windowEndsAt > now) {
        if (budget.count >= 3) throw new ConvexError("RATE_LIMITED");
        await ctx.db.patch(budget._id, { count: budget.count + 1 });
      } else if (budget) {
        await ctx.db.patch(budget._id, { count: 1, windowEndsAt: now + 10 * 60 * 1000 });
      } else {
        await ctx.db.insert("submissionLimits", { key: contactKey, count: 1, windowEndsAt: now + 10 * 60 * 1000 });
      }
    }
    const byEmail = email ? await ctx.db.query("waitingListSubmissions").withIndex("by_email", q => q.eq("normalizedEmail", email)).first() : null;
    const byPhone = phone ? await ctx.db.query("waitingListSubmissions").withIndex("by_phone", q => q.eq("normalizedPhone", phone)).first() : null;
    // Idempotent acceptance never leaks an existing contact or overwrites their details.
    if (byEmail || byPhone) return { accepted: true as const };
    await ctx.db.insert("waitingListSubmissions", {
      email, phone, normalizedEmail: email, normalizedPhone: phone, name, preferences,
      followUpConsent: true, noticeVersion: args.noticeVersion, consentedAt: now,
      status: "new", notes: "", updatedAt: now, context,
    });
    return { accepted: true as const };
  },
});

export const list = query({
  args: { sessionId: v.string(), status: v.optional(status), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const opts = { ...args.paginationOpts, numItems: Math.min(100, Math.max(1, args.paginationOpts.numItems)) };
    if (args.status) return await ctx.db.query("waitingListSubmissions")
      .withIndex("by_status", q => q.eq("status", args.status!)).order("desc").paginate(opts);
    return await ctx.db.query("waitingListSubmissions").order("desc").paginate(opts);
  },
});

export const update = mutation({
  args: { sessionId: v.string(), id: v.id("waitingListSubmissions"), status: v.optional(status), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    if (!await ctx.db.get(args.id)) throw new ConvexError("NOT_FOUND");
    if (args.notes !== undefined && args.notes.length > 5000) throw new ConvexError("NOTES_TOO_LONG");
    await ctx.db.patch(args.id, { ...(args.status ? { status: args.status } : {}),
      ...(args.notes !== undefined ? { notes: args.notes.trim() } : {}), updatedAt: Date.now() });
    return { updated: true };
  },
});

export const remove = mutation({
  args: { sessionId: v.string(), id: v.id("waitingListSubmissions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    if (!await ctx.db.get(args.id)) throw new ConvexError("NOT_FOUND");
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});
