const SITE_URL = "https://www.ragdollbleuroi.eu";
export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!);
}
export function renderSitemap(entries: Array<{path: string; updatedAt?: number}>): string {
  const urls = entries.flatMap(entry => {
    const bg = SITE_URL + entry.path;
    const en = bg + "?lang=en";
    return [bg, en].map(url => `<url><loc>${escapeXml(url)}</loc>${entry.updatedAt ? `<lastmod>${new Date(entry.updatedAt).toISOString()}</lastmod>` : ""}<xhtml:link rel="alternate" hreflang="bg" href="${escapeXml(bg)}"/><xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(bg)}"/></url>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`;
}
