import { requireAdmin } from "./lib/admin";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all site settings
export const getAllSettings = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    return await ctx.db.query("siteSettings").collect();
  },
});

// Get settings by type
export const getSettingsByType = query({
  args: { sessionId: v.string(), type: v.union(v.literal("social_media"), v.literal("contact_info"), v.literal("site_content"), v.literal("feature_toggle"), v.literal("analytics"), v.literal("seo"), v.literal("location")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    return await ctx.db
      .query("siteSettings")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

// Get setting by key
export const getSettingByKey = query({
  args: { sessionId: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    return await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

// Get social media settings (helper function)
export const getSocialMediaSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("siteSettings")
      .withIndex("by_type", (q) => q.eq("type", "social_media"))
      .collect();
    
    // Convert to key-value object
    const socialMedia: Record<string, string> = {};
    settings.filter(setting => ["facebook_url", "instagram_url", "tiktok_url"].includes(setting.key)).forEach(setting => {
      try {
        const value: unknown = JSON.parse(setting.value);
        if (typeof value === "string") socialMedia[setting.key] = value;
      } catch {
        socialMedia[setting.key] = setting.value;
      }
    });

    return socialMedia;
  },
});

// Create or update setting
export const upsertSetting = mutation({
  args: { sessionId: v.string(),
    key: v.string(),
    value: v.string(),
    type: v.union(v.literal("social_media"), v.literal("contact_info"), v.literal("site_content"), v.literal("feature_toggle"), v.literal("analytics"), v.literal("seo"), v.literal("location")),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", input.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: input.value,
        type: input.type,
        description: input.description,
      });
      return await ctx.db.get(existing._id);
    } else {
      const settingId = await ctx.db.insert("siteSettings", input);
      return await ctx.db.get(settingId);
    }
  },
});

// Get location settings (helper function)
export const getLocationSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("siteSettings")
      .withIndex("by_type", (q) => q.eq("type", "location"))
      .collect();
    
    // Convert to key-value object
    const location: Record<string, unknown> = {};
    settings.forEach(setting => {
      try {
        location[setting.key] = JSON.parse(setting.value);
      } catch {
        location[setting.key] = setting.value;
      }
    });

    return location;
  },
});

// Update location settings (batch update)
export const updateLocationSettings = mutation({
  args: { sessionId: v.string(),
    address: v.optional(v.string()),
    coordinates: v.optional(v.string()), // JSON string: {lat: number, lng: number}
    googleMapsUrl: v.optional(v.string()),
    appleMapsUrl: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const updates = [];

    if (input.address !== undefined) {
      const result = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "establishment_address"))
        .first();

      if (result) {
        await ctx.db.patch(result._id, { value: input.address });
      } else {
        await ctx.db.insert("siteSettings", {
          key: "establishment_address",
          value: input.address,
          type: "location",
          description: "Physical address of the establishment"
        });
      }
      updates.push("establishment_address");
    }

    if (input.coordinates !== undefined) {
      const result = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "establishment_coordinates"))
        .first();

      if (result) {
        await ctx.db.patch(result._id, { value: input.coordinates });
      } else {
        await ctx.db.insert("siteSettings", {
          key: "establishment_coordinates",
          value: input.coordinates,
          type: "location",
          description: "GPS coordinates (lat, lng) as JSON"
        });
      }
      updates.push("establishment_coordinates");
    }

    if (input.googleMapsUrl !== undefined) {
      const result = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "google_maps_url"))
        .first();

      if (result) {
        await ctx.db.patch(result._id, { value: input.googleMapsUrl });
      } else {
        await ctx.db.insert("siteSettings", {
          key: "google_maps_url",
          value: input.googleMapsUrl,
          type: "location",
          description: "Custom Google Maps URL"
        });
      }
      updates.push("google_maps_url");
    }

    if (input.appleMapsUrl !== undefined) {
      const result = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "apple_maps_url"))
        .first();

      if (result) {
        await ctx.db.patch(result._id, { value: input.appleMapsUrl });
      } else {
        await ctx.db.insert("siteSettings", {
          key: "apple_maps_url",
          value: input.appleMapsUrl,
          type: "location",
          description: "Custom Apple Maps URL"
        });
      }
      updates.push("apple_maps_url");
    }

    if (input.displayName !== undefined) {
      const result = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "location_display_name"))
        .first();

      if (result) {
        await ctx.db.patch(result._id, { value: input.displayName });
      } else {
        await ctx.db.insert("siteSettings", {
          key: "location_display_name",
          value: input.displayName,
          type: "location",
          description: "Display name for the location"
        });
      }
      updates.push("location_display_name");
    }

    return { updated: updates };
  },
});

// Update social media settings (batch update)
export const updateSocialMediaSettings = mutation({
  args: { sessionId: v.string(),
    facebook: v.optional(v.string()),
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const updates = [];

    if (input.facebook !== undefined) {
      const result = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "facebook_url"))
        .first();

      if (result) {
        await ctx.db.patch(result._id, { value: input.facebook });
      } else {
        await ctx.db.insert("siteSettings", {
          key: "facebook_url",
          value: input.facebook,
          type: "social_media",
          description: "Facebook page URL",
        });
      }
      updates.push("facebook");
    }

    if (input.instagram !== undefined) {
      const result = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "instagram_url"))
        .first();

      if (result) {
        await ctx.db.patch(result._id, { value: input.instagram });
      } else {
        await ctx.db.insert("siteSettings", {
          key: "instagram_url",
          value: input.instagram,
          type: "social_media",
          description: "Instagram profile URL",
        });
      }
      updates.push("instagram");
    }

    if (input.tiktok !== undefined) {
      const result = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", "tiktok_url"))
        .first();

      if (result) {
        await ctx.db.patch(result._id, { value: input.tiktok });
      } else {
        await ctx.db.insert("siteSettings", {
          key: "tiktok_url",
          value: input.tiktok,
          type: "social_media",
          description: "TikTok profile URL",
        });
      }
      updates.push("tiktok");
    }

    return { updated: updates };
  },
});

// Delete setting
export const deleteSetting = mutation({
  args: { sessionId: v.string(), id: v.id("siteSettings") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    await ctx.db.delete(input.id);
    return { success: true };
  },
});

// Initialize default settings (useful for first-time setup)
export const initializeDefaultSettings = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionId);
    const { sessionId: _sessionId, ...input } = args;
    const defaults = [
      {
        key: "facebook_url",
        value: "https://www.facebook.com/profile.php?id=61561853557367",
        type: "social_media" as const,
        description: "Facebook page URL",
      },
      {
        key: "instagram_url", 
        value: "https://www.instagram.com/bleuroi_cattery_ragdol_british/",
        type: "social_media" as const,
        description: "Instagram profile URL",
      },
      {
        key: "tiktok_url",
        value: "https://www.tiktok.com/@radanovpridemainecoon",
        type: "social_media" as const,
        description: "TikTok profile URL",
      },
    ];

    const results = [];
    for (const setting of defaults) {
      const existing = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("siteSettings", setting);
        results.push(await ctx.db.get(id));
      }
    }

    return results;
  },
});
export const getPublicTrackingSettings = query({
  args: {},
  handler: async ctx => {
    const settings = await ctx.db.query("siteSettings").withIndex("by_type", q => q.eq("type", "analytics")).collect();
    return settings.filter(s => ["google_analytics_id", "meta_pixel_id", "google_search_console"].includes(s.key));
  },
});
