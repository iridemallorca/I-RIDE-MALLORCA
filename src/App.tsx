import IRideMallorcaPage from './pages/IRideMallorcaPage';
import GuidePage from './pages/GuidePage';
export function normalisePath(path: string) { return path === '/' ? '/' : path.replace(/\/+$/, '') + '/'; }
export default function App({ path }: { path: string }) { return normalisePath(path) === '/' ? <IRideMallorcaPage /> : <GuidePage path={normalisePath(path)} />; }
