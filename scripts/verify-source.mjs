import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const expected = {
  'index.tsx': '4212f64c2d47ab5e5c6e6a0b3d4b9536a87018bd09023532d6bf4e643c835b9b',
  'styles.ts': 'c0f3a1c59c4e98dfdb206a79e2a0b849d57842b4ea7d40f939c881b387919664',
  'data.ts': '506c8235ced086edcfa29c18533dfdcafa15b127537fe7493cfc788d4a82f015',
};
for (const [file, hash] of Object.entries(expected)) {
  const content = await readFile(new URL(`../vendor/colourist-reel-page/${file}`, import.meta.url));
  const actual = createHash('sha256').update(content).digest('hex');
  if (actual !== hash) throw new Error(`Source hash mismatch: ${file}`);
  console.info(`Verified ${file}`);
}
const ascii = await readFile(new URL('../vendor/ascii-logo/ascii-logo.tsx', import.meta.url));
if (createHash('sha256').update(ascii).digest('hex') !== 'c1ec8a5fbe4832a9ae78f97b975385bceacaa04f19d7b45138690a5a6190978d') {
  throw new Error('Source hash mismatch: ascii-logo.tsx');
}
console.info('Verified ascii-logo.tsx');
