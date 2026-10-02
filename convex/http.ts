import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { renderSitemap } from "./lib/sitemapXml";

const http = httpRouter();
http.route({ path: "/sitemap.xml", method: "GET", handler: httpAction(async ctx => {
  const entries = await ctx.runQuery(internal.sitemap.entries, {});
  return new Response(renderSitemap(entries), { headers: {
    "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
  } });
}) });
export default http;
