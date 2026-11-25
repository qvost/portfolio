# Loading and interaction pass

Measured on November 26, 2026 against the local production preview at
`http://localhost:4174/`. The public canonical remains `https://qvost.vercel.app/`.

## Conditions

Chrome 156, 390 by 844 viewport, 4x CPU slowdown, 150ms latency,
1.6Mbps download, and 750Kbps upload. Each of three navigations used a cleared,
disabled browser cache. Each sample covered 12 seconds after navigation.
Resource sizes below are encoded body sizes from Resource Timing. They exclude
the HTML response and request headers. They are not total page weight on Vercel.

Direct Chrome DevTools Protocol traces and PerformanceObservers supplied the
measurements. No DevTools MCP or CrUX tool was available. The public PageSpeed
Insights request returned HTTP 429, so this pass has no field-data result.

## Observed loading change

| Initial home navigation | Before | After |
| --- | ---: | ---: |
| Resource requests, median | 15 | 6 |
| Resource requests, range | 15–15 | 6–6 |
| Encoded resource bytes, median | 429,918 | 277,023 |
| Encoded resource bytes, range | 429,918–429,918 | 277,023–277,023 |

The initial resource requests fell by nine and encoded resource bytes fell by
about 36%. This defers work until it is needed. It does not remove project
artwork or change the sampled logo.

The baseline requested project illustrations and both 48KB encoded Shaligram
SVGs while their sections were hidden. The project grid now mounts after its
first opening. The logo fallback and ASCII sampler mount on the first lab visit.
The small header mark loads when the lab opens. Once loaded, the sampler remains
mounted and pauses when inactive, preserving its existing lifecycle behavior.

The before trace also recorded a 68ms function call and a 19ms layout. The after
trace had longer function calls in some samples. Long-task totals varied between
runs, so this pass does not claim a CPU or interaction latency improvement.

## Measurement limits

The automated throttled session did not report FCP or LCP inside its sample
window. Its zero LCP and CLS observations are not passing scores. A separate
interactive screenshot session painted normally, but it is not an equivalent
timing run. This report therefore uses the consistent request and byte counts
and makes no Core Web Vitals claim. The collected long-task excess is over a
fixed observation window, not Lighthouse TBT or field INP.

Repeat a production-origin Lighthouse run and inspect real-user data after
deployment. Google documents the distinction between Lighthouse lab data and
CrUX field data in its [PageSpeed Insights guide](https://developer.chrome.com/docs/crux/guides/pagespeed-insights).

## Cursor and footer

The ink cursor batches movement into animation frames, uses frame-time based
following, and stops requesting frames at rest. Pointer movement reads a cached
root rectangle. Scroll and chapter changes schedule one hit check before DOM
writes. Its animation changes transforms and opacity only. A precise colored
tip stays at the pointer while the decorative drop follows within eight pixels.

Native cursors return for text inputs, coarse pointers, reduced motion, focus
loss, cancellation, and hidden tabs. The footer reuses the existing copy control,
including its real clipboard result and failure message. Its copy target is
44px square. The static projects footer has ordinary links and no dead copy
button when JavaScript is absent.

Raw measurements and traces are saved locally in ignored `artifacts/perf-*`
files. Screenshots for this pass are under `artifacts/ink-*` and
`artifacts/footer-*`.
