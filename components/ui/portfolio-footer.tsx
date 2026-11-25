import { CopyButton } from './colourist-reel-page/contact-panel';
import './portfolio-footer.css';

export function PortfolioFooter({ email, onHome }: { email: string; onHome?: () => void }) {
  return <footer className="q-footer">
    <div className="q-footer-contact">
      <p className="q-footer-label">Get in touch</p>
      <div className="q-footer-address"><a href={`mailto:${email}`}>{email}</a>{onHome ? <CopyButton value={email} /> : null}</div>
    </div>
    <div className="q-footer-details">
      <p>Siddid Pandey<span>Kathmandu, Nepal</span></p>
      <nav aria-label="Social profiles"><a href="https://github.com/qvost" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.linkedin.com/in/qvost/" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://x.com/qvostlost" target="_blank" rel="noreferrer">X</a></nav>
    </div>
    <div className="q-footer-bottom">
      <p className="q-footer-mark">qvost<span>.</span></p>
      <p>© {new Date().getFullYear()}</p>
      {onHome ? <button type="button" onClick={onHome}>Back to the start</button> : <a href="/">Back to the start</a>}
    </div>
  </footer>;
}
