import gsap from "gsap";
import type Lenis from "lenis";
import { profile } from "./portfolio-data";
import { createVisibleRenderLoop, getSceneBufferSize } from "./render-loop";

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const SOUND_STORAGE_KEY = "qvost-sound";
let cachedSoundEnabled: boolean | undefined;

function soundEnabled() {
  if (cachedSoundEnabled !== undefined) return cachedSoundEnabled;
  try { cachedSoundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) === "on"; }
  catch { cachedSoundEnabled = false; }
  return cachedSoundEnabled;
}

export function playInterfaceSound(url: string) {
  if (!soundEnabled()) return;
  const audio = new Audio(url);
  audio.volume = 0.25;
  void audio.play().catch(() => {});
}

function initCursor(root: HTMLElement) {
  const cursor = root.querySelector<HTMLElement>(".target-cursor");
  const point = root.querySelector<HTMLElement>(".cursor-point");
  if (!cursor || !point) return () => {};
  const media = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)");
  const controller = new AbortController();
  const signal = controller.signal;
  let frame = 0;
  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let previous = 0;
  let visible = false;
  let displayed = false;
  let link = false;
  let renderedLink = false;
  let pointX = Number.NaN;
  let pointY = Number.NaN;

  function hide() {
    visible = false;
    if (displayed) root.classList.remove("cursor-active");
    displayed = false;
    link = false;
    renderedLink = false;
    pointX = Number.NaN;
    pointY = Number.NaN;
    previous = 0;
    cursor?.classList.remove("is-pressed", "is-link");
    window.cancelAnimationFrame(frame);
    frame = 0;
  }
  function render(time: number) {
    if (!displayed) {
      root.classList.add("cursor-active");
      displayed = true;
    }
    const delta = previous ? Math.min(time - previous, 40) : 16;
    previous = time;
    const blend = 1 - Math.exp(-delta / 52);
    x += (tx - x) * blend;
    y += (ty - y) * blend;
    if (cursor) cursor.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0)`;
    if (pointX !== tx || pointY !== ty) {
      point?.style.setProperty("transform", `translate3d(${tx - 1.5}px, ${ty - 1.5}px, 0)`);
      pointX = tx;
      pointY = ty;
    }
    if (link !== renderedLink) {
      cursor?.classList.toggle("is-link", link);
      renderedLink = link;
    }
    if (Math.hypot(tx - x, ty - y) > 0.12 && visible) frame = window.requestAnimationFrame(render);
    else { frame = 0; previous = 0; }
  }
  function move(event: PointerEvent) {
    if (!media.matches || event.pointerType !== "mouse" || !(event.target instanceof Element) || !root.contains(event.target) || event.target.closest("input, textarea, select, [contenteditable=true]")) { hide(); return; }
    tx = event.clientX; ty = event.clientY;
    if (!visible) {
      x = tx; y = ty;
      visible = true;
    }
    link = !!event.target.closest("a, button, [role=button], .joystick");
    if (!frame) frame = window.requestAnimationFrame(render);
  }
  window.addEventListener("pointermove", move, { signal, passive: true });
  window.addEventListener("pointerdown", () => { if (visible) cursor.classList.add("is-pressed"); }, { signal });
  window.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"), { signal });
  window.addEventListener("blur", hide, { signal });
  document.addEventListener("pointerleave", hide, { signal });
  document.addEventListener("visibilitychange", hide, { signal });
  document.addEventListener("keydown", hide, { signal });
  media.addEventListener("change", hide, { signal });
  return () => { hide(); controller.abort(); };
}

export function initPortfolioControls(root: HTMLElement, lenis: Lenis) {
  const controller = new AbortController();
  const signal = controller.signal;
  const sound = root.querySelector<HTMLButtonElement>(".sound-toggle");
  const copy = root.querySelector<HTMLButtonElement>(".copy-email");
  const backTop = root.querySelector<HTMLElement>(".back-top");
  const toggle = root.querySelector<HTMLElement>(".menu-toggle-btn");
  const close = root.querySelector<HTMLElement>(".close-btn");
  const overlay = root.querySelector<HTMLElement>(".menu-overlay");
  const canvas = root.querySelector<HTMLCanvasElement>("#skyline");
  const symbol = root.querySelector<HTMLElement>(".about-symbol");
  const hands = root.querySelector<HTMLElement>(".halftone-hands");
  const reduced = prefersReducedMotion();
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cleanupCursor = initCursor(root);
  let copyTimer = 0;
  let active = true;
  let menuOpen = false;
  let backTopVisible: boolean | undefined;
  let handsBounds: DOMRect | null = null;
  let returnFocus: HTMLElement | null = null;
  const background = Array.from(root.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay);
  const initialInert = background.map(element => element.inert);

  function refreshSound() {
    cachedSoundEnabled = undefined;
    const on = soundEnabled();
    if (!sound) return;
    sound.innerHTML = `Sound ${on ? "on" : "off"} <span aria-hidden="true">${on ? "◉" : "◌"}</span>`;
    sound.setAttribute("aria-pressed", String(on));
    sound.setAttribute("aria-label", `${on ? "Disable" : "Enable"} interface sounds`);
  }
  function toggleSound() {
    try { localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled() ? "off" : "on"); } catch { /* Private storage keeps sound off. */ }
    refreshSound();
  }
  async function copyEmail() {
    if (!copy) return;
    try {
      await navigator.clipboard.writeText(profile.email);
      if (active) copy.textContent = "Email copied";
    } catch {
      if (active) copy.textContent = profile.email;
    }
    if (!active) return;
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => { copy.textContent = "Copy email"; }, 2500);
  }
  function keyboard(event: KeyboardEvent) {
    if (event.key === "Escape" && menuOpen) { event.preventDefault(); close?.click(); }
    if ((event.key === "Enter" || event.key === " ") && (event.target === toggle || event.target === close)) {
      event.preventDefault();
      if (event.target instanceof HTMLElement) event.target.click();
    }
    if (event.key !== "Tab" || !menuOpen || !overlay) return;
    const elements = Array.from(overlay.querySelectorAll<HTMLElement>('a[href], button, [tabindex="0"]'));
    const first = elements[0]; const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  function updateMenuState() {
    if (!overlay) return;
    const next = overlay.dataset.open === "true";
    if (next === menuOpen) return;
    menuOpen = next;
    overlay.setAttribute("aria-hidden", String(!next));
    toggle?.setAttribute("aria-expanded", String(next));
    overlay.inert = !next;
    if (next) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      background.forEach(element => { element.inert = true; });
      lenis.stop();
      close?.focus({ preventScroll: true });
    } else {
      background.forEach((element, index) => { element.inert = initialInert[index] ?? false; });
      lenis.start();
      returnFocus?.focus({ preventScroll: true });
    }
  }
  const observer = overlay ? new MutationObserver(updateMenuState) : null;
  if (overlay) {
    overlay.inert = true;
    observer?.observe(overlay, { attributes: true, attributeFilter: ["data-open"] });
  }
  function onScroll() {
    handsBounds = null;
    const visible = lenis.scroll > 500;
    if (visible !== backTopVisible) {
      backTopVisible = visible;
      backTop?.classList.toggle("visible", visible);
      backTop?.setAttribute("tabindex", visible ? "0" : "-1");
    }
    if (symbol && !reduced) symbol.style.transform = `rotate(${lenis.scroll * 0.035}deg)`;
  }
  function anchorClick(event: MouseEvent) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || !(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (href === "#top") {
      event.preventDefault();
      lenis.scrollTo(0, { immediate: reduced, duration: 0.85 });
      return;
    }
    const target = href ? document.getElementById(href.slice(1)) : null;
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    lenis.scrollTo(target, { immediate: reduced, duration: 0.85 });
  }
  refreshSound(); onScroll();
  window.addEventListener("storage", (event) => {
    if (event.key === SOUND_STORAGE_KEY || event.key === null) refreshSound();
  }, { signal });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshSound();
  }, { signal });
  sound?.addEventListener("click", toggleSound, { signal });
  copy?.addEventListener("click", copyEmail, { signal });
  root.addEventListener("keydown", keyboard, { signal });
  root.addEventListener("click", anchorClick, { signal });
  lenis.on("scroll", onScroll);

  const xTo = canvas && !reduced && finePointer ? gsap.quickTo(canvas, "x", { duration: 1.2, ease: "power3.out" }) : null;
  const yTo = canvas && !reduced && finePointer ? gsap.quickTo(canvas, "y", { duration: 1.2, ease: "power3.out" }) : null;
  let canvasVisible = false;
  let parallaxFrame = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  const canvasObserver = canvas && !reduced && finePointer ? new IntersectionObserver(entries => {
    canvasVisible = entries[entries.length - 1]?.isIntersecting ?? false;
  }) : null;
  if (canvas) canvasObserver?.observe(canvas);
  function parallax(event: PointerEvent) {
    if (menuOpen || !canvasVisible || event.pointerType !== "mouse") return;
    parallaxX = event.clientX;
    parallaxY = event.clientY;
    if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(() => {
      parallaxFrame = 0;
      if (!active || menuOpen || !canvasVisible) return;
      xTo?.((parallaxX / window.innerWidth - 0.5) * 14);
      yTo?.((parallaxY / window.innerHeight - 0.5) * 8);
    });
  }
  if (canvas && !reduced && finePointer) window.addEventListener("pointermove", parallax, { signal, passive: true });
  let handsFrame = 0;
  let handsX = 0;
  let handsY = 0;
  if (hands && !reduced && finePointer) {
    window.addEventListener("resize", () => { handsBounds = null; }, { signal, passive: true });
    hands.addEventListener("pointermove", (event) => {
      handsX = event.clientX;
      handsY = event.clientY;
      if (!handsFrame) handsFrame = window.requestAnimationFrame(() => {
        handsFrame = 0;
        if (!active) return;
        const bounds = handsBounds ??= hands.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        hands.style.setProperty("--reach", `${((handsX - bounds.left) / bounds.width - 0.5) * 18}px`);
        hands.style.setProperty("--lift", `${((handsY - bounds.top) / bounds.height - 0.5) * 8}px`);
      });
    }, { signal, passive: true });
    hands.addEventListener("pointerleave", () => {
      window.cancelAnimationFrame(handsFrame);
      handsFrame = 0;
      handsBounds = null;
      hands.style.setProperty("--reach", "0px");
      hands.style.setProperty("--lift", "0px");
    }, { signal });
  }
  return () => {
    active = false;
    controller.abort(); observer?.disconnect(); cleanupCursor();
    canvasObserver?.disconnect();
    window.cancelAnimationFrame(parallaxFrame);
    window.cancelAnimationFrame(handsFrame);
    window.clearTimeout(copyTimer);
    lenis.off("scroll", onScroll);
    if (menuOpen) lenis.start();
    background.forEach((element, index) => { element.inert = initialInert[index] ?? false; });
    xTo?.tween.kill(); yTo?.tween.kill();
  };
}

export function initFallbackSkyline(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>("#skyline");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return () => {};
  const reduced = prefersReducedMotion();
  const layers = Array.from({ length: 8 }, (_, layer) => {
    let seed = 31713 + layer * 71;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    return Array.from({ length: 30 }, (_, index) => ({
      x: index / 12, width: 0.04 + random() * 0.055,
      height: 0.05 + random() * 0.2 + layer * 0.012,
      offset: random() * 0.02,
    }));
  });
  function resize() {
    if (!canvas) return;
    const size = getSceneBufferSize({ width: window.innerWidth, height: window.innerHeight });
    canvas.width = size.width; canvas.height = size.height;
    loop.request();
  }
  function render(time: number) {
    if (!canvas || !context) return false;
    const width = canvas.width; const height = canvas.height;
    context.fillStyle = "#e30613"; context.fillRect(0, 0, width, height);
    layers.forEach((buildings, layer) => {
      const factor = (layer + 1) / 8;
      context.fillStyle = `rgb(${Math.round(190 * (1 - factor))},${Math.round(4 * (1 - factor))},${Math.round(15 * (1 - factor))})`;
      const shift = reduced ? 0 : ((time * 0.000008 * factor) % 1.2);
      buildings.forEach(building => {
        const x = (building.x - shift) * width;
        const w = building.width * width;
        const h = building.height * height;
        const y = height * (0.85 + factor * 0.1) - h;
        context.beginPath();
        context.moveTo(x, height); context.lineTo(x, y + h * 0.15);
        context.lineTo(x + w * 0.2, y + h * building.offset);
        context.lineTo(x + w * 0.8, y); context.lineTo(x + w, y + h * 0.12);
        context.lineTo(x + w, height); context.closePath(); context.fill();
      });
    });
    return !reduced;
  }
  const loop = createVisibleRenderLoop({ element: canvas, occludedBy: root.querySelector<HTMLElement>(".menu-overlay"), draw: render });
  resize(); window.addEventListener("resize", resize);
  return () => { loop.destroy(); window.removeEventListener("resize", resize); };
}
