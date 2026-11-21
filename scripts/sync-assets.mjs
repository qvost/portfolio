import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const base = "https://ui.aryank.space/assets/deadspace-page";
const sequence = (prefix, count, extension) => Array.from({ length: count }, (_, i) => `${prefix}${i + 1}.${extension}`);
const assets = [
  "fonts/de-fonte-plus.ttf", "fonts/dm-mono.ttf", "fonts/stylish.ttf",
  "global/logo.svg", "lab/hero-visual.png", "site-icon.png",
  ...sequence("project/project_", 5, "jpg"),
  ...Array.from({ length: 5 }, (_, i) => `work/work_0${i + 1}.jpg`),
  ...sequence("contact/contact_icon_", 5, "png"),
  ...sequence("contact/icon_", 10, "svg"),
  "sfx/menu-close.mp3", "sfx/menu-open.mp3", "sfx/menu-select.mp3",
];
const failures = [];
for (let i = 0; i < assets.length; i += 4) {
  await Promise.all(assets.slice(i, i + 4).map(async asset => {
    try {
      const response = await fetch(`${base}/${asset}`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (response.headers.get("content-type")?.includes("text/html")) throw new Error("Received HTML instead of an asset");
      const target = resolve(project, "public/assets/deadspace-page", asset);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) throw new Error("Empty response");
      await mkdir(dirname(target), { recursive: true });
      await writeFile(`${target}.partial`, bytes);
      await rename(`${target}.partial`, target);
      console.info(`Saved ${asset} (${bytes.length} bytes)`);
    } catch (error) {
      failures.push(asset);
      console.error(`Failed ${asset}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }));
}
if (failures.length) {
  process.exitCode = 1;
  console.error(`${failures.length} assets could not be downloaded. Hosted asset URLs remain the default.`);
} else {
  console.info(`Saved all ${assets.length} original assets. Set VITE_ASSET_BASE=/assets/deadspace-page to self-host them.`);
}
