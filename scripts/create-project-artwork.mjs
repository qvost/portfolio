import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Original project illustrations. Run with Node; no drawing library is needed.
// The 5:6 format matches the existing grid and project detail images.
const root = new URL('../public/projects/', import.meta.url);
const C = { ink: '#242923', green: '#6c7952', line: '#bbc2b0', quiet: '#69705f', pale: '#d7ddcb', white: '#f6f5ef' };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const path = (d, stroke = C.ink, width = 3, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const circle = (x, y, r, fill = 'none', stroke = C.line, width = 2, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const rect = (x, y, w, h, fill = C.white, radius = 0, stroke = C.line, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
const text = (value, x, y, size = 22, fill = C.quiet, extra = '') => `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" ${extra}>${escape(value)}</text>`;
const group = (content, transform, extra = '') => `<g transform="${transform}" ${extra}>${content}</g>`;
const sequence = (count, draw) => Array.from({ length: count }, (_, index) => draw(index)).join('');

function cover({ slug, name, subtitle, stack, ground, drawing, description }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1080" viewBox="0 0 900 1080" role="img" aria-labelledby="title desc">
<title id="title">${escape(name)} project illustration</title>
<desc id="desc">${escape(description)}</desc>
<defs><pattern id="dot-grid" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="1.15" fill="${C.line}" opacity=".55"/></pattern></defs>
<rect width="900" height="1080" fill="${ground}"/>
<rect x="54" y="274" width="792" height="590" fill="url(#dot-grid)"/>
${text(name, 60, 121, name.length > 12 ? 62 : 72, C.ink, 'letter-spacing="-3.4"')}
${text(subtitle, 64, 172, 24)}
${drawing}
${path('M64 948H836', C.line, 1.5)}
${text(stack, 64, 1000, 21)}
${text('qvost', 836, 1000, 21, C.quiet, 'text-anchor="end"')}
</svg>\n`;
}

function statis() {
  const wave = 'M215 0h50v-48h68v48h58v-48h68v48h58v-48h68v48h78';
  return circle(450, 570, 258, 'none', C.line, 2, 'stroke-dasharray="3 10"') +
    sequence(3, index => {
      const y = 418 + index * 145;
      return rect(164, y - 68, 572, 110, index === 1 ? C.pale : C.white, 15) +
        group(path(wave, index === 1 ? C.green : C.ink, 5), `translate(0 ${y})`) +
        circle(197, y - 22, 6, C.green, C.green) + circle(702, y - 22, 6, C.green, C.green);
    }) + path('M766 414c52 42 52 260 0 302m0 0 1-23m-1 23 23-4', C.green, 4) +
    text('same seed', 190, 842, 20) + text('same result', 710, 842, 20, C.quiet, 'text-anchor="end"');
}

function strata() {
  const plane = (y, fill) => `<path d="M450 ${y} 774 ${y + 146} 450 ${y + 292} 126 ${y + 146}Z" fill="${fill}" stroke="${C.line}" stroke-width="2"/>`;
  const grid = sequence(5, index => {
    const step = index / 4;
    const x = 126 + step * 324;
    const y = 498 - step * 146;
    return path(`M${x} ${y}l324 146M${900 - x} ${y}l-324 146`, C.line, 1.5);
  });
  const nodes = [[300, 485], [435, 414], [578, 480], [452, 548], [596, 607], [340, 605], [455, 680]];
  return plane(514, '#d8dece') + plane(432, '#e4e8dc') + plane(350, C.white) + grid +
    path('M300 485 435 414 578 480 452 548 340 605 455 680 596 607 452 548 300 485', C.green, 5) +
    path('M435 414v-65M578 480v-65M455 680v65', C.line, 2, 'stroke-dasharray="5 8"') +
    nodes.map(([x, y], index) => circle(x, y, index === 3 ? 19 : 10, index === 3 ? C.ink : C.green, C.white, 3)).join('') +
    circle(452, 548, 39, 'none', C.green, 2, 'stroke-dasharray="3 6"');
}

function reify() {
  const wires = sequence(4, index => {
    const y = 370 + index * 125;
    return rect(106, y - 27, 108, 54, C.white, 9) +
      path(`M214 ${y}H260C330 ${y} 306 550 382 550`, C.green, 3) +
      sequence(3, dot => circle(129 + dot * 25, y, 3.5, C.quiet, 'none'));
  });
  const outputs = sequence(3, index => {
    const y = 400 + index * 150;
    return path(`M518 550C595 550 563 ${y} 636 ${y}H676`, C.green, 4) +
      rect(657, y - 44, 119, 88, C.white, 10) +
      text('{ }', 716, y + 13, 36, C.green, 'text-anchor="middle"');
  });
  const pins = sequence(5, index => path(`M${406 + index * 22} 466v-18M${406 + index * 22} 634v18`, C.ink, 3));
  return wires + outputs + pins + rect(365, 466, 170, 168, C.ink, 18, C.ink) +
    path('m420 518-27 32 27 32m60-64 27 32-27 32', C.white, 6) +
    text('discover', 160, 843, 21, C.quiet, 'text-anchor="middle"') +
    text('compile', 450, 843, 21, C.quiet, 'text-anchor="middle"') +
    text('call', 716, 843, 21, C.quiet, 'text-anchor="middle"');
}

function vecta() {
  const sheet = (changed = false) => rect(0, 0, 345, 450, changed ? C.white : '#d7dccf', 13) +
    path('M30 66H315', C.line, 2) + sequence(6, index => circle(32 + index * 13, 33, 2.5, C.quiet, 'none')) +
    sequence(8, row => {
      const lengths = [188, 124, 226, 160, 202, 143, 218, 110];
      const isChange = changed && [2, 3, 6].includes(row);
      return text(`${row.toString(16).padStart(2, '0')}`, 28, 112 + row * 40, 13, C.quiet) +
        rect(69, 98 + row * 40, lengths[row] + (isChange ? 16 : 0), 12, isChange ? C.green : C.line, 2, 'none');
    });
  return group(sheet(), 'translate(155 385) rotate(-9 172 225)') +
    group(sheet(true), 'translate(380 315) rotate(7 172 225)') +
    path('M272 790v32h350v-32', C.green, 4) +
    circle(448, 822, 12, C.green, C.white, 3) + text('before', 220, 325, 20) + text('after', 655, 833, 20);
}

function hisaab() {
  const ledger = rect(0, 0, 356, 464, C.white, 8) + text('Rs.', 33, 65, 38, C.ink) +
    path('M32 100H324', C.line, 2) +
    sequence(5, index => rect(33, 141 + index * 44, 129 - index % 3 * 22, 10, C.line, 2, 'none') + rect(247, 141 + index * 44, 75, 10, C.line, 2, 'none')) +
    path('M33 389H323', C.line, 2) + rect(210, 414, 112, 14, C.green, 2, 'none');
  return circle(450, 559, 252, '#dce0d1', 'none') +
    group(ledger, 'translate(227 307) rotate(-9 178 232)') +
    circle(645, 672, 105, C.green, C.white, 5) + circle(645, 672, 82, 'none', '#dce0d1', 2) +
    path('m605 672 27 27 55-58', C.white, 8) +
    path('M142 454h42m-21-21v42M697 338h42m-21-21v42', C.green, 3);
}

function samayamiiti() {
  const dateGrid = rect(465, 360, 277, 373, C.white, 13) + path('M465 430h277', C.line, 2) +
    path('M521 344v34M686 344v34', C.ink, 8) +
    sequence(28, index => {
      const x = 498 + index % 7 * 35;
      const y = 478 + Math.floor(index / 7) * 49;
      return index === 17 ? rect(x - 12, y - 13, 26, 26, C.green, 5, 'none') : circle(x, y, 3, C.line, 'none');
    });
  const ticks = sequence(60, index => {
    const angle = index / 60 * Math.PI * 2;
    const inner = index % 5 === 0 ? 174 : 187;
    return path(`M${390 + Math.sin(angle) * inner} ${602 - Math.cos(angle) * inner}L${390 + Math.sin(angle) * 198} ${602 - Math.cos(angle) * 198}`, index % 5 === 0 ? C.ink : C.line, index % 5 === 0 ? 3 : 1.5);
  });
  return group(dateGrid, 'rotate(9 600 546)') + circle(390, 602, 229, C.white, C.line, 2) +
    `<path d="M390 602V389A213 213 0 0 1 574.5 708.5Z" fill="${C.pale}"/>` + ticks +
    path('M390 458v144l108 60', C.ink, 10) + path('M390 602 302 690', C.green, 3) + circle(390, 602, 10, C.green, C.white, 3);
}

async function shaligram() {
  const mark = await readFile(new URL('../public/assets/shaligram/mark.svg', import.meta.url), 'utf8');
  // Embed the user's mark directly: SVG images cannot rely on external assets.
  const symbol = mark.replace(/<svg\b[^>]*>/, '<svg x="280" y="385" width="340" height="340" viewBox="0 0 420 420" color="#242923">');
  const dots = sequence(16, index => {
    const angle = index / 16 * Math.PI * 2;
    return circle(450 + Math.cos(angle) * 269, 555 + Math.sin(angle) * 269, index % 4 === 0 ? 6 : 2, index % 4 === 0 ? C.green : C.line, 'none');
  });
  return circle(450, 555, 237, '#dce1d2', 'none') + circle(450, 555, 269, 'none', C.line, 2) +
    circle(450, 555, 208, 'none', C.green, 1.5, 'stroke-dasharray="3 8"') +
    path('M145 555H755M450 250V860', C.line, 1.5) + symbol + dots;
}

function nitroFan() {
  const blades = sequence(7, index => group(`<path d="M450 514C451 465 474 415 537 384C582 362 624 386 635 425C591 428 557 451 536 487C523 510 514 536 511 557Z" fill="${index % 2 ? '#abb79b' : C.green}" stroke="${C.white}" stroke-width="3"/>`, `rotate(${index * 360 / 7} 450 568)`));
  return rect(156, 277, 588, 582, '#dce1d6', 36) +
    sequence(4, index => circle(index % 2 ? 715 : 185, index < 2 ? 306 : 830, 4.5, C.quiet, 'none')) +
    circle(450, 568, 240, C.white, C.line, 2) + circle(450, 568, 218, 'none', C.line, 2) +
    blades + circle(450, 568, 64, C.ink, C.white, 5) + circle(450, 568, 40, 'none', C.line, 2) +
    path('M388 822h124', C.green, 5) + circle(363, 822, 4, C.green, 'none');
}

function seedheMaut() {
  const record = (cx, cy, r, light = false) => circle(cx, cy, r, light ? '#d4dbc7' : C.ink, light ? C.line : C.ink, 2) +
    sequence(8, index => circle(cx, cy, r - 18 - index * 9, 'none', light ? '#b4bea5' : '#485040', 1.5)) +
    circle(cx, cy, r * .31, light ? C.ink : '#b6c19f', 'none') + circle(cx, cy, 6, C.white, 'none');
  const wave = sequence(45, index => {
    const x = 186 + index * 12;
    const h = 6 + Math.abs(Math.sin(index * .73) * Math.sin(index * .19)) * 47;
    return path(`M${x} ${843 - h}v${h * 2}`, index > 23 ? C.line : C.green, 4);
  });
  return record(565, 450, 174, true) + record(354, 583, 220) +
    path('M565 416v70m-18-60 36 48M335 565v36m37-36v36', C.white, 5) + wave;
}

function sanofi() {
  const rungs = sequence(17, index => {
    const y = 336 + index * 29;
    const x = Math.sin(index / 16 * Math.PI * 2) * 116;
    return path(`M${450 - x} ${y}H${450 + x}`, C.line, 3) +
      circle(450 - x, y, 4, C.green, 'none') + circle(450 + x, y, 4, C.ink, 'none');
  });
  const strand = (flip = false) => {
    const points = sequence(81, index => {
      const t = index / 80;
      return `${index ? 'L' : 'M'}${450 + Math.sin(t * Math.PI * 2) * (flip ? -116 : 116)} ${336 + t * 464}`;
    });
    return path(points, flip ? C.green : C.ink, 7);
  };
  const molecule = (cx, cy, r) => {
    const points = sequence(6, index => `${index ? 'L' : 'M'}${cx + Math.sin(index / 6 * Math.PI * 2) * r} ${cy - Math.cos(index / 6 * Math.PI * 2) * r}`) + 'Z';
    return path(points, C.line, 2) + circle(cx, cy - r, 5, C.green, 'none');
  };
  return circle(450, 565, 256, '#d9dfcf', 'none') + molecule(234, 381, 40) + molecule(698, 726, 48) +
    rungs + strand() + strand(true) +
    path('M171 630h61m-31-31v62M670 379h52m-26-26v52', C.green, 2);
}

const projects = [
  { slug: 'statis', name: 'Statis', subtitle: 'Deterministic execution', stack: 'Rust / Linux', ground: '#e9e7df', drawing: statis(), description: 'Three identical execution traces with matching checkpoints, connected by a replay loop.' },
  { slug: 'strata', name: 'Strata', subtitle: 'Vector search', stack: 'C++ / Python', ground: '#e4e8df', drawing: strata(), description: 'A search path travels through nodes across three layered vector planes.' },
  { slug: 'reify', name: 'Reify', subtitle: 'Infrastructure for agents', stack: 'Rust / MCP', ground: '#eeede8', drawing: reify(), description: 'Four website data inputs converge on a compiler and emerge as three callable tools.' },
  { slug: 'vecta', name: 'Vecta', subtitle: 'Binary analysis', stack: 'Rust / CI', ground: '#e4e6df', drawing: vecta(), description: 'Two offset binary reports reveal changes highlighted in muted green.' },
  { slug: 'hisaab', name: 'Hisaab', subtitle: 'Invoicing & records', stack: 'Next.js / IndexedDB', ground: '#efede4', drawing: hisaab(), description: 'A rupee ledger with rows of entries and a circular check mark.' },
  { slug: 'samayamiiti', name: 'Samayamiiti', subtitle: 'Calendar & time', stack: 'React / Vite', ground: '#e7e9e1', drawing: samayamiiti(), description: 'A finely marked analog clock overlaps a small calendar with one highlighted day.' },
  { slug: 'shaligram-labs', name: 'Shaligram Labs', subtitle: 'Research & infrastructure', stack: 'Next.js / TypeScript', ground: '#e9e7df', drawing: await shaligram(), description: 'The original Shaligram Labs mark centered within a field of research orbits.' },
  { slug: 'nitro-fan', name: 'nitro-fan', subtitle: 'Linux fan control', stack: 'Python / Linux', ground: '#e3e7e2', drawing: nitroFan(), description: 'A seven-bladed cooling fan inside a hardware enclosure.' },
  { slug: 'seedhemaut-tribute', name: 'Seedhe Maut', subtitle: 'Music & interaction', stack: 'React / GSAP', ground: '#e8e4db', drawing: seedheMaut(), description: 'Two overlapping vinyl records sit above a two-channel audio waveform.' },
  { slug: 'sonafi-site', name: 'Sanofi study', subtitle: 'Independent web concept', stack: 'React / TypeScript', ground: '#e6eae3', drawing: sanofi(), description: 'An abstract double helix with molecular outlines, illustrating an independent healthcare website concept.' },
];

await mkdir(root, { recursive: true });
for (const project of projects) await writeFile(new URL(`${project.slug}.svg`, root), cover(project));
console.info(`Created ${projects.length} original project covers.`);
