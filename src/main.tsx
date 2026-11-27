import { createRoot, hydrateRoot } from "react-dom/client";
import { Portfolio } from './Portfolio';
import "./global.css";

const mount = document.getElementById("root");
if (!mount) throw new Error("Portfolio mount point is missing.");

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const Page = path === '/work' ? (await import('./WorkIndex')).WorkIndex
  : path === '/project' ? (await import('./ProjectOverview')).ProjectOverview
  : path === '/contact' ? (await import('./ContactPage')).ContactPage
  : path === '/lab' ? (await import('./LabPage')).LabPage
  : null;
if (Page) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/work.css';
  document.head.append(stylesheet);
  createRoot(mount).render(<Page />);
} else if (mount.hasChildNodes()) hydrateRoot(mount, <Portfolio />);
else createRoot(mount).render(<Portfolio />);
