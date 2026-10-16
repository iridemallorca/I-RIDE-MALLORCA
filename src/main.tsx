import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
const el = document.getElementById('root')!;
const app = <App path={window.location.pathname} />;
if (el.hasChildNodes()) hydrateRoot(el, app); else createRoot(el).render(app);
