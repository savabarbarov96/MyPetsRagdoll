/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { renderSitemap } from "./lib/sitemapXml";
const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

it("publishes only displayed cats and published article slugs with language equivalents", async () => {
  const t = convexTest(schema, modules);
  const visible = await t.run(async ctx => {
    const cat = { name: "Cat", subtitle: "", image: "/cat.jpg", description: "", age: "", color: "", status: "", gallery: [], gender: "female" as const, birthDate: "2026-01-01", isDisplayed: true };
    const id = await ctx.db.insert("cats", cat);
    await ctx.db.insert("cats", { ...cat, isDisplayed: false });
    const article = { title: "News", content: "", isPublished: true, publishedAt: 1, sortOrder: 0, updatedAt: 1, slug: "real-slug" };
    await ctx.db.insert("announcements", article);
    await ctx.db.insert("announcements", { ...article, slug: "draft-slug", isPublished: false });
    return id;
  });
  const entries = await t.query(internal.sitemap.entries, {});
  const xml = renderSitemap(entries);
  expect(entries.filter(e => e.path.startsWith("/cat/"))).toEqual([{path:`/cat/${visible}`,updatedAt:undefined}]);
  expect(xml).toContain("/news/real-slug");
  expect(xml).not.toContain("draft-slug");
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("/privacy");
  expect(xml).not.toContain("/terms");
  expect(xml).toContain('hreflang="bg"');
  expect(xml).toContain('hreflang="en"');
  expect(xml).toContain("?lang=en");
});

it("escapes XML values instead of injecting markup", () => {
  const xml = renderSitemap([{ path: '/news/a&b"<c>', updatedAt: 1 }]);
  expect(xml).toContain("a&amp;b&quot;&lt;c&gt;");
  expect(xml).not.toContain('<c>');
});

it("preserves published slug-less article IDs without making draft IDs public", async () => {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const record = { title: "Historical article", content: "Verified public text", isPublished: true, publishedAt: 1, sortOrder: 0, updatedAt: 1 };
    const published = await ctx.db.insert("announcements", record);
    const draft = await ctx.db.insert("announcements", { ...record, isPublished: false });
    return { published, draft };
  });
  expect((await t.query(api.announcements.getAnnouncementBySlug, {slug:ids.published}))?.title).toBe("Historical article");
  expect(await t.query(api.announcements.getAnnouncementBySlug, {slug:ids.draft})).toBeNull();
  expect(await t.query(api.announcements.getAnnouncementBySlug, {slug:"not-a-slug-or-id"})).toBeNull();
  const xml = renderSitemap(await t.query(internal.sitemap.entries, {}));
  expect(xml).toContain(`/news/${ids.published}`);
  expect(xml).not.toContain(`/news/${ids.draft}`);
});
