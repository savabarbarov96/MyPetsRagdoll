import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const backend = 'https://wandering-bobcat-37.convex.cloud';
async function query(path, args = {}) {
  const response = await fetch(`${backend}/api/query`, { method: 'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify({path,args,format:'json'}) });
  const result = await response.json();
  if (!response.ok || result.status !== 'success') throw new Error(`Published query failed: ${path}`);
  return result.value;
}
const [cats, gallery, heroes, articles] = await Promise.all([query('cats:getDisplayedCats'),query('gallery:getPublishedGalleryItems'),query('heroImages:getActiveHeroImages'),query('announcements:getPublishedAnnouncements')]);
const urls = [...new Set([...cats.flatMap(cat=>[cat.image,...cat.gallery]),...gallery.map(item=>item.imageUrl),...heroes.map(item=>item.src),...articles.flatMap(item=>[item.featuredImage,...(item.gallery||[])])].filter(Boolean))];
await mkdir('public/cats', {recursive:true});
const manifest = {};
for (const url of urls) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.convex.cloud')) continue;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(buffer).metadata();
  const key = createHash('sha256').update(url).digest('hex').slice(0,16);
  const maxWidth = metadata.width || 1280;
  const widths = [...new Set([320,640,960,1280].map(width=>Math.min(width,maxWidth)))];
  const variants = [];
  for (const width of widths) {
    const filename = `/cats/${key}-${width}.webp`;
    await sharp(buffer).rotate().resize({width,withoutEnlargement:true}).webp({quality:82}).toFile(`public${filename}`);
    variants.push(`${filename} ${width}w`);
  }
  manifest[url]={src:`/cats/${key}-${widths[Math.min(1,widths.length-1)]}.webp`,srcSet:variants.join(', '),width:metadata.width,height:metadata.height};
}
await writeFile('src/data/responsiveImages.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Optimized ${Object.keys(manifest).length} authentic published images; remote originals unchanged.`);
