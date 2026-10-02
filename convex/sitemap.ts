import { internalQuery } from "./_generated/server";

const STATIC_PATHS = ["/", "/british", "/all-cats", "/about", "/news", "/trust", "/contact", "/waiting-list"];

export const entries = internalQuery({
  args: {},
  handler: async ctx => {
    const cats = await ctx.db.query("cats").withIndex("by_displayed", q => q.eq("isDisplayed", true)).collect();
    const articles = await ctx.db.query("announcements").withIndex("by_published", q => q.eq("isPublished", true)).collect();
    return [...STATIC_PATHS.map(path => ({ path, updatedAt: undefined as number | undefined })),
      ...cats.map(cat => ({ path: `/cat/${cat._id}`, updatedAt: undefined as number | undefined })),
      ...articles.map(article => ({ path: `/news/${encodeURIComponent(article.slug || article._id)}`, updatedAt: article.updatedAt }))];
  },
});
