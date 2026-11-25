import { useEffect, useState } from 'react';
import AsciiLogo from '../ascii-logo';

/** The original mark stays visible until the canvas has sampled its white mask. */
export function ReactiveLabMark({ onExplore, active }: { onExplore: () => void; active: boolean }) {
  const [opened, setOpened] = useState(active);
  useEffect(() => { if (active) setOpened(true); }, [active]);

  return <button type="button" className="q-lab-emblem" onClick={onExplore} aria-label="Explore Reify research">
    <div className="q-lab-ascii" aria-hidden="true">
      {opened ? <img className="q-lab-ascii-fallback" src="/assets/shaligram/mark.svg" alt="" /> : null}
      {opened ? <AsciiLogo
        src="/assets/shaligram/mark-ascii.svg"
        background="transparent"
        gridColor="#e2e2d9"
        charColor="#35452b"
        chars=".:+*#%@"
        cellSize={4}
        cellGap={2}
        mobileCellSize={3}
        mobileCellGap={1}
        logoScale={76}
        threshold={0.25}
        pushRadius={8}
        pushForce={6}
        spring={0.04}
        damping={0.6}
        flickerMs={90}
        active={active}
      /> : null}
    </div>
    <span className="q-lab-coordinate q-lab-coordinate-top" aria-hidden="true">Kathmandu / Nepal</span>
    <span className="q-lab-coordinate q-lab-coordinate-bottom" aria-hidden="true"><span className="q-mark-rest-label"><span className="q-mark-motion-label">Move through the mark</span><span className="q-mark-static-label">Explore Reify</span></span><span className="q-mark-hover-label">Explore Reify</span></span>
  </button>;
}
