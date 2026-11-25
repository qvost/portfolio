import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { useReducedMotion } from './motion-preference';

export function CopyButton({ value, label = 'email address' }: { value: string; label?: string }) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);

  const copy = async () => {
    clearTimeout(timer.current);
    setStatus('copying');
    try {
      await navigator.clipboard.writeText(value);
      if (!mounted.current) return;
      setStatus('copied');
      timer.current = setTimeout(() => setStatus('idle'), 2200);
    } catch {
      if (mounted.current) setStatus('failed');
    }
  };

  return <span className="q-copy-control" data-status={status}>
    <motion.button type="button" className="q-copy-button" onClick={copy} disabled={status === 'copying'}
      aria-label={status === 'copied' ? `Copied ${label}` : `Copy ${label}`}
      whileTap={reducedMotion ? undefined : { scale: .92 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg key={status === 'copied' ? 'check' : 'copy'} width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"
          initial={{ opacity: 0, scale: reducedMotion ? 1 : .7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : .8 }} transition={{ duration: reducedMotion ? 0 : .13 }}>
          {status === 'copied' ? <motion.path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reducedMotion ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reducedMotion ? 0 : .2 }} /> : <>
            <rect x="7" y="7" width="9" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M12 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.3" />
          </>}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
    <span className="q-copy-feedback" role="status">{status === 'copied' ? 'Copied' : status === 'failed' ? 'Select the address to copy.' : ''}</span>
  </span>;
}

export function ContactPanel({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const address = useRef<HTMLInputElement>(null);
  const id = useId();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => address.current?.focus({ preventScroll: true }));
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', outside, true);
    window.addEventListener('keydown', escape, true);
    window.addEventListener('focusin', focus);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('keydown', escape, true);
      window.removeEventListener('focusin', focus);
    };
  }, [open]);

  return <div ref={container} className="q-contact q-bottom-right">
    <button ref={trigger} className="q-contact-trigger" type="button" aria-expanded={open} aria-controls={id}
      aria-haspopup="dialog" onClick={() => setOpen(!open)}>Say hello <span aria-hidden="true">{open ? '−' : '+'}</span></button>
    <AnimatePresence>
      {open ? <motion.div id={id} role="dialog" aria-label="Get in touch" className="q-contact-panel"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reducedMotion ? 0 : 4, scale: reducedMotion ? 1 : .98 }} transition={{ duration: reducedMotion ? 0 : .18, ease: [.16, 1, .3, 1] }}
        onKeyDown={event => event.stopPropagation()}>
        <div className="q-contact-heading"><p>Have something in mind?</p><button type="button" aria-label="Close contact panel" onClick={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}>×</button></div>
        <p className="q-contact-note">Write to me about it.</p>
        <div className="q-contact-address"><input ref={address} readOnly value={email} aria-label="Email address" onFocus={event => event.currentTarget.select()} /><CopyButton value={email} /></div>
        <a className="q-contact-mail" href={`mailto:${email}`}>Open email </a>
      </motion.div> : null}
    </AnimatePresence>
  </div>;
}
