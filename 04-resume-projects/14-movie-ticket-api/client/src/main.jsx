import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Demo build (GitHub Pages): আসল Node server নেই, তাই browser-এর ভেতরের নকল API server চালু করি
(async () => {
  if (import.meta.env.VITE_MOCK) (await import('./mockServer.js')).installMock();
  createRoot(document.getElementById('root')).render(<App />);
})();
