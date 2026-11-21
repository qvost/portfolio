# qvost / Siddid Pandey

A portfolio for Siddid Pandey, building Shaligram Labs in Kathmandu. Featured work: **Statis**, **Strata**, and **Reify**. Built on the supplied BLANK Deadspace source with React, TypeScript, Vite, GSAP, Lenis, and Three.js.

## Run

```sh
npm install
npm run dev
```

Vite defaults to port 5173. `npm run build` creates `dist/`; `npm run preview` serves the production build. Three.js is bundled from the installed dependency and imported when a visual scene needs it. No runtime import map or external Three.js CDN is needed.

## Routes

| Path | Content |
| --- | --- |
| `/` | Introduction, Shaligram Labs, and three selected projects |
| `/work` | All 11 public repositories, with illustrations, descriptions, stack labels, and source links |
| `/project` | Reify: live web traffic to typed MCP tools |
| `/lab` | Shaligram Labs, particle scene, pinned experiment, and technical interests |
| `/contact` | Finite contact page, Kathmandu clock, email copy, and social links |

Every route has the shared halftone hands footer. Navigation supports direct URLs, browser history, modified clicks, and a circular joystick menu. Vercel and Netlify SPA fallbacks are included.

## This polish pass

- Corrected the lab to **Shaligram Labs**, with links to its website throughout the portfolio.
- Replaced the former project selection with Statis, Strata, and Reify. Their images are original concept diagrams, with actual project and repository links.
- Made Reify the featured `/project` record, with its own copy, menu entry, title, repository, and Shaligram Labs link. Strata links to its research site.
- Expanded Work to all 11 public repositories, including the profile README. Each row uses the existing alternating illustration and copy layout. The homepage keeps Statis, Strata, and Reify as its selected projects.
- Removed decorative arrows from link labels and the email-copy control. The back-to-top link has a visible text label.
- Removed the footer builder credit and the homepage lab badge. Simplified the introduction, project summaries, contact copy, and navigation labels, and matched the navigation and about-section mark to the qvost favicon. Source provenance remains documented below.
- Removed the asynchronous Three.js route remount that could restart loading and animations.
- Rebuilt menu state changes so focus moves once when opening, returns when closing, and background scrolling stops while the dialog is open. Escape, keyboard navigation, and drag selection are supported.
- Shortened the boot animation to about one second and the page transition to a short block wipe.
- Made SplitText own its animation lifecycle so font loading and width changes can preserve reveal progress.
- Replaced the old cursor ring with a precise dot and bracket reticle. It uses transforms, stops requesting frames when settled, and yields to keyboard, touch, reduced motion, editable fields, and forced colors.
- Removed cloned contact sections and infinite contact scrolling.
- Capped the lab particle raster and density, paused offscreen hero drawing, and added image restoration on WebGL context or shader failure.
- Added responsive layout corrections and a consistent footer with local halftone artwork.
- Deferred the Three.js import without remounting the route. Reduced-motion visits skip it; the menu initializes its renderer on first opening, and project distortion initializes near the artwork on desktop.
- Stopped canvas frame scheduling offscreen and in hidden tabs. The menu stops when closed, particles stop after their interaction settles, and project distortion renders on scroll, image load, and resize.
- Made project artwork load lazily and initialize each texture independently. Resizing redraws the static fallback skyline, including reduced-motion visits.

Interface audio starts off and can be enabled with the Sound control. Storage restrictions keep audio off without breaking navigation.

## Edit content

- `components/ui/deadspace-page/portfolio-data.ts`: identity, lab, selected projects, and the full repository archive.
- `components/ui/deadspace-page/portfolio.ts`: route copy and markup adaptations.
- `components/ui/deadspace-page/polish.css`: current layout, footer, and cursor corrections.
- `components/ui/deadspace-page/portfolio.css`: earlier portfolio styles, layered before the polish stylesheet.
- `components/ui/deadspace-page/portfolio-effects.ts`: cursor, accessibility, sound, copy action, and canvas fallback.
- `components/ui/deadspace-page/render-loop.ts`: shared visibility and demand controls for canvas rendering.
- `components/ui/deadspace-page/index.tsx`: source animation runtime and local router.
- `components/ui/halftone-hands/index.ts`: local vector hands illustration.
- `public/projects/`: original illustrations for all 11 repositories.

The component retains its `assetBase`, `initialPath`, `className`, and `style` props.

## Source and assets

Deadspace registry: `@compronents/deadspace-page`, revision `3c6248757140`.

The four original supplied files were copied before adaptation, their hashes matched the handoff, and exact copies remain under `vendor/deadspace-page/`. The active `fragments.ts`, `menu-shader.ts`, and `styles.ts` also remain unchanged. Portfolio copy is adapted by a separate module.

The original font, lab visual, project spatial artwork, contact icon, and sound paths remain available through `assetBase`. Reify's supporting spatial artwork is labeled as artwork, rather than a software screenshot. The work cards use local concept illustrations with lazy loading and asynchronous image decoding.

To self-host the original assets:

```sh
npm run assets:sync
VITE_ASSET_BASE=/assets/deadspace-page npm run build
```

Alternatively set `VITE_ASSET_BASE` in `.env.local`. The sync script validates responses and fails on missing or HTML assets.

### Halftone hands provenance

Requested reference: https://ui.aryank.space/components/halftone-hands

The BLANK CLI is absent, and the reference page, registry source, and discovery endpoints were unreachable from this execution environment. The footer therefore uses an original local SVG recreation of two reaching halftone hands. **It is not the registry's installed component or a verified exact copy.** It has no additional runtime dependency and uses the same motion preferences as the rest of the portfolio.

## Content grounding

Rechecked on November 21, 2026:

- https://github.com/qvost
- https://github.com/qvost/statis
- https://github.com/qvost/strata
- https://github.com/qvost/reify
- https://github.com/qvost/shaligram-labs
- https://github.com/qvost/vecta
- https://github.com/qvost/hisaab
- https://github.com/qvost/samayamiiti
- https://github.com/qvost/nitro-fan
- https://github.com/qvost/seedhemaut-tribute
- https://github.com/qvost/sonafi-site
- https://github.com/qvost/qvost
- https://shaligramlabs.vercel.app/

GitHub profile and repository content supplied the identity and project descriptions. Direct access to Shaligram's deployed site was blocked; its local repository source and exported homepage were also inspected. LinkedIn blocked public retrieval, so its supplied URL remains a contact link; employment and education details were not inferred.

The public GitHub profile lists 11 repositories. All 11 archive entries have public repository pages. The repositories tab and API were unavailable in this environment, so repository pages, READMEs, and matching local source supplied the archive details. Repository data is stored locally and does not require a GitHub request when someone opens Work. `sonafi-site` is the repository slug for the independent Sanofi website study. This is a snapshot of the public repositories checked on November 21, 2026.

## Verification

```sh
npm run audit:content
npm run typecheck
npm run build
```

The content audit checks the homepage selection and order, identity, lab URL, all archive repository destinations and local illustrations, and the obsolete lab name. TypeScript and production compilation pass. The generated SVG hands and project illustrations were rasterized and inspected independently.

Full browser verification remains pending: the environment rejects local server startup with `listen EPERM`, and Chromium cannot start because socket operations are forbidden. Desktop and narrow viewport interactions, visual layout, and live hosted font/media responses have not been verified here. The successful build does not substitute for those checks.

### Performance evidence

Before the archive expansion, a static production-build comparison on November 21, 2026, using the same dependencies and Vite settings showed that JavaScript referenced by the HTML entry and its module-preload links decreased from **284 KB to approximately 161 KB gzip**, a **43% reduction**. Sizes are the sum of `node:zlib.gzipSync` outputs for those files, not a browser network trace. These are the performance pass measurements, not a new measurement of the expanded archive.

The approximately 124 KB gzip Three.js chunk is now deferred. A normal-motion homepage still requests it for the skyline; reduced-motion visits and other routes avoid that request until a supported scene is activated. Total JavaScript for a visit that uses all scenes is slightly larger because of the scheduling controls.

Loading and interaction improvements remain hypotheses until measured in a browser. To verify: run `npm run dev` in an environment that permits sockets, record equivalent cold-load DevTools traces on desktop and mobile, compare initial transfers and LCP, then record idle, scroll, menu open/close, and tab visibility transitions. Check that canvas callbacks stop offscreen or when static, resume when needed, and disappear after route changes. Repeat with reduced motion enabled. No LCP, INP, CLS, or field-performance improvement has been claimed from the build sizes.
