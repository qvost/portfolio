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
  const { render, renderWork, renderContact, renderLab, renderProject } = await server.ssrLoadModule('/src/entry-server.tsx');
  const template = (await readFile(resolve('index.html'), 'utf8')).replaceAll(defaultOrigin, escape(origin));
  if (!template.includes('<div id="root"></div>')) throw new Error('Missing prerender mount point.');
  const work = renderWork();
  const contact = renderContact();
  const lab = renderLab();
  const project = renderProject();
  const fallback = `<noscript><link rel="stylesheet" href="/work.css"><link rel="stylesheet" href="/footer.css"><style>#root{display:none}html,body{height:auto;overflow:auto}</style>${work}</noscript>`;
  const home = template.replace('<div id="root"></div>', () => `<div id="root">${render()}</div>`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/, () => fallback);
  await writeFile(resolve('index.html'), home);

  const baseHead = template.slice(template.indexOf('<head>') + 6, template.indexOf('</head>'))
    .replace(/\s*<script type="module"[^>]*><\/script>/g, '')
    .replace(/\s*<link rel="stylesheet"[^>]*>/g, '')
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
  const pageHead = ({ title, description, path }) => baseHead
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*("\s*\/?>)/, `$1${escape(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*("\s*\/?>)/, `$1${escape(`${origin}${path}`)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*("\s*\/?>)/, `$1${escape(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*("\s*\/?>)/, `$1${escape(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*("\s*\/?>)/, `$1${escape(`${origin}${path}`)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*("\s*\/?>)/, `$1${escape(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*("\s*\/?>)/, `$1${escape(description)}$2`);
  const standalone = (head, body) => `<!doctype html><html lang="en"><head>${head}<link rel="stylesheet" href="/work.css"><link rel="stylesheet" href="/footer.css"></head><body>${body}</body></html>`;
  const pages = [
    { path: 'work/', content: work, title: 'Siddid Pandey | Projects by qvost', description: 'Projects by Siddid Pandey, including Hana One, Lab Notes, Reify, Statis, and tools for everyday life. Descriptions, live sites, and source code.' },
    { path: 'contact/', content: contact, title: 'Contact Siddid Pandey | qvost', description: 'Contact Siddid Pandey (qvost), a developer in Kathmandu, Nepal. Email, GitHub, LinkedIn, and X.' },
    { path: 'lab/', content: lab, title: 'Shaligram Labs | AI research by Siddid Pandey', description: 'Shaligram Labs is Siddid Pandey’s independent AI research lab in Kathmandu, building typed interfaces that let agents use websites.' },
    { path: 'project/', content: project, title: 'Selected projects by qvost | Siddid Pandey', description: 'Explore selected projects by Siddid Pandey in an interactive drawing. Reify, Statis, Strata, and tools for everyday life with live sites and source code.' },
  ];
  await writeFile(resolve('footer.css'), await readFile(new URL('../components/ui/portfolio-footer.css', import.meta.url), 'utf8'));
  for (const page of pages) {
    await mkdir(resolve(page.path), { recursive: true });
    const head = pageHead({ ...page, path: `/${page.path}` });
    await writeFile(resolve(`${page.path}index.html`), standalone(head, page.content));
  }
  await writeFile(resolve('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  const urls = ['/', ...pages.map(page => `/${page.path}`)].map(path => `<url><loc>${escape(`${origin}${path}`)}</loc></url>`).join('');
  await writeFile(resolve('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
  console.log(`Prerendered home, contact, lab, projects, and work. Canonical origin: ${origin}`);
} finally {
  await server.close();
}
