import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const defaultOrigin = 'https://qvost.vercel.app';
const configured = process.env.SITE_URL || defaultOrigin;
const site = new URL(configured);
if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
  throw new Error('SITE_URL must be an HTTPS origin, such as https://qvost.vercel.app.');
}
const origin = site.origin;
const resolve = path => new URL(`../dist/${path}`, import.meta.url);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });

try {
  const { render, renderWork } = await server.ssrLoadModule('/src/entry-server.tsx');
  const template = (await readFile(resolve('index.html'), 'utf8')).replaceAll(defaultOrigin, escape(origin));
  if (!template.includes('<div id="root"></div>')) throw new Error('Missing prerender mount point.');
  const work = renderWork();
  const fallback = `<noscript><link rel="stylesheet" href="/work.css"><link rel="stylesheet" href="/footer.css"><style>#root{display:none}html,body{height:auto;overflow:auto}</style>${work}</noscript>`;
  const home = template.replace('<div id="root"></div>', () => `<div id="root">${render()}</div>`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/, () => fallback);
  await writeFile(resolve('index.html'), home);

  const head = template.slice(template.indexOf('<head>') + 6, template.indexOf('</head>'))
    .replace(/\s*<script type="module"[^>]*><\/script>/g, '')
    .replace(/\s*<link rel="stylesheet"[^>]*>/g, '')
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
    .replaceAll('qvost | Siddid Pandey, developer in Kathmandu', 'Projects by qvost | Siddid Pandey')
    .replaceAll('Siddid Pandey, known as qvost. Developer in Kathmandu, Nepal, building tools and systems with Rust, React and TypeScript. Independent AI research at Shaligram Labs.', 'Projects by qvost, Siddid Pandey: Statis, Strata, Reify, Vecta and tools for everyday life. Descriptions, live sites and source code.')
    .replaceAll(`${origin}/"`, `${origin}/work/"`);
  await mkdir(resolve('work/'), { recursive: true });
  await writeFile(resolve('footer.css'), await readFile(new URL('../components/ui/portfolio-footer.css', import.meta.url), 'utf8'));
  await writeFile(resolve('work/index.html'), `<!doctype html><html lang="en"><head>${head}<link rel="stylesheet" href="/work.css"><link rel="stylesheet" href="/footer.css"></head><body>${work}</body></html>`);
  await writeFile(resolve('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  await writeFile(resolve('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(origin)}/</loc></url><url><loc>${escape(origin)}/work/</loc></url></urlset>\n`);
  console.log(`Prerendered home and projects. Canonical origin: ${origin}`);
} finally {
  await server.close();
}
