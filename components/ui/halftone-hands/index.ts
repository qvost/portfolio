/** Local vector recreation. The BLANK registry source could not be retrieved. */
export function halftoneHandsMarkup() {
  return `<div class="halftone-hands" data-halftone-hands aria-hidden="true">
    <svg viewBox="0 0 1200 420" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <defs>
        <pattern id="hands-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.75" fill="currentColor"/></pattern>
        <linearGradient id="hands-shade" x1="100" y1="330" x2="420" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" stop-opacity=".08"/><stop offset="1" stop-color="currentColor" stop-opacity=".75"/></linearGradient>
        <path id="hand-form" d="M-40 330 142 240C188 216 201 182 242 165L331 127C350 119 370 113 390 111L506 103C529 102 547 107 547 117C547 130 526 135 505 136L408 150 369 166C410 170 450 173 468 187C476 194 475 204 467 211C458 218 438 217 420 215L362 211 389 229C411 241 431 250 431 264C430 274 419 280 408 278L342 249 365 279C378 294 378 305 367 313C354 322 342 314 332 305L287 270C298 295 301 314 288 323C273 333 263 318 252 305L211 267C192 276 177 285 160 301L23 396Z"/>
      </defs>
      <g class="hands-guides" stroke="currentColor" stroke-opacity=".15"><path d="M0 210H1200M600 30V390" stroke-dasharray="2 8"/><circle cx="600" cy="121" r="36" stroke-dasharray="2 7"/></g>
      <g class="hand-left">
        <use href="#hand-form" fill="url(#hands-dots)"/><use href="#hand-form" fill="url(#hands-shade)" stroke="currentColor" stroke-width="1.1"/>
        <g stroke="#000" stroke-opacity=".65" stroke-width="2"><path d="M185 250q40-35 77-34M217 238q28-43 64-57M291 190q35-11 69-12M330 202q-11 28-6 42M114 273l34 33M130 262l32 32"/></g>
      </g>
      <g class="hand-right" transform="translate(1200 -5) scale(-1 1)">
        <use href="#hand-form" fill="url(#hands-dots)"/><use href="#hand-form" fill="url(#hands-shade)" stroke="currentColor" stroke-width="1.1"/>
        <g stroke="#000" stroke-opacity=".65" stroke-width="2"><path d="M185 250q40-35 77-34M217 238q28-43 64-57M291 190q35-11 69-12M330 202q-11 28-6 42M114 273l34 33M130 262l32 32"/></g>
      </g>
      <g class="hands-signal" stroke="currentColor"><path d="M591 121h18M600 112v18"/><circle cx="600" cy="121" r="4" fill="currentColor" stroke="none"/></g>
    </svg>
  </div>`;
}
