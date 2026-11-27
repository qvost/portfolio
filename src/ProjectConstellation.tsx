import type { ColouristProject } from '../components/ui/colourist-reel-page/data';

const petal = 'M250 250C168 220 184 122 250 97C316 122 332 220 250 250Z';

export function ProjectConstellation({ projects }: { projects: ColouristProject[] }) {
  if (projects.length === 0) return null;

  // Native radios own selection, including on the prerendered page without JavaScript.
  const selectionStyles = projects.map(project => {
    const selected = `.project-constellation:has(#constellation-${project.slug}:checked)`;
    return `${selected} [data-preview="${project.slug}"]{display:flex}
      ${selected} [data-petal="${project.slug}"]{fill:#6c795217;stroke:#6c7952}
      ${selected} [data-trace="${project.slug}"]{stroke-dashoffset:0}
      .constellation-stage:has(label[for="constellation-${project.slug}"]:hover) [data-petal="${project.slug}"]{stroke:#6c7952}`;
  }).join('\n');

  return <section className="project-constellation" aria-label="Project constellation">
    <style>{selectionStyles}</style>
    <div className="constellation-drawing">
      <fieldset className="constellation-stage" aria-describedby="constellation-instructions">
        <legend className="constellation-sr-only">Choose a project</legend>
        {projects.map((project, index) => {
          const angle = index / projects.length * Math.PI * 2;
          return <div className="constellation-choice" key={project.slug}
            style={{ left: `${50 + Math.sin(angle) * 39}%`, top: `${50 - Math.cos(angle) * 39}%` }}>
            <input className="constellation-radio" type="radio" name="constellation-project"
              id={`constellation-${project.slug}`} value={project.slug} defaultChecked={index === 0}
              aria-controls={`constellation-preview-${project.slug}`} />
            <label className="constellation-label" htmlFor={`constellation-${project.slug}`}>
              <span className="constellation-point" aria-hidden="true" />
              <span>{project.client}</span>
            </label>
          </div>;
        })}
        <svg className="constellation-engraving" viewBox="0 0 500 500" fill="none" aria-hidden="true">
          <defs>
            <pattern id="constellation-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r=".65" fill="#a7af9a" opacity=".4" />
            </pattern>
          </defs>
          <rect width="500" height="500" fill="url(#constellation-grid)" />
          <circle cx="250" cy="250" r="188" stroke="#bbc2b0" strokeDasharray="1 7" />
          <circle cx="250" cy="250" r="80" stroke="#bbc2b0" strokeWidth=".6" />
          {projects.map((project, index) => <g key={project.slug} transform={`rotate(${index / projects.length * 360} 250 250)`}>
            <path className="constellation-petal" data-petal={project.slug} d={petal} />
            <path className="constellation-trace" data-trace={project.slug} d={petal} pathLength="1" />
            <path d="M250 78V88" stroke="#a7af9a" strokeWidth="1" />
          </g>)}
          <circle cx="250" cy="250" r="30" fill="#eeeee7" stroke="#bbc2b0" strokeWidth=".7" />
          <path d="M240 250h20m-10-10v20" stroke="#6c7952" strokeWidth="1.2" />
          <circle cx="250" cy="250" r="3" fill="#6c7952" />
        </svg>
      </fieldset>
      <div className="constellation-caption">
        <span>{projects.length} projects</span>
        <span id="constellation-instructions">Choose a name to explore.</span>
      </div>
    </div>
    <div className="constellation-previews">
      {projects.map(project => <article className="constellation-preview" data-preview={project.slug}
        id={`constellation-preview-${project.slug}`} aria-labelledby={`constellation-title-${project.slug}`} key={project.slug}>
        <div className="constellation-heading">
          <div>
            <p className="constellation-category">{project.type === 'web' ? 'Web' : project.type === 'systems' ? 'Systems' : 'Experiments'}</p>
            <h2 id={`constellation-title-${project.slug}`}>{project.client}</h2>
            <p className="constellation-focus">{project.title}</p>
          </div>
          <img src={project.poster} alt="" width="900" height="1080" loading="lazy" />
        </div>
        <p className="constellation-description">{project.description}</p>
        <p className="constellation-stack">{project.stack}</p>
        <div className="constellation-links">
          {project.href ? <a href={project.href}>{project.href.startsWith('https://github.com/') ? 'Read project' : 'Visit project'}</a> : null}
          {project.source ? <a href={project.source}>Source code</a> : null}
        </div>
        <a className="constellation-index-link" href={`/work/#${project.slug}`}>Find in the full index</a>
      </article>)}
    </div>
  </section>;
}
