import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { Portfolio } from './Portfolio';
import { WorkIndex } from './WorkIndex';
import { ContactPage } from './ContactPage';
import { LabPage } from './LabPage';
import { ProjectOverview } from './ProjectOverview';

export function render() { return renderToString(<Portfolio />); }
export function renderWork() { return renderToStaticMarkup(<WorkIndex />); }
export function renderContact() { return renderToStaticMarkup(<ContactPage />); }
export function renderLab() { return renderToStaticMarkup(<LabPage />); }
export function renderProject() { return renderToStaticMarkup(<ProjectOverview />); }
