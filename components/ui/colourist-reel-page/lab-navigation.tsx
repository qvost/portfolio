import { useEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from './motion-preference';

const CHAPTERS = [
  { id: 'lab-introduction', label: 'Introduction' },
  { id: 'lab-reify', label: 'Reify' },
  { id: 'lab-approach', label: 'Approach' },
];

export function scrollToLabChapter(container: HTMLDivElement | null, id: string, reducedMotion: boolean) {
  const section = container?.querySelector<HTMLElement>(`#${id}`);
  if (!container || !section) return;
  const headerHeight = container.querySelector('header')?.getBoundingClientRect().height ?? 88;
  const top = id === CHAPTERS[0].id ? 0 : section.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - headerHeight - 25;
  container.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'instant' : 'smooth' });
}

export function LabNavigation({ container, active }: { container: RefObject<HTMLDivElement | null>; active: boolean }) {
  const [chapter, setChapter] = useState(CHAPTERS[0].id);
  const navigation = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const scroll = container.current;
    if (!scroll || !active) return;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const range = scroll.scrollHeight - scroll.clientHeight;
      const progress = range > 0 ? scroll.scrollTop / range : 0;
      scroll.style.setProperty('--lab-progress', String(progress));
      navigation.current?.style.setProperty('--lab-progress', String(progress));
      const center = scroll.getBoundingClientRect().top + scroll.clientHeight * .4;
      let current = CHAPTERS[0].id;
      for (const item of CHAPTERS) {
        if ((scroll.querySelector(`#${item.id}`)?.getBoundingClientRect().top ?? Infinity) <= center) current = item.id;
      }
      if (progress > .98) current = CHAPTERS[2].id;
      setChapter(previous => previous === current ? previous : current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const observer = new ResizeObserver(schedule);
    observer.observe(scroll);
    const content = scroll.querySelector('.q-lab-body');
    if (content) observer.observe(content);
    scroll.addEventListener('scroll', schedule, { passive: true });
    paint();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); scroll.removeEventListener('scroll', schedule); };
  }, [container, active]);

  return <nav ref={navigation} className="q-lab-navigation" aria-label="Lab chapters" data-active={active} inert={!active}>
    {CHAPTERS.map((item, index) => <button key={item.id} type="button" aria-label={`Jump to ${item.label}`} aria-current={chapter === item.id ? 'location' : undefined}
      onClick={() => scrollToLabChapter(container.current, item.id, reducedMotion)}>
      <span className="q-chapter-label">{item.label}</span><span className="q-chapter-tick" aria-hidden="true" /><span className="q-chapter-number" aria-hidden="true">0{index + 1}</span>
    </button>)}
  </nav>;
}
