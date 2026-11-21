import { DEADSPACE_ROUTE_FRAGMENTS, type DeadspaceRoute } from "./fragments";
import { halftoneHandsMarkup } from "../halftone-hands";
import { profile, projects, repositories } from "./portfolio-data";

export { profile, projects, repositories } from "./portfolio-data";
export type { DeadspaceRoute } from "./fragments";

const monogram = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M14 14h52v52H14V14Zm12 12v28h28V26H26Z"/><path d="m51 59 8-8 25 25-8 8z"/></svg>';

function external(href: string) {
  return href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
}

function projectCards() {
  return projects.map((project, index) => `
    <article class="home-project">
      <a class="project-art" href="${project.href}"${external(project.href)} aria-label="${project.action}: ${project.name}">
        <img src="${project.image}" alt="${project.name} system concept diagram" width="900" height="1080" loading="lazy" />
        <span class="art-caption mono">System / ${String(index + 1).padStart(2, "0")}</span>
      </a>
      <div class="project-caption"><h3>${project.name}</h3><span class="mono">${project.stack}</span></div>
      <p>${project.description}</p>
      <div class="project-links"><a class="text-link" href="${project.href}"${external(project.href)}>${project.action}</a><a class="text-link" href="${project.source}"${external(project.source)}>Source</a></div>
    </article>`).join("");
}

function homeSections() {
  return `
    <section class="home-about" id="about">
      <div class="section-top mono"><span>01 / About me</span><span>Kathmandu, Nepal</span></div>
      <div class="about-layout">
        <span class="about-symbol" aria-hidden="true">${monogram}</span>
        <div>
          <h2 data-animate-variant="slide" data-animate-type="lines">I'm Siddid.<br />I build.</h2>
          <p class="about-statement" data-animate-variant="slide" data-animate-type="lines">I build tools for repeatable program execution and for agents that use the web.</p>
          <div class="about-detail"><p><a class="inline-link" href="${profile.lab.url}"${external(profile.lab.url)}>Shaligram Labs</a><br />Independent research in Kathmandu.</p><p>I've written three research papers on Reify, Statis, and Strata.</p></div>
          <a href="/lab" class="outline-link">About the lab</a>
        </div>
      </div>
      <div class="running-line" aria-hidden="true"><div>Statis / Strata / Reify / Statis / Strata / Reify / </div></div>
    </section>
    <section class="home-work" id="selected-work">
      <div class="section-top mono"><span>02 / Selected projects</span><a href="/work">All repositories</a></div>
      <h2 data-animate-variant="slide" data-animate-type="lines">Selected<br />work.</h2>
      <div class="home-projects">${projectCards()}</div>
    </section>`;
}

function footer() {
  return `<footer class="portfolio-footer">
    <div class="footer-container">
      <div class="section-top mono"><span>03 / Contact</span><a href="${profile.lab.url}"${external(profile.lab.url)}>Shaligram Labs</a></div>
      <a class="footer-invitation" href="mailto:${profile.email}">Say<br />hello.</a>
      ${halftoneHandsMarkup()}
      <div class="footer-contacts"><a class="footer-email" href="mailto:${profile.email}">${profile.email}</a><div class="footer-socials"><a href="${profile.github}"${external(profile.github)}>GitHub</a><a href="${profile.linkedin}"${external(profile.linkedin)}>LinkedIn</a><a href="${profile.x}"${external(profile.x)}>X</a></div></div>
      <div class="footer-colophon mono"><span>© ${new Date().getFullYear()} ${profile.name} / qvost</span><span>Kathmandu, Nepal · NPT +05:45</span></div>
    </div>
  </footer>`;
}

function setText(root: ParentNode, selector: string, text: string) {
  const element = root.querySelector(selector);
  if (element) element.textContent = text;
}
function setHTML(root: ParentNode, selector: string, html: string) {
  const element = root.querySelector(selector);
  if (element) element.innerHTML = html;
}

export function getDeadspaceFragment(route: DeadspaceRoute, assetBase: string, ownerDocument = document) {
  const template = ownerDocument.createElement("template");
  template.innerHTML = DEADSPACE_ROUTE_FRAGMENTS[route].replaceAll("__ASSET_BASE__", assetBase.replace(/\/$/, ""));
  const root = template.content;
  setHTML(root, ".nav-location p", '<span class="location-dot" aria-hidden="true"></span> Kathmandu, NP');
  setHTML(root, ".nav-clock p", '00 <span>:</span> 00 NPT');
  setHTML(root, ".nav-logo a", monogram);
  root.querySelector(".nav-logo a")?.setAttribute("aria-label", "qvost, home");
  const nav = root.querySelector("nav");
  nav?.setAttribute("aria-label", "Main navigation");
  nav?.insertAdjacentHTML("beforeend", `<div class="quick-nav"><a href="/work"${route === "/work" ? ' aria-current="page"' : ""}>Work</a><a href="/lab"${route === "/lab" ? ' aria-current="page"' : ""}>About</a><a href="/contact"${route === "/contact" ? ' aria-current="page"' : ""}>Contact</a></div>`);
  root.querySelectorAll<HTMLAnchorElement>(".menu-overlay-items a").forEach((link, index) => {
    link.href = index === 0 ? profile.github : profile.linkedin;
    link.textContent = index === 0 ? "GitHub" : "LinkedIn";
  });
  setText(root, ".menu-overlay-footer a:first-child", "Shaligram / About");
  setText(root, ".menu-overlay-footer a:last-child", "Contact me");
  const toggle = root.querySelector(".menu-toggle-btn");
  toggle?.setAttribute("role", "button");
  toggle?.setAttribute("tabindex", "0");
  toggle?.setAttribute("aria-label", "Open navigation menu");
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.setAttribute("aria-controls", "explore-menu");
  toggle?.insertAdjacentHTML("beforeend", '<span class="menu-caption mono">Menu</span>');
  const overlay = root.querySelector(".menu-overlay");
  overlay?.setAttribute("id", "explore-menu");
  overlay?.setAttribute("role", "dialog");
  overlay?.setAttribute("aria-label", "Portfolio navigation");
  overlay?.setAttribute("aria-modal", "true");
  overlay?.setAttribute("aria-hidden", "true");
  const close = root.querySelector(".close-btn");
  close?.setAttribute("role", "button");
  close?.setAttribute("tabindex", "0");
  close?.setAttribute("aria-label", "Close navigation menu");
  root.querySelectorAll("footer, .contact-footer").forEach(element => element.remove());

  if (route === "/") {
    setText(root, ".progress-bar-copy p:last-child", "qvost / Loading portfolio");
    setText(root, ".hero h1", "qvost");
    setText(root, ".hero > p", "Siddid Pandey / Software & systems");
    const hero = root.querySelector(".hero");
    root.querySelector("#skyline")?.remove();
    hero?.insertAdjacentHTML("afterbegin", '<div class="hero-halftone-slot"></div>');
    const heading = hero?.querySelector("h1");
    for (const attribute of ["data-animate-variant", "data-animate-on-scroll", "data-animate-delay"]) heading?.removeAttribute(attribute);
    root.querySelector(".hero-footer")?.insertAdjacentHTML("beforebegin", '<div class="hero-actions"><a href="#selected-work" class="hero-cta">View my work</a><a href="#about" class="hero-scroll mono">About me</a></div><div class="hero-side mono" aria-hidden="true">Execution / Search / Agents</div>');
    setText(root, ".hero-footer p:first-child", "3 research papers / Kathmandu");
    setText(root, ".hero-footer p:last-child", "Statis · Strata · Reify");
    hero?.insertAdjacentHTML("afterend", homeSections());
  }
  if (route === "/work") {
    setHTML(root, ".work-hero h1", "Work<br />archive");
    setText(root, ".work-hero-footer p:first-child", "[ GitHub / qvost ]");
    setText(root, ".work-hero-footer p:last-child", `${repositories.length} public repositories`);
    root.querySelector(".work-hero")?.insertAdjacentHTML("beforeend", `<p class="work-intro">${repositories.length} public repositories.<br />Systems research and web projects.</p><a href="#projects" class="work-down mono">Browse the repositories</a>`);
    root.querySelector(".work-items")?.setAttribute("id", "projects");
    setHTML(root, ".work-items .container", repositories.map((project, index) => `<div class="work-item-row" id="work-item-row-${index + 1}"><article class="archive-project"><a class="archive-art" href="${project.href}"${external(project.href)} aria-label="${project.action}: ${project.name}"><div class="work-item"><img src="${project.image}" alt="${project.name} concept illustration" loading="lazy" decoding="async" width="900" height="1080" /></div></a><div class="archive-copy"><span class="mono">${String(index + 1).padStart(2, "0")} / ${project.category}</span><h2>${project.name}</h2><p>${project.description}</p><span class="mono">${project.stack}</span><div class="project-links"><a class="text-link" href="${project.href}"${external(project.href)}>${project.action}</a><a class="text-link" href="${project.source}"${external(project.source)}>Source</a></div></div></article></div>`).join(""));
  }
  if (route === "/project") {
    const reify = projects.find(project => project.id === "reify");
    setText(root, ".project-hero h1", "Reify");
    setText(root, ".project-hero-header > p", "Live traffic. Callable tools.");
    setText(root, ".project-hero-meta-col:first-child p", "Independent research / Open source");
    const tags = root.querySelectorAll(".project-hero-meta-col:nth-child(2) p");
    ["Live traffic observation", "Task-scoped tools", "Rust / MCP"].forEach((value, index) => { if (tags[index]) tags[index].textContent = value; });
    if (reify) root.querySelector(".project-hero-header")?.insertAdjacentHTML("beforeend", `<a class="outline-link source-link" href="${reify.source}"${external(reify.source)}>View repository</a><a class="project-research-link mono" href="https://shaligramlabs.vercel.app/systems/reify/" target="_blank" rel="noopener noreferrer">Reify at Shaligram Labs</a>`);
    const paragraphs = root.querySelectorAll(".project-info-col > p.lg");
    if (paragraphs[0]) paragraphs[0].textContent = "Reify turns a website's live network traffic into a typed interface for agents. It observes the requests behind the page, infers their JSON schemas, and compiles a small set of MCP tools around the task at hand.";
    if (paragraphs[1]) paragraphs[1].textContent = "The Rust workspace connects traffic capture, schema compilation, and a stateless MCP gateway. Agents can discover and call task-scoped tools through one entry point. The public repository documents the architecture, command-line workflow, and browser companion for authenticated sessions.";
    const detailHTML = [
      `<p class="type-mono">Project</p><p>Reify</p><br /><p class="type-mono">Builder</p><p>${profile.name}</p>`,
      '<p class="type-mono">Input</p><p>Live web traffic</p><br /><p class="type-mono">Output</p><p>Task-scoped MCP tools</p>',
      '<p class="type-mono">Core</p><p>Rust workspace</p><br /><p class="type-mono">Interface</p><p>Typed, stateless MCP</p>',
      '<p class="type-mono">Read the source</p><p><a class="text-link" href="https://github.com/qvost/reify#readme" target="_blank" rel="noopener noreferrer">Architecture & setup</a></p><br /><p class="type-mono">Artwork</p><p>BLANK spatial studies</p>',
    ];
    root.querySelectorAll(".project-info-sub-col").forEach((detail, index) => { detail.innerHTML = detailHTML[index] || ""; });
    root.querySelectorAll(".project-img img").forEach(image => {
      image.setAttribute("crossorigin", "anonymous");
      image.setAttribute("loading", "lazy");
      image.setAttribute("decoding", "async");
    });
    root.querySelector(".project-images .container")?.insertAdjacentHTML("beforeend", '<p class="visual-note mono">Supporting spatial artwork / BLANK Deadspace. These are not software screenshots.</p>');
  }
  if (route === "/lab") {
    setHTML(root, ".lab-hero h1", "Shaligram<br />Labs");
    setText(root, ".lab-hero p", "Independent research. Kathmandu, Nepal.");
    const about = root.querySelectorAll(".lab-about h3");
    if (about[0]) about[0].textContent = "Shaligram Labs is my independent research lab in Kathmandu. I work on repeatable execution and interfaces that let agents call web services.";
    if (about[1]) about[1].textContent = "The focus is the foundation: deterministic execution, efficient search, and typed interfaces. Statis supervises binary execution. Strata explores quantized vector search. Reify turns observed web traffic into tools an agent can call.";
    root.querySelector(".lab-about .container")?.insertAdjacentHTML("beforeend", `<a class="outline-link lab-site-link" href="${profile.lab.url}"${external(profile.lab.url)}>Visit Shaligram Labs</a>`);
    setText(root, ".pie-transition-outro-header h3", "Live web requests become typed tools.");
    setText(root, ".pie-transition-footer p:first-child", "[ Shaligram Labs ]");
    setText(root, ".pie-transition-footer p:last-child", "Research / Infrastructure");
    setText(root, ".stats-header h3", "Research areas.");
    setText(root, ".stats-header p", "The projects I'm working on at Shaligram Labs.");
    const stats = [["OS", "Reproducible execution at the binary boundary.", "Statis / Rust / Linux"], ["ANN", "Compact navigation. Precise refinement.", "Strata / C++ / Python"], ["MCP", "Live traffic becomes a typed interface.", "Reify / Rust / Agents"], ["NP", "An independent lab in Kathmandu, Nepal.", "Shaligram Labs"]];
    root.querySelectorAll(".stat-item").forEach((item, index) => {
      const stat = stats[index];
      if (!stat) return;
      setText(item, "h1", stat[0] || ""); setText(item, "h3", stat[1] || ""); setText(item, "p", stat[2] || "");
    });
    setText(root, ".clients-header h2", "Working vocabulary");
  }
  if (route === "/contact") {
    root.querySelector(".contact-visual")?.setAttribute("aria-hidden", "true");
    root.querySelector(".contact-info")?.insertAdjacentHTML("beforebegin", '<div class="contact-heading"><span class="mono">Email or find me online</span><h1>Get in<br />touch.</h1><button class="copy-email mono" type="button" aria-live="polite">Copy email</button></div>');
    const rows = [["Local time", '<span class="contact-clock">00:00 NPT</span>'], ["Based in", profile.location], ["Email", `<a href="mailto:${profile.email}">${profile.email}</a>`], ["Code", `<a href="${profile.github}"${external(profile.github)}>github.com/qvost</a>`], ["LinkedIn", `<a href="${profile.linkedin}"${external(profile.linkedin)}>LinkedIn / qvost</a>`], ["Lab", `<a href="${profile.lab.url}"${external(profile.lab.url)}>Shaligram Labs</a>`], ["Elsewhere", `<a href="${profile.x}"${external(profile.x)}>@qvostlost</a>`]];
    root.querySelectorAll(".contact-info-row").forEach((row, index) => {
      const data = rows[index];
      if (data) row.innerHTML = `<p>${data[0]}</p><p>${data[1]}</p>`;
    });
  }
  template.innerHTML += footer() + '<button class="sound-toggle mono" type="button" aria-pressed="false" aria-label="Enable interface sounds">Sound off <span aria-hidden="true">◌</span></button><div class="target-cursor" aria-hidden="true"><span></span></div><div class="cursor-point" aria-hidden="true"></div><a class="back-top mono" href="#top" aria-label="Back to top" tabindex="-1">Top</a>';
  return template.innerHTML;
}
