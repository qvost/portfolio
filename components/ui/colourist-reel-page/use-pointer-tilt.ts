import { useEffect, useRef } from 'react';

/** The hit area stays fixed; only the card artwork moves by a bounded amount. */
export function usePointerTilt() {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let x = 0;
    let y = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.style.setProperty('--surface-rx', '0deg');
      element.style.setProperty('--surface-ry', '0deg');
      element.removeAttribute('data-pointer-active');
    };
    const paint = () => {
      frame = 0;
      const box = element.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (x - box.left) / box.width));
      const ny = Math.max(0, Math.min(1, (y - box.top) / box.height));
      element.style.setProperty('--surface-rx', `${(0.5 - ny) * 4.4}deg`);
      element.style.setProperty('--surface-ry', `${(nx - 0.5) * 4.4}deg`);
      element.style.setProperty('--surface-x', `${nx * 100}%`);
      element.style.setProperty('--surface-y', `${ny * 100}%`);
      element.dataset.pointerActive = 'true';
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !pointer.matches || motion.matches || document.hidden) return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointercancel', reset);
    pointer.addEventListener('change', reset);
    motion.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    window.addEventListener('blur', reset);
    return () => {
      reset();
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointercancel', reset);
      pointer.removeEventListener('change', reset);
      motion.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', reset);
      window.removeEventListener('blur', reset);
    };
  }, []);
  return ref;
}
