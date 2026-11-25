import { useEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from './motion-preference';
import { ReactiveLabMark } from './reactive-lab-mark';
import { LabNavigation, scrollToLabChapter } from './lab-navigation';

type DiscoveryStage = {
  id: string;
  label: string;
  input: string;
  output: string;
  description: string;
  code: string;
};

export type ShaligramLab = {
  name: string;
  location: string;
  description: string;
  href: string;
  researchHref: string;
  systemHref: string;
  sourceHref: string;
  manifestoHref: string;
  stages: [DiscoveryStage, ...DiscoveryStage[]];
};

/** The old reel's 64px peek and one-second reveal, with a scrollable lab inside. */
export function LabContinuation({ lab, host, expanded, covered, visible, onOpen, onClose, onNext }: {
  lab: ShaligramLab;
  host: RefObject<HTMLDivElement | null>;
  expanded: boolean;
  covered: boolean;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const previousExpanded = useRef(false);
  const previousCovered = useRef(false);
  const keyboardInput = useRef(false);
  const [stage, setStage] = useState(lab.stages[0]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const key = () => { keyboardInput.current = true; };
    const pointer = () => { keyboardInput.current = false; };
    window.addEventListener('keydown', key, true);
    window.addEventListener('pointerdown', pointer, true);
    window.addEventListener('wheel', pointer, { passive: true, capture: true });
    return () => {
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('wheel', pointer, true);
    };
  }, []);

  useEffect(() => {
    if (expanded === previousExpanded.current) return;
    previousExpanded.current = expanded;
    if (expanded) scrollRef.current?.scrollTo({ top: 0 });
    const timer = setTimeout(() => {
      if (!keyboardInput.current) return;
      if (expanded) backRef.current?.focus({ preventScroll: true });
      else if (visible) openRef.current?.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 1100);
    return () => clearTimeout(timer);
  }, [expanded, visible, reducedMotion]);

  useEffect(() => {
    const returning = previousCovered.current && !covered && expanded;
    previousCovered.current = covered;
    if (!returning || !keyboardInput.current) return;
    const timer = window.setTimeout(() => nextRef.current?.focus({ preventScroll: true }), reducedMotion ? 0 : 1300);
    return () => window.clearTimeout(timer);
  }, [covered, expanded, reducedMotion]);

  useEffect(() => {
    const root = host.current;
    const content = scrollRef.current;
    if (!root || !content || !visible || covered) return;
    let startY: number | null = null;
    let startX = 0;
    let startedAtTop = false;
    let startedAtBottom = false;
    let upward = 0;
    let downward = 0;
    let lastWheel = 0;
    let continueGesture = false;
    const atBottom = () => content.scrollHeight - content.clientHeight - content.scrollTop <= 2;
    // Ignore the opening gesture's momentum before allowing the reverse gesture.
    const canCloseAfter = performance.now() + (reducedMotion ? 250 : 1150);
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (!expanded) {
        if (event.deltaY > 2) { event.preventDefault(); onOpen(); }
        return;
      }
      const now = performance.now();
      const bottom = atBottom();
      if (now < canCloseAfter) { upward = 0; downward = 0; lastWheel = now; return; }
      if (now - lastWheel > 220) { downward = 0; continueGesture = bottom; }
      if (bottom && event.deltaY > 0) {
        // Reaching the edge is not navigation. A fresh wheel gesture continues the story.
        if (continueGesture) downward += event.deltaY;
        event.preventDefault();
        if (downward > 80) { downward = 0; onNext(); }
      } else downward = 0;
      if (content.scrollTop > 1 || event.deltaY >= 0) {
        upward = 0;
        lastWheel = now;
        return;
      }
      if (now - lastWheel > 220) upward = 0;
      lastWheel = now;
      upward += -event.deltaY;
      event.preventDefault();
      if (upward > 80) { upward = 0; onClose(); }
    };
    const touchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? null;
      startX = event.touches[0]?.clientX ?? 0;
      startedAtTop = content.scrollTop <= 1;
      startedAtBottom = atBottom();
    };
    const touchEnd = (event: TouchEvent) => {
      const endY = event.changedTouches[0]?.clientY;
      if (startY === null || endY === undefined) return;
      const distance = startY - endY;
      if (Math.abs(startX - (event.changedTouches[0]?.clientX ?? startX)) > Math.abs(distance)) { startY = null; return; }
      if (!expanded && distance > 40) onOpen();
      else if (expanded && startedAtTop && distance < -90 && performance.now() > canCloseAfter) onClose();
      else if (expanded && startedAtBottom && distance > 70 && performance.now() > canCloseAfter) onNext();
      startY = null;
    };
    const cancelTouch = () => { startY = null; };
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('a, input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === ' ' && event.target instanceof Element && event.target.closest('button')) return;
      if (!expanded && ['ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault(); onOpen();
      } else if (expanded && atBottom() && ['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.shiftKey && performance.now() > canCloseAfter) {
        event.preventDefault(); onNext();
      }
    };
    root.addEventListener('wheel', wheel, { passive: false });
    root.addEventListener('touchstart', touchStart, { passive: true });
    root.addEventListener('touchend', touchEnd, { passive: true });
    root.addEventListener('touchcancel', cancelTouch);
    window.addEventListener('keydown', key);
    return () => {
      root.removeEventListener('wheel', wheel);
      root.removeEventListener('touchstart', touchStart);
      root.removeEventListener('touchend', touchEnd);
      root.removeEventListener('touchcancel', cancelTouch);
      window.removeEventListener('keydown', key);
    };
  }, [host, expanded, covered, visible, onOpen, onClose, onNext, reducedMotion]);

  return <section
    className="q-lab-panel"
    data-expanded={expanded}
    data-visible={visible}
    data-covered={covered}
    aria-label={lab.name}
    inert={!visible || covered}
  >
    <button
      ref={openRef}
      className="q-lab-peek"
      type="button"
      tabIndex={expanded ? -1 : 0}
      aria-hidden={expanded}
      aria-expanded={expanded}
      aria-controls="shaligram-content"
      onClick={onOpen}
    >
      <span className="q-lab-peek-index">01 / My AI lab</span>
      <span>Shaligram Labs</span>
      <span className="q-lab-peek-arrow" aria-hidden="true">↑</span>
    </button>
    <div id="shaligram-content" ref={scrollRef} className="q-lab-scroll" inert={!expanded} tabIndex={expanded ? 0 : -1}>
      <header className="q-lab-header">
        <a href={lab.href} target="_blank" rel="noreferrer" className="q-lab-brand"><img src="/assets/shaligram/mark.svg" alt="" />{lab.name}</a>
        <button ref={backRef} type="button" onClick={onClose}>Back to portfolio <span aria-hidden="true">↑</span></button>
        <span className="q-lab-reading-progress" aria-hidden="true" />
      </header>
      <div className="q-lab-body">
        <div className="q-lab-eyebrow"><span className="q-lab-status" />{lab.location}<span className="q-lab-edition">Research / 001</span></div>
        <div className="q-lab-hero" id="lab-introduction">
          <div>
            <p className="q-lab-kicker">Shaligram Labs</p>
            <h2>Interfaces for<br /><span>web agents.</span></h2>
            <p className="q-lab-intro">{lab.description}</p>
            <a className="q-lab-visit" href={lab.href} target="_blank" rel="noreferrer">Visit the lab <span aria-hidden="true">↗</span></a>
          </div>
          <ReactiveLabMark active={expanded && visible && !covered} onExplore={() => scrollToLabChapter(scrollRef.current, 'lab-reify', reducedMotion)} />
        </div>
        <section className="q-lab-research" id="lab-reify" aria-labelledby="reify-heading">
          <div className="q-lab-section-label"><span>01 / First system</span><span>Rust · MCP</span></div>
          <div className="q-lab-research-grid">
            <div className="q-lab-research-copy">
              <h3 id="reify-heading">Reify<span>.</span></h3>
              <p>Compile a website into tools an agent can call.</p>
              <p className="q-lab-research-desc">Reify finds the data behind a website, infers its schema, and mounts tools for the task at hand.</p>
              <div className="q-lab-links"><a href={lab.researchHref} target="_blank" rel="noreferrer">Read the paper ↗</a><a href={lab.sourceHref} target="_blank" rel="noreferrer">Source code ↗</a></div>
            </div>
            <div className="q-lab-discovery">
              <p className="q-lab-discovery-label">Three paths to a callable tool</p>
              <div className="q-lab-stages" role="tablist" aria-label="Explore Reify discovery paths">
                {lab.stages.map((item, index) => <button key={item.id} id={`stage-${item.id}`} role="tab" type="button" aria-selected={stage.id === item.id} aria-controls="lab-stage-panel" tabIndex={stage.id === item.id ? 0 : -1} onClick={() => setStage(item)}
                  onKeyDown={event => {
                    const next = event.key === 'ArrowRight' ? (index + 1) % lab.stages.length : event.key === 'ArrowLeft' ? (index - 1 + lab.stages.length) % lab.stages.length : event.key === 'Home' ? 0 : event.key === 'End' ? lab.stages.length - 1 : null;
                    if (next === null) return;
                    event.preventDefault();
                    setStage(lab.stages[next]);
                    document.getElementById(`stage-${lab.stages[next].id}`)?.focus({ preventScroll: true });
                  }}>
                  {stage.id === item.id ? <motion.span className="q-lab-stage-selection" layoutId="lab-discovery-selection" transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 450, damping: 36, mass: .65 }} /> : null}
                  <span className="q-stage-index">0{index + 1}</span><span className="q-stage-label">{item.label}</span>
                </button>)}
              </div>
              <div className="q-lab-tool-diagram" data-stage={stage.id} aria-hidden="true">
                <div className="q-lab-input-lines"><i /><i /><i /><i /></div>
                <svg viewBox="0 0 440 100" preserveAspectRatio="none"><path d="M0 15H80C125 15 115 50 160 50H280C325 50 315 85 360 85H440M0 38H110C135 38 135 50 160 50M0 62H110C135 62 135 50 160 50M0 85H80C125 85 115 50 160 50M280 50C325 50 315 15 360 15H440M280 50H440" /></svg>
                <div className="q-lab-compiler">R<span>compile</span></div>
                <div className="q-lab-output-lines"><i /><i /><i /></div>
              </div>
              <div id="lab-stage-panel" role="tabpanel" aria-labelledby={`stage-${stage.id}`} tabIndex={0}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={stage.id} className="q-lab-stage-content" initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .18 }} aria-live="polite">
                  <div className="q-lab-stage-flow"><span>{stage.input}</span><span aria-hidden="true">→</span><span>{stage.output}</span></div>
                  <code>{stage.code}</code><p>{stage.description}</p>
                </motion.div>
              </AnimatePresence>
              </div>
              <a className="q-lab-system-link" href={lab.systemHref} target="_blank" rel="noreferrer">Explore the compiler ↗</a>
            </div>
          </div>
          <div className="q-lab-results">
            <div><strong>98.4<span>%</span></strong><p>fewer schema tokens</p></div>
            <div><strong>92.5<span>%</span></strong><p>task completion</p></div>
            <a href={lab.researchHref} target="_blank" rel="noreferrer">Author-reported Reify paper results.<br />Read the methods and limits ↗</a>
          </div>
        </section>
        <section className="q-lab-principle" id="lab-approach">
          <p className="q-lab-kicker">Research and source code</p>
          <h3>The code and the<br />experiments are public.</h3>
          <div><p>I publish code, measurements, and failed approaches so others can inspect and repeat the experiments.</p><a href={lab.manifestoHref} target="_blank" rel="noreferrer">Read the lab manifesto ↗</a></div>
        </section>
        <button ref={nextRef} className="q-lab-next" type="button" onClick={onNext} aria-controls="github-heading"><span className="q-lab-next-label">Next chapter <span>02 / GitHub activity</span></span><span className="q-lab-next-title">My GitHub contributions.</span><span className="q-lab-next-arrow" aria-hidden="true">↓</span></button>
        <footer className="q-lab-footer"><span>Shaligram Labs / Kathmandu</span><a href={lab.href} target="_blank" rel="noreferrer">shaligramlabs.vercel.app ↗</a><button type="button" onClick={onClose}>Back to qvost ↑</button></footer>
      </div>
    </div>
    <LabNavigation container={scrollRef} active={expanded && visible && !covered} />
  </section>;
}
