import { useEffect, useRef } from 'react';

type Joint = { x: number; y: number; vx: number; vy: number };
type Pulse = { x: number; y: number; age: number; hue: number };

/** A fixed-step elastic tail. Pointer geometry, ribbon, ring and label share one clock. */
export function ColourRibbonCursor({ host }: { host: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    const canvas = canvasRef.current;
    const pointer = pointerRef.current;
    const context = canvas?.getContext('2d');
    if (!root || !canvas || !pointer || !context) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const joints: Joint[] = Array.from({ length: 18 }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    const pulses: Pulse[] = [];
    const target = { x: 0, y: 0 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;
    let accumulator = 0;
    let inside = false;
    let initialized = false;
    let hoverRadius = 0;
    let desiredRadius = 0;
    let hue = 0;
    let action = '';

    const enabled = () => finePointer.matches && !preference.matches && !document.hidden;
    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const clear = () => context.clearRect(0, 0, width, height);
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      accumulator = 0;
      inside = false;
      initialized = false;
      pulses.length = 0;
      root.removeAttribute('data-cursor');
      pointer.style.opacity = '0';
      clear();
    };

    const step = (dt: number) => {
      const first = joints[0];
      first.x = target.x;
      first.y = target.y;
      for (let i = 1; i < joints.length; i++) {
        const joint = joints[i];
        const parent = joints[i - 1];
        joint.vx += (parent.x - joint.x) * 650 * dt;
        joint.vy += (parent.y - joint.y) * 650 * dt;
        joint.vx *= Math.exp(-30 * dt);
        joint.vy *= Math.exp(-30 * dt);
        joint.x += joint.vx * dt;
        joint.y += joint.vy * dt;
        const distance = Math.hypot(joint.x - parent.x, joint.y - parent.y);
        if (distance > 14) {
          joint.x = parent.x + (joint.x - parent.x) / distance * 14;
          joint.y = parent.y + (joint.y - parent.y) / distance * 14;
        }
      }
      hoverRadius += (desiredRadius - hoverRadius) * (1 - Math.exp(-20 * dt));
      for (const pulse of pulses) pulse.age += dt;
      while (pulses[0] && pulses[0].age > 0.5) pulses.shift();
    };

    const paint = () => {
      clear();
      // Named back-to-front layers: tapered tail, click pulse, hover ring. The pointer is SVG.
      context.lineCap = 'round';
      for (let i = joints.length - 1; i > 0; i--) {
        const joint = joints[i];
        const parent = joints[i - 1];
        const fraction = 1 - i / joints.length;
        context.beginPath();
        context.moveTo(joint.x, joint.y);
        context.lineTo(parent.x, parent.y);
        context.lineWidth = fraction * 5;
        context.strokeStyle = `hsla(${hue + i * 4},65%,52%,${fraction * 0.55})`;
        context.stroke();
      }
      for (const pulse of pulses) {
        context.beginPath();
        context.arc(pulse.x, pulse.y, 6 + pulse.age * 44, 0, Math.PI * 2);
        context.strokeStyle = `hsla(${pulse.hue},65%,52%,${(1 - pulse.age * 2) * 0.4})`;
        context.lineWidth = 1;
        context.stroke();
      }
      if (hoverRadius > 0.5) {
        context.beginPath();
        context.arc(target.x, target.y, hoverRadius, 0, Math.PI * 2);
        context.lineWidth = 1;
        context.strokeStyle = `hsla(${hue},65%,52%,0.4)`;
        context.stroke();
      }
    };

    const tick = (time: number) => {
      frame = 0;
      if (!inside || !enabled()) { stop(); return; }
      accumulator += previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 120;
      previousTime = time;
      let iterations = 0;
      while (accumulator >= 1 / 120 && iterations++ < 6) {
        step(1 / 120);
        accumulator -= 1 / 120;
      }
      paint();
      const unsettled = joints.some(joint => Math.hypot(joint.x - target.x, joint.y - target.y) > 0.2 || Math.hypot(joint.vx, joint.vy) > 0.2);
      if (unsettled || pulses.length || Math.abs(hoverRadius - desiredRadius) > 0.1) frame = requestAnimationFrame(tick);
      else previousTime = 0;
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !enabled()) return;
      const rect = root.getBoundingClientRect();
      target.x = event.clientX - rect.left;
      target.y = event.clientY - rect.top;
      hue = Math.floor(Math.max(0, Math.min(1, target.x / width)) * 300);
      if (!initialized) {
        for (const joint of joints) { joint.x = target.x; joint.y = target.y; joint.vx = 0; joint.vy = 0; }
        initialized = true;
      }
      inside = true;
      root.dataset.cursor = 'active';
      root.style.setProperty('--pointer-colour', `hsl(${hue},65%,48%)`);
      pointer.style.transform = `translate3d(${target.x}px,${target.y}px,0)`;
      pointer.style.color = `hsl(${hue},65%,48%)`;
      pointer.style.opacity = '1';
      const hit = event.target instanceof Element ? event.target.closest('button, a, input, [role="button"], .q-lab-peek') : null;
      desiredRadius = hit ? 18 : 0;
      const nextAction = hit?.matches('.cr-grid-card, .cr-slide') ? 'View' : hit?.matches('.q-lab-peek') ? 'Explore' : '';
      if (action !== nextAction) { action = nextAction; pointer.dataset.action = action; }
      wake();
    };
    const press = () => {
      if (!inside || !enabled()) return;
      if (pulses.length === 3) pulses.shift();
      pulses.push({ ...target, age: 0, hue });
      wake();
    };
    const onPreference = () => { if (!enabled()) stop(); };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    resize();
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', stop);
    root.addEventListener('pointercancel', stop);
    root.addEventListener('pointerdown', press, { passive: true });
    document.addEventListener('visibilitychange', onPreference);
    preference.addEventListener('change', onPreference);
    finePointer.addEventListener('change', onPreference);
    return () => {
      stop();
      observer.disconnect();
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', stop);
      root.removeEventListener('pointercancel', stop);
      root.removeEventListener('pointerdown', press);
      document.removeEventListener('visibilitychange', onPreference);
      preference.removeEventListener('change', onPreference);
      finePointer.removeEventListener('change', onPreference);
    };
  }, [host]);

  return <div className="q-cursor-layers" aria-hidden="true">
    <canvas ref={canvasRef} className="q-cursor-ribbon" />
    <div ref={pointerRef} className="q-cursor-pointer" data-action="">
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none"><path d="M1.4 1.5 13 12.2l-6-.6L3.3 17 1.4 1.5Z" fill="currentColor" stroke="white" strokeWidth="1.3" strokeLinejoin="round" /></svg>
    </div>
  </div>;
}
