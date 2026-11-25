# qvost portfolio

A portfolio for Siddid Pandey with scroll reveals into Shaligram Labs and live GitHub contributions.
React, TypeScript, Vite, Motion, and an Embla project list.

```sh
npm install
npm run dev
```

Development uses port 5174. `npm run build` checks TypeScript and writes `dist/`.
`npm run preview` serves the production build on port 4174.

## Edit the content

- `src/portfolio-data.ts` contains the identity, contact links, and ten projects.
- `src/shaligram-lab.ts` contains lab links and the three Reify discovery paths.
- `src/global.css` contains the visual overrides and responsive lab layout.
- `components/ui/colourist-reel-page/lab-continuation.tsx` owns the peeking panel, reveal, internal scrolling, and interactive compiler diagram.
- `components/ui/colourist-reel-page/colour-ribbon-cursor.tsx` owns the cursor artwork.
- `components/ui/github-contributions/` owns the third chapter, live calendar data, and its scoped styles.
- `public/projects/` contains ten original illustrations matching the portfolio's paper and green theme.
- `public/assets/shaligram/mark.svg` is the user's lab mark, sourced from the live lab site.

The page takes explicit `site`, `projects`, `lab`, and `githubUsername` content. It has no video
player, footage gallery, or film defaults. Project cards open descriptions,
original illustrations, and live/repository links.

## Controls

Scroll down, swipe up, press Arrow Down, or click the lower panel to reveal
Shaligram Labs. The reveal retains the original one-second easing and 64px peek.
Continue scrolling inside the lab to explore Reify, its discovery paths,
reported results, and the lab manifesto. Scroll up past the top, click a Back
button, or press Escape to return to the portfolio.

At the lab's bottom edge, continue with a fresh downward scroll, swipe up, press
Page Down, or click Next chapter to reveal GitHub. The third page fetches actual
contributions for `qvost`, supports keyboard/day inspection and mobile horizontal
scrolling, and offers manual refresh. The public source caches results for about
an hour; the fetched time is shown on the page. A failed refresh keeps the last
successful calendar. Back, Escape, or scrolling up past the top returns to the
same place in the lab. The chapter links also lead back to the introduction.

GitHub returns to the landing page's white-and-ink theme. The lab zooms out and
fades away as the contribution chapter appears. The cat in the header and hero
follows a fine pointer; click, tap, Enter or Space gives it a brief reply and
bounce. Reduced motion keeps the reply and removes movement.

P opens projects. I opens information. Escape returns from a project to the
list, then home. Up/down arrows move through a focused project list, and Enter
opens the selected project. Touch uses tap to center, then tap to open.

The cursor and reveal respond to live reduced-motion changes. Touch has native
pointer behavior. Hidden sections are inert. The lab uses native internal scroll
with overscroll containment and a guard against the opening gesture's momentum
immediately closing it.

## Research and source

The lab section was researched against the lab's home page, Reify system page,
and manifesto on November 26, 2026. See `docs/shaligram-research.md` for the
source URLs and content decisions. Paper metrics are labeled author-reported
and link to the published evaluation.

The navigation, centered title, project list physics, and reveal timing derive
from the supplied Colourist Reel Page at revision `5ca0339059a7`. Untouched source
and attribution remain under `vendor/colourist-reel-page/`. Run
`npm run source:verify` to verify the three original hashes. The public portfolio
contains no footage or third-party film credits. The font remains Booton Medium.
`npm run assets:sync` restores only the font and the lab mark.

Use `npm run typecheck` and `npm run build` for compile checks. Browser evidence
is stored in the ignored `artifacts/` directory. Current coverage is recorded in
`docs/acceptance.md`.
