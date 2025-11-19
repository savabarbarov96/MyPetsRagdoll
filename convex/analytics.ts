import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Mutation to track a page visit
export const trackPageVisit = mutation({
  args: {
    path: v.string(),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.string(),
    deviceType: v.union(
      v.literal("mobile"),
      v.literal("tablet"),
      v.literal("desktop"),
      v.literal("unknown")
    ),
    language: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pageVisits", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Helper function to get start of day timestamp
function getStartOfDay(daysAgo: number = 0): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.getTime();
}

// Helper function to get date string in YYYY-MM-DD format
function getDateString(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Helper function to count unique sessions
function countUniqueSessions(visits: any[]): number {
  const uniqueSessions = new Set(visits.map(v => v.sessionId));
  return uniqueSessions.size;
}

// Query to get analytics summary (today, 7d, 30d, all-time)
export const getAnalyticsSummary = query({
  handler: async (ctx) => {
    const now = Date.now();
    const todayStart = getStartOfDay(0);
    const sevenDaysAgo = getStartOfDay(7);
    const thirtyDaysAgo = getStartOfDay(30);

    // Get all real visits
    const allVisits = await ctx.db
      .query("pageVisits")
      .withIndex("by_timestamp")
      .collect();

    // Get all synthetic visits
    const allSyntheticVisits = await ctx.db
      .query("syntheticVisits")
      .collect();

    // Filter visits by time period
    const todayVisits = allVisits.filter(v => v.timestamp >= todayStart);
    const last7DaysVisits = allVisits.filter(v => v.timestamp >= sevenDaysAgo);
    const last30DaysVisits = allVisits.filter(v => v.timestamp >= thirtyDaysAgo);

    // Calculate synthetic visitors for each period
    const todayDate = getDateString(0);
    const todaySynthetic = allSyntheticVisits.find(sv => sv.date === todayDate)?.count || 0;

    let last7DaysSynthetic = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = getDateString(i);
      const syntheticVisit = allSyntheticVisits.find(sv => sv.date === dateStr);
      last7DaysSynthetic += syntheticVisit?.count || 0;
    }

    let last30DaysSynthetic = 0;
    for (let i = 0; i < 30; i++) {
      const dateStr = getDateString(i);
      const syntheticVisit = allSyntheticVisits.find(sv => sv.date === dateStr);
      last30DaysSynthetic += syntheticVisit?.count || 0;
    }

    const allTimeSynthetic = allSyntheticVisits.reduce((sum, sv) => sum + sv.count, 0);

    return {
      today: {
        real: countUniqueSessions(todayVisits),
        synthetic: todaySynthetic,
        total: countUniqueSessions(todayVisits) + todaySynthetic,
      },
      last7Days: {
        real: countUniqueSessions(last7DaysVisits),
        synthetic: last7DaysSynthetic,
        total: countUniqueSessions(last7DaysVisits) + last7DaysSynthetic,
      },
      last30Days: {
        real: countUniqueSessions(last30DaysVisits),
        synthetic: last30DaysSynthetic,
        total: countUniqueSessions(last30DaysVisits) + last30DaysSynthetic,
      },
      allTime: {
        real: countUniqueSessions(allVisits),
        synthetic: allTimeSynthetic,
        total: countUniqueSessions(allVisits) + allTimeSynthetic,
      },
    };
  },
});

// Query to get daily stats for the last N days
export const getDailyStats = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const daysToFetch = args.days || 30;

    // Get all visits for the time period
    const startDate = getStartOfDay(daysToFetch - 1);
    const allVisits = await ctx.db
      .query("pageVisits")
      .withIndex("by_timestamp")
      .filter(q => q.gte(q.field("timestamp"), startDate))
      .collect();

    // Get all synthetic visits
    const allSyntheticVisits = await ctx.db
      .query("syntheticVisits")
      .collect();

    // Build daily stats
    const dailyStats = [];
    for (let i = daysToFetch - 1; i >= 0; i--) {
      const dayStart = getStartOfDay(i);
      const dayEnd = getStartOfDay(i - 1);
      const dateStr = getDateString(i);

      // Filter visits for this day
      const dayVisits = allVisits.filter(
        v => v.timestamp >= dayStart && v.timestamp < dayEnd
      );

      // Get synthetic visits for this day
      const syntheticVisit = allSyntheticVisits.find(sv => sv.date === dateStr);
      const syntheticCount = syntheticVisit?.count || 0;

      const realCount = countUniqueSessions(dayVisits);

      dailyStats.push({
        date: dateStr,
        real: realCount,
        synthetic: syntheticCount,
        total: realCount + syntheticCount,
        pageViews: dayVisits.length,
      });
    }

    return dailyStats;
  },
});

// Query to get page-specific stats
export const getPageStats = query({
  args: { path: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let visits;

    if (args.path) {
      const path = args.path; // Extract to ensure type safety
      visits = await ctx.db
        .query("pageVisits")
        .withIndex("by_path", q => q.eq("path", path))
        .collect();
    } else {
      visits = await ctx.db
        .query("pageVisits")
        .collect();
    }

    // Group by path
    const pathCounts: Record<string, { views: number; uniqueVisitors: number; sessions: Set<string> }> = {};

    visits.forEach(visit => {
      if (!pathCounts[visit.path]) {
        pathCounts[visit.path] = {
          views: 0,
          uniqueVisitors: 0,
          sessions: new Set(),
        };
      }
      pathCounts[visit.path].views++;
      pathCounts[visit.path].sessions.add(visit.sessionId);
    });

    // Convert to array and calculate unique visitors
    const pageStats = Object.entries(pathCounts).map(([path, data]) => ({
      path,
      views: data.views,
      uniqueVisitors: data.sessions.size,
    })).sort((a, b) => b.views - a.views);

    return pageStats;
  },
});

// Query to get device breakdown
export const getDeviceStats = query({
  handler: async (ctx) => {
    const allVisits = await ctx.db
      .query("pageVisits")
      .collect();

    const deviceCounts: Record<string, number> = {
      mobile: 0,
      tablet: 0,
      desktop: 0,
      unknown: 0,
    };

    allVisits.forEach(visit => {
      deviceCounts[visit.deviceType]++;
    });

    return [
      { device: "mobile", count: deviceCounts.mobile },
      { device: "tablet", count: deviceCounts.tablet },
      { device: "desktop", count: deviceCounts.desktop },
      { device: "unknown", count: deviceCounts.unknown },
    ].filter(d => d.count > 0);
  },
});

// Internal mutation to create daily synthetic visits (called by cron job)
export const createDailySyntheticVisits = internalMutation({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const dateStr = args.date || getDateString(0);

    // Check if synthetic visits already exist for this date
    const existing = await ctx.db
      .query("syntheticVisits")
      .withIndex("by_date", q => q.eq("date", dateStr))
      .first();

    if (existing) {
      // Already created for this day, don't create again
      return { success: false, message: "Synthetic visits already exist for this date", existing };
    }

    // Generate random count between 20 and 30 (inclusive)
    const count = Math.floor(Math.random() * 11) + 20; // 20-30 inclusive

    const syntheticVisit = await ctx.db.insert("syntheticVisits", {
      date: dateStr,
      count,
      createdAt: Date.now(),
    });

    return { success: true, count, id: syntheticVisit };
  },
});

// Query to get all synthetic visits (for admin debugging)
export const getAllSyntheticVisits = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("syntheticVisits")
      .collect();
  },
});
