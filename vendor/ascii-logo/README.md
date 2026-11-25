# Interactive ASCII Logo source

Supplied by the user from `@compronents/ascii-logo`, revision `5ca0339059a7`.
The registry request returned HTTP 403, so the source was copied directly from
the complete implementation supplied in the conversation. Its SHA-256 matches:

`c1ec8a5fbe4832a9ae78f97b975385bceacaa04f19d7b45138690a5a6190978d`

This file is untouched. The runtime copy is `components/ui/ascii-logo.tsx`.
It preserves source comments, public defaults, pixel sampling, glyph flicker,
pointer repulsion, and spring return. Portfolio adaptations add chapter activity,
visibility and reduced-motion handling, bounded pixel ratio, local sampling
coordinates during zooms, heavier glyphs, and scheduling that parks between
flicker updates or while hidden. `logoScale` changes trigger resampling.

The hero supplies the user's own same-origin Shaligram mark through `src`.
The mask changes only its fill to white for the brightness sampler. The original
mark remains in the header and as the canvas loading/error fallback. No external
logo or film media is shown in the portfolio.
