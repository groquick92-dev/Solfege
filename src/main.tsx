import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/index.css'

// Met l'application en cache pour un usage hors-ligne, et se met à jour toute
// seule au chargement suivant. `onNeedRefresh` est volontairement ignoré :
// interrompre un enfant en plein exercice pour lui proposer une mise à jour
// n'aurait aucun sens.
registerSW({ immediate: true })

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément racine introuvable')

createRoot(racine).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
