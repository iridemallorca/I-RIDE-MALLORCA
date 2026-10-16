import { renderToString } from 'react-dom/server';
import App from './App';
export { routeGuides, products, faq, origin, routePath, productPath } from './data/content';
export function render(path: string) { return renderToString(<App path={path} />); }
