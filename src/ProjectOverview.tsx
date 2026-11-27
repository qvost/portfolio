import { PortfolioFooter } from '../components/ui/portfolio-footer';
import { selectedPortfolioProjects, portfolioSite } from './portfolio-data';
import { SiteHeader } from './SiteNavigation';
import { ProjectConstellation } from './ProjectConstellation';

export function ProjectOverview() {
  return <main className="work-page route-page project-page">
    <SiteHeader currentPath="/project/" />
    <section className="work-intro">
      <p>Siddid Pandey / Selected work</p>
      <h1>Projects by qvost.</h1>
      <p>I write Rust for deterministic systems and agent tools. The web projects include an invoicing tool and a Nepali calendar.</p>
      <p className="route-primary-link"><a href="/work/">Browse all projects</a></p>
    </section>
    <ProjectConstellation projects={selectedPortfolioProjects} />
    <PortfolioFooter email={portfolioSite.email} />
  </main>;
}
