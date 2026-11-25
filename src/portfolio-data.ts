import type { ColouristProject, ColouristSite } from '../components/ui/colourist-reel-page';

export const portfolioSite = {
  name: 'qvost',
  email: 'qvostwon@gmail.com',
  instagramUrl: 'https://github.com/qvost',
  instagramHandle: 'GitHub',
  location: 'Kathmandu, Nepal',
  timezone: 'Asia/Kathmandu',
  role: 'developer',
  titleSuffix: 'building tools and systems.',
  subTitle: 'Siddid Pandey, based in Kathmandu, Nepal.\nRust, React and independent AI research at Shaligram Labs.',
  description: "I'm Siddid, a developer who goes by qvost.\n\nI work on deterministic systems and infrastructure for agents at Shaligram Labs. I also make tools for everyday life and websites with custom motion and interaction.\n\nMost of my systems code is Rust. On the web, I work with React and TypeScript.\n\nHave something in mind? Write to me.",
  featuredLogos: [],
  builtBy: { label: 'qvost', href: 'https://github.com/qvost' },
  socials: [
    { label: 'Shaligram Labs', href: 'https://shaligramlabs.vercel.app/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/qvost/' },
    { label: 'X', href: 'https://x.com/qvostlost' },
  ],
} satisfies ColouristSite;

const work = [
  {
    slug: 'statis', client: 'Statis', title: 'Deterministic execution', type: 'systems',
    tileColor: '#e06641',
    description: 'Runs unmodified Linux binaries with seeded randomness and a virtual clock to make execution reproducible.',
    stack: 'Rust / Linux', href: 'https://statis-linux.vercel.app/',
  },
  {
    slug: 'strata', client: 'Strata', title: 'Vector search', type: 'systems',
    tileColor: '#5a74ac',
    description: 'Searches HNSW graphs with compact binary signatures, then refines the results with scalar quantization to reduce memory traffic.',
    stack: 'C++ / Python', href: 'https://strata-research.vercel.app/',
  },
  {
    slug: 'reify', client: 'Reify', title: 'Infrastructure for agents', type: 'systems',
    tileColor: '#a163ad',
    description: 'Compiles live web requests into typed MCP tools that an agent can call for a specific task.',
    stack: 'Rust / MCP', href: 'https://shaligramlabs.vercel.app/',
  },
  {
    slug: 'vecta', client: 'Vecta', title: 'Binary analysis', type: 'systems',
    tileColor: '#62957e',
    description: 'Compares compiled binaries for section growth, symbol changes, and runtime requirements. Includes a command-line tool, CI checks, and a web report viewer.',
    stack: 'Rust / CI', href: 'https://vecta-gate.vercel.app/',
  },
  {
    slug: 'hisaab', client: 'Hisaab', title: 'Invoicing & records', type: 'web',
    tileColor: '#c39d32',
    description: 'Invoicing and remittance tracking for Nepali contractors. It stores records in the browser and supports Bikram Sambat dates and currency conversion.',
    stack: 'Next.js / IndexedDB', href: 'https://hisaab-np.vercel.app/',
  },
  {
    slug: 'samayamiiti', client: 'Samayamiiti', title: 'Calendar & time', type: 'web',
    tileColor: '#719aaf',
    description: 'A Nepali calendar with a clock, Bikram Sambat date conversion, and world times. Includes a fullscreen clock and optional ambient sounds.',
    stack: 'React / Vite', href: 'https://samayamiiti.vercel.app/',
  },
  {
    slug: 'shaligram-labs', client: 'Shaligram Labs', title: 'Research & infrastructure', type: 'web',
    tileColor: '#5e70cc',
    description: 'The lab website and research publication for Reify. It documents the compiler pipeline, experiments, and how to connect an agent.',
    stack: 'Next.js / TypeScript', href: 'https://shaligramlabs.vercel.app/',
  },
  {
    slug: 'nitro-fan', client: 'nitro-fan', title: 'Linux fan control', type: 'experiments',
    tileColor: '#8b979d',
    description: 'Controls fan speed and reads temperatures on Acer Nitro V 15 laptops running Linux. Includes a thermal daemon and JSON output for status bars.',
    stack: 'Python / Linux', href: 'https://github.com/qvost/nitro-fan#readme',
  },
  {
    slug: 'seedhemaut-tribute', client: 'Seedhe Maut', title: 'Music & interaction', type: 'experiments',
    tileColor: '#b36544',
    description: 'A tribute to Seedhe Maut with scroll-driven discography, searchable tracklists, and album artwork. Built with React and GSAP.',
    stack: 'React / GSAP', href: 'https://seedhe-maut-theta.vercel.app/',
  },
  {
    slug: 'sonafi-site', client: 'Sanofi study', title: 'Website concept', type: 'experiments',
    tileColor: '#9673b6',
    description: 'An independent Sanofi website concept, executive pitch, and research dossier. Includes clinical-program filters, search, and a film dialog.',
    stack: 'React / TypeScript', href: 'https://github.com/qvost/sonafi-site#readme',
  },
] satisfies Array<{
  slug: string; client: string; title: string; type: ColouristProject['type'];
  tileColor: string; description: string; stack: string; href: string;
}>;

export const portfolioProjects: ColouristProject[] = work.map(project => ({
  ...project,
  year: '',
  source: `https://github.com/qvost/${project.slug}`,
  poster: `/projects/${project.slug}.svg`,
  credits: [
    { role: 'Code & design', title: 'Siddid Pandey', link: 'https://github.com/qvost' },
  ],
}));
