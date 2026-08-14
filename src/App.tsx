import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Navigation } from './ui/Navigation'
import { useProgression } from './store/progression'
import { reglerAmbiance, reglerVolume } from './audio/contexte'
import Accueil from './pages/Accueil'

// Les écrans d'exercice tirent VexFlow et les échantillons audio : les charger
// à la demande garde l'accueil léger, ce qui compte sur la tablette familiale.
const ListeCours = lazy(() => import('./pages/ListeCours'))
const PageCours = lazy(() => import('./pages/PageCours'))
const LectureNotes = lazy(() => import('./pages/LectureNotes'))
const Rythme = lazy(() => import('./pages/Rythme'))
const DicteeRythme = lazy(() => import('./pages/DicteeRythme'))
const Oreille = lazy(() => import('./pages/Oreille'))
const Dictee = lazy(() => import('./pages/Dictee'))
const Chant = lazy(() => import('./pages/Chant'))
const Piano = lazy(() => import('./pages/Piano'))
const Profil = lazy(() => import('./pages/Profil'))
const Parents = lazy(() => import('./pages/Parents'))

function Chargement() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3" role="status">
      <span className="text-5xl animate-[pulsation_2s_ease-in-out_infinite]" aria-hidden="true">
        🎵
      </span>
      <p className="text-encre-clair font-titre">Un instant…</p>
    </div>
  )
}

export default function App() {
  const reglages = useProgression((etat) => etat.reglages)

  // Les réglages sont relus du stockage local au démarrage : la chaîne audio
  // doit être remise à leur valeur, sinon le volume repart à sa valeur d'usine
  // à chaque ouverture.
  useEffect(() => {
    reglerVolume(reglages.volume)
    reglerAmbiance(reglages.ambiance)
  }, [reglages.volume, reglages.ambiance])

  return (
    <div className="min-h-dvh pb-24">
      <Suspense fallback={<Chargement />}>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/cours" element={<ListeCours />} />
          <Route path="/cours/:id" element={<PageCours />} />
          <Route path="/lecture/:cle/:palier" element={<LectureNotes />} />
          <Route path="/rythme/:niveau" element={<Rythme />} />
          <Route path="/dictee-rythme/:niveau" element={<DicteeRythme />} />
          <Route path="/oreille/:palier" element={<Oreille />} />
          <Route path="/dictee/:palier" element={<Dictee />} />
          <Route path="/chant" element={<Chant />} />
          <Route path="/piano" element={<Piano />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="*" element={<Accueil />} />
        </Routes>
      </Suspense>
      <Navigation />
    </div>
  )
}
