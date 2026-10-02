"use node";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const login = action({
  args: { password: v.string() },
  handler: async (ctx, args): Promise<{ sessionId: string; expiresAt: number; success: true }> => {
    const configured = process.env.ADMIN_PASSWORD_HASH;
    if (!configured) throw new ConvexError("Admin login is not configured");
    if (!args.password || args.password.length > 256) throw new ConvexError("Invalid login");
    if (!(await ctx.runMutation(internal.auth.consumeLoginAttempt, {}))) {
      throw new ConvexError("Too many login attempts. Try again later.");
    }
    // Format: scrypt:<32 hex salt>:<128 hex derived key>. No password is bundled in the application.
    const [scheme, salt, expectedHex] = configured.split(":");
    if (scheme !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(expectedHex ?? "")) {
      throw new ConvexError("Admin login is not configured");
    }
    const candidate = scryptSync(args.password, salt, 64);
    if (!timingSafeEqual(candidate, Buffer.from(expectedHex, "hex"))) throw new ConvexError("Invalid login");
    return await ctx.runMutation(internal.auth.createSession, { sessionId: `admin_${randomBytes(32).toString("hex")}` });
  },
});
