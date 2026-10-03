import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts, so they also work offline.
import '@fontsource-variable/inter'
import '@fontsource-variable/inter/wght-italic.css'
import '@fontsource-variable/nunito'
import '@fontsource-variable/merriweather'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/caveat'
import './styles/tokens.css'
import './styles/base.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
