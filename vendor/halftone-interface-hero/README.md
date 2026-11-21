# Halftone Interface Hero source

Canonical source supplied by the user from `@compronents/halftone-interface-hero`, revision `3c6248757140` at ui.aryank.space. The adjacent TSX file is the unchanged source snapshot.

SHA-256: `96c51ab01c9a490c8af3e3729b688a634b324c9839ca990300bc99e38412bc6d`.

The active adaptation lives at `components/ui/halftone-interface-hero.tsx`. It retains the shader, sampled wordmark, pointer lighting, and square particle trail. The portfolio embeds the effect in its existing hero, using the De Fonte Plus font and a warm palette.

Additional optional props are `embedded`, `fontFamily`, and `onReady`. Embedded mode omits the standalone navigation and footer. The readiness callback keeps the existing HTML heading visible until WebGL and the wordmark font are ready.

Both render loops stop at rest and pause outside the viewport, while the tab is hidden, or while the portfolio menu is open. Pointer events are sampled once per frame, particles are capped, and drawing buffers use the shared pixel budget. Reduced motion and touch layouts use a static wordmark. No runtime dependency was added.
