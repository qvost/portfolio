# qvost search audit

November 27, 2026. Canonical site: https://qvost.vercel.app/.
Scope: the portfolio, projects page, generated HTML, crawl files, and sharing metadata.
Sources: the Google SEO skill's offline documentation and the official pages linked below.

## Finding: Main content depended on JavaScript

- Severity: High. Fixed in the production build.
- Affected: `/`, `src/main.tsx`, `src/Portfolio.tsx`, `src/entry-server.tsx`, `scripts/prerender.mjs`.
- Evidence: The previous root was empty HTML. The build now renders the actual React portfolio and then hydrates it. The landing heading is visible on the first render. With JavaScript disabled, readers get a visible, scrollable page with ten project descriptions and links.
- Why it matters: Google can render JavaScript, but prerendering reduces dependence on that step and serves readers and crawlers that do not execute scripts.
- Doc: "Understand the JavaScript SEO basics". https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics (local: `docs/search/docs/crawling-indexing/javascript/javascript-seo-basics.md`).
- Recommendation: Keep prerendering in `npm run build`. Deploy the complete `dist/` directory, including generated HTML.

## Finding: Brand and identity signals were incomplete

- Severity: Medium. Fixed in source and generated HTML.
- Affected: `/`, `index.html`, `src/portfolio-data.ts`.
- Evidence: The home title and H1 now start with Siddid Pandey, followed by the qvost brand and developer role. The projects page H1 names Siddid Pandey. WebSite markup names qvost, and the Person entity identifies Siddid Pandey as qvost with a description, Kathmandu location, and matching public profiles. Existing Search Console verification is preserved.
- Why it matters: Descriptive titles explain the page. Consistent home-page text and WebSite markup help Google understand the preferred site name. They do not force a particular result title or site name.
- Doc: "Influencing your title links in search results". https://developers.google.com/search/docs/appearance/title-link (local: `docs/search/docs/appearance/title-link.md`).
- Doc: "Provide a site name to Google Search". https://developers.google.com/search/docs/appearance/site-names (local: `docs/search/docs/appearance/site-names.md`).
- Recommendation: Keep public profiles, visible biography, and structured identity data consistent.

## Finding: Canonical URLs and discovery files were missing

- Severity: Medium. Fixed in generated output.
- Affected: `/`, `/work/`, `/robots.txt`, `/sitemap.xml`.
- Evidence: The confirmed origin is `https://qvost.vercel.app`. Each page has one self-referencing canonical URL. The sitemap lists both pages with absolute URLs. Robots rules allow crawling and reference the sitemap. `SITE_URL` supports a future domain change. No guessed modification dates or priority values are emitted.
- Why it matters: Canonical annotations identify the preferred URL. Sitemaps help discovery; they do not guarantee indexing.
- Doc: "How to specify a canonical URL with rel=canonical and other methods". https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls (local: `docs/search/docs/crawling-indexing/consolidate-duplicate-urls.md`).
- Doc: "Build and submit a sitemap". https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap (local: `docs/search/docs/crawling-indexing/sitemaps/build-sitemap.md`).
- Recommendation: Serve these files from the production root. Redirect alternate production hostnames to the chosen host in hosting settings. Keep preview deployments out of the index through the host's preview controls.

## Finding: Project details required interaction

- Severity: Medium. Fixed with an accessible projects page.
- Affected: `/work/`, `src/WorkIndex.tsx`, `public/work.css`.
- Evidence: The landing page links to `/work/` through an ordinary anchor. The page contains all ten descriptions, local illustrations, live links, and repository links in its HTML. It shares project data with the interactive portfolio and no-JavaScript fallback, and has its own title, description, and canonical URL.
- Why it matters: Google discovers links through anchors with href attributes. Readers can browse the work without opening animated panels or running JavaScript.
- Doc: "Understand the JavaScript SEO basics". https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics (local: `docs/search/docs/crawling-indexing/javascript/javascript-seo-basics.md`).
- Recommendation: Add projects to `src/portfolio-data.ts` so both versions stay current. Describe what each project does.

## Finding: Sharing previews were incomplete

- Severity: Low. Fixed in source and generated output.
- Affected: Page metadata, `/social-card.png`, `/social-card.svg`.
- Evidence: Both pages have Open Graph and Twitter card metadata, an absolute image URL, image dimensions, and descriptive alternative text. The original sharing image is 1200 by 630 pixels and follows the portfolio's palette.
- Why it matters: Social clients have an explicit preview. This is a sharing improvement, not a claim of higher Google ranking.
- Doc: "Control your snippets in search results" covers the separate role of search descriptions. https://developers.google.com/search/docs/appearance/snippet (local: `docs/search/docs/appearance/snippet.md`).
- Recommendation: Keep preview copy aligned with the site. If the domain changes, update the SVG's printed address and export the PNG again.

## Finding: Search indexing and ranking need Search Console confirmation

- Severity: Medium. External follow-up.
- Affected: The deployed site and its Google Search Console property.
- Evidence: The live home and `/work/` both return HTTP 200, expose rendered HTML and self-referencing canonicals, and the live robots file references a sitemap containing both URLs. The page includes a Search Console verification token. A public exact-name search lookup surfaced LinkedIn and a Bevel Creatives team page, but not this portfolio; that lookup cannot confirm Google's index state or position. Search Console data was unavailable in this workspace.
- Why it matters: Crawlability does not confirm indexing, and indexing does not guarantee a particular ranking. Google chooses when to recrawl and how to rank a page.
- Doc: "Ask Google to recrawl your URLs". https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl (local: `docs/search/docs/crawling-indexing/ask-google-to-recrawl.md`).
- Doc: "SEO Starter Guide". https://developers.google.com/search/docs/fundamentals/seo-starter-guide (local: `docs/search/docs/fundamentals/seo-starter-guide.md`).
- Recommendation: After publishing these changes, confirm ownership in Search Console, submit `https://qvost.vercel.app/sitemap.xml`, inspect the home and projects URLs, and request indexing for the home URL. Add the portfolio URL to public profiles such as GitHub and LinkedIn, then track impressions and average position for the exact query `Siddid Pandey`. No first-place ranking or indexing deadline is promised.

## Verification

The November 27 production build passes. Inspection of `dist/` confirmed the name-first title and H1 on both pages, self-referencing canonicals, valid home-page JSON-LD, and both URLs in the sitemap. The live site has not been updated with these changes yet. This is not a Google Rich Results or Search Console validation.

The earlier browser inspection covered desktop and 320px layouts, hydration, chapter navigation, and a JavaScript-disabled visit. Screenshots are in the ignored `artifacts/` directory. The copy pass replaces vague slogans with descriptions of the work. Supplied component comments and vendor attribution remain intact.
