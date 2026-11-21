// @ts-nocheck
// biome-ignore-all lint: source-authored GSAP template port.

"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import type { CSSProperties } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { type DeadspaceRoute, getDeadspaceFragment } from "./portfolio";
import { getDeadspacePageStyles } from "./styles";
import portfolioStyles from "./portfolio.css?inline";
import polishStyles from "./polish.css?inline";
import { initPortfolioControls, initFallbackSkyline, playInterfaceSound, prefersReducedMotion } from "./portfolio-effects";
import { createVisibleRenderLoop, getSceneBufferSize } from "./render-loop";

gsap.registerPlugin(ScrollTrigger, SplitText);

export const DEFAULT_ASSET_BASE =
  "https://ui.aryank.space/assets/deadspace-page";

const ROUTES: DeadspaceRoute[] = ["/", "/work", "/project", "/lab", "/contact"];
const ROUTE_SET = new Set(ROUTES);

function normalizePath(path: string): DeadspaceRoute {
  const normalized =
    (path || "/")
      .split("?")[0]
      .split("#")[0]
      .replace(/\.html$/, "")
      .replace(/\/$/, "") || "/";
  return ROUTE_SET.has(normalized as DeadspaceRoute)
    ? (normalized as DeadspaceRoute)
    : "/";
}

function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  let current = node?.parentElement ?? null;
  while (current) {
    const style = window.getComputedStyle(current);
    if (
      /(auto|scroll)/.test(style.overflow + style.overflowY + style.overflowX)
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return window;
}

function getScrollTop(scroller: HTMLElement | Window | null) {
  if (!scroller || scroller === window) {
    return window.scrollY || window.pageYOffset || 0;
  }
  return scroller.scrollTop;
}

function scrollToTop(scroller: HTMLElement | Window | null) {
  if (!scroller || scroller === window) {
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  scroller.scrollTo({ top: 0, behavior: "instant" });
}

function useScrollRuntime(rootElement: HTMLElement | null) {
  const [state, setState] = useState<{
    scroller: HTMLElement | Window | null;
    lenis: Lenis | null;
  }>({ scroller: null, lenis: null });

  useLayoutEffect(() => {
    if (!rootElement) return;

    const scroller = getScrollParent(rootElement);
    let lenis: Lenis | null = null;
    let ticker: ((time: number) => void) | null = null;
    let previousOverflowAnchor = "";
    let previousOverscrollBehavior = "";
    let previousScrollBehavior = "";

    if (scroller instanceof HTMLElement) {
      previousOverflowAnchor = scroller.style.overflowAnchor;
      previousOverscrollBehavior = scroller.style.overscrollBehavior;
      previousScrollBehavior = scroller.style.scrollBehavior;
      scroller.style.overflowAnchor = "none";
      scroller.style.overscrollBehavior = "contain";
      scroller.style.scrollBehavior = "auto";
      lenis = new Lenis({
        wrapper: scroller,
        content: rootElement,
        smoothWheel: !prefersReducedMotion(),
        syncTouch: false,
        lerp: window.innerWidth <= 1000 ? 0.075 : 0.1,
        duration: window.innerWidth <= 1000 ? 0.8 : 1.2,
        touchMultiplier: window.innerWidth <= 1000 ? 1.5 : 2,
      });
      ScrollTrigger.defaults({ scroller });
    } else {
      lenis = new Lenis({
        smoothWheel: !prefersReducedMotion(),
        syncTouch: false,
        lerp: window.innerWidth <= 1000 ? 0.075 : 0.1,
        duration: window.innerWidth <= 1000 ? 0.8 : 1.2,
        touchMultiplier: window.innerWidth <= 1000 ? 1.5 : 2,
      });
      ScrollTrigger.defaults({ scroller: undefined });
    }

    lenis.on("scroll", ScrollTrigger.update);
    ticker = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis;
    setState({ scroller, lenis });

    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      if (ticker) gsap.ticker.remove(ticker);
      lenis?.destroy();
      if (window.lenis === lenis) window.lenis = null;
      if (scroller instanceof HTMLElement) {
        scroller.style.overflowAnchor = previousOverflowAnchor;
        scroller.style.overscrollBehavior = previousOverscrollBehavior;
        scroller.style.scrollBehavior = previousScrollBehavior;
      }
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill(true));
      ScrollTrigger.defaults({ scroller: undefined });
      setState({ scroller: null, lenis: null });
    };
  }, [rootElement]);

  return state;
}

export default function DeadspacePage({
  assetBase = DEFAULT_ASSET_BASE,
  initialPath = "/",
  className = "",
  style,
}: {
  assetBase?: string;
  initialPath?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const [pathname, setPathname] = useState<DeadspaceRoute>(() =>
    normalizePath(initialPath),
  );
  const { scroller, lenis } = useScrollRuntime(rootElement);
  const css = useMemo(() => getDeadspacePageStyles(assetBase)
    .replace(/^@import url\('https:\/\/fonts\.googleapis\.com\/[^']+'\);\s*/, "")
    .replaceAll("font-style: normal;", "font-style: normal; font-display: swap;")
    + "\n" + portfolioStyles + "\n" + polishStyles, [assetBase]);
  useEffect(() => {
    const pop = () => { setPathname(normalizePath(window.location.pathname)); if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); else scrollToTop(scroller); };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [scroller, lenis]);
  useEffect(() => {
    document.title = "Qvost";
  }, []);

  useEffect(() => {
    setPathname(normalizePath(initialPath));
  }, [initialPath]);

  const navigate = useCallback(
    (nextPath: string) => {
      const next = normalizePath(nextPath);
      window.history.pushState({}, "", next);
      setPathname(next);
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else scrollToTop(scroller);
    },
    [scroller, lenis],
  );

  return (
    <div
      ref={setRootElement}
      className={["deadspace-page", className].filter(Boolean).join(" ")}
      style={style}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {rootElement && scroller && lenis ? (
        <DeadspaceRouteView
          key={pathname}
          assetBase={assetBase}
          lenis={lenis}
          navigate={navigate}
          pathname={pathname}
          rootElement={rootElement}
          scroller={scroller}
        />
      ) : null}
    </div>
  );
}

function DeadspaceRouteView({
  assetBase,
  lenis,
  navigate,
  pathname,
  rootElement,
  scroller,
}: {
  assetBase: string;
  lenis: Lenis;
  navigate: (path: string) => void;
  pathname: DeadspaceRoute;
  rootElement: HTMLElement;
  scroller: HTMLElement | Window;
}) {
  const [routeElement, setRouteElement] = useState<HTMLDivElement | null>(null);
  const html = useMemo(
    () => getDeadspaceFragment(pathname, assetBase),
    [assetBase, pathname],
  );

  useDeadspaceEffects({
    assetBase,
    lenis,
    navigate,
    pathname,
    root: routeElement,
    rootElement,
    scroller,
  });

  return (
    <main
      id="top"
      tabIndex={-1}
      ref={setRouteElement}
      className={`deadspace-route deadspace-route-${pathname === "/" ? "index" : pathname.slice(1)}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function useDeadspaceEffects({
  assetBase,
  lenis,
  navigate,
  pathname,
  root,
  rootElement,
  scroller,
}: {
  assetBase: string;
  lenis: Lenis;
  navigate: (path: string) => void;
  pathname: DeadspaceRoute;
  root: HTMLElement | null;
  rootElement: HTMLElement;
  scroller: HTMLElement | Window;
}) {
  useLayoutEffect(() => {
    if (!root) return;

    const cleanups: Array<() => void> = [];
    const asset = (path: string) =>
      `${assetBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

    const reduced = prefersReducedMotion();
    cleanups.push(initPortfolioControls(root, lenis));
    cleanups.push(initNavClock(root));
    const menuControls = initMenu(root, asset);
    cleanups.push(menuControls.cleanup);
    cleanups.push(initRouteLinks(root, navigate, menuControls.close, pathname));
    cleanups.push(initTransitionReveal(root));
    if (pathname === "/") cleanups.push(initPreloader(root));
    cleanups.push(initAnimatedCopy(root));
    if (pathname === "/") cleanups.push(!reduced && canUseWebGL()
      ? initDeferredWebGL(three => initSkyline(root, three), () => initFallbackSkyline(root))
      : initFallbackSkyline(root));
    if (pathname === "/lab" && !reduced) {
      cleanups.push(initLabScroll(root));
      cleanups.push(initPieTransition(root));
      cleanups.push(initStats(root));

      cleanups.push(initParticleVisual(root, asset));
    }
    if (pathname === "/lab") cleanups.push(initClients(root));
    if (pathname === "/contact") cleanups.push(initContact(root, asset));
    if (pathname === "/project" && !reduced && canUseWebGL()) {
      cleanups.push(
        initVisibleProjectEffect(root, () => initDeferredWebGL(three =>
          initImageDistortion(root, rootElement, scroller, lenis, pathname, three))),
      );
    }
    const refreshFrame = window.requestAnimationFrame(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      cleanups.reverse().forEach((cleanup) => cleanup());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill(true));
    };
  }, [assetBase, lenis, navigate, pathname, root, rootElement, scroller]);
}

let webGLAvailable: boolean | undefined;
type ThreeEngine = Pick<typeof import("three"), "Scene" | "OrthographicCamera" | "WebGLRenderer" | "PlaneGeometry" | "ShaderMaterial" | "Vector2" | "Vector3" | "Mesh" | "PerspectiveCamera" | "Texture" | "GLSL3">;
function loadThreeEngine(): Promise<ThreeEngine> {
  return import("three").then(({ Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, ShaderMaterial, Vector2, Vector3, Mesh, PerspectiveCamera, Texture, GLSL3 }) =>
    ({ Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, ShaderMaterial, Vector2, Vector3, Mesh, PerspectiveCamera, Texture, GLSL3 }));
}

function initDeferredEffect<T>(ready: Promise<T>, start: (value: T) => () => void, fallback: () => () => void = () => () => {}) {
  let active = true;
  let cleanup = () => {};
  void ready.then((value) => {
    if (!active) return;
    try { cleanup = start(value); }
    catch { cleanup = fallback(); }
  }, () => { if (active) cleanup = fallback(); });
  return () => { active = false; cleanup(); };
}

function initDeferredWebGL(start: (three: ThreeEngine) => () => void, fallback: () => () => void = () => () => {}) {
  return initDeferredEffect(loadThreeEngine(), start, fallback);
}

function initVisibleProjectEffect(root: HTMLElement, start: () => () => void) {
  const target = root.querySelector<HTMLElement>(".project-images");
  if (!target) return () => {};
  const desktop = window.matchMedia("(min-width: 1000px)");
  let visible = false;
  let started = false;
  let active = true;
  let cleanup = () => {};
  function activate() {
    if (!active || started || !visible || !desktop.matches) return;
    started = true;
    observer.disconnect();
    desktop.removeEventListener("change", activate);
    cleanup = start();
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[entries.length - 1]?.isIntersecting ?? false;
    activate();
  }, { rootMargin: "200px" });
  observer.observe(target);
  desktop.addEventListener("change", activate);
  return () => { active = false; observer.disconnect(); desktop.removeEventListener("change", activate); cleanup(); };
}

function canUseWebGL() {
  if (webGLAvailable !== undefined) return webGLAvailable;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    webGLAvailable = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch { webGLAvailable = false; }
  return webGLAvailable;
}

function isExternalLink(href: string | null) {
  return (
    !href ||
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  );
}

function initRouteLinks(root: HTMLElement, navigate: (path: string) => void, closeMenu: () => void, currentPath: DeadspaceRoute) {
  let active = true;
  let transitioning = false;
  const handleClick = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a");
    if (!link || !root.contains(link) || link.target === "_blank" || link.hasAttribute("download")) return;
    const href = link.getAttribute("href");
    if (isExternalLink(href)) return;
    event.preventDefault();
    event.stopPropagation();
    if (transitioning) return;
    const next = normalizePath(href || "/");
    if (next === currentPath) { closeMenu(); return; }
    transitioning = true;
    animateTransitionOut(root).then(() => {
      if (!active) return;
      closeMenu();
      navigate(next);
    });
  };
  root.addEventListener("click", handleClick, { capture: true });
  return () => {
    active = false;
    root.removeEventListener("click", handleClick, { capture: true });
  };
}

function initTransitionReveal(root: HTMLElement) {
  const blocks = [...root.querySelectorAll(".transition-block")];
  gsap.set(blocks, { opacity: 0 });
  return () => gsap.killTweensOf(blocks);
}

function animateTransitionOut(root: HTMLElement) {
  return new Promise<void>((resolve) => {
    const grid = root.querySelector<HTMLElement>(".transition-grid");
    const blocks = root.querySelectorAll<HTMLElement>(".transition-block");
    if (prefersReducedMotion() || !grid || !blocks.length) { resolve(); return; }
    grid.style.pointerEvents = "auto";
    gsap.to(blocks, { opacity: 1, duration: 0.18, stagger: { amount: 0.18, from: "start" }, ease: "power2.inOut", onComplete: resolve });
  });
}

function bootSeen() {
  try { return sessionStorage.getItem("deadspacePreloaderSeen") === "true"; }
  catch { return true; }
}

function initPreloader(root: HTMLElement) {
  const preloader = root.querySelector<HTMLElement>(".preloader");
  if (!preloader) return () => {};
  if (prefersReducedMotion() || bootSeen()) { preloader.style.display = "none"; return () => {}; }
  const bar = root.querySelector(".progress-bar");
  const indicator = root.querySelector(".progress-bar-indicator");
  const text = root.querySelector(".progress-bar-copy span");
  const blocks = root.querySelectorAll(".preloader-block");
  const progress = { value: 0 };
  const timeline = gsap.timeline({ onComplete: () => {
    try { sessionStorage.setItem("deadspacePreloaderSeen", "true"); } catch {}
    preloader.style.display = "none";
  } });
  timeline.set(bar, { opacity: 1 })
    .to(progress, { value: 100, duration: 0.65, ease: "power2.out", onUpdate: () => {
      if (text) text.textContent = `${Math.round(progress.value)}%`;
      if (indicator) gsap.set(indicator, { "--progress": progress.value / 100 });
    } })
    .to(bar, { opacity: 0, duration: 0.1 })
    .to(blocks, { opacity: 0, duration: 0.15, stagger: { amount: 0.2, from: "edges" } });
  return () => { timeline.kill(); try { sessionStorage.setItem("deadspacePreloaderSeen", "true"); } catch {} };
}

function initNavClock(root: HTMLElement) {
  const clock = root.querySelector<HTMLElement>(".nav-clock p");
  const colon = clock?.querySelector<HTMLElement>("span");
  if (!clock || !colon) return () => {};
  const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  function update() {
    const [hours, minutes] = formatter.format(new Date()).split(":");
    clock.childNodes[0].textContent = `${hours} `;
    clock.childNodes[2].textContent = ` ${minutes} NPT`;
  }
  update();
  const timer = window.setInterval(update, 15000);
  const blink = prefersReducedMotion() ? 0 : window.setInterval(() => { colon.style.visibility = colon.style.visibility === "hidden" ? "visible" : "hidden"; }, 800);
  return () => { window.clearInterval(timer); window.clearInterval(blink); };
}

const MENU_ITEMS = [
  { label: "Home", icon: "compass-sharp", href: "/" },
  { label: "About", icon: "cube-sharp", href: "/lab" },
  { label: "Work", icon: "laptop-sharp", href: "/work" },
  { label: "Reify", icon: "flash-sharp", href: "/project" },
  { label: "Contact", icon: "paper-plane-sharp", href: "/contact" },
];

function initMenu(root: HTMLElement, asset: (path: string) => string) {
  const menu = root.querySelector<HTMLElement>(".circular-menu");
  const joystick = root.querySelector<HTMLElement>(".joystick");
  const overlay = root.querySelector<HTMLElement>(".menu-overlay");
  const toggle = root.querySelector<HTMLElement>(".menu-toggle-btn");
  const close = root.querySelector<HTMLElement>(".close-btn");
  if (!menu || !joystick || !overlay || !toggle || !close) return { close: () => {}, cleanup: () => {} };
  joystick.setAttribute("aria-hidden", "true");
  joystick.innerHTML = '<svg class="center-icon center-main" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5M8 12h8m-4-4v8"/></svg><span class="center-icon center-up">▴</span><span class="center-icon center-down">▾</span><span class="center-icon center-left">◂</span><span class="center-icon center-right">▸</span>';
  let cleanupAtmosphere = () => {};
  let atmosphereStarted = false;
  const controller = new AbortController();
  const signal = controller.signal;
  const glyphs = ["⌖", "✳", "▤", "⋈", "◎"];
  const segments = MENU_ITEMS.map((item, index) => {
    const segment = document.createElement("a");
    segment.className = "menu-segment";
    segment.href = item.href;
    segment.innerHTML = `<div class="segment-content"><span class="segment-glyph" aria-hidden="true">${glyphs[index]}</span><div class="label">${item.label}</div></div>`;
    segment.addEventListener("pointerenter", () => { if (isOpen) playInterfaceSound(asset("sfx/menu-select.mp3")); }, { signal });
    menu.appendChild(segment);
    return segment;
  });
  let isOpen = false;
  let animation: gsap.core.Timeline | null = null;
  let dragging = false;
  let selected = -1;
  let centerX = 0;
  let centerY = 0;

  function resize() {
    const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.74, 660);
    const center = size / 2;
    const radius = size * 0.45;
    menu.style.width = `${size}px`; menu.style.height = `${size}px`;
    segments.forEach((segment, index) => {
      const start = (index * 72 - 90) * Math.PI / 180;
      const end = start + 72 * Math.PI / 180;
      segment.style.clipPath = `path('M ${center} ${center} L ${center + radius * Math.cos(start)} ${center + radius * Math.sin(start)} A ${radius} ${radius} 0 0 1 ${center + radius * Math.cos(end)} ${center + radius * Math.sin(end)} Z')`;
      const content = segment.querySelector<HTMLElement>(".segment-content");
      if (content) {
        content.style.left = `${center + size * 0.29 * Math.cos((start + end) / 2)}px`;
        content.style.top = `${center + size * 0.29 * Math.sin((start + end) / 2)}px`;
        content.style.transform = "translate(-50%, -50%)";
      }
    });
  }

  function resetStick() {
    dragging = false;
    selected = -1;
    segments.forEach(segment => segment.classList.remove("is-selected"));
    gsap.to(joystick, { x: 0, y: 0, duration: prefersReducedMotion() ? 0 : 0.25, ease: "power3.out", overwrite: "auto" });
  }

  function setOpen(next: boolean) {
    if (isOpen === next) return;
    isOpen = next;
    animation?.kill();
    resetStick();
    playInterfaceSound(asset(next ? "sfx/menu-open.mp3" : "sfx/menu-close.mp3"));
    // Pointer state changes once; accessibility and scroll lock observe this state.
    overlay.style.pointerEvents = next ? "all" : "none";
    overlay.dataset.open = String(next);
    if (next && !atmosphereStarted && !prefersReducedMotion() && canUseWebGL()) {
      atmosphereStarted = true;
      cleanupAtmosphere = initDeferredEffect(
        Promise.all([loadThreeEngine(), import("./menu-shader")]),
        ([three, { matrixShader }]) => initMenuAtmosphere(root, three, matrixShader),
      );
    }
    const duration = prefersReducedMotion() ? 0 : 0.22;
    animation = gsap.timeline().to(overlay, { opacity: next ? 1 : 0, duration, ease: "power2.out" }, 0)
      .to(segments, { opacity: next ? 1 : 0, duration, stagger: next && duration ? 0.035 : 0, ease: "power2.out" }, 0)
      .to(joystick, { scale: next ? 1 : 0, duration, ease: "power3.out" }, 0)
      .to(root.querySelectorAll(".menu-overlay-nav, .menu-overlay-footer"), { opacity: next ? 1 : 0, duration }, 0);
  }

  joystick.addEventListener("pointerdown", (event) => {
    if (!isOpen || event.button !== 0) return;
    const rect = joystick.getBoundingClientRect();
    centerX = rect.left + rect.width / 2; centerY = rect.top + rect.height / 2;
    dragging = true;
    joystick.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, { signal });
  joystick.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - centerX; const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const ratio = distance > 24 ? 24 / distance : 1;
    gsap.set(joystick, { x: dx * ratio, y: dy * ratio });
    selected = distance > 18 ? Math.floor(((Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360) / 72) : -1;
    segments.forEach((segment, index) => segment.classList.toggle("is-selected", selected === index));
  }, { signal });
  joystick.addEventListener("pointerup", () => {
    const target = dragging ? segments[selected] : null;
    resetStick();
    target?.click();
  }, { signal });
  joystick.addEventListener("pointercancel", resetStick, { signal });
  toggle.addEventListener("click", () => setOpen(!isOpen), { signal });
  close.addEventListener("click", () => setOpen(false), { signal });
  window.addEventListener("resize", resize, { signal });
  resize();
  gsap.set([joystick], { scale: 0 });
  gsap.set(segments, { opacity: 0 });
  return {
    close: () => setOpen(false),
    cleanup: () => {
      controller.abort(); animation?.kill();
      gsap.killTweensOf([overlay, joystick, ...segments]);
      cleanupAtmosphere();
    },
  };
}

function initMenuAtmosphere(root: HTMLElement, THREE: ThreeEngine, matrixShader: typeof import("./menu-shader").matrixShader) {
  const canvas = root.querySelector<HTMLCanvasElement>("#menu-canvas");
  if (!canvas || prefersReducedMotion() || !canUseWebGL()) return () => {};

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: matrixShader.vertexShader,
    fragmentShader: matrixShader.fragmentShader,
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      uColorBg: { value: new THREE.Vector3(0.8902, 0.0235, 0.0745) },
      uColorFg: { value: new THREE.Vector3(0, 0, 0) },
    },
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  const overlay = canvas.closest<HTMLElement>(".menu-overlay");

  function resize() {
    const { width, height } = getSceneBufferSize({ width: window.innerWidth, height: window.innerHeight });
    renderer.setSize(width, height, false);
    material.uniforms.iResolution.value.set(width, height);
  }

  resize();
  const loop = createVisibleRenderLoop({
    element: canvas,
    enabled: overlay?.dataset.open === "true",
    draw(time) {
      material.uniforms.iTime.value = time * 0.001;
      try { renderer.render(scene, camera); } catch { return false; }
      return true;
    },
  });
  const observer = new MutationObserver(() => loop.setEnabled(overlay?.dataset.open === "true"));
  if (overlay) observer.observe(overlay, { attributes: true, attributeFilter: ["data-open"] });
  window.addEventListener("resize", resize);
  return () => {
    observer.disconnect();
    loop.destroy();
    window.removeEventListener("resize", resize);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}

function initAnimatedCopy(root: HTMLElement) {
  const elements = root.querySelectorAll<HTMLElement>("[data-animate-variant]");
  if (prefersReducedMotion()) { gsap.set(elements, { opacity: 1, filter: "none" }); return () => {}; }
  const splits: SplitText[] = [];
  let active = true;
  let initialized = false;
  const started = performance.now();
  const hasPreloader = !!root.querySelector(".preloader") && !bootSeen();
  gsap.set(elements, { opacity: 0 });

  function splitWhenReady() {
    if (!active || initialized) return;
    initialized = true;
    elements.forEach((element) => {
      const variant = element.dataset.animateVariant;
      const scroll = element.dataset.animateOnScroll !== "false";
      const type = variant === "slide" ? element.dataset.animateType || "lines" : variant === "flicker" ? "chars" : "words";
      const delay = Number.parseFloat(element.dataset.animateDelay || "0") + (hasPreloader && !scroll ? Math.max(0, 1.05 - (performance.now() - started) / 1000) : 0);
      const split = SplitText.create(element, {
        type,
        mask: variant === "slide" ? type : undefined,
        autoSplit: true,
        linesClass: "line",
        wordsClass: "word",
        onSplit: (self) => {
          if (!active) return;
          const targets = variant === "flicker" ? self.chars : type === "lines" ? self.lines : self.words;
          gsap.set(element, { opacity: 1 });
          // Returning the tween lets SplitText preserve progress after a font or width change.
          return gsap.fromTo(targets,
            variant === "slide" ? { yPercent: 105 } : variant === "diffuse" ? { opacity: 0, filter: "blur(36px)" } : { opacity: 0 },
            {
              yPercent: 0, opacity: 1, filter: "blur(0px)",
              duration: variant === "diffuse" ? 1.1 : variant === "flicker" ? 0.12 : 0.7,
              ease: "power3.out", delay,
              stagger: variant === "flicker" ? { amount: 0.28, from: "random" } : variant === "slide" ? 0.07 : 0,
              scrollTrigger: scroll ? { trigger: element, start: "top 88%", once: true } : undefined,
            });
        },
      });
      splits.push(split);
    });
    ScrollTrigger.refresh();
  }
  const timer = window.setTimeout(splitWhenReady, 900);
  document.fonts?.ready?.then(splitWhenReady) ?? window.requestAnimationFrame(splitWhenReady);
  return () => { active = false; window.clearTimeout(timer); splits.forEach(split => split.revert()); };
}

function initSkyline(root: HTMLElement, THREE: ThreeEngine) {
  const canvas = root.querySelector<HTMLCanvasElement>("#skyline");
  if (!canvas) return () => {};
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const pixelRatioLimit = isMobile ? 1.0 : 1.25;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    stencil: false,
    depth: false,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3() },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
      #else
        precision mediump float;
      #endif

      uniform float iTime;
      uniform vec3 iResolution;
      varying vec2 vUv;

      uint seed = 31713U;

      float rand(void) {
        seed = (seed << 13U) ^ seed;
        seed = seed * (seed * seed * 15731U + 789221U) + 1376312589U;
        uint seed2 = seed * seed;
        return float(seed2&0x7fffffffU)/float(0x7fffffffU);
      }

      float Polygon(vec2 uv, float h) {
        float mid = (rand()-.5)*exp2(-h*2.);
        float f = abs(uv.y-rand()+.5)-rand()-2.;
        f = max(f,abs(uv.x-mid)-rand()-.5+h*.4);
        f = max(f,abs(dot(uv,vec2(1,1)/sqrt(2.))-rand()+.5)-rand()-1.);
        f = max(f,abs(dot(uv,vec2(1,-1)/sqrt(2.))-rand()+.5)-rand()-1.);
        return f;
      }

      vec3 Buildings(vec2 uv, int layer) {
        seed = uint(2. + uv.x/4.);
        uv.x = (fract(uv.x/4.)-.5)*4.;

        bool cull = (pow(float(layer+1)/8.,.3) < rand());
        seed += 0x1001U*uint(layer);

        float a = Polygon(uv-vec2(0,0), 0.);
        float b = Polygon(uv-vec2(0,2), .5);
        float c = Polygon(uv-vec2(0,4), 1.);
        if (cull) { a = 1.; b = 1.; c = 1.; }

        a = min(a, uv.y+.5);

        vec3 f = vec3(a,min(a,b),min(min(a,b),c)).zyx;
        vec3 col = vec3(.5+.5*f/(.01+abs(f)));

        return vec3(dot(col,vec3(.985,.01,.005)));
      }

      void main() {
        vec2 fragCoord = vUv * iResolution.xy;
        vec2 uv = (fragCoord-iResolution.xy*vec2(.5,.5))/iResolution.y;

        uv *= 10.;
        uv.y += 3.;
        uv.x -= 8.;

        vec3 color = vec3(1);

        const float size = .5;
        const float fog = .15;
        const float baseFog = 0.075;

        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*0.)+iTime*vec2(4,0),0), exp2(-fog*0.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*1.)+iTime*vec2(4,0),1), exp2(-fog*1.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*2.)+iTime*vec2(4,0),2), exp2(-fog*2.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*3.)+iTime*vec2(4,0),3), exp2(-fog*3.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*4.)+iTime*vec2(4,0),4), exp2(-fog*4.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*5.)+iTime*vec2(4,0),5), exp2(-fog*5.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*6.)+iTime*vec2(4,0),6), exp2(-fog*6.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*7.)+iTime*vec2(4,0),7), exp2(-fog*7.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*8.)+iTime*vec2(4,0),8), exp2(-fog*8.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*9.)+iTime*vec2(4,0),9), exp2(-fog*9.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*10.)+iTime*vec2(4,0),10), exp2(-fog*10.-baseFog)));
        color = min(color, mix(vec3(1), Buildings(uv*exp2(size*11.)+iTime*vec2(4,0),11), exp2(-fog*11.-baseFog)));

        color = pow(color, vec3(1./2.2));

        const vec3 bgColor = vec3(0.89, 0.024, 0.075);
        color = mix(bgColor, vec3(0.0), 1.0 - color.r);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  let resizeTimer = 0;

  function resize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const { width, height } = getSceneBufferSize({ width: window.innerWidth, height: window.innerHeight, maxPixelRatio: pixelRatioLimit });
      renderer.setSize(width, height, false);
      material.uniforms.iResolution.value.set(width, height, 1);
    }, 100);
  }

  const loop = createVisibleRenderLoop({
    element: canvas,
    occludedBy: root.querySelector<HTMLElement>(".menu-overlay"),
    draw(time) {
      material.uniforms.iTime.value = time * 0.001;
      try { renderer.render(scene, camera); } catch { return false; }
      return true;
    },
  });

  resize();
  window.addEventListener("resize", resize);
  return () => {
    loop.destroy();
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", resize);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}

function initLabScroll(root: HTMLElement) {
  const revealer = root.querySelector(".lab-about-revealer");
  const overlay = root.querySelector(".lab-hero-overlay");
  const hero = root.querySelector(".lab-hero");
  if (!revealer || !overlay || !hero) return () => {};
  const config = {
    trigger: hero,
    start: "top top",
    end: "150% top",
    scrub: true,
  };
  const tweens = [
    gsap.to(revealer, {
      clipPath: "polygon(0% 100%, 100% 100%, 100% -25%, 0% 0%)",
      ease: "none",
      scrollTrigger: config,
    }),
    gsap.to(overlay, { opacity: 1, ease: "none", scrollTrigger: config }),
  ];
  return () => tweens.forEach((tween) => tween.kill());
}

function initPieTransition(root: HTMLElement) {
  const container = root.querySelector<HTMLElement>(".pie-transition");
  const header = root.querySelector<HTMLElement>(
    ".pie-transition-outro-header h3",
  );
  if (!container || !header) return () => {};
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 800 800");
  svg.style.cssText =
    "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(80vw,80vh);height:min(80vw,80vh);overflow:visible;";
  const dotsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const pieGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  dotsGroup.style.transformOrigin = "400px 400px";
  pieGroup.style.transformOrigin = "400px 400px";
  dotsGroup.setAttribute("id", "pie-transition-dots-group");
  pieGroup.setAttribute("id", "pie-transition-pie-group");

  for (let i = 0; i < 1500; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * 300;
    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    dot.setAttribute("cx", String(400 + Math.cos(angle) * distance));
    dot.setAttribute("cy", String(400 + Math.sin(angle) * distance));
    dot.setAttribute("r", "1");
    dot.setAttribute("fill", "#e30613");
    dotsGroup.appendChild(dot);
  }

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
  mask.setAttribute("id", "pie-transition-mask");
  const maskBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  maskBg.setAttribute("width", "800");
  maskBg.setAttribute("height", "800");
  maskBg.setAttribute("fill", "black");
  const slicePath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  slicePath.setAttribute("fill", "white");
  mask.append(maskBg, slicePath);
  defs.appendChild(mask);
  const solidCircle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  solidCircle.setAttribute("cx", "400");
  solidCircle.setAttribute("cy", "400");
  solidCircle.setAttribute("r", "302");
  solidCircle.setAttribute("fill", "#e30613");
  solidCircle.setAttribute("mask", "url(#pie-transition-mask)");
  pieGroup.appendChild(solidCircle);
  svg.append(defs, dotsGroup, pieGroup);
  container.appendChild(svg);

  const split = SplitText.create(header, {
    type: "words",
    wordsClass: "pie-transition-word",
  });
  gsap.set(split.words, { opacity: 0 });

  function updatePieFill(progress: number) {
    const angle = progress * 360;
    if (angle <= 0) {
      slicePath.setAttribute("d", "");
      return;
    }
    if (angle >= 360) {
      slicePath.setAttribute(
        "d",
        "M 400,400 m -302,0 a 302,302 0 1,0 604,0 a 302,302 0 1,0 -604,0",
      );
      return;
    }
    const startAngle = -90;
    const endAngle = startAngle + angle;
    const x1 = 400 + 302 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 400 + 302 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 400 + 302 * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 400 + 302 * Math.sin((endAngle * Math.PI) / 180);
    const largeArc = angle > 180 ? 1 : 0;
    slicePath.setAttribute(
      "d",
      `M 400,400 L ${x1},${y1} A 302,302 0 ${largeArc} 1 ${x2},${y2} Z`,
    );
  }

  const trigger = ScrollTrigger.create({
    trigger: container,
    start: "top top",
    end: () => `+=${window.innerHeight * 2.5}`,
    scrub: true,
    pin: true,
    pinSpacing: true,
    onUpdate: (self) => {
      const progress = self.progress;
      updatePieFill(progress <= 0.5 ? progress / 0.5 : 1);
      const scaleMultiplier = window.innerWidth < 1000 ? 3 : 2.5;
      const scale =
        progress >= 0.5 ? 1 + ((progress - 0.5) / 0.5) * scaleMultiplier : 1;
      pieGroup.style.transform = `scale(${scale})`;
      dotsGroup.style.transform = `scale(${scale})`;
      if (progress >= 0.75 && progress <= 0.95) {
        const textProgress = (progress - 0.75) / 0.2;
        split.words.forEach((word, index) => {
          gsap.set(word, {
            opacity: textProgress >= index / split.words.length ? 1 : 0,
          });
        });
      } else if (progress < 0.75) {
        gsap.set(split.words, { opacity: 0 });
      } else {
        gsap.set(split.words, { opacity: 1 });
      }
    },
  });

  return () => {
    trigger.kill();
    split.revert();
    svg.remove();
  };
}

function initStats(root: HTMLElement) {
  const triggers = [...root.querySelectorAll<HTMLElement>(".stat-item")].map(
    (item) =>
      ScrollTrigger.create({
        trigger: item,
        start: "top bottom",
        end: "top 25%",
        scrub: true,
        onUpdate: (self) => gsap.set(item, { x: 250 - self.progress * 250 }),
      }),
  );
  return () => triggers.forEach((trigger) => trigger.kill());
}

const CLIENTS = [
  ["Rust", "Runtime supervision"],
  ["Linux / seccomp", "Binary execution"],
  ["Seeded entropy", "Reproducible runs"],
  ["Virtual time", "Controlled execution"],
  ["HNSW", "Graph navigation"],
  ["Binary signatures", "Coarse search"],
  ["SQ8 / ADC", "Distance refinement"],
  ["C++ / Python", "Traversal & evaluation"],
  ["Traffic observation", "API discovery"],
  ["JSON Schema", "Inferred structure"],
  ["MCP", "Typed agent tools"],
  ["Kathmandu", "Shaligram Labs"],
];

function initClients(root: HTMLElement) {
  const clientsList = root.querySelector<HTMLElement>(".clients-list");
  if (!clientsList) return () => {};
  CLIENTS.forEach(([name, project]) => {
    const row = document.createElement("div");
    row.className = "client-row";
    row.innerHTML = `<p class="type-mono">${name}</p><p class="type-mono">${project}</p>`;
    clientsList.appendChild(row);
  });
  const triggers = [
    ...clientsList.querySelectorAll<HTMLElement>(".client-row"),
  ].map((row) => {
    const paragraphs = [...row.querySelectorAll("p")];
    return ScrollTrigger.create({
      trigger: row,
      start: "top 75%",
      end: "top 65%",
      scrub: true,
      onUpdate: (self) => {
        gsap.set(row, { gap: `${25 - self.progress * 25}%` });
        paragraphs.forEach((paragraph) =>
          gsap.set(paragraph, { opacity: self.progress }),
        );
      },
    });
  });
  return () => {
    triggers.forEach((trigger) => trigger.kill());
    clientsList.innerHTML = "";
  };
}

function initContact(root: HTMLElement, asset: (path: string) => string) {
  const icon = root.querySelector<HTMLImageElement>(".contact-visual-icon img");
  const controller = new AbortController();
  const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  function updateClock() {
    root.querySelectorAll(".contact-clock").forEach(element => { element.textContent = `${clock.format(new Date())} NPT`; });
  }
  updateClock();
  const timer = window.setInterval(updateClock, 30000);
  root.querySelectorAll(".contact-info-row").forEach((row, index) => {
    const showIcon = () => { if (icon) icon.src = asset(`contact/icon_${index + 1}.svg`); };
    row.addEventListener("pointerenter", showIcon, { signal: controller.signal });
    row.addEventListener("focusin", showIcon, { signal: controller.signal });
  });
  return () => { window.clearInterval(timer); controller.abort(); };
}

function initImageDistortion(
  root: HTMLElement,
  rootElement: HTMLElement,
  scroller: HTMLElement | Window,
  lenis: Lenis,
  pathname: DeadspaceRoute,
  THREE: ThreeEngine,
) {
  const selector = pathname === "/work" ? ".work-item img" : ".project-img img";
  const media = [...root.querySelectorAll<HTMLImageElement>(selector)];
  if (media.length === 0) return () => {};
  const bendStrength = "1.5";
  const cameraPosition = 400;
  let isMobile = window.innerWidth < 1000;
  let active = true;
  let failed = false;
  const imageEvents = new AbortController();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const buffer = getSceneBufferSize({ width: window.innerWidth, height: window.innerHeight });
  renderer.setSize(buffer.width, buffer.height, false);
  renderer.domElement.className = "deadspace-webgl-layer";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = isMobile ? "none" : "block";
  rootElement.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    10,
    1000,
  );
  camera.position.z = cameraPosition;
  camera.fov =
    (2 * Math.atan(window.innerHeight / 2 / cameraPosition) * 180) / Math.PI;
  camera.updateProjectionMatrix();

  const geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uScrollVelocity: { value: 0 },
      uTexture: { value: null },
      uTextureSize: { value: new THREE.Vector2(100, 100) },
      uQuadSize: { value: new THREE.Vector2(100, 100) },
    },
    vertexShader: `
      uniform float uScrollVelocity;
      uniform vec2 uTextureSize;
      uniform vec2 uQuadSize;
      out vec2 vUvCover;
      vec2 getCoverUv(vec2 uv, vec2 textureSize, vec2 quadSize){
        vec2 ratio=vec2(min((quadSize.x/quadSize.y)/(textureSize.x/textureSize.y),1.0),min((quadSize.y/quadSize.x)/(textureSize.y/textureSize.x),1.0));
        return vec2(uv.x*ratio.x+(1.0-ratio.x)*0.5,uv.y*ratio.y+(1.0-ratio.y)*0.5);
      }
      void main(){ vUvCover=getCoverUv(uv,uTextureSize,uQuadSize); vec3 pos=position; float dist=length(uv-vec2(0.5)); pos.z+=dist*dist*uScrollVelocity*${bendStrength}; gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0); }
    `,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uTexture;
      in vec2 vUvCover;
      out vec4 outColor;
      void main(){ outColor=vec4(texture(uTexture,vUvCover).rgb,1.0); }
    `,
    glslVersion: THREE.GLSL3,
  });
  const objects: any[] = [];
  let smoothVelocity = 0;
  let loop: ReturnType<typeof createVisibleRenderLoop> | null = null;

  function getObjectTop(bounds: DOMRect) {
    if (scroller instanceof HTMLElement) return bounds.top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    return bounds.top + window.scrollY;
  }

  function createMeshes() {
    const loadImage = (img: HTMLImageElement) =>
      new Promise<HTMLImageElement>((resolve) => {
        if (img.complete) {
          resolve(img);
        } else {
          img.addEventListener("load", () => resolve(img), { once: true, signal: imageEvents.signal });
          img.addEventListener("error", () => resolve(img), { once: true, signal: imageEvents.signal });
        }
      });

    media.forEach(image => {
      void loadImage(image).then(img => {
        if (!active || failed || !img.naturalWidth || !img.naturalHeight) return;
        img.crossOrigin = "anonymous";
        img.style.opacity = isMobile ? "1" : "0";
        const bounds = img.getBoundingClientRect();
        const imageMaterial = material.clone();
        const mesh = new THREE.Mesh(geometry, imageMaterial);
        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        imageMaterial.uniforms.uTexture.value = texture;
        imageMaterial.uniforms.uTextureSize.value.set(
          img.naturalWidth || 1,
          img.naturalHeight || 1,
        );
        imageMaterial.uniforms.uQuadSize.value.set(bounds.width, bounds.height);
        mesh.scale.set(bounds.width, bounds.height, 1);
        if (!isMobile) scene.add(mesh);
        objects.push({
          img,
          material: imageMaterial,
          mesh,
          texture,
          width: bounds.width,
          height: bounds.height,
          top: getObjectTop(bounds),
          left: bounds.left,
        });
        loop?.request();
      });
    });
  }

  function setPositions() {
    objects.forEach((object) => {
      const bounds = object.img.getBoundingClientRect();
      object.mesh.visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      object.mesh.scale.set(bounds.width, bounds.height, 1);
      object.material.uniforms.uQuadSize.value.set(bounds.width, bounds.height);
      object.mesh.position.x = bounds.left - window.innerWidth / 2 + bounds.width / 2;
      object.mesh.position.y = window.innerHeight / 2 - bounds.top - bounds.height / 2;
    });
  }

  function restoreImages() {
    failed = true;
    loop?.setEnabled(false);
    media.forEach(img => { img.style.opacity = "1"; });
    renderer.domElement.style.display = "none";
  }
  renderer.domElement.addEventListener("webglcontextlost", restoreImages);
  renderer.debug.onShaderError = restoreImages;

  function render() {
    if (isMobile || failed || objects.length === 0) return false;
    smoothVelocity += (lenis.velocity - smoothVelocity) * 0.1;
    objects.forEach((object) => {
      object.material.uniforms.uScrollVelocity.value = smoothVelocity;
    });
    setPositions();
    try { renderer.render(scene, camera); } catch { restoreImages(); }
    return !failed && (Math.abs(smoothVelocity) > 0.01 || Math.abs(lenis.velocity) > 0.01);
  }

  const onScroll = () => loop?.request();

  function toggleMode() {
    if (isMobile || failed) {
      renderer.domElement.style.display = "none";
      objects.forEach((object) => {
        object.img.style.opacity = "1";
      });
      return;
    }

    renderer.domElement.style.display = "block";
    objects.forEach((object) => {
      object.img.style.opacity = "0";
      if (!scene.children.includes(object.mesh)) {
        scene.add(object.mesh);
      }
    });
  }

  function handleResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 1000;

    if (isMobile !== wasMobile) {
      toggleMode();
    }
    loop?.setEnabled(!isMobile && !failed);
    if (isMobile) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov =
      (2 * Math.atan(window.innerHeight / 2 / cameraPosition) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    const buffer = getSceneBufferSize({ width: window.innerWidth, height: window.innerHeight });
    renderer.setSize(buffer.width, buffer.height, false);

    objects.forEach((object) => {
      const bounds = object.img.getBoundingClientRect();
      object.width = bounds.width;
      object.height = bounds.height;
      object.top = getObjectTop(bounds);
      object.left = bounds.left;
      object.mesh.scale.set(bounds.width, bounds.height, 1);
      object.material.uniforms.uQuadSize.value.x = bounds.width;
      object.material.uniforms.uQuadSize.value.y = bounds.height;
    });
    loop?.request();
  }

  loop = createVisibleRenderLoop({
    element: root.querySelector<HTMLElement>(".project-images") || root,
    occludedBy: root.querySelector<HTMLElement>(".menu-overlay"),
    draw: render,
    enabled: !isMobile,
  });
  lenis.on("scroll", onScroll);
  window.addEventListener("resize", handleResize);
  createMeshes();

  return () => {
    active = false;
    imageEvents.abort();
    renderer.domElement.removeEventListener("webglcontextlost", restoreImages);
    lenis.off("scroll", onScroll);
    window.removeEventListener("resize", handleResize);
    loop?.destroy();
    media.forEach((img) => {
      img.style.opacity = "1";
    });
    objects.forEach((object) => {
      object.texture?.dispose?.();
      object.material.dispose();

    });
    material.dispose();
    geometry.dispose();
    renderer.domElement.remove();
    renderer.dispose();
  };
}

function initParticleVisual(
  root: HTMLElement,
  asset: (path: string) => string,
) {
  const canvas = root.querySelector<HTMLCanvasElement>("#particle-canvas");
  if (!canvas) return () => {};
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
    desynchronized: true,
  });
  if (!gl) return () => {};

  const config = {
    canvasBg: "#e30613",
    distortionRadius: 220,
    forceStrength: 0.035,
    logoPath: asset("lab/hero-visual.png"),
    logoSize: 900,
    maxDisplacement: 100,
    particleSpacing: window.innerWidth < 1000 ? 6 : 4,
    returnForce: 0.1,
  };
  const state = {
    geometry: null as null | {
      colBuf: WebGLBuffer;
      count: number;
      posBuf: WebGLBuffer;
    },
    isMobile: window.innerWidth < 1000,
    mouse: { x: 0, y: 0 },
    particles: [] as {
      i: number;
      j: number;
      ox: number;
      oy: number;
      vx: number;
      vy: number;
    }[],
    posArray: null as Float32Array | null,
    program: null as WebGLProgram | null,
  };
  let active = true;
  let vShader: WebGLShader | null = null;
  let fShader: WebGLShader | null = null;
  let execCount = 0;
  let pixelRatio = 1;
  let pointerX = 0;
  let pointerY = 0;
  let pointerDirty = false;
  let resolutionUniform: WebGLUniformLocation | null = null;
  let pointSizeUniform: WebGLUniformLocation | null = null;

  function sizeCanvas() {
    const size = getSceneBufferSize({ width: innerWidth, height: innerHeight });
    canvas.width = size.width;
    canvas.height = size.height;
    pixelRatio = canvas.width / innerWidth;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
  }

  function setupShaders() {
    const vs = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_pointSize;
      attribute vec2 a_position;
      attribute vec4 a_color;
      varying vec4 v_color;
      void main() {
        vec2 clip = (a_position / u_resolution * 2.0 - 1.0) * vec2(1.0, -1.0);
        v_color = a_color;
        gl_Position = vec4(clip, 0.0, 1.0);
        gl_PointSize = u_pointSize;
      }`;

    const fs = `
      precision mediump float;
      varying vec4 v_color;
      void main() {
        if (v_color.a < 0.01) discard;
        float dist = length(gl_PointCoord - 0.5);
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
      }`;

    vShader = gl.createShader(gl.VERTEX_SHADER);
    fShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vShader || !fShader) return;

    gl.shaderSource(vShader, vs);
    gl.compileShader(vShader);
    gl.shaderSource(fShader, fs);
    gl.compileShader(fShader);

    state.program = gl.createProgram();
    if (!state.program) return;
    gl.attachShader(state.program, vShader);
    gl.attachShader(state.program, fShader);
    gl.bindAttribLocation(state.program, 0, "a_position");
    gl.bindAttribLocation(state.program, 1, "a_color");
    gl.linkProgram(state.program);
    resolutionUniform = gl.getUniformLocation(state.program, "u_resolution");
    pointSizeUniform = gl.getUniformLocation(state.program, "u_pointSize");
  }

  function createParticles(pixels: Uint8ClampedArray) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = Math.min(innerWidth / 1100, 1) * pixelRatio;
    const dim = config.logoSize;
    const spacing = config.particleSpacing;
    const pos: number[] = [];
    const colors: number[] = [];

    state.particles = [];

    for (let i = 0; i < dim; i += spacing) {
      for (let j = 0; j < dim; j += spacing) {
        const idx = (i * dim + j) * 4;
        if (pixels[idx + 3] > 50) {
          const x = cx + (j - dim / 2) * scale;
          const y = cy + (i - dim / 2) * scale;

          pos.push(x, y);
          colors.push(
            pixels[idx] / 255,
            pixels[idx + 1] / 255,
            pixels[idx + 2] / 255,
            pixels[idx + 3] / 255,
          );
          state.particles.push({ ox: x, oy: y, vx: 0, vy: 0, i, j });
        }
      }
    }

    state.posArray = new Float32Array(pos);
    const posBuf = gl.createBuffer();
    const colBuf = gl.createBuffer();
    if (!posBuf || !colBuf) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, state.posArray, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    state.geometry = { posBuf, colBuf, count: state.particles.length };
    loop.request();
  }

  function loadImage() {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!active) return;
      const temp = document.createElement("canvas");
      const ctx = temp.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      temp.width = temp.height = config.logoSize;

      const s = config.logoSize * 0.9;
      const o = (config.logoSize - s) / 2;
      ctx.drawImage(img, o, o, s, s);

      try { createParticles(ctx.getImageData(0, 0, config.logoSize, config.logoSize).data); } catch { canvas.style.display = "none"; }
    };
    img.src = config.logoPath;
  }

  function render() {
    if (!state.program || !state.geometry) return;
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      config.canvasBg,
    );
    if (!rgb) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(
      Number.parseInt(rgb[1], 16) / 255,
      Number.parseInt(rgb[2], 16) / 255,
      Number.parseInt(rgb[3], 16) / 255,
      1,
    );
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(state.program);

    gl.uniform2f(
      resolutionUniform,
      canvas.width,
      canvas.height,
    );
    gl.uniform1f(pointSizeUniform, 3 * pixelRatio / Math.min(devicePixelRatio || 1, 2));

    gl.bindBuffer(gl.ARRAY_BUFFER, state.geometry.posBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, state.geometry.colBuf);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, state.geometry.count);
  }

  function animate() {
    if (!state.geometry || !state.posArray) return false;
    if (pointerDirty) {
      const rect = canvas.getBoundingClientRect();
      state.mouse.x = (pointerX - rect.left) * pixelRatio;
      state.mouse.y = (pointerY - rect.top) * pixelRatio;
      pointerDirty = false;
    }

    if (!state.isMobile && execCount > 0) {
      execCount--;
      const rad = (config.distortionRadius * pixelRatio) ** 2;
      const maxDisplacement = config.maxDisplacement * pixelRatio;
      const motionScale = pixelRatio / Math.min(devicePixelRatio || 1, 2);
      const forceStrength = config.forceStrength * motionScale;
      const edgeFalloff = 0.02 / motionScale;
      let needsUpdate = false;

      for (let i = 0; i < state.particles.length; i++) {
        const x = state.posArray[i * 2];
        const y = state.posArray[i * 2 + 1];
        const p = state.particles[i];
        const dx = state.mouse.x - x;
        const dy = state.mouse.y - y;
        const dis = dx * dx + dy * dy;

        if (dis < rad && dis > 0) {
          const f = -rad / dis;
          const distOrig = Math.sqrt((x - p.ox) ** 2 + (y - p.oy) ** 2);
          const mult = Math.max(
            0.1,
            1 - distOrig / (maxDisplacement * 2),
          );
          const force = f * forceStrength * mult / Math.sqrt(dis);
          p.vx += dx * force;
          p.vy += dy * force;
          needsUpdate = true;
        }

        if (Math.abs(p.vx) > 0.01 || Math.abs(p.vy) > 0.01) {
          const nx = x + (p.vx *= 0.82) + (p.ox - x) * config.returnForce;
          const ny = y + (p.vy *= 0.82) + (p.oy - y) * config.returnForce;
          const dox = nx - p.ox;
          const doy = ny - p.oy;
          const distOrig = Math.sqrt(dox * dox + doy * doy);

          if (distOrig > maxDisplacement) {
            const s = maxDisplacement / distOrig;
            const ds =
              s +
              (1 - s) * Math.exp(-(distOrig - maxDisplacement) * edgeFalloff);
            state.posArray[i * 2] = p.ox + dox * ds;
            state.posArray[i * 2 + 1] = p.oy + doy * ds;
            p.vx *= 0.7;
            p.vy *= 0.7;
          } else {
            state.posArray[i * 2] = nx;
            state.posArray[i * 2 + 1] = ny;
          }
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        gl.bindBuffer(gl.ARRAY_BUFFER, state.geometry.posBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, state.posArray);
      }
    }

    render();
    return !state.isMobile && execCount > 0;
  }

  function handleMouseMove(event: MouseEvent) {
    if (state.isMobile) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerDirty = true;
    execCount = 90;
    loop.request();
  }

  function handleResize() {
    state.isMobile = innerWidth < 1000;
    sizeCanvas();
    if (!state.geometry || !state.posArray) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = Math.min(innerWidth / 1100, 1) * pixelRatio;
    const dim = config.logoSize;

    for (let i = 0; i < state.particles.length; i++) {
      const p = state.particles[i];
      p.ox = cx + (p.j - dim / 2) * scale;
      p.oy = cy + (p.i - dim / 2) * scale;
      p.vx = 0;
      p.vy = 0;
      state.posArray[i * 2] = p.ox;
      state.posArray[i * 2 + 1] = p.oy;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, state.geometry.posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, state.posArray);
    execCount = 0;
    loop.request();
  }

  const loop = createVisibleRenderLoop({ element: canvas, occludedBy: root.querySelector<HTMLElement>(".menu-overlay"), draw: animate });
  sizeCanvas();
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  setupShaders();
  loadImage();
  const pointerTarget = root.querySelector<HTMLElement>(".lab-hero") || canvas;
  pointerTarget.addEventListener("pointermove", handleMouseMove, { passive: true });
  window.addEventListener("resize", handleResize);

  return () => {
    active = false;
    loop.destroy();
    pointerTarget.removeEventListener("pointermove", handleMouseMove);
    window.removeEventListener("resize", handleResize);
    if (state.geometry) {
      gl.deleteBuffer(state.geometry.posBuf);
      gl.deleteBuffer(state.geometry.colBuf);
    }
    if (state.program) {
      if (vShader) gl.detachShader(state.program, vShader);
      if (fShader) gl.detachShader(state.program, fShader);
      gl.deleteProgram(state.program);
    }
    if (vShader) gl.deleteShader(vShader);
    if (fShader) gl.deleteShader(fShader);
  };
}
