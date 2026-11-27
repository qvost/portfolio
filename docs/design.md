# Portfolio direction

The initial implementation used the supplied Colourist Reel Page at revision
`5ca0339059a7`. Untouched copies under `vendor/colourist-reel-page/` still match
the three supplied hashes. The current app keeps its centered introduction,
edge controls, looping Embla list, pointer hue, and one-second reveal.

## November 26 revision

The user requested removal of the unrelated video and film credits. The runtime
now has no media player, video galleries, film data, or film credits. The video
and still files were removed from `public/`. Project cards use original project
illustrations from the user's sibling portfolio.

Shaligram Labs takes the lower panel's place. It rests as a 64px strip, expands
with the same 1000ms cubic-bezier easing and 300ms delay, then scrolls internally.
An upward gesture at the top, Back, or Escape returns to the introduction.
A short momentum guard keeps the opening gesture from immediately reversing it.
Native internal scrolling supports touch inertia and keyboard scrolling.

The lab uses its own warm paper, muted green, and actual mark. It contains an
introduction, an interactive three-path Reify diagram, paper results explicitly
labeled author-reported, and links to research, source, and the manifesto.
`docs/shaligram-research.md` records the sources and scope of these claims.

## Typography and interaction

Booton Medium remains the single face. The portfolio keeps its white stage,
ink headline, grey copy, and hue-following role. The cursor is an ink drop that
stretches with movement and expands over controls. A colored point marks the hit
position. Blue changes to green in the lab. Animation stops at rest, on
cancellation, in hidden tabs, and under reduced motion. Inputs and touch retain
their native pointer behavior.

The final chapter and static projects page share a contact footer. The email
address supplies its largest line of type. Thin rules separate contact, social
links, and the small wordmark. Navigation uses plain text without arrow icons.

The compiler diagram uses editable layout and SVG paths.
Changing a discovery path updates its wire offset, labels, code, and explanation.
The diagram illustrates the compiler's discovery order and has no live backend.
It runs no permanent animation loop. Reduced motion removes its transitions.

Personal and lab data are separate from the navigation and artwork modules.
The requested design-system-boss workflow remains out of scope because this was
an empty target rather than an existing design system migration. Unslop, router
design, codebase design, and interactive art informed the original implementation
and this focused revision.

## Final interaction pass

Public Bencho previews informed the original magnetic dots around the lab mark,
a spring selection tile in the research tabs, copy
feedback in a compact contact panel, and chapter ticks with reading progress.
See `docs/interaction-references.md` for the reference pages. No paid source was
downloaded and no dependency was added.

Project artwork tilts at most 2.2 degrees; its button hit area stays fixed. The
lab hero now uses the supplied ASCII component instead of magnetic dots. It samples
the actual mark into green glyphs on the paper grid. Pointer movement pushes nearby
glyphs out; a spring restores them. Sampling uses local dimensions so the mark
stays accurate through the chapter zoom. Hidden or covered chapters stop drawing
and flickering. Reduced motion keeps a static glyph rendering. The ink cursor
is the single global cursor effect.

Research controls now use native tab semantics, roving focus, arrow keys, Home,
and End. Chapter navigation uses the lab's existing scroll container rather
than a second scroll system. Contact copy confirmation follows the clipboard
promise; denied access shows a selectable-address fallback. Escape closes the
contact panel and restores focus without changing the portfolio screen.

## Project artwork

The grid now uses ten original SVG illustrations made for this portfolio,
replacing the previous red and black covers. Their paper grounds, charcoal ink,
and muted green match the Shaligram section. Each subject comes from its actual
project: repeated execution traces, vector planes, compiler connections, binary
comparisons, a rupee ledger, a calendar and clock, the original lab mark, cooling
hardware, vinyl records, and a healthcare concept illustration.

The files remain at `public/projects/<slug>.svg`, so grid and project details
share the new covers through the existing data. All use a 900 × 1080 viewBox and
have title and description metadata. The lab mark is embedded in its SVG rather
than fetched as an external dependency. These are native vector drawings, not
AI-generated bitmaps or screenshots of the products.

Run `npm run artwork:generate` to regenerate the complete set from
`scripts/create-project-artwork.mjs`. It uses only Node and the existing lab mark.

## Third chapter: GitHub

The home sequence is now introduction → Shaligram Labs → GitHub contributions.
At the bottom of the lab, a fresh downward wheel gesture, upward swipe, Page
Down, or the Next chapter button opens the third sheet. It follows the same
1000ms cubic-bezier curve; the lab zooms out to 78% with rounded edges and a
small upward drift, then dissolves into the white GitHub chapter. GitHub settles
from a slight overscale as it appears, rather than sliding over the lab.
Returning to the lab reverses the zoom. Gesture guards
prevent the opening momentum from immediately advancing or reversing a chapter.
The lab stays mounted and retains its scroll position. Back, Escape, or a
downward swipe/upward wheel at the GitHub page's top returns to the lab.

`components/ui/github-contributions/` owns the calendar, fetch lifecycle and
scoped styles. `githubUsername` is set to `qvost` in `src/main.tsx`. The public
feed at `https://github-contributions-api.jogruber.de/v4/qvost?y=last` supplies
the actual daily counts and intensity levels. The feed is fetched on first
entry, refreshed every ten minutes while the chapter is visible, and checked
again when a stale page returns to the foreground. Refresh is also available
manually. The source caches results for one hour, disclosed beside the fetched
time; this is live fetched data, not instant event streaming. No secret token,
hardcoded contribution counts, or new dependency is used.

Requests are validated and cancelled when leaving the chapter. A failed
initial fetch offers Retry and a direct profile link. A failed refresh retains
the last successful calendar. The graph uses one keyboard tab stop with arrow
navigation, day counts on hover/focus/tap, and native horizontal scrolling on
narrow screens. Reduced motion removes sheet travel; hidden chapters are inert.
The stack itself uses `overflow: clip` so focus cannot scroll the translated
pages; only their interior containers scroll.

GitHub now shares the introduction's white ground, dark ink, grey details and
cursor-coloured accent. The calendar uses five monochrome intensity levels.
Its stylesheet references portfolio tokens directly; the lab's paper and green
stay inside the Shaligram chapter.

`ReactiveGitHubCat.tsx` gives the header mark and larger hero cat independent
pose, gaze and blink layers. A fine pointer turns the mark and shifts its eyes;
a click, tap, Enter or Space triggers a bounded bounce, blink and short reply.
The hit area remains stationary. Pointer writes are coalesced into one frame,
with no permanent animation loop. Leaving the page, going offscreen, hiding the
tab, or enabling reduced motion cancels motion. Reduced motion retains the
text reply. Entry focus does not override a control already used by the visitor.

## November 28 project update

The collection now includes Hana One and Lab Notes. Their descriptions come from
the repositories' current READMEs, checked on November 28, 2026:
[Hana One](https://github.com/qvost/hana-one) and
[Lab Notes](https://github.com/qvost/lab-notes). Reify's description now names its
local Rust gateway, and the Sanofi concept links to its published demo.

The new covers use the existing paper, ink, and green palette. Hana One has a
ceramic speaker with a flower grille and a muted pink accent. Lab Notes has a
spiral notebook containing a queue and a search graph. The artwork generator
reproduces all twelve covers without a drawing library.

The selected-projects page has a circular engraving with one petal per selected project.
Selecting a name traces its petal and replaces the adjacent description and
links. The radios own selection and keyboard navigation. CSS follows their
checked state, so the prerendered page works without JavaScript. SVG `pathLength`
normalizes each outline for the drawing transition. Another selection retargets
the active transitions immediately. Reduced motion removes transitions, including
when the preference changes while the page is open. Hidden descriptions use
`display: none`, which also removes their links from keyboard navigation.

The landing page retains its layout from before this update. It has no recent
project strip or recency labels. Reify leads the selected collection and opens
the engraving by default. Hana One appears in the P project browser and full
work archive, and is excluded from the selected-projects engraving.
Booton and the existing chapter transitions continue the current design.
The constellation has no timer, frame loop, or new package dependency.
