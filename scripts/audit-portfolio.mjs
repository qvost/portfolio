import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const result = await build({ entryPoints: ["components/ui/deadspace-page/portfolio.ts"], bundle: true, platform: "node", format: "esm", write: false });
const source = result.outputFiles[0]?.text;
assert.ok(source, "Portfolio module must compile");
const portfolio = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
assert.deepEqual(portfolio.projects.map(project => project.name), ["Statis", "Strata", "Reify"], "Featured projects must match the requested selection and order");
for (const filename of ["components/ui/deadspace-page/portfolio-data.ts", "components/ui/deadspace-page/portfolio.ts", "components/ui/deadspace-page/index.tsx", "index.html", "README.md"]) {
  assert.doesNotMatch(await readFile(filename, "utf8"), /Manaslu/i, `Stale lab name in ${filename}`);
}
assert.equal(portfolio.profile.lab.name, "Shaligram Labs");
assert.equal(portfolio.profile.lab.url, "https://shaligramlabs.vercel.app/");
assert.equal(portfolio.projects.find(project => project.name === "Strata")?.source, "https://github.com/qvost/strata");
assert.equal(portfolio.profile.name, "Siddid Pandey");
assert.equal(portfolio.profile.location, "Kathmandu, Nepal");
for (const project of portfolio.repositories) {
  assert.equal(project.source, `https://github.com/qvost/${project.id}`, `Repository destination for ${project.name}`);
  const artwork = await readFile(`public${project.image}`, "utf8");
  assert.match(artwork, /<svg\s/, `${project.name} must have local vector artwork`);
  assert.match(artwork, new RegExp(project.name.toUpperCase()), `Artwork must identify ${project.name}`);
}
const adapter = await readFile("components/ui/deadspace-page/portfolio.ts", "utf8");
assert.match(adapter, /halftoneHandsMarkup\(\)/, "Footer must include the hands illustration");
console.info(`PASS: featured project order, ${portfolio.repositories.length} repository destinations and illustrations, identity, lab, footer, and stale-copy checks`);
