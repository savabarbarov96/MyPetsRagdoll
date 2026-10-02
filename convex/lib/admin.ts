import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

export async function findAdminSession(ctx: QueryCtx | MutationCtx, token: string | undefined) {
  // Previously issued tokens were weak and publicly exposed. Never accept them.
  if (!token || !/^admin_[a-f0-9]{64}$/.test(token)) return null;
  const session = await ctx.db.query("adminSessions")
    .withIndex("by_session_id", q => q.eq("sessionId", token)).first();
  return session?.authVersion === 2 && session.isValid && session.expiresAt > Date.now()
    ? session : null;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx | ActionCtx, token: string | undefined): Promise<void> {
  if ("db" in ctx) {
    if (await findAdminSession(ctx, token)) return;
  } else if (await ctx.runQuery(internal.auth.verifyAdmin, { sessionId: token ?? "" })) {
    return;
  }
  throw new ConvexError("Unauthorized");
}
