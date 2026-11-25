# Acceptance record

## Ink cursor and footer, November 26

- Replaced the brackets with an ink drop. It stretches with movement, expands over controls, and compresses on press. The hover tip is blue on the white pages and green in the lab.
- A fresh desktop Chromium session confirmed hover expansion and press compression. A mutation observer recorded zero cursor style writes during a settled 350ms interval.
- Live reduced motion, pointer cancellation, and movement over the contact input restored the native cursor. Chromium coarse-pointer emulation also left it native.
- Removed upright and directional arrow glyphs from rendered navigation and project links. Keyboard arrow controls still work.
- Added a shared contact footer to the final GitHub chapter and the static projects page. It contains the email, social links, location, year, and a return link. The interactive copy target is 44px square.
- The real clipboard operation reported success. A simulated permission rejection reported failure. The footer return control also worked with keyboard Enter.
- Inspected the footer at 1440px and 320px. The narrow GitHub scroll width remained 320px. The static projects footer loaded its standalone stylesheet and has no copy button requiring JavaScript.
- Entered the lab, confirmed the ASCII mark loaded, continued through the zoom-out transition to GitHub, and returned to the introduction. The deferred project grid contained all ten projects when opened.
- Three local throttled navigations recorded six initial resource requests rather than fifteen, and 277,023 encoded resource bytes rather than 429,918. Paint timings were unavailable in that automated session; no Core Web Vitals pass is claimed. See `performance.md`.
- TypeScript, the production build, static HTML generation, and all four vendor source hash checks pass. No runtime package was added.

Current screenshots and interaction records are in ignored `artifacts/ink-final-hover.png`,
`footer-desktop.png`, `footer-mobile-final.png`, `footer-static-mobile.png`,
`cursor-interactions.json`, and `final-interactions.json`.

## Bracket cursor and ASCII mark, November 26

- Replaced the ribbon with a precise point and spring brackets. Brackets widen over controls, compress on press, and show short action labels. The lab uses a green point; the portfolio and GitHub use blue.
- The cursor parks after settling, clears on cancellation, blur, or tab visibility changes, and restores native behavior for inputs, coarse pointers, and live reduced-motion changes.
- Copied the supplied ASCII source before adapting it. Its untouched vendor hash matches `c1ec8a5fbe4832a9ae78f97b975385bceacaa04f19d7b45138690a5a6190978d`. `npm run source:verify` confirms all four shipped source files.
- The lab hero samples the actual Shaligram mark through a white-fill copy of the original SVG. The header keeps the static original. No external sample logo appears in the page.
- Fine-pointer inspection confirmed glyph displacement and a full spring return to the original sampled positions. The cursor's hover and press shapes were inspected in the browser.
- Canvas redraws stop when offscreen, in a background tab, or in a closed chapter. Live reduced motion produces identical successive canvas frames and removes the custom cursor.
- Blocking the sampling asset left the original SVG visible. Normal loading completed without a missing asset or uncaught browser error.
- Desktop 1440px and narrow 320px layouts were inspected. At 320px, the lab scroll width remained 320px. Chromium touch emulation confirmed native swiping over the mark and tapping it to reach Reify. No physical iOS or Android device was used.
- TypeScript and the production build pass, including static HTML generation. No runtime package was added.

Evidence in `artifacts/`: `bracket-cursor-hover.png`, `ascii-scatter-desktop.png`,
`ascii-lab-desktop.png`, `ascii-lab-mobile.png`, `ascii-logo-touch.png`, and
`ascii-static-fallback.png`.

## Copy and search pass, November 26

- The landing heading names qvost and describes the work. The GitHub and lab copy uses direct descriptions. The 320px GitHub heading fits after shortening it to "Code and activity."
- The production build prerenders the home page, then hydrates the existing interactive app. `/work/` and the JavaScript-disabled fallback share the ten projects from `src/portfolio-data.ts`.
- Canonicals, WebSite and Person data, titles, descriptions, social previews, robots, and sitemap use `https://qvost.vercel.app`. The existing Search Console verification tag is preserved.
- Local production HTTP inspection returned 200 for home, projects, robots, sitemap, and sharing PNG. Sitemap XML and JSON-LD parsed successfully. Browser hydration reported no errors.
- The no-JavaScript mobile visit showed the fallback and all ten projects. Desktop and 320px screenshots are under `artifacts/seo-*`.
- Search Console verification, indexing, and ranking are external follow-up after deployment. See `docs/seo-audit.md`.

Current revision checked November 26, 2026 against the local production preview.
This replaces the November 25 checks for the initial film-template version.

## Requested revision

- [x] Removed the lower video and its runtime player, playback controls, and film galleries.
- [x] Removed the film clips and still images from `public/` and the built output.
- [x] Removed all visible film credits from the portfolio, grid, project details, and information screen.
- [x] Replaced project covers with the user's ten original project illustrations from the sibling portfolio.
- [x] Replaced the lower panel with Shaligram Labs, researched directly from its live home, system, and manifesto pages.
- [x] Used the lab's actual mark, relevant Reify research, and working links to the lab, paper, system, repository, and manifesto.
- [x] Kept the original 64px peek, 1000ms reveal easing, and 300ms delay.
- [x] Continued into native scrolling within the lab, with reverse scrolling at the top to return home.

The original source attribution is retained privately in the untouched vendor
files. It is not rendered as a portfolio credit.

## Browser checks

Chromium desktop at 1440 × 900 and mobile emulation at 393 × 852 were operated.
The 320 × 640 layout was inspected separately.

- [x] Mouse wheel opens the lab. Scrolling down continues into the research section.
- [x] Scrolling to the top and then scrolling upward returns to the introduction.
- [x] The opening momentum does not immediately reverse the reveal.
- [x] Clicking the peek opens the lab. Back and Escape return to the portfolio.
- [x] A CDP touch swipe opens the lab, a second swipe scrolls the content, and a downward swipe from the top closes it.
- [x] All three discovery buttons remain keyboard controls. Selecting a path updates the diagram and text.
- [x] P and I navigate to projects and information. Project cards open original artwork, descriptions, and destination links.
- [x] Grid images resolve for all ten projects.
- [x] No video elements, film-image requests, visible film credits, or broken images were found in the checked flows.
- [x] Changing reduced motion while mounted removes the reveal transition. Arrow Down and Escape still work.
- [x] No horizontal overflow was observed in the checked desktop and mobile lab layouts.
- [x] No uncaught browser errors were reported.

The mobile checks caught a sticky hover state causing the collapsed strip to
remain lifted. The lift now applies only to devices with a fine pointer and
hover support. The lab also hides the inactive portfolio logo on mobile.

## Assets and compile checks

- [x] `npm run typecheck` passes.
- [x] `npm run build` passes.
- [x] `npm run source:verify` still matches all three supplied vendor hashes.
- [x] `npm run assets:sync` only restores the font and the user's lab mark.
- [x] All 13 current public files were fetched from the production preview and matched their local bytes. Total size: 346,039 bytes.

Current evidence is stored under the ignored `artifacts/` directory. Lab images
use the `lab-` and `home-lab-` prefixes; original project artwork checks use
`projects-own-art-` and `project-own-art-`. `lab-runtime-checks.json` records touch,
internal scroll, return gestures, and live reduced-motion changes.

Physical phones, Safari, and Firefox remain unchecked. No production deployment
was performed.

## Final interaction pass, November 26

- [x] Production build and TypeScript compile pass with no additional dependency.
- [x] Lab mark reacts to an actual fine pointer; nearby dots move and recover on leave.
- [x] Grid artwork tilts within its unchanged button hit area and resets under live reduced motion.
- [x] The reduced-motion setting hides the custom cursor and removes lab reveal transitions.
- [x] Contact opens, copies the actual email, and closes with Escape while focus returns to its trigger.
- [x] Denied clipboard permission displays the selectable-address fallback instead of success.
- [x] Research tabs support Left, Right, Home, End, and one tab stop for the selected control.
- [x] Chapter buttons scroll the lab container; current chapter and header progress respond to scrolling.
- [x] Desktop 1440px, mobile 393px, and narrow 320px layouts were inspected with no settled horizontal overflow.
- [x] No videos, visible film credits, broken project images, or uncaught browser errors appeared in the inspected flows.

Screenshots use the `polish-` prefix in `artifacts/`; `polish-runtime.json` records
pointer feedback, live reduced motion, clipboard denial, and final page state.

## Eye tracker integration

- [x] Added `components/ui/eye-tracker/EyeTracker.tsx` from the supplied Bencho source, retaining its explanatory comments.
- [x] All six design tokens map directly to existing portfolio properties; no global tokens or package dependencies were added.
- [x] Mounted the toy above the information screen's contact links.
- [x] An actual pointer turns the face and gives the two eyes different projected widths. Leaving the window returns them to center.
- [x] Click, touch, Enter, and Space activate replies. Consecutive keyboard activations produced different complete lines.
- [x] Live reduced motion restores a still face and removes typing motion. No eye DOM changes occurred during the observed 500ms interval.
- [x] Leaving Info unmounts the component; reopening it starts with the reply hidden.
- [x] The 320px layout keeps the reply inside the viewport and allows the longer information page to scroll.
- [x] TypeScript and the production build pass.

`artifacts/eye-runtime.json` records pointer, keyboard, reduced-motion, and
mounting observations. The `eye-` screenshots show desktop and narrow layouts.

## Project cover refresh

- [x] Replaced all ten covers with original paper, charcoal, and muted-green SVG artwork.
- [x] Each image has a project-specific illustration and retains its current asset path.
- [x] All ten grid images load at their expected 900 × 1080 dimensions.
- [x] Inspected the desktop grid, lower rows, mobile grid, and Sanofi project detail.
- [x] The 320px grid has no horizontal overflow.
- [x] Kept the grid layout and its pointer interactions; updated the loading ground to the existing off-white token.
- [x] TypeScript and the production build pass with no added dependencies.

The `grid-theme-` screenshots in `artifacts/` record this version. Artwork can
be regenerated with `npm run artwork:generate`.

## Third chapter: live GitHub contributions

- [x] Introduction → Shaligram Labs → GitHub is a reversible three-chapter flow with the existing reveal curve.
- [x] An actual wheel gesture opens the lab; scrolling its content to the bottom keeps the lab open; a fresh downward gesture opens GitHub.
- [x] Actual emulated touch swipes open the lab, continue into GitHub, and return to the lab at its preserved scroll position.
- [x] Arrow Down, End, then Page Down completes the keyboard flow; Escape restores focus to the lab's Next chapter control.
- [x] The live public feed loaded 368 dated cells. Totals and activity statistics derive from the response rather than literals.
- [x] Calendar arrows move by day/week with one tab stop and the corresponding date/count readout.
- [x] The five legend shades match the five calendar intensity levels.
- [x] Initial offline failure displays Retry; restoring the connection and retrying loads the calendar.
- [x] A failed manual refresh retains all loaded days and reports the failed refresh.
- [x] Live reduced motion removes sheet travel and does not reset the lab's retained scroll position.
- [x] Desktop 1440px, mobile 393px, and narrow 320px layouts inspected. Page width matches the viewport; only the calendar scrolls horizontally.
- [x] The page stack does not scroll when focus moves. Covered chapters are inert and the GitHub heading receives entry focus.
- [x] TypeScript and the production build pass; all three original source hashes still match. No new dependency added.

The `github-` screenshots under `artifacts/` record the lab continuation,
desktop and narrow calendar, and initial unavailable state. The data source is
`github-contributions-api.jogruber.de`; its one-hour source cache is disclosed
next to the fetched timestamp. The client fetches on entry and refreshes stale
activity while visible, with cancellation on departure and a manual refresh.

## GitHub landing theme and reactive cat

- [x] The GitHub sheet and sticky header use the introduction's white background and dark ink, with five monochrome calendar shades.
- [x] A real fine pointer updates the headline accent, cat pose, and eye direction; the header and hero marks react independently.
- [x] Click, Enter, and Space produce a short reply, bounce, and blink. Consecutive activations select different replies.
- [x] Reduced motion cancels gaze and active animations; keyboard activation still displays a reply with no running animation.
- [x] The 320px page has no horizontal overflow, and the cat's reply stays within the viewport.
- [x] The lab visibly shrinks into a rounded frame and fades before the white GitHub page appears. Returning restores its full scale, opacity, and scroll position.
- [x] TypeScript and production build pass. No uncaught browser errors appeared in the inspected desktop, narrow, or fine-pointer sessions.

Screenshots: `github-landing-theme-desktop.png`, `github-landing-theme-narrow.png`,
`github-reactive-cat.png`, and `github-white-zoom-out.png` in `artifacts/`.
