import type { APIRoute } from 'astro';

export const prerender = true;

const paths = [
  '',
  'method/',
  'ai-collaboration/',
  'about/',
  'projects/citibike/',
  'projects/adventureworks/',
  'projects/workbench/',
  'projects/qingdao-transit/',
  'projects/rnd-patent/',
];

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const urls = paths
    .map((path) => `  <url><loc>${new URL(`${base}${path}`, site)}</loc></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
