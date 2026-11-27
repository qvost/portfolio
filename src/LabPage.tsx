import { PortfolioFooter } from '../components/ui/portfolio-footer';
import { portfolioSite } from './portfolio-data';
import { shaligramLab } from './shaligram-lab';
import { SiteHeader } from './SiteNavigation';

export function LabPage() {
  return <main className="work-page route-page">
    <SiteHeader currentPath="/lab/" />
    <section className="work-intro">
      <p>{shaligramLab.location}</p>
      <h1>Shaligram Labs.</h1>
      <p>{shaligramLab.description}</p>
      <p className="route-primary-link"><a href={shaligramLab.href}>Visit Shaligram Labs</a></p>
    </section>
    <section className="route-section lab-section" aria-labelledby="reify-heading">
      <div className="route-section-heading">
        <p className="work-type">Rust / MCP</p>
        <h2 id="reify-heading">Reify</h2>
        <p>Compile a website into tools an agent can call. Reify finds the data behind a website, infers its schema, and mounts tools for the task at hand.</p>
      </div>
      <div className="lab-paths">
        {shaligramLab.stages.map((stage, index) => <article key={stage.id}>
          <p className="work-type">0{index + 1} / {stage.label}</p>
          <h3>{stage.input} to {stage.output}</h3>
          <p>{stage.description}</p>
          <code>{stage.code}</code>
        </article>)}
      </div>
      <nav className="route-links" aria-label="Reify resources">
        <a href={shaligramLab.researchHref} target="_blank" rel="noreferrer">Read the paper</a>
        <a href={shaligramLab.systemHref} target="_blank" rel="noreferrer">Explore the compiler</a>
        <a href={shaligramLab.sourceHref} target="_blank" rel="noreferrer">Source code</a>
      </nav>
    </section>
    <section className="route-section">
      <h2>Research and source code</h2>
      <p>I publish code, measurements, and failed approaches so others can inspect and repeat the experiments.</p>
      <a href={shaligramLab.manifestoHref} target="_blank" rel="noreferrer">Read the lab manifesto</a>
    </section>
    <PortfolioFooter email={portfolioSite.email} />
  </main>;
}
