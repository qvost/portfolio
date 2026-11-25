# Eye tracker

Adapted from the Bencho source supplied with the request, offered under the MIT
licence at https://bencho.dev/licence. The original explanatory comments remain
in `EyeTracker.tsx` and `src/global.css`. No package was added.

The information screen mounts one `EyeTracker` above its contact links:

```tsx
<EyeTracker size={88} within=".cr-info-screen" />
```

The supplied follow, bounce, size, shape, eyes, eyeScale, eyeWidth, eyeRound,
eyeHeight, idle, and within inputs remain available. The original `Watcher`
export is named `EyeTracker` here.

## Token mapping

The CSS reads the portfolio's existing properties directly. No Bencho globals
are defined.

| Supplied token | Existing portfolio token |
| --- | --- |
| `--bg` | `--colour-white` |
| `--card` | `--colour-off-white` |
| `--fill-on` | `--q-ink` |
| `--fill-slab` | `--colour-off-white` |
| `--font-ui` | `--font-booton` |
| `--ink` | `--q-ink` |

## Integration changes

The toy supports keyboard activation, live reduced motion, and a centered
speech bubble on narrow screens. Under reduced motion, it faces forward without
blinking and shows complete replies immediately. The frame loop parks between
movement and blinks, pauses offscreen or in a hidden tab, and cleans up when
the information screen is left. The original sphere projection, eye styles,
shape morphing, typing cadence, and non-repeating replies are retained.
