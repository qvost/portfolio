import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import ColouristReelPage from "../components/ui/colourist-reel-page";
import { shaligramLab } from "./shaligram-lab";
import { portfolioProjects, portfolioSite } from "./portfolio-data";
import { useReducedMotion } from "../components/ui/colourist-reel-page/motion-preference";
import "./global.css";

const mount = document.getElementById("root");
if (!mount) throw new Error("Portfolio mount point is missing.");

function Portfolio() {
  const reducedMotion = useReducedMotion();
  return <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
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

createRoot(mount).render(<Portfolio />);
