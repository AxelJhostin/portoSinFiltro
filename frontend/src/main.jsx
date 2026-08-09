import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './lib/leafletConfig';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(reg => {
      // Cachear ya mismo el JS/CSS con hash de esta carga — si no, el offline
      // solo funciona a partir de la segunda visita (el SW llega tarde a la primera).
      // Solo same-origin: el SW ignora todo lo demás (ver fetch handler en sw.js).
      const urls = [
        ...document.querySelectorAll('script[src]'),
        ...document.querySelectorAll('link[rel="stylesheet"]'),
      ].map(el => el.src || el.href).filter(u => u && u.startsWith(location.origin));
      reg.active?.postMessage({ type: 'CACHE_URLS', urls });
    });
  });
}
