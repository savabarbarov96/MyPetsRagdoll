import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Main cats table
  cats: defineTable({
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
    isDisplayed: v.boolean(),
    freeText: v.optional(v.string()),
    // New fields for gallery filtering
    category: v.optional(v.union(v.literal("kitten"), v.literal("adult"), v.literal("all"))),
  })
    .index("by_displayed", ["isDisplayed"])
    .index("by_gender", ["gender"])
    .index("by_registration", ["registrationNumber"])
    .index("by_category", ["category"])
    .index("by_category_displayed", ["category", "isDisplayed"]),

  // Pedigree connections between cats
  pedigreeConnections: defineTable({
    parentId: v.id("cats"),
    childId: v.id("cats"),
    type: v.union(v.literal("mother"), v.literal("father")),
  })
    .index("by_parent", ["parentId"])
    .index("by_child", ["childId"])
    .index("by_child_type", ["childId", "type"]),

  // Saved pedigree trees
  pedigreeTrees: defineTable({
    rootCatId: v.id("cats"),
    name: v.string(),
    description: v.string(),
    // Store the tree structure as JSON for performance
    treeData: v.string(), // JSON stringified tree data
  })
    .index("by_root_cat", ["rootCatId"]),

  // Admin sessions for authentication
  adminSessions: defineTable({
    sessionId: v.string(),
    isValid: v.boolean(),
    expiresAt: v.number(), // Unix timestamp
    createdBy: v.optional(v.string()), // Could track who created the session
  })
    .index("by_session_id", ["sessionId"])
    .index("by_validity", ["isValid"]),

  // Optional: Contact form submissions
  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("new"), 
      v.literal("read"), 
      v.literal("replied")
    ),
  })
    .index("by_status", ["status"]),

  // Optional: Image metadata if you want to track uploaded images
  images: defineTable({
    filename: v.string(),
    url: v.string(),
    uploadedAt: v.string(),
    associatedCatId: v.optional(v.id("cats")),
    imageType: v.union(
      v.literal("profile"), 
      v.literal("gallery"), 
      v.literal("general"),
      v.literal("news"),
      v.literal("award_certificate"),
      v.literal("award_gallery"),
      v.literal("business_gallery")
    ),
  })
    .index("by_cat", ["associatedCatId"])
    .index("by_type", ["imageType"]),

  // Global site settings
  siteSettings: defineTable({
    key: v.string(), // Unique setting key
    value: v.string(), // JSON stringified value
    type: v.union(
      v.literal("social_media"),
      v.literal("contact_info"), 
      v.literal("site_content"),
      v.literal("feature_toggle"),
      v.literal("analytics"),
      v.literal("seo"),
      v.literal("location")
    ),
    description: v.optional(v.string()), // Human-readable description
  })
    .index("by_key", ["key"])
    .index("by_type", ["type"]),

  // TikTok videos for cats
  tiktokVideos: defineTable({
    catId: v.optional(v.id("cats")), // If null, it's a global video
    videoUrl: v.string(), // TikTok video URL
    embedId: v.optional(v.string()), // TikTok embed ID if available
    thumbnail: v.string(), // Thumbnail image URL
    title: v.string(),
    description: v.optional(v.string()),
    hashtags: v.array(v.string()),
    viewCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
    isActive: v.boolean(), // Can be disabled without deleting
    sortOrder: v.number(), // For manual ordering
  })
    .index("by_cat", ["catId"])
    .index("by_active", ["isActive"])
    .index("by_cat_active", ["catId", "isActive"])
    .index("by_sort_order", ["sortOrder"]),

  // Simple announcements/news for homepage
  announcements: defineTable({
    title: v.string(),
    content: v.string(), // Simple text content
    featuredImage: v.optional(v.string()), // Optional featured image URL
    gallery: v.optional(v.array(v.string())), // Optional gallery images array
    isPublished: v.boolean(),
    publishedAt: v.number(), // Unix timestamp
    sortOrder: v.number(), // Manual ordering
    updatedAt: v.number(), // Unix timestamp
    slug: v.optional(v.string()), // URL slug for SEO-friendly URLs
    metaDescription: v.optional(v.string()), // SEO meta description
    metaKeywords: v.optional(v.string()), // SEO keywords
  })
    .index("by_published", ["isPublished", "publishedAt"])
    .index("by_sort_order", ["sortOrder"])
    .index("by_slug", ["slug"]),

  // Awards and recognitions for the cattery
  awards: defineTable({
    title: v.string(),
    description: v.string(),
    awardDate: v.number(), // Unix timestamp
    awardingOrganization: v.string(),
    category: v.union(
      v.literal("best_in_show"), 
      v.literal("championship"), 
      v.literal("cattery_recognition"),
      v.literal("breeding_award"),
      v.literal("other")
    ),
    // Main award image/certificate
    certificateImage: v.string(),
    // Additional images for the award (ceremony photos, etc.)
    galleryImages: v.array(v.string()),
    // Associated cat if award is cat-specific
    associatedCatId: v.optional(v.id("cats")),
    isPublished: v.boolean(),
    sortOrder: v.number(),
    // Additional metadata
    achievements: v.optional(v.string()), // JSON stringified achievements data
    updatedAt: v.number(),
  })
    .index("by_published", ["isPublished", "awardDate"])
    .index("by_category", ["category"])
    .index("by_cat", ["associatedCatId"])
    .index("by_sort_order", ["sortOrder"]),

  // Hero images for the floating circles in the hero section
  heroImages: defineTable({
    src: v.string(), // Image URL
    alt: v.string(), // Alt text for accessibility
    name: v.optional(v.string()), // Display name for the image/cat
    subtitle: v.optional(v.string()), // Subtitle or category for the image
    isActive: v.boolean(), // Whether the image is displayed in hero section
    position: v.number(), // Order/position for display
    uploadedAt: v.number(), // Unix timestamp
  })
    .index("by_active", ["isActive"])
    .index("by_position", ["position"])
    .index("by_active_position", ["isActive", "position"]),

  // Hero videos for the main background video in hero section
  heroVideos: defineTable({
    src: v.string(), // Video URL from Convex storage
    thumbnailSrc: v.optional(v.string()), // Thumbnail image URL
    alt: v.string(), // Alt text for accessibility
    title: v.optional(v.string()), // Display title
    description: v.optional(v.string()), // Video description
    isActive: v.boolean(), // Only one active at a time
    duration: v.optional(v.number()), // Video duration in seconds
    fileSize: v.optional(v.number()), // File size in bytes
    format: v.optional(v.string()), // Video format (mp4, webm)
    uploadedAt: v.number(), // Unix timestamp
    // Video-specific playback settings
    shouldAutoplay: v.optional(v.boolean()), // Default: true
    shouldLoop: v.optional(v.boolean()), // Default: true
    shouldMute: v.optional(v.boolean()), // Default: true (for autoplay compliance)
  })
    .index("by_active", ["isActive"])
    .index("by_uploaded", ["uploadedAt"]),

  // Business gallery items (separate from awards)
  gallery: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    category: v.union(
      v.literal("award"),
      v.literal("certificate"),
      v.literal("photo"),
      v.literal("trophy"),
      v.literal("achievement")
    ),
    date: v.optional(v.string()), // Display date (string for flexibility)
    isPublished: v.boolean(),
    sortOrder: v.number(),
    uploadedAt: v.number(), // Unix timestamp
    // Additional metadata
    associatedCatId: v.optional(v.id("cats")), // Link to specific cat if applicable
    tags: v.optional(v.array(v.string())), // Searchable tags
  })
    .index("by_published", ["isPublished", "sortOrder"])
    .index("by_category", ["category"])
    .index("by_cat", ["associatedCatId"])
    .index("by_published_category", ["isPublished", "category"]),

  // Real page visits for analytics
  pageVisits: defineTable({
    path: v.string(), // Page path (e.g., '/', '/about', '/news')
    referrer: v.optional(v.string()), // HTTP referrer
    userAgent: v.optional(v.string()), // Browser user agent
    sessionId: v.string(), // Unique session identifier
    timestamp: v.number(), // Unix timestamp in milliseconds
    deviceType: v.union(
      v.literal("mobile"),
      v.literal("tablet"),
      v.literal("desktop"),
      v.literal("unknown")
    ),
    // Additional metadata
    language: v.optional(v.string()), // Browser language
    screenResolution: v.optional(v.string()), // Screen size
  })
    .index("by_path", ["path"])
    .index("by_timestamp", ["timestamp"])
    .index("by_path_timestamp", ["path", "timestamp"])
    .index("by_session", ["sessionId"])
    .index("by_device", ["deviceType"]),

  // Synthetic visitor boosts (separate table for clarity)
  syntheticVisits: defineTable({
    date: v.string(), // Date in YYYY-MM-DD format
    count: v.number(), // Number of synthetic visitors for this day (20-30)
    createdAt: v.number(), // Unix timestamp when created
  })
    .index("by_date", ["date"]),
}); 