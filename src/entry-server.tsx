import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { Portfolio } from './Portfolio';
import { WorkIndex } from './WorkIndex';

export function render() { return renderToString(<Portfolio />); }
export function renderWork() { return renderToStaticMarkup(<WorkIndex />); }
