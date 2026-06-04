// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initGA4, initClarity } from './lib/analytics'

// ── Analytics: initialise once on app boot ────────────────
// Scripts are only injected if env vars are set (safe in dev)
initGA4()
initClarity()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
