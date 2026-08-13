/**
 * Clavier virtuel.
 *
 * Espace d'exploration libre, sans score ni contrainte. Retrouver « do ré mi »
 * sur un vrai clavier ancre la théorie bien mieux qu'un exercice noté, et
 * l'enfant y revient de lui-même entre deux activités.
 */

import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { EnTete, Page, Carte } from '../ui/Carte'
import { Bouton } from '../ui/Bouton'
import { Portee } from '../notation/Portee'
import { jouerNote } from '../audio/lecture'
import { suivreChargement } from '../audio/instruments'
import { midiVersNote, nomFrancais } from '../music/theory'
import { useProgression } from '../store/progression'

/** Deux octaves à partir du do central : l'ambitus travaillé en clé de sol. */
const PREMIERE_NOTE = 60
const NB_TOUCHES = 25

/** Position des touches noires dans une octave, en demi-tons. */
const TOUCHES_NOIRES = new Set([1, 3, 6, 8, 10])

/** Rangée du clavier de l'ordinateur associée aux touches, de do à do. */
const TOUCHES_CLAVIER = [
  'KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT',
  'Digit6', 'KeyY', 'Digit7', 'KeyU', 'KeyI',
]

export default function Piano() {
  const [enfoncees, setEnfoncees] = useState<Set<number>>(new Set())
  const [derniere, setDerniere] = useState<number | null>(null)
  const [progression, setProgression] = useState(0)
  const [pret, setPret] = useState(false)
  const aideNoms = useProgression((etat) => etat.reglages.aideNoms)
  const modifierReglages = useProgression((etat) => etat.modifierReglages)

  useEffect(() => {
    return suivreChargement((etat) => {
      setProgression(etat.progression)
      setPret(etat.pret)
    })
  }, [])

  const jouer = useCallback((midi: number) => {
    setDerniere(midi)
    setEnfoncees((precedentes) => new Set(precedentes).add(midi))
    void jouerNote(midi, { duree: 2.5 })
    // L'enfoncement visuel est purement décoratif : la note sonne jusqu'à
    // l'extinction naturelle de l'échantillon, indépendamment de l'affichage.
    window.setTimeout(() => {
      setEnfoncees((precedentes) => {
        const suivantes = new Set(precedentes)
        suivantes.delete(midi)
        return suivantes
      })
    }, 220)
  }, [])

  useEffect(() => {
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.repeat) return
      const indice = TOUCHES_CLAVIER.indexOf(evenement.code)
      if (indice !== -1) {
        evenement.preventDefault()
        jouer(PREMIERE_NOTE + indice)
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [jouer])

  const touches = Array.from({ length: NB_TOUCHES }, (_, i) => PREMIERE_NOTE + i)
  const blanches = touches.filter((midi) => !TOUCHES_NOIRES.has(midi % 12))

  return (
    <Page>
      <EnTete titre="Le piano" sousTitre="Explore les sons librement" emoji="🎹" />

      {!pret && (
        <Carte teinte="ciel" className="mb-5 text-center">
          <p className="font-titre mb-2">Chargement du piano… {Math.round(progression * 100)} %</p>
          <div className="h-3 w-full rounded-full bg-white overflow-hidden">
            <div
              className="h-full bg-ciel-300 transition-[width] duration-300"
              style={{ width: `${progression * 100}%` }}
            />
          </div>
        </Carte>
      )}

      <Carte className="mb-5">
        {derniere !== null ? (
          <>
            <Portee notes={[{ midi: derniere, couleur: 'cible' }]} hauteur={150} />
            <p className="text-center font-titre font-bold text-xl text-lavande-600">
              {nomFrancais(midiVersNote(derniere))}
            </p>
          </>
        ) : (
          <p className="text-center text-encre-pale py-12 font-titre">
            Appuie sur une touche pour commencer…
          </p>
        )}
      </Carte>

      {/* Le clavier défile horizontalement sur les petits écrans plutôt que de
          rétrécir les touches sous la taille d'un doigt. */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div
          className="relative h-52 sans-selection"
          style={{ width: `${blanches.length * 3}rem`, minWidth: '100%' }}
          role="group"
          aria-label="Clavier de piano"
        >
          {/* Touches blanches */}
          {blanches.map((midi, index) => (
            <button
              key={midi}
              onPointerDown={() => jouer(midi)}
              className={clsx(
                'absolute top-0 h-52 border-2 border-encre-pale/30 rounded-b-[var(--radius-doux)]',
                'flex items-end justify-center pb-3 font-titre font-bold text-sm transition-colors',
                enfoncees.has(midi) ? 'bg-menthe-200 text-menthe-700' : 'bg-white text-encre-pale',
              )}
              style={{
                left: `${(index / blanches.length) * 100}%`,
                width: `${100 / blanches.length}%`,
              }}
              aria-label={nomFrancais(midiVersNote(midi))}
            >
              {aideNoms && nomFrancais(midiVersNote(midi))}
            </button>
          ))}

          {/* Touches noires, dessinées par-dessus */}
          {touches
            .filter((midi) => TOUCHES_NOIRES.has(midi % 12))
            .map((midi) => {
              // Une touche noire se place à cheval sur la frontière entre la
              // blanche qui la précède et la suivante.
              const rang = blanches.filter((b) => b < midi).length
              return (
                <button
                  key={midi}
                  onPointerDown={() => jouer(midi)}
                  className={clsx(
                    'absolute top-0 h-32 rounded-b-[var(--radius-doux)] z-10 border-2 border-encre/40',
                    enfoncees.has(midi) ? 'bg-lavande-400' : 'bg-encre',
                  )}
                  style={{
                    left: `${((rang / blanches.length) * 100) - (100 / blanches.length) * 0.3}%`,
                    width: `${(100 / blanches.length) * 0.6}%`,
                  }}
                  aria-label={nomFrancais(midiVersNote(midi))}
                />
              )
            })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-4">
        <Bouton
          teinte="neutre"
          taille="petit"
          onClick={() => modifierReglages({ aideNoms: !aideNoms })}
        >
          {aideNoms ? 'Masquer' : 'Afficher'} le nom des notes
        </Bouton>
      </div>

      <p className="text-center text-encre-pale text-sm mt-4">
        Tu peux aussi jouer avec les touches <strong>Q</strong> à <strong>I</strong> de ton clavier.
      </p>
    </Page>
  )
}
