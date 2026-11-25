import { MotionConfig } from 'motion/react';
import ColouristReelPage from '../components/ui/colourist-reel-page';
import { useReducedMotion } from '../components/ui/colourist-reel-page/motion-preference';
import { portfolioProjects, portfolioSite } from './portfolio-data';
import { shaligramLab } from './shaligram-lab';

export function Portfolio() {
  const reducedMotion = useReducedMotion();
  return <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
    <ColouristReelPage
      assetBase="/assets/colourist-reel-page"
      lab={shaligramLab}
      githubUsername="qvost"
      site={portfolioSite}
      projects={portfolioProjects}
      className="qvost-portfolio"
    />
  </MotionConfig>;
}
