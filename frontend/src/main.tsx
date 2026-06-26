import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { installMockAdapter } from './lib/api/installMockAdapter'

// Await mock adapter installation before rendering so the first request from
// any component hits the mock layer (not the real network).
;(async () => {
  await installMockAdapter();
  createRoot(document.getElementById("root")!).render(<App />);
})();
