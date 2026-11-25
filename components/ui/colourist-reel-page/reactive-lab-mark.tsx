import { useEffect, useRef } from 'react';

const DOTS = Array.from({ length: 13 * 13 }, (_, index) => ({
  x: 40 + index % 13 * 28,
  y: 40 + Math.floor(index / 13) * 28,
})).filter(dot => Math.hypot(dot.x - 208, dot.y - 208) < 185);

/** A small magnetic field around the user's mark. No permanent animation loop. */
export function ReactiveLabMark({ onExplore, active }: { onExplore: () => void; active: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !active) return;
    const dots = Array.from(element.querySelectorAll<SVGCircleElement>('.q-mark-field circle'));
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let x = 0;
    let y = 0;
    let inView = true;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.style.setProperty('--mark-x', '0px');
      element.style.setProperty('--mark-y', '0px');
      element.style.setProperty('--mark-turn', '0deg');
      element.removeAttribute('data-pointer-active');
      for (const dot of dots) { dot.style.transform = ''; dot.style.opacity = ''; }
    };
    const paint = () => {
      frame = 0;
      const box = element.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, (x - box.left) / box.width * 2 - 1));
      const ny = Math.max(-1, Math.min(1, (y - box.top) / box.height * 2 - 1));
      const px = (nx + 1) * 208;
      const py = (ny + 1) * 208;
      element.style.setProperty('--mark-x', `${nx * 9}px`);
      element.style.setProperty('--mark-y', `${ny * 7}px`);
      element.style.setProperty('--mark-turn', `${nx * 5}deg`);
      element.dataset.pointerActive = 'true';
      dots.forEach((dot, index) => {
        const point = DOTS[index];
        const dx = px - point.x;
        const dy = py - point.y;
        const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 125);
        dot.style.transform = `translate(${dx * influence * .2}px,${dy * influence * .2}px)`;
        dot.style.opacity = String(.1 + influence * .6);
      });
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !pointer.matches || motion.matches || document.hidden || !inView) return;
      x = event.clientX; y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      if (!inView) reset();
    });
    observer.observe(element);
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    pointer.addEventListener('change', reset);
    motion.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      reset(); observer.disconnect();
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointercancel', reset);
      pointer.removeEventListener('change', reset);
      motion.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [active]);

  return <button ref={ref} type="button" className="q-lab-emblem" onClick={onExplore} aria-label="Explore Reify research">
    <svg className="q-mark-field" viewBox="0 0 416 416" aria-hidden="true">{DOTS.map(point => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="1" />)}</svg>
    <span className="q-lab-orbit q-lab-orbit-outer" aria-hidden="true" />
    <span className="q-lab-orbit q-lab-orbit-inner" aria-hidden="true" />
    <img src="/assets/shaligram/mark.svg" alt="" />
    <span className="q-lab-coordinate q-lab-coordinate-top" aria-hidden="true">Kathmandu / Nepal</span>
    <span className="q-lab-coordinate q-lab-coordinate-bottom" aria-hidden="true"><span className="q-mark-rest-label">Web agent research</span><span className="q-mark-hover-label">Explore Reify ↓</span></span>
    <i className="q-lab-emblem-dot" aria-hidden="true" />
  </button>;
}
