import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';

// Only assets currently used by the portfolio. No film media is downloaded.
const assets = [
  { source: 'https://ui.aryank.space/assets/colourist-reel-page/booton-medium.woff2', target: 'assets/colourist-reel-page/booton-medium.woff2' },
  { source: 'https://shaligramlabs.vercel.app/shaligram-mark.svg', target: 'assets/shaligram/mark.svg' },
];
for (const asset of assets) {
  const destination = new URL(`../public/${asset.target}`, import.meta.url);
  await mkdir(new URL('.', destination), { recursive: true });
  let existing;
  try { existing = await stat(destination); } catch { /* Download only missing files. */ }
  if (existing?.size) continue;
  const response = await fetch(asset.source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error(`Could not fetch ${asset.target}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length) throw new Error(`Empty asset: ${asset.target}`);
  const temporary = new URL(`${destination.href}.partial`);
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
}
// The sampler reads bright pixels against black; keep the original geometry intact.
const mark = await readFile(new URL('../public/assets/shaligram/mark.svg', import.meta.url), 'utf8');
await writeFile(new URL('../public/assets/shaligram/mark-ascii.svg', import.meta.url), mark.replaceAll('fill="currentColor"', 'fill="#ffffff"'));
console.info('Portfolio font, lab mark, and ASCII sampling mask are available.');
