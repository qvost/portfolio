"use client";

// Portfolio navigation and loop-aware list adapted from the supplied reel page.
// Original source and attribution remain in vendor/colourist-reel-page/.

import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type Variants,
} from "motion/react";
import type * as React from "react";
import {
  createContext,
  memo,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type ColouristProject,
  type ColouristSite,
} from "./data";
import { getColouristReelPageStyles } from "./styles";
import { ColourRibbonCursor } from "./colour-ribbon-cursor";
import { useReducedMotion } from "./motion-preference";
import { LabContinuation, type ShaligramLab } from "./lab-continuation";
import { ContactPanel } from "./contact-panel";
import { usePointerTilt } from "./use-pointer-tilt";
import { EyeTracker } from "../eye-tracker/EyeTracker";
import { GitHubContributions } from "../github-contributions/GitHubContributions";

export type { ColouristProject, ColouristSite } from "./data";


export const DEFAULT_ASSET_BASE =
  "/assets/colourist-reel-page";

type Page = "home" | "projects" | "project" | "information";
type ProjectViewMode = "list" | "grid";
type HomeViewMode = "intro" | "lab" | "github";
type Filter = "all" | ColouristProject["type"];
type Breakpoint =
  | ""
  | "mobile"
  | "tabletPortrait"
  | "tabletMedium"
  | "tabletLandscape"
  | "laptop"
  | "desktop";
type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

export type ColouristReelView = "home" | "projects" | "grid" | "information";

interface RootContextValue {
  rootRef: RefObject<HTMLDivElement | null>;
  url: (path: string) => string;
}

const RootContext = createContext<RootContextValue | null>(null);

function useRoot() {
  const ctx = useContext(RootContext);
  if (!ctx) throw new Error("ColouristReelPage parts must render inside it");
  return ctx;
}

/** Leading + trailing throttle with `cancel`, matching lodash.throttle. */
function throttle<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: A | undefined;
  const invoke = (args: A) => {
    last = Date.now();
    fn(...args);
  };
  const throttled = (...args: A) => {
    const remaining = wait - (Date.now() - last);
    if (remaining <= 0 || remaining > wait) {
      if (timer) clearTimeout(timer);
      timer = undefined;
      invoke(args);
      return;
    }
    pending = args;
    timer ??= setTimeout(() => {
      timer = undefined;
      if (pending) invoke(pending);
      pending = undefined;
    }, remaining);
  };
  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };
  return throttled;
}

/** Ranges agree with the stylesheet, including exact breakpoint widths. */
function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w <= 550) setBp("mobile");
      else if (w <= 768) setBp("tabletPortrait");
      else if (w <= 1124) setBp("tabletMedium");
      else if (w <= 1440) setBp("tabletLandscape");
      else if (w <= 1679) setBp("laptop");
      else setBp("desktop");
    };
    window.addEventListener("resize", update);
    update();
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

const isSmall = (bp: Breakpoint) => bp === "mobile" || bp === "tabletPortrait";

const formatClock = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

/** Stands in for the source's em dash separators. */
const Dash = () => <span className="cr-dash" aria-hidden="true" />;

function Timezone({ timezone }: { timezone: string }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const tz = (() => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return timezone;
    } catch {
      return "Asia/Kolkata";
    }
  })();
  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!mounted)
    return (
      <div className="cr-tz" suppressHydrationWarning>
        {formatClock(new Date(), tz)}
      </div>
    );
  const zone =
    new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  return (
    <div className="cr-tz" suppressHydrationWarning>
      {formatClock(now, tz)} {zone}
    </div>
  );
}

const pageVariants: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeInOut", delay: 0.3 },
  },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeInOut" } },
};

function Description({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <p>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

function InfoScreen({
  site,
  isActive,
}: {
  site: ColouristSite;
  isActive: boolean;
}) {
  const { url } = useRoot();
  const logos = site.featuredLogos;
  return (
    <motion.section
      className="cr-info-screen"
      inert={!isActive}
      variants={pageVariants}
      initial="hidden"
      animate={isActive ? "visible" : "hidden"}
      style={{
        zIndex: isActive ? 20 : 1,
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      <div
        className="cr-info-inner"
        style={{ pointerEvents: isActive ? "auto" : "none" }}
      >
        {isActive ? <div className="q-info-companion"><EyeTracker size={88} within=".cr-info-screen" /></div> : null}
        <div className="cr-info-top">
          {site.instagramUrl ? (
            <motion.div className="cr-info-cell type-small">
              <a href={site.instagramUrl} target="_blank" rel="noreferrer">
                {site.instagramHandle}
              </a>
            </motion.div>
          ) : null}
          {site.email ? (
            <motion.div className="cr-info-cell type-small">
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </motion.div>
          ) : null}
        </div>
        {site.description ? (
          <div className="cr-info-desc type-small">
            <Description text={site.description} />
          </div>
        ) : null}
        {site.timezone && site.location ? (
          <div className="cr-info-tzrow type-small">
            <span>
              {site.location} <Dash />{" "}
            </span>
            <Timezone timezone={site.timezone} />
          </div>
        ) : null}
        {logos.length > 0 ? (
          <div className="cr-info-logos">
            {logos.map((src) => (
              <img
                key={src}
                className="cr-info-logo"
                src={url(src)}
                alt="Featured logo"
              />
            ))}
          </div>
        ) : null}
        {site.socials?.length ? <div className="cr-info-socials">
          {site.socials.map(link => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}
        </div> : null}
        <div className="cr-info-footer">
          <p className="type-small">
            <span>©</span> {new Date().getFullYear()} {site.name}
          </p>
          <p className="type-small">
            Built by{" "}
            <a href={site.builtBy.href} target="_blank" rel="noreferrer">
              {site.builtBy.label}
            </a>
          </p>
        </div>
      </div>
    </motion.section>
  );
}

// Opacity by distance (in slides) from the centre of the list.
const FALLOFF = [1, 0.6, 0.35, 0.2, 0.12, 0.06, 0];
const falloff = (d: number) => {
  if (d >= 6) return 0;
  const i = Math.floor(d);
  const n = FALLOFF[i];
  return n + (FALLOFF[i + 1] - n) * (d - i);
};

interface CarouselProps {
  projects: ColouristProject[];
  activeProject: ColouristProject | null;
  isPlayerMode: boolean;
  playerControlIsActive: boolean;
  activePage: Page;
  isActive: boolean;
  setActiveProject: (p: ColouristProject) => void;
  setActivePage: (p: Page) => void;
}

const carouselVariants: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
};

type EmblaApi = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>;

/** Per-slide distance from the scroll position, loop-aware, in slide units. */
function slideDistances(api: EmblaApi) {
  const engine = api.internalEngine();
  const progress = api.scrollProgress();
  const snaps = api.scrollSnapList();
  const count = snaps.length;
  const out = new Array<number>(count);
  let nearest = Number.POSITIVE_INFINITY;
  let nearestIndex = 0;
  for (let i = 0; i < count; i += 1) {
    let diff = snaps[i] - progress;
    if (engine.options.loop) {
      for (const point of engine.slideLooper.loopPoints) {
        const target = point.target();
        if (i === point.index && target !== 0) {
          const sign = Math.sign(target);
          if (sign === -1) diff = snaps[i] - (1 + progress);
          if (sign === 1) diff = snaps[i] + (1 - progress);
        }
      }
    }
    const d = Math.abs(diff * count);
    out[i] = d;
    if (d < nearest) {
      nearest = d;
      nearestIndex = i;
    }
  }
  return { distances: out, nearestIndex };
}

const ProjectCarousel = memo(function ProjectCarousel({
  projects,
  activeProject,
  isPlayerMode,
  playerControlIsActive,
  activePage,
  isActive,
  setActiveProject,
  setActivePage,
}: CarouselProps) {
  const rafRef = useRef<number | null>(null);
  const centreRef = useRef(0);
  const plugins = useMemo(() => [WheelGesturesPlugin()], []);
  const [emblaRef, api] = useEmblaCarousel(
    {
      loop: true,
      axis: "y",
      startIndex: Math.floor(projects.length / 2),
      dragFree: true,
      align: "center",
      skipSnaps: false,
      containScroll: false,
      watchSlides: false,
    },
    plugins,
  );

  useEffect(() => {
    if (!api || !activeProject) return;
    const i = projects.findIndex((p) => p.slug === activeProject.slug);
    if (i !== -1 && api.selectedScrollSnap() !== i) api.scrollTo(i, true);
  }, [api, activeProject, projects]);

  const paint = useCallback(() => {
    if (!api || !projects.length) return;
    const { distances, nearestIndex } = slideDistances(api);
    centreRef.current = nearestIndex;
    const slides = api.slideNodes();
    for (let i = 0; i < distances.length; i += 1) {
      const slide = slides[i];
      const d = distances[i];
      slide.style.opacity = String(falloff(d));
      slide.style.transform = "none";
      slide.style.pointerEvents = d <= 5 ? "auto" : "none";
      slide.style.willChange = "opacity";
      slide.setAttribute("data-center", String(d < 0.5));
      slide.tabIndex = d < 0.5 ? 0 : -1;
      slide.setAttribute("aria-current", String(d < 0.5));
    }
    api.containerNode().style.willChange = "transform";
  }, [api, projects.length]);

  const schedulePaint = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paint();
    });
  }, [paint]);

  // Centre the active project (or the middle row) whenever the list opens.
  useEffect(() => {
    if (!api || !isActive || !projects.length) return;
    let index =
      projects.length % 2 === 0
        ? Math.floor(projects.length / 2) - 1
        : Math.floor(projects.length / 2);
    if (activeProject) {
      const i = projects.findIndex((p) => p.slug === activeProject.slug);
      if (i !== -1) index = i;
    }
    api.scrollTo(index, true);
    setActiveProject(projects[index]);
  }, [api, isActive]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveProject(projects[api.selectedScrollSnap()]);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, projects, setActiveProject]);

  // A release near rest snaps hard; a fling keeps a tenth of its distance.
  useEffect(() => {
    if (!api) return;
    const onPointerUp = (instance: EmblaApi) => {
      const { scrollTo, target, location } = instance.internalEngine();
      const diff = target.get() - location.get();
      const factor = Math.abs(diff) < 0.25 ? 10 : 0.1;
      scrollTo.distance(diff * factor, true);
    };
    api.on("pointerUp", onPointerUp);
    return () => {
      api.off("pointerUp", onPointerUp);
    };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const clamp = () => {
      const {
        limit,
        target,
        location,
        offsetLocation,
        scrollTo,
        translate,
        scrollBody,
      } = api.internalEngine();
      let edge: number | null = null;
      if (limit.reachedMax(target.get())) edge = limit.max;
      if (limit.reachedMin(target.get())) edge = limit.min;
      if (edge !== null) {
        offsetLocation.set(edge);
        location.set(edge);
        target.set(edge);
        translate.to(edge);
        translate.toggleActive(false);
        // biome-ignore lint/correctness/useHookAtTopLevel: embla engine setter, not a React hook
        scrollBody.useDuration(0).useFriction(0);
        scrollTo.distance(0, false);
      } else {
        translate.toggleActive(true);
      }
    };
    paint();
    api.on("scroll", clamp);
    api.on("scroll", schedulePaint);
    api.on("reInit", paint);
    return () => {
      api.off("scroll", clamp);
      api.off("scroll", schedulePaint);
      api.off("reInit", paint);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [api, paint, schedulePaint]);

  const bp = useBreakpoint();
  const small = isSmall(bp);
  const onSlideClick = useCallback(
    (i: number) => {
      if (!api) return;
      api.scrollTo(i);
      setActiveProject(projects[i]);
      if (!small) setActivePage("project");
    },
    [api, small, setActivePage, setActiveProject, projects],
  );

  return (
    <div className="cr-carousel" role="region" aria-label="Projects, use up and down arrow keys" onKeyDown={(event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (event.key === "ArrowDown") api?.scrollNext();
        else api?.scrollPrev();
        if (api) api.slideNodes()[api.selectedScrollSnap()]?.focus({ preventScroll: true });
      }
    }}>
      <motion.div
        ref={emblaRef}
        className={isActive ? "cr-embla-pe-on" : "cr-embla-pe-off"}
        variants={carouselVariants}
        initial="hidden"
        animate={
          activePage !== "project" || playerControlIsActive
            ? "visible"
            : "hidden"
        }
      >
        <div className="cr-embla-container">
          {projects.map((p, i) => (
            <button
              type="button"
              key={`${p.slug}-${i}`}
              className="cr-slide cr-slide-desktop"
              onClick={() => onSlideClick(i)}
            >
              <div className="cr-tile-slot tile-slot">
                <motion.div
                  className="cr-tile"
                  data-tile
                  style={{
                    background: p.tileColor || "var(--colour-off-white)",
                  }}
                />
              </div>
              <motion.div
                className="cr-slide-content"
                style={
                  {
                    "--cr-slide-colour": isPlayerMode
                      ? "var(--colour-white)"
                      : "var(--colour-off-black)",
                  } as CSSVars
                }
              >
                {p.client ? <span>{p.client}</span> : null}
                {p.title ? (
                  <span className="project-title">{p.title}</span>
                ) : null}
              </motion.div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
});

const mobileCarouselVariants: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeInOut", delay: 0.5 },
  },
};

const MobileProjectCarousel = memo(function MobileProjectCarousel({
  projects,
  activeProject,
  isPlayerMode,
  activePage,
  isActive,
  setActiveProject,
  setActivePage,
}: CarouselProps) {
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number | null>(null);
  const [emblaRef, api] = useEmblaCarousel({
    loop: true,
    axis: "y",
    startIndex: Math.floor(projects.length / 2),
    dragFree: true,
    align: "center",
    skipSnaps: false,
    containScroll: false,
    watchSlides: false,
  });

  useEffect(() => {
    if (!api || !activeProject) return;
    const i = projects.findIndex((p) => p.slug === activeProject.slug);
    if (i !== -1 && api.selectedScrollSnap() !== i) api.scrollTo(i, true);
  }, [api, activeProject, projects]);

  const paint = useCallback(() => {
    if (!api || !projects.length) return;
    const { distances } = slideDistances(api);
    const slides = api.slideNodes();
    for (let i = 0; i < distances.length; i += 1) {
      const slide = slides[i];
      const d = distances[i];
      slide.style.opacity = String(falloff(d));
      slide.style.transform = "none";
      slide.style.willChange = "opacity";
      slide.setAttribute("data-center", String(d < 0.5));
      slide.tabIndex = d < 0.5 ? 0 : -1;
      slide.setAttribute("aria-current", String(d < 0.5));
    }
    api.containerNode().style.willChange = "transform";
  }, [api, projects.length]);

  const schedulePaint = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paint();
    });
  }, [paint]);

  useEffect(() => {
    if (!api || !isActive) return;
    paint();
    api.on("scroll", schedulePaint);
    api.on("reInit", paint);
    return () => {
      api.off("scroll", schedulePaint);
      api.off("reInit", paint);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [api, paint, schedulePaint, isActive]);

  useEffect(() => {
    if (!api || !projects.length || !isActive || activeProject) return;
    setActiveProject(projects[Math.floor(projects.length / 2)]);
  }, [api, projects, setActiveProject, isActive, activeProject]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSlideClick = useCallback(
    (i: number) => {
      if (!api || !isActive) return;
      if (api.selectedScrollSnap() === i) {
        setActivePage("project");
        return;
      }
      api.scrollTo(i);
      setActiveProject(projects[i]);
    },
    [api, setActivePage, setActiveProject, projects, isActive],
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveProject(projects[api.selectedScrollSnap()]);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, projects, setActiveProject]);

  return (
    <div className="cr-mcarousel performance" role="region" aria-label="Projects, use up and down arrow keys" onKeyDown={event => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (event.key === "ArrowDown") api?.scrollNext();
        else api?.scrollPrev();
        if (api) api.slideNodes()[api.selectedScrollSnap()]?.focus({ preventScroll: true });
      }
    }}>
      {mounted ? (
        <motion.div
          ref={emblaRef}
          variants={mobileCarouselVariants}
          initial="hidden"
          animate={activePage !== "project" ? "visible" : "hidden"}
          style={{ pointerEvents: activePage === "projects" ? "auto" : "none" }}
        >
          <div className="cr-embla-container">
            {projects.map((p, i) => (
              <button
                type="button"
                key={`${p.slug}-${i}`}
                className="cr-slide"
                onClick={() => onSlideClick(i)}
              >
                <div className="tile-slot">
                  <motion.div
                    className="cr-tile"
                    data-tile
                    style={{
                      background: p.tileColor || "var(--colour-off-white)",
                    }}
                  />
                </div>
                <motion.div
                  className="cr-mslide-content"
                  layout
                  transition={{ duration: 0.1 }}
                  style={
                    {
                      "--cr-slide-colour": isPlayerMode
                        ? "var(--colour-white)"
                        : "var(--colour-off-black)",
                    } as CSSVars
                  }
                >
                  {p.client ? <span>{p.client}</span> : null}
                  {p.title ? (
                    <span className="project-title">{p.title}</span>
                  ) : null}
                </motion.div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
});

function ProjectGridCard({
  project,
  isPriority,
  setActiveProject,
  setActivePage,
}: {
  project: ColouristProject;
  isPriority: boolean;
  setActiveProject: (p: ColouristProject) => void;
  setActivePage: (p: Page) => void;
}) {
  const { url } = useRoot();
  const tiltRef = usePointerTilt();
  return (
    <button
      ref={tiltRef}
      type="button"
      className="cr-grid-card"
      aria-label={`View ${project.client}: ${project.title}`}
      onClick={() => {
        setActiveProject(project);
        setActivePage("project");
      }}
    >
      <div className="cr-grid-media">
        <div className="cr-grid-media-inner">
          {project.poster ? (
            <img
              src={url(project.poster)}
              alt={`${project.title} - ${project.client}`}
              loading={isPriority ? "eager" : "lazy"}
              decoding="async"
            />
          ) : null}

        </div>
      </div>
      <div>
        <p className="cr-grid-title type-small">
          {project.source ? <><span>{project.client}</span><span>{project.title}</span></> : <>
            {project.title ? <span>{project.title}</span> : null}
            {project.client ? <span>{project.client}</span> : null}
          </>}
        </p>
        {project.type ? (
          <p className="cr-grid-type type-small">{project.type}</p>
        ) : null}
      </div>
    </button>
  );
}

const ProjectGrid = memo(function ProjectGrid({
  projects,
  isPlayerMode,
  isActive,
  useDelay,
  setActiveProject,
  setActivePage,
}: {
  projects: ColouristProject[];
  isPlayerMode: boolean;
  isActive: boolean;
  useDelay: boolean;
  setActiveProject: (p: ColouristProject) => void;
  setActivePage: (p: Page) => void;
}) {
  return (
    <div
      className="cr-grid"
      style={{
        pointerEvents: isPlayerMode ? "none" : isActive ? "all" : "none",
        opacity: isPlayerMode ? 0 : 1,
        transform: isPlayerMode ? "scale(0.98)" : "scale(1)",
        filter: isPlayerMode ? "blur(10px)" : "blur(0px)",
        transitionDelay: useDelay ? "500ms" : "0ms",
      }}
    >
      {projects.length > 0 ? (
        <div className="cr-grid-pad">
          <div className="cr-lgrid layout-grid">
            {projects.map((p, i) => (
              <ProjectGridCard
                key={p.slug}
                project={p}
                isPriority={i < 3}
                setActiveProject={setActiveProject}
                setActivePage={setActivePage}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
});

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "systems", label: "Systems" },
  { id: "web", label: "Web" },
  { id: "experiments", label: "Experiments" },
];

function ProjectFilters({
  activeFilter,
  isPlayerMode,
  setActiveFilter,
  projects,
}: {
  projects: ColouristProject[];
  activeFilter: Filter;
  isPlayerMode: boolean;
  setActiveFilter: (f: Filter) => void;
}) {
  return (
    <div
      className="cr-filters"
      inert={isPlayerMode}
      style={{
        pointerEvents: isPlayerMode ? "none" : "auto",
        opacity: isPlayerMode ? 0 : 1,
      }}
    >
      {FILTERS.filter(({ id }) => id === "all" || projects.some(project => project.type === id)).map(({ id, label }) => {
        const active = activeFilter === id;
        return (
          <button
            key={id}
            type="button"
            className="cr-filter"
            style={{ pointerEvents: active ? "none" : "auto" }}
            onClick={() => setActiveFilter(id)}
          >
            <span
              style={{
                color: active
                  ? "var(--colour-mid-grey)"
                  : "var(--colour-light-grey)",
              }}
            >
              {label}
            </span>
            {active ? (
              <motion.div className="cr-tile-bg" layoutId="filter-tile-bg" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

const listVariants: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeInOut" } },
};

const gridVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(5px)",
    y: 15,
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.5, ease: "easeInOut", delay: 0.75 },
  },
};

const ProjectsScreen = memo(function ProjectsScreen({
  projects,
  isActive,
  activeProject,
  activePage,
  playerControlIsActive,
  projectViewMode,
  homeViewMode,
  setActiveProject,
  setActivePage,
}: {
  projects: ColouristProject[];
  isActive: boolean;
  activeProject: ColouristProject | null;
  activePage: Page;
  playerControlIsActive: boolean;
  projectViewMode: ProjectViewMode;
  homeViewMode: HomeViewMode;
  setActiveProject: (p: ColouristProject) => void;
  setActivePage: (p: Page) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [filtered, setFiltered] = useState(projects);
  const [isFiltering, setIsFiltering] = useState(false);
  const hasProjects = projects.length > 0;
  const isPlayer = activePage === "project";
  const isList = projectViewMode === "list";
  const isGrid = projectViewMode === "grid";
  const small = isSmall(useBreakpoint());
  const listKey = filtered.map((p) => p.slug).join("|");

  // Fade out, swap the filtered set after 300ms, fade back in.
  useEffect(() => {
    setIsFiltering(true);
    const id = setTimeout(() => {
      setFiltered(
        filter === "all" ? projects : projects.filter((p) => p.type === filter),
      );
      setIsFiltering(false);
    }, 300);
    return () => clearTimeout(id);
  }, [filter, projects]);

  const listActive =
    isActive && homeViewMode === "intro" && (isList || (isGrid && isPlayer));

  return (
    <motion.section
      className="cr-projects"
      inert={!isActive}
      variants={pageVariants}
      initial="hidden"
      animate={isActive ? "visible" : "hidden"}
      style={{ zIndex: isActive ? 50 : 1 }}
    >
      <ProjectFilters
        projects={projects}
        isPlayerMode={isPlayer}
        activeFilter={filter}
        setActiveFilter={setFilter}
      />
      <div
        className="cr-projects-inner projects-screen"
        style={{
          opacity: hasProjects && !isFiltering ? 1 : 0,
          pointerEvents: hasProjects && !isFiltering ? "auto" : "none",
        }}
      >
        <motion.div
          className="cr-list"
          inert={!listActive || (isPlayer && !playerControlIsActive)}
          variants={listVariants}
          initial="hidden"
          animate={listActive ? "visible" : "hidden"}
          style={{
            zIndex: listActive ? 20 : 1,
            pointerEvents: listActive ? "auto" : "none",
          }}
        >
          {!small ? (
            <ProjectCarousel
              key={listKey}
              projects={filtered}
              activeProject={activeProject}
              isPlayerMode={isPlayer}
              activePage={activePage}
              playerControlIsActive={playerControlIsActive}
              isActive={listActive}
              setActiveProject={setActiveProject}
              setActivePage={setActivePage}
            />
          ) : null}
          {small ? (
            <MobileProjectCarousel
              key={listKey}
              projects={filtered}
              activeProject={activeProject}
              isPlayerMode={isPlayer}
              activePage={activePage}
              playerControlIsActive={playerControlIsActive}
              isActive={isActive && !isPlayer}
              setActiveProject={setActiveProject}
              setActivePage={setActivePage}
            />
          ) : null}
        </motion.div>
        <motion.div
          className="cr-gridwrap"
          inert={!isActive || !isGrid || isPlayer}
          variants={gridVariants}
          initial="hidden"
          animate={isActive && isGrid ? "visible" : "hidden"}
          style={{
            pointerEvents: isActive && isGrid && !isPlayer ? "auto" : "none",
            zIndex: isActive && isGrid && !isPlayer ? 20 : 1,
            transitionDelay: isGrid && isPlayer ? "500ms" : "0ms",
          }}
        >
          <ProjectGrid
            projects={filtered}
            isPlayerMode={isPlayer}
            isActive={isActive && isGrid}
            useDelay={isGrid && !isPlayer}
            setActiveProject={setActiveProject}
            setActivePage={setActivePage}
          />
        </motion.div>
      </div>
    </motion.section>
  );
});

/** The role word: its hue follows the cursor across the page, 0 to 300deg. */
function ColourTitle({ children }: { children: string }) {
  const reducedMotion = useReducedMotion();
  const { rootRef } = useRoot();
  const [hue, setHue] = useState(0);
  useEffect(() => {
    if (reducedMotion) { setHue(235); return; }
    const onMove = throttle((e: MouseEvent) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setHue(Math.floor(((e.clientX - rect.left) / (rect.width || 1)) * 300));
    }, 100);
    window.addEventListener("mousemove", onMove);
    return () => {
      onMove.cancel();
      window.removeEventListener("mousemove", onMove);
    };
  }, [rootRef, reducedMotion]);
  return (
    <span className="cr-colour" style={{ color: `hsl(${hue}deg,70%,50%)` }}>
      {children}
    </span>
  );
}

function HomeScreen({
  site,
  isPlayerMode,
  isActive,
}: {
  site: ColouristSite;
  isPlayerMode: boolean;
  isActive: boolean;
}) {
  return (
    <motion.section
      className="cr-home"
      inert={!isActive || isPlayerMode}
      variants={pageVariants}
      initial={isActive ? false : 'hidden'}
      animate={isActive ? "visible" : "hidden"}
      style={{ zIndex: isActive ? 2 : 1 }}
    >
      <div
        className="cr-home-content"
        style={{
          opacity: isPlayerMode ? 0 : 1,
          pointerEvents: isActive ? "auto" : "none",
        }}
      >
        <h1 className="cr-home-title">
          {site.name}, a <ColourTitle>{site.role}</ColourTitle> {site.titleSuffix}
        </h1>
        <p className="cr-home-sub">{site.subTitle}</p>
        <a className="q-work-index-link" href="/work/">Browse projects <span aria-hidden="true">↗</span></a>
      </div>
    </motion.section>
  );
}

function MainNavButton({
  title,
  hint,
  onClick,
  alignHintLeft = false,
}: {
  title: string;
  hint: string;
  onClick: () => void;
  alignHintLeft?: boolean;
}) {
  return (
    <button
      type="button"
      className="cr-navbtn tile-button"
      aria-label={hint}
      data-left={alignHintLeft}
      onClick={onClick}
    >
      {title}
      <p className="cr-navhint hint" data-left={alignHintLeft}>
        {hint}
      </p>
    </button>
  );
}

function EscButton({
  activePage,
  alignHintLeft = false,
  useDarkMode = false,
  setActivePage,
  setHomeViewMode,
}: {
  activePage: Page;
  alignHintLeft?: boolean;
  useDarkMode?: boolean;
  setActivePage: (p: Page) => void;
  setHomeViewMode?: (m: HomeViewMode) => void;
}) {
  const back = useCallback(() => {
    if (activePage === "project") setActivePage("projects");
    else if (activePage === "projects") setActivePage("home");
    else if (activePage === "home" && setHomeViewMode)
      setHomeViewMode("intro");
    else setActivePage("home");
  }, [activePage, setActivePage, setHomeViewMode]);

  return (
    <button
      type="button"
      className="cr-esc tile-button"
      aria-label="Back"
      data-dark={useDarkMode}
      data-left={alignHintLeft}
      onClick={back}
    >
      esc
      <p
        className="cr-eschint hint"
        data-dark={useDarkMode}
        data-left={alignHintLeft}
      >
        Escape
      </p>
    </button>
  );
}

const layoutStyle = (isActive: boolean): React.CSSProperties => ({
  pointerEvents: isActive ? "auto" : "none",
  zIndex: isActive ? 2 : 1,
});

function HomeLayout({
  homeViewMode,
  isActive,
  setActivePage,
  setHomeViewMode,
}: {
  homeViewMode: HomeViewMode;
  isActive: boolean;
  setActivePage: (p: Page) => void;
  setHomeViewMode: (m: HomeViewMode) => void;
}) {
  const small = isSmall(useBreakpoint());


  return (
    <motion.div
      className="cr-layout cr-layout-gap"
      inert={!isActive}
      variants={fadeVariants}
      initial="hidden"
      animate={isActive ? "visible" : "hidden"}
      style={layoutStyle(isActive)}
    >
      {homeViewMode === "lab" ? (
        <EscButton
          activePage="home"
          useDarkMode
          setActivePage={setActivePage}
          setHomeViewMode={setHomeViewMode}
        />
      ) : (
        <>
          <MainNavButton
            title={small ? "Projects" : "P"}
            hint="Projects"
            onClick={() => setActivePage("projects")}
          />
          <MainNavButton
            title={small ? "Info" : "I"}
            hint="Info"
            alignHintLeft
            onClick={() => setActivePage("information")}
          />
        </>
      )}
    </motion.div>
  );
}

const iconStroke = {
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ListIcon = () => (
  <svg
    width="14"
    height="10"
    viewBox="0 0 14 10"
    fill="none"
    aria-hidden="true"
  >
    <path d="M0.5 5H13.5" stroke="var(--colour-off-black)" {...iconStroke} />
    <path
      d="M0.5 9.33325H13.5"
      stroke="var(--colour-off-black)"
      {...iconStroke}
    />
    <path
      d="M0.5 0.666626H13.5"
      stroke="var(--colour-off-black)"
      {...iconStroke}
    />
  </svg>
);

const GridIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path d="M7 0.5V13.5" stroke="var(--colour-off-black)" {...iconStroke} />
    <path d="M0.5 7H13.5" stroke="var(--colour-off-black)" {...iconStroke} />
    <path
      d="M12.0556 0.5H1.94444C1.1467 0.5 0.5 1.1467 0.5 1.94444V12.0556C0.5 12.8533 1.1467 13.5 1.94444 13.5H12.0556C12.8533 13.5 13.5 12.8533 13.5 12.0556V1.94444C13.5 1.1467 12.8533 0.5 12.0556 0.5Z"
      stroke="var(--colour-off-black)"
      {...iconStroke}
    />
  </svg>
);

function ViewButton({
  active,
  dark,
  hint,
  onClick,
  children,
}: {
  active: boolean;
  dark: boolean;
  hint: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const idle = dark ? "var(--colour-off-white)" : "var(--colour-light-grey)";
  return (
    <button
      type="button"
      aria-label={hint}
      className={`cr-view ${dark ? "cr-view-dark" : "cr-view-light"}`}
      style={
        {
          pointerEvents: active ? "none" : "auto",
          "--cr-view-stroke": active ? "var(--colour-off-black)" : idle,
        } as CSSVars
      }
      onClick={onClick}
    >
      {children}
      <p className="cr-viewhint hint">{hint}</p>
      {active ? <motion.div className="cr-tile-bg" layoutId="tile-bg" /> : null}
    </button>
  );
}

function ProjectLayout({
  activePage,
  projectViewMode,
  isActive,
  setActivePage,
  setProjectViewMode,
}: {
  activePage: Page;
  projectViewMode: ProjectViewMode;
  isActive: boolean;
  setActivePage: (p: Page) => void;
  setProjectViewMode: (m: ProjectViewMode) => void;
}) {
  return (
    <motion.div
      className="cr-layout"
      inert={!isActive}
      variants={fadeVariants}
      initial="hidden"
      animate={isActive ? "visible" : "hidden"}
      style={layoutStyle(isActive)}
    >
      <EscButton activePage={activePage} setActivePage={setActivePage} />
      <div className="cr-views">
        <ViewButton
          active={projectViewMode === "list"}
          dark={false}
          hint="List"
          onClick={() => setProjectViewMode("list")}
        >
          <ListIcon />
        </ViewButton>
        <ViewButton
          active={projectViewMode === "grid"}
          dark={false}
          hint="Grid"
          onClick={() => setProjectViewMode("grid")}
        >
          <GridIcon />
        </ViewButton>
      </div>
    </motion.div>
  );
}

function DetailLayout({ activePage, isActive, setActivePage }: {
  activePage: Page;
  isActive: boolean;
  setActivePage: (page: Page) => void;
}) {
  return <motion.div className="cr-layout" inert={!isActive} variants={fadeVariants} initial="hidden" animate={isActive ? "visible" : "hidden"} style={layoutStyle(isActive)}>
    <EscButton activePage={activePage} useDarkMode setActivePage={setActivePage} />
  </motion.div>;
}

function InfoLayout({
  activePage,
  isActive,
  setActivePage,
}: {
  activePage: Page;
  isActive: boolean;
  setActivePage: (p: Page) => void;
}) {
  return (
    <motion.div
      className="cr-layout cr-layout-info cr-layout-gap"
      inert={!isActive}
      variants={fadeVariants}
      initial="hidden"
      animate={isActive ? "visible" : "hidden"}
      style={layoutStyle(isActive)}
    >
      <EscButton
        activePage={activePage}
        alignHintLeft
        setActivePage={setActivePage}
      />
    </motion.div>
  );
}

function Header({
  activePage,
  projectViewMode,
  homeViewMode,
  setActivePage,
  setProjectViewMode,
  setHomeViewMode,
}: {
  activePage: Page;
  projectViewMode: ProjectViewMode;
  homeViewMode: HomeViewMode;
  setActivePage: (p: Page) => void;
  setProjectViewMode: (m: ProjectViewMode) => void;
  setHomeViewMode: (m: HomeViewMode) => void;
}) {
  const small = isSmall(useBreakpoint());
  return (
    <header className="cr-header">
      <HomeLayout
        homeViewMode={homeViewMode}
        isActive={activePage === "home" && homeViewMode === "intro"}
        setActivePage={setActivePage}
        setHomeViewMode={setHomeViewMode}
      />
      <InfoLayout
        activePage={activePage}
        isActive={activePage === "information"}
        setActivePage={setActivePage}
      />
      <ProjectLayout
        activePage={activePage}
        projectViewMode={projectViewMode}
        isActive={activePage === "projects"}
        setActivePage={setActivePage}
        setProjectViewMode={setProjectViewMode}
      />
      <DetailLayout activePage={activePage} isActive={activePage === "project"} setActivePage={setActivePage} />
    </header>
  );
}

function Logo({
  site,
  activePage,
  homeViewMode,
  setActivePage,
}: {
  site: ColouristSite;
  activePage: Page;
  homeViewMode: HomeViewMode;
  setActivePage: (p: Page) => void;
}) {
  const [open, setOpen] = useState(false);
  const small = isSmall(useBreakpoint());
  const isActive =
    activePage !== "project" &&
    homeViewMode === "intro" &&
    (small || activePage !== "projects");
  return (
    <motion.div
      className="cr-logo type-p"
      inert={!isActive}
      onMouseOver={() => {
        if (!small) setOpen(true);
      }}
      onMouseOut={() => {
        if (!small) setOpen(false);
      }}
      style={
        {
          "--cr-logo-op": isActive ? 1 : 0,
          "--cr-logo-pe": isActive ? "auto" : "none",
        } as CSSVars
      }
    >
      <AnimatePresence initial={false}>
        <motion.div key="logo" className="cr-logo-cell" layout>
          <button
            type="button"
            className="cr-logo-btn"
            onClick={() => setActivePage("home")}
          >
            {site.name}
          </button>
        </motion.div>
        {open ? (
          <motion.div
            key="info-container"
            className="cr-logo-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout
          >
            <div>
              <Dash />
            </div>
            {site.email ? (
              <motion.div key="email" className="cr-logo-cell">
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </motion.div>
            ) : null}
            <div>
              <Dash />
            </div>
            {site.instagramUrl ? (
              <motion.div key="instagram" className="cr-logo-cell">
                <a href={site.instagramUrl} target="_blank" rel="noreferrer">
                  {site.instagramHandle}
                </a>
              </motion.div>
            ) : null}
            <div>
              <Dash />
            </div>
            <motion.div key="timezone" className="cr-logo-cell">
              <Timezone timezone={site.timezone} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function ProjectInfo({ isActive, project }: { isActive: boolean; project: ColouristProject | null }) {
  return <AnimatePresence>
    {isActive && project ? <motion.section key={project.slug} className="cr-pinfo q-project-details" aria-label={`${project.client} project details`}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .3 }}>
      <div className="q-project-detail-grid">
        <img className="q-project-cover" src={project.poster} alt={`${project.client} original project illustration`} />
        <div className="q-project-copy">
          <p className="q-project-category">{project.type} / Selected work</p>
          <h2 className="q-project-heading">{project.client}</h2>
          <p className="q-project-focus">{project.title}</p>
          <p className="cr-pinfo-description">{project.description}</p>
          {project.stack ? <p className="q-project-stack">Built with <span>{project.stack}</span></p> : null}
          <div className="cr-pinfo-links">
            {project.href ? <a href={project.href} target="_blank" rel="noreferrer">Visit project ↗</a> : null}
            {project.source ? <a href={project.source} target="_blank" rel="noreferrer">View source ↗</a> : null}
          </div>
          <p className="q-project-author">Code & design by Siddid Pandey</p>
        </div>
      </div>
    </motion.section> : null}
  </AnimatePresence>;
}

const viewState = (view: ColouristReelView): { page: Page; mode: ProjectViewMode } =>
  view === "grid" ? { page: "projects", mode: "grid" } : { page: view, mode: "list" };

function PortfolioChrome({ site, activePage, projectViewMode, expanded, project, count, openLab }: {
  site: ColouristSite;
  activePage: Page;
  projectViewMode: ProjectViewMode;
  expanded: boolean;
  project: ColouristProject | null;
  count: number;
  openLab: () => void;
}) {
  return <div className="q-chrome" aria-label="Portfolio links">
    {!expanded && activePage !== 'project' && activePage !== 'information' ? <>
      <p className="q-identity">{activePage === 'projects' ? `Selected work / ${count} projects` : 'Independent developer'}</p>
      <div className="q-location"><i className="q-location-dot" aria-hidden="true" /><span>{site.location.split(',')[0]}</span><Timezone timezone={site.timezone} /></div>
      {activePage !== 'projects' || projectViewMode === 'list' ? <>
        <a className="q-bottom-left" href={site.instagramUrl} target="_blank" rel="noreferrer">{site.instagramHandle}</a>
        <ContactPanel email={site.email} />
      </> : null}
    </> : null}
    {activePage === 'home' && !expanded ? <button type="button" className="q-reel-caption" onClick={openLab}>Scroll to explore <span>/ my AI lab</span><span className="q-scroll-arrow" aria-hidden="true">↓</span></button> : null}
    {activePage === 'projects' && project && projectViewMode === 'list' ? <div className="q-project-action">
      {project.href ? <a href={project.href} target="_blank" rel="noreferrer">Visit {project.client} ↗</a> : null}
      {project.source ? <a href={project.source} target="_blank" rel="noreferrer">View source ↗</a> : null}
    </div> : null}
  </div>;
}

export interface ColouristReelPageProps {
  assetBase?: string;
  site: ColouristSite;
  projects: ColouristProject[];
  lab: ShaligramLab;
  githubUsername: string;
  initialView?: ColouristReelView;
  className?: string;
  style?: React.CSSProperties;
}

export default function ColouristReelPage({
  assetBase = DEFAULT_ASSET_BASE,
  site,
  projects,
  lab,
  githubUsername,
  initialView = "home",
  className,
  style,
}: ColouristReelPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const base = assetBase.replace(/\/$/, "");
  const ctx = useMemo<RootContextValue>(() => ({
    rootRef,
    url: (path: string) => /^(https?:)?\/\//.test(path) || path.startsWith('/') ? path : `${base}/${path}`,
  }), [base]);
  const [activePage, setActivePage] = useState<Page>(viewState(initialView).page);
  const [projectViewMode, setProjectViewMode] = useState<ProjectViewMode>(viewState(initialView).mode);
  const [activeProject, setActiveProject] = useState<ColouristProject | null>(null);
  const [homeViewMode, setHomeViewMode] = useState<HomeViewMode>("intro");
  const labExpanded = activePage === 'home' && homeViewMode !== 'intro';
  const githubExpanded = activePage === 'home' && homeViewMode === 'github';
  const openLab = useCallback(() => setHomeViewMode('lab'), []);
  const openGitHub = useCallback(() => setHomeViewMode('github'), []);
  const closeLab = useCallback(() => setHomeViewMode('intro'), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      const key = event.key.toLowerCase();
      if (key === 'p') { event.preventDefault(); setActivePage('projects'); }
      else if (key === 'i') { event.preventDefault(); setActivePage('information'); }
      else if (event.key === 'Escape') {
        event.preventDefault();
        if (activePage === 'project') setActivePage('projects');
        else if (githubExpanded) openLab();
        else if (labExpanded) closeLab();
        else setActivePage('home');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePage, labExpanded, githubExpanded, openLab, closeLab]);

  useEffect(() => {
    const next = viewState(initialView);
    setActivePage(next.page);
    setProjectViewMode(next.mode);
  }, [initialView]);

  useEffect(() => {
    setHomeViewMode('intro');
    if (activePage === 'home') setActiveProject(null);
  }, [activePage]);

  return <RootContext.Provider value={ctx}>
    <LayoutGroup id="colourist-reel-page">
      <div ref={rootRef} role="main" aria-label={`${site.name} portfolio`}
        className={`cr-root${className ? ` ${className}` : ''}`}
        data-dark={activePage === 'project'} data-page={activePage}
        data-project-view={projectViewMode} data-lab-expanded={labExpanded} data-chapter={homeViewMode} style={style}>
        <style dangerouslySetInnerHTML={{ __html: getColouristReelPageStyles(base) }} />
        <Logo site={site} activePage={activePage} homeViewMode={homeViewMode} setActivePage={setActivePage} />
        <Header activePage={activePage} projectViewMode={projectViewMode} homeViewMode={homeViewMode}
          setActivePage={setActivePage} setProjectViewMode={setProjectViewMode} setHomeViewMode={setHomeViewMode} />
        <HomeScreen site={site} isPlayerMode={labExpanded} isActive={activePage === 'home'} />
        <ProjectsScreen projects={projects} activeProject={activeProject} activePage={activePage}
          playerControlIsActive={false} projectViewMode={projectViewMode} homeViewMode={homeViewMode}
          isActive={activePage === 'projects'} setActiveProject={setActiveProject} setActivePage={setActivePage} />
        <InfoScreen site={site} isActive={activePage === 'information'} />
        <LabContinuation lab={lab} host={rootRef} expanded={labExpanded} covered={githubExpanded} visible={activePage === 'home'} onOpen={openLab} onClose={closeLab} onNext={openGitHub} />
        <GitHubContributions key={githubUsername} username={githubUsername} active={githubExpanded} onBack={openLab} onHome={closeLab} />
        <ProjectInfo isActive={activePage === 'project'} project={activeProject} />
        <PortfolioChrome site={site} activePage={activePage} projectViewMode={projectViewMode} expanded={labExpanded}
          project={activeProject} count={projects.length} openLab={openLab} />
        <ColourRibbonCursor host={rootRef} />
      </div>
    </LayoutGroup>
  </RootContext.Provider>;
}
