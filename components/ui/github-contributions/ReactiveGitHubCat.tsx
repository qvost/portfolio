import { useEffect, useRef, useState } from 'react';

const MARK = 'M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.64 1.22 3.28.93.1-.73.39-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.64 0c2.15-1.45 3.1-1.15 3.1-1.15.61 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.04.76 2.1v3.09c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z';
const GREETINGS = ['Hey, I see you.', 'Back to building?', 'Thanks for stopping by.'];
const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/** The mark and gaze have separate pivots; pointer updates never render React. */
export function ReactiveGitHubCat({ active, compact = false }: { active: boolean; compact?: boolean }) {
  const button = useRef<HTMLButtonElement>(null);
  const pose = useRef<HTMLSpanElement>(null);
  const lids = useRef<SVGGElement>(null);
  const effects = useRef<Animation[]>([]);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetingIndex = useRef(0);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const element = button.current;
    const page = element?.closest<HTMLElement>('.q-github-page');
    if (!element || !page || !active) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let seen = true;
    let clientX = 0;
    let clientY = 0;
    const rest = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.style.setProperty('--cat-x', '0px');
      element.style.setProperty('--cat-y', '0px');
      element.style.setProperty('--cat-turn', '0deg');
      element.style.setProperty('--cat-look-x', '0px');
      element.style.setProperty('--cat-look-y', '0px');
      element.removeAttribute('data-looking');
    };
    const stop = () => {
      rest();
      effects.current.forEach(effect => effect.cancel());
      effects.current = [];
      if (timeout.current !== null) clearTimeout(timeout.current);
      timeout.current = null;
      setGreeting('');
    };
    const paint = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const reach = Math.max(160, Math.min(page.clientWidth, page.clientHeight) * .3);
      const x = clamp((clientX - rect.left - rect.width / 2) / reach);
      const y = clamp((clientY - rect.top - rect.height / 2) / reach);
      element.style.setProperty('--cat-x', `${x * (compact ? 2 : 6)}px`);
      element.style.setProperty('--cat-y', `${y * (compact ? 2 : 4)}px`);
      element.style.setProperty('--cat-turn', `${x * 7}deg`);
      // These are viewBox units: gaze remains legible in both sizes of the mark.
      element.style.setProperty('--cat-look-x', `${x * .7}px`);
      element.style.setProperty('--cat-look-y', `${y * .45}px`);
      element.dataset.looking = 'true';
    };
    const move = (event: PointerEvent) => {
      if (!seen || document.hidden || !fine.matches || still.matches || event.pointerType === 'touch') return;
      clientX = event.clientX; clientY = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(entries => {
      seen = entries.some(entry => entry.isIntersecting);
      if (!seen) stop();
    });
    observer.observe(element);
    page.addEventListener('pointermove', move, { passive: true });
    page.addEventListener('pointerleave', rest);
    page.addEventListener('pointercancel', rest);
    document.addEventListener('visibilitychange', stop);
    fine.addEventListener('change', stop);
    still.addEventListener('change', stop);
    return () => {
      stop(); observer.disconnect();
      page.removeEventListener('pointermove', move);
      page.removeEventListener('pointerleave', rest);
      page.removeEventListener('pointercancel', rest);
      document.removeEventListener('visibilitychange', stop);
      fine.removeEventListener('change', stop);
      still.removeEventListener('change', stop);
    };
  }, [active, compact]);

  const boop = () => {
    if (!active) return;
    if (timeout.current !== null) clearTimeout(timeout.current);
    setGreeting(GREETINGS[greetingIndex.current++ % GREETINGS.length]);
    timeout.current = setTimeout(() => { setGreeting(''); timeout.current = null; }, 2200);
    effects.current.forEach(effect => effect.cancel());
    effects.current = [];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return;
    const bounce = pose.current?.animate([
      { transform: 'translateY(0) rotate(0deg) scale(1)' },
      { transform: 'translateY(3px) rotate(-9deg) scale(.93)', offset: .2 },
      { transform: 'translateY(-9px) rotate(8deg) scale(1.04)', offset: .5 },
      { transform: 'translateY(0) rotate(0deg) scale(1)' },
    ], { duration: 650, easing: 'cubic-bezier(.22,.75,.3,1)' });
    const blink = lids.current?.animate([
      { transform: 'scaleY(1)' }, { transform: 'scaleY(.12)', offset: .35 }, { transform: 'scaleY(1)' },
    ], { duration: 260, easing: 'ease-in-out' });
    effects.current = [bounce, blink].filter((effect): effect is Animation => effect !== undefined);
  };

  return <button ref={button} type="button" className="q-gh-cat" data-compact={compact} data-speaking={Boolean(greeting)} onClick={boop} aria-label="Say hello to the GitHub cat">
    <span ref={pose} className="q-gh-cat-pose" aria-hidden="true">
      <svg className="q-gh-cat-drawing" viewBox="0 0 24 24" fill="currentColor">
        <path d={MARK} />
        <g className="q-gh-cat-gaze"><g ref={lids} className="q-gh-cat-lids"><rect x="8.25" y="9.3" width="1.65" height="2.25" rx=".825" /><rect x="14.1" y="9.3" width="1.65" height="2.25" rx=".825" /></g></g>
      </svg>
    </span>
    <span className="q-gh-cat-caption" aria-live="polite">{greeting || (compact ? '' : 'Say hello.')}</span>
  </button>;
}
