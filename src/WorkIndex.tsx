import { portfolioProjects, portfolioSite } from './portfolio-data';

export function WorkIndex() {
  return <main className="work-page">
    <header><a href="/" aria-label="qvost portfolio home">qvost</a><a href={`mailto:${portfolioSite.email}`}>Get in touch ↗</a></header>
    <section className="work-intro">
      <p>Siddid Pandey / Kathmandu, Nepal</p>
      <h1>Projects by qvost.</h1>
      <p>I build tools and systems with Rust, React and TypeScript. At <a href="https://shaligramlabs.vercel.app/">Shaligram Labs</a>, I work on infrastructure for AI agents.</p>
      <nav aria-label="Profile links"><a href="https://github.com/qvost">GitHub ↗</a><a href="https://www.linkedin.com/in/qvost/">LinkedIn ↗</a><a href="https://x.com/qvostlost">X ↗</a></nav>
    </section>
    <section className="work-list" aria-label="Selected projects">
      {portfolioProjects.map(project => <article key={project.slug} id={project.slug}>
        <img src={project.poster} alt="" width="900" height="1080" loading="lazy" />
        <div><p className="work-type">{project.stack}</p><h2>{project.client}</h2><p>{project.description}</p>
          <div className="work-links">{project.href ? <a href={project.href}>Visit {project.client} ↗</a> : null}{project.source ? <a href={project.source}>Source code ↗</a> : null}</div>
        </div>
      </article>)}
    </section>
    <footer><a href="/">Back to the portfolio ↑</a><span>qvost / Siddid Pandey</span></footer>
  </main>;
}
