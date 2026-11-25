import { createRoot, hydrateRoot } from "react-dom/client";
import { Portfolio } from './Portfolio';
import "./global.css";

const mount = document.getElementById("root");
if (!mount) throw new Error("Portfolio mount point is missing.");

if (/^\/work\/?$/.test(window.location.pathname)) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/work.css';
  document.head.append(stylesheet);
  const { WorkIndex } = await import('./WorkIndex');
  createRoot(mount).render(<WorkIndex />);
} else if (mount.hasChildNodes()) hydrateRoot(mount, <Portfolio />);
else createRoot(mount).render(<Portfolio />);
