import type { ShaligramLab } from '../components/ui/colourist-reel-page/lab-continuation';

// Verified against the lab's home, Reify, and manifesto pages on 2026-11-26.
export const shaligramLab = {
  name: 'Shaligram Labs',
  location: 'Independent AI research, Kathmandu',
  href: 'https://shaligramlabs.vercel.app/',
  researchHref: 'https://shaligramlabs.vercel.app/research/reify',
  systemHref: 'https://shaligramlabs.vercel.app/systems/reify',
  sourceHref: 'https://github.com/qvost/reify',
  manifestoHref: 'https://shaligramlabs.vercel.app/manifesto',
  description: 'My independent AI research lab in Kathmandu. I build small, typed interfaces that let agents use websites.',
  stages: [
    {
      id: 'profile', label: 'Match a profile', input: 'Known website', output: 'Cached request plan',
      description: 'Reify first checks for a curated profile. A match supplies the request plan and schema without live discovery.',
      code: 'profile.match(site, task)',
    },
    {
      id: 'compile', label: 'Compile the site', input: 'Live website data', output: 'Inferred JSON schema',
      description: 'On a cache miss, Reify reads the site\'s HTML and hydration data, then infers typed inputs and outputs.',
      code: 'schema.infer(site.data)',
    },
    {
      id: 'capture', label: 'Read the traffic', input: 'Network requests', output: 'Task-scoped MCP tools',
      description: 'When static data cannot resolve the task, Reify captures browser traffic through CDP and filters visual and tracking requests.',
      code: 'tools.mount(task)',
    },
  ],
} satisfies ShaligramLab;
