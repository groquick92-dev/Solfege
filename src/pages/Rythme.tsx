/**
 * Exercice de rythme : écouter, puis frapper.
 *
 * Les frappes sont horodatées sur l'horloge audio et non sur `Date.now()`.
 * L'écart entre les deux atteint couramment plusieurs dizaines de
 * millisecondes selon la charge de la page, ce qui suffirait à déclarer faux
 * un enfant parfaitement en place.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CadreExercice, useSerie } from '../exercices/CadreExercice'
import { Bouton } from '../ui/Bouton'
import { Carte } from '../ui/Carte'
import { Retour } from '../ui/Retour'
import { Portee } from '../notation/Portee'
import { type QuestionRythme, evaluerFrappes, genererRythme, scoreFrappes } from '../music/generateurs'
import { frappes } from '../music/rythme'
import { jouerFrappe, jouerRythme } from '../audio/lecture'
import { decompte } from '../audio/metronome'
import { debloquerAudio, maintenant } from '../audio/contexte'
import { useProgression } from '../store/progression'

/** Nombre de rythmes par série — plus court que les autres exercices, car chacun prend plus de temps. */
const RYTHMES_PAR_SERIE = 5

type Phase = 'attente' | 'ecoute' | 'decompte' | 'frappe' | 'bilan'

export default function Rythme() {
  const { niveau: niveauParam } = useParams()
  const niveau = (Math.min(3, Math.max(1, Number.parseInt(niveauParam ?? '1', 10) || 1)) as 1 | 2 | 3)

  const serie = useSerie(`rythme-${niveau - 1}`, RYTHMES_PAR_SERIE)
  const tempo = useProgression((etat) => etat.reglages.tempo)

  const [question, setQuestion] = useState<QuestionRythme>(() => genererRythme(2, niveau))
  const [phase, setPhase] = useState<Phase>('attente')
  const [score, setScore] = useState(0)

  // Les frappes sont accumulées dans une référence : les enregistrer dans
  // l'état déclencherait un rendu à chaque appui, au pire moment possible.
  const departRef = useRef(0)
  const frappesRef = useRef<number[]>([])

  useEffect(() => {
    setQuestion(genererRythme(2, niveau))
    setPhase('attente')
    frappesRef.current = []
  }, [serie.indice, niveau])

  const ecouter = useCallback(async () => {
    setPhase('ecoute')
    const attendus = frappes(question.evenements)
    await jouerRythme(attendus, tempo)
    const duree = ((question.duree + 0.5) * 60000) / tempo
    window.setTimeout(() => setPhase('attente'), duree)
  }, [question, tempo])

  const commencer = useCallback(async () => {
    await debloquerAudio()
    setPhase('decompte')
    frappesRef.current = []

    await decompte(tempo, question.mesure.numerateur)

    departRef.current = maintenant()
    setPhase('frappe')

    // La fenêtre de frappe dépasse d'un temps la fin du rythme : une dernière
    // note frappée juste après la barre reste comptée.
    const duree = ((question.duree + 1) * 60000) / tempo
    window.setTimeout(() => {
      const attendus = frappes(question.evenements)
      const resultats = evaluerFrappes(attendus, frappesRef.current)
      const obtenu = scoreFrappes(resultats)
      setScore(obtenu)
      setPhase('bilan')
      window.setTimeout(() => serie.repondrePartiel(obtenu / 100), 2600)
    }, duree)
  }, [question, tempo, serie])

  const frapper = useCallback(() => {
    if (phase !== 'frappe') return
    const secondesParTemps = 60 / tempo
    frappesRef.current.push((maintenant() - departRef.current) / secondesParTemps)
    jouerFrappe(maintenant())
  }, [phase, tempo])

  // La barre d'espace double le bouton : beaucoup d'enfants la trouvent plus
  // naturelle qu'un appui à la souris pour marquer un rythme.
  useEffect(() => {
    if (phase !== 'frappe') return
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.code === 'Space' || evenement.code === 'Enter') {
        evenement.preventDefault()
        frapper()
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [phase, frapper])

  return (
    <CadreExercice titre="Le rythme" emoji="🥁" serie={serie} total={RYTHMES_PAR_SERIE}>
      <Carte teinte="rose" className="mb-5">
        <Portee
          notes={question.evenements.map((e) => ({
            midi: 71, // toutes les notes sur la même ligne : seul le rythme compte
            duree: e.silence ? e.valeurId.slice('silence:'.length) : e.valeurId,
            silence: e.silence,
          }))}
          mesure={question.mesure.nom}
          tempsParMesure={question.mesure.numerateur}
          hauteur={160}
          description={`Rythme à ${question.mesure.nom}`}
        />
        <p className="text-center text-encre-clair text-sm mt-1">
          Tempo : {tempo} — mesure à {question.mesure.nom}
        </p>
      </Carte>

      {phase === 'attente' && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Bouton teinte="ciel" onClick={ecouter} icone={<span aria-hidden="true">▶️</span>}>
            Écouter le rythme
          </Bouton>
          <Bouton teinte="peche" onClick={commencer} icone={<span aria-hidden="true">👏</span>}>
            À toi de frapper !
          </Bouton>
        </div>
      )}

      {phase === 'ecoute' && (
        <p className="text-center font-titre text-xl text-ciel-600 animate-[pulsation_2s_ease-in-out_infinite]">
          🔊 Écoute bien…
        </p>
      )}

      {phase === 'decompte' && (
        <p className="text-center font-titre text-2xl text-peche-600 animate-[pulsation_1s_ease-in-out_infinite]">
          Prépare-toi…
        </p>
      )}

      {phase === 'frappe' && (
        <button
          onPointerDown={frapper}
          className="w-full py-14 rounded-[var(--radius-galet)] bg-peche-300 text-[#7a3418]
                     font-titre font-bold text-3xl sans-selection
                     shadow-[0_6px_0_0_var(--color-peche-500)] active:translate-y-[4px] active:shadow-none
                     animate-[rebond-doux_0.5s_ease-out]"
          aria-label="Frapper le rythme"
        >
          👏 Frappe !
        </button>
      )}

      {phase === 'bilan' && (
        <Retour
          juste={score >= 70}
          message={score >= 90 ? 'Parfaitement en place !' : score >= 70 ? 'Bien joué !' : 'Pas encore…'}
          detail={`Précision : ${score} %`}
        />
      )}
    </CadreExercice>
  )
}
