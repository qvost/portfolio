import { PortfolioFooter } from '../components/ui/portfolio-footer';
import { portfolioSite } from './portfolio-data';
import { SiteHeader } from './SiteNavigation';

export function ContactPage() {
  return <main className="work-page route-page">
    <SiteHeader currentPath="/contact/" />
    <section className="work-intro">
      <p>Siddid Pandey / Kathmandu, Nepal</p>
      <h1>Contact Siddid Pandey.</h1>
      <p>I work on deterministic systems and infrastructure for agents at Shaligram Labs. For projects, research, or a conversation, write to me.</p>
      <p className="route-primary-link"><a href={`mailto:${portfolioSite.email}`}>{portfolioSite.email}</a></p>
    </section>
    <section className="route-section" aria-labelledby="contact-links-heading">
      <h2 id="contact-links-heading">Find me elsewhere</h2>
      <nav aria-label="Profile links">
        <a href="https://github.com/qvost" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://www.linkedin.com/in/qvost/" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://x.com/qvostlost" target="_blank" rel="noreferrer">X</a>
      </nav>
    </section>
    <PortfolioFooter email={portfolioSite.email} />
  </main>;
}
