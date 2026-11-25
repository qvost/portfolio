import { useEffect, useRef, type RefObject } from 'react';

const ACTIONS = 'a, button, [role="button"], [role="tab"], .cr-slide';
const NATIVE = 'input, textarea, select, [contenteditable="true"], iframe';

/** An exact pointer tip inside an ink drop that stretches and settles. */
export function InkCursor({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const pointerRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    const pointer = pointerRef.current;
    const drop = dropRef.current;
    if (!root || !pointer || !drop) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let bounds = root.getBoundingClientRect();
    const target = { x: 0, y: 0 };
    const ink = { x: 0, y: 0, size: 7, stretch: 0, angle: 0 };
    let clientX = 0;
    let clientY = 0;
    let inside = false;
    let hovered = false;
    let pressed = false;
    let needsHit = false;
    let frame = 0;
    let previous = 0;
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const enabled = () => fine.matches && !still.matches && !document.hidden;

    const stop = () => {
      cancelAnimationFrame(frame);
      clearTimeout(releaseTimer);
      frame = previous = 0;
      inside = pressed = false;
      pointer.style.opacity = '0';
      root.removeAttribute('data-cursor');
    };
    const hit = (element: Element | null) => {
      if (element?.closest(NATIVE)) { stop(); return false; }
      const action = element?.closest(ACTIONS);
      hovered = Boolean(action && !action.matches(':disabled, [aria-disabled="true"]'));
      return true;
    };

    const paint = (time: number) => {
      frame = 0;
      if (!inside || !enabled()) { stop(); return; }
      // Scroll and chapter changes can move a control beneath a stationary pointer.
      // Read its hit region before the frame's transform writes.
      if (needsHit) {
        needsHit = false;
        if (!hit(document.elementFromPoint(clientX, clientY))) return;
      }
      const dt = previous ? Math.min((time - previous) / 1000, .05) : 1 / 60;
      previous = time;
      // Exponential following gives the same response at 60Hz and 120Hz.
      const follow = 1 - Math.exp(-36 * dt);
      ink.x += (target.x - ink.x) * follow;
      ink.y += (target.y - ink.y) * follow;
      const dx = target.x - ink.x, dy = target.y - ink.y;
      const distance = Math.hypot(dx, dy);
      // Eight pixels keep the decoration close; the precise tip never trails.
      const lag = distance > 8 ? 8 / distance : 1;
      ink.x = target.x - dx * lag;
      ink.y = target.y - dy * lag;
      const size = pressed ? 5 : hovered ? 26 : 7;
      const settle = 1 - Math.exp(-22 * dt);
      ink.size += (size - ink.size) * settle;
      ink.stretch += ((hovered || pressed ? 0 : Math.min(.7, distance / 18)) - ink.stretch) * settle;
      if (distance > .2) ink.angle = Math.atan2(dy, dx) * 180 / Math.PI;
      pointer.dataset.hover = String(hovered && !pressed);
      pointer.style.transform = `translate3d(${target.x}px,${target.y}px,0)`;
      pointer.style.opacity = '1';
      root.dataset.cursor = 'active';
      drop.style.transform = `translate3d(${ink.x - target.x}px,${ink.y - target.y}px,0) rotate(${ink.angle}deg) scale(${ink.size / 8 * (1 + ink.stretch)},${ink.size / 8 / (1 + ink.stretch)})`;
      if (distance > .05 || Math.abs(size - ink.size) > .03 || ink.stretch > .005) {
        frame = requestAnimationFrame(paint);
      } else previous = 0;
    };
    const wake = () => { if (!frame && inside && enabled()) frame = requestAnimationFrame(paint); };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !enabled()) { stop(); return; }
      if (!hit(event.target instanceof Element ? event.target : null)) return;
      clientX = event.clientX; clientY = event.clientY;
      target.x = clientX - bounds.left; target.y = clientY - bounds.top;
      if (!inside) {
        ink.x = target.x; ink.y = target.y;
        ink.size = hovered ? 26 : 7; ink.stretch = 0;
      }
      inside = true;
      wake();
    };
    const press = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType === 'touch' || !inside) return;
      clearTimeout(releaseTimer); pressed = true; wake();
    };
    const release = () => {
      if (!inside) return;
      // A quick click still gets one readable compression before it releases.
      releaseTimer = setTimeout(() => { pressed = false; wake(); }, 90);
    };
    const refresh = () => { needsHit = true; wake(); };
    const resize = () => {
      bounds = root.getBoundingClientRect();
      target.x = clientX - bounds.left; target.y = clientY - bounds.top;
      refresh();
    };
    const preference = () => { if (!enabled()) stop(); };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    const changes = new MutationObserver(refresh);
    changes.observe(root, { attributes: true, attributeFilter: ['data-page', 'data-chapter', 'data-project-view'] });
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', stop);
    root.addEventListener('pointercancel', stop);
    root.addEventListener('pointerdown', press, { passive: true });
    root.addEventListener('scroll', refresh, true);
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', preference);
    fine.addEventListener('change', preference);
    still.addEventListener('change', preference);
    return () => {
      stop(); observer.disconnect(); changes.disconnect();
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', stop);
      root.removeEventListener('pointercancel', stop);
      root.removeEventListener('pointerdown', press);
      root.removeEventListener('scroll', refresh, true);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', preference);
      fine.removeEventListener('change', preference);
      still.removeEventListener('change', preference);
    };
  }, [host]);

  return <div className="q-cursor-layers" aria-hidden="true">
    <div ref={pointerRef} className="q-cursor-pointer" data-hover="false">
      <div ref={dropRef} className="q-cursor-drop" />
      <i className="q-cursor-point" />
    </div>
  </div>;
}
