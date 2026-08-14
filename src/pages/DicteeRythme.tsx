/**
 * Dictée rythmique : écouter une mesure et l'écrire.
 *
 * C'est le pendant écrit de l'exercice de frappe. Reproduire un rythme avec
 * les mains et savoir le noter sont deux compétences distinctes : la seconde
 * demande d'identifier les durées, pas seulement de les ressentir. Elle est
 * au programme dès la deuxième année, et c'est celle qui bloque le plus
 * souvent au moment des relevés.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CadreExercice, useDelai, useSerie } from '../exercices/CadreExercice'
import { Bouton } from '../ui/Bouton'
import { Carte } from '../ui/Carte'
import { Retour } from '../ui/Retour'
import { Portee, type NoteAffichee } from '../notation/Portee'
import { genererRythme } from '../music/generateurs'
import { figuresJusquAu, frappes, tempsParMesure, valeur } from '../music/rythme'
import { jouerRythme } from '../audio/lecture'
import { useProgression } from '../store/progression'

/** Quatre dictées par série : chacune demande plusieurs écoutes. */
const DICTEES_PAR_SERIE = 4

/** Hauteur unique d'affichage : seul le rythme compte, pas la mélodie. */
const LIGNE = 71

export default function DicteeRythme() {
  const { niveau: niveauParam } = useParams()
  const niveau = Math.min(3, Math.max(1, Number.parseInt(niveauParam ?? '1', 10) || 1)) as 1 | 2 | 3

  const tempo = useProgression((etat) => etat.reglages.tempo)
  const generer = useCallback(() => genererRythme(1, niveau, '4/4'), [niveau])
  const serie = useSerie(`dictee-rythme-${niveau}`, DICTEES_PAR_SERIE, generer)

  const question = serie.question
  const differer = useDelai()
  const capacite = tempsParMesure(question.mesure)

  const [saisie, setSaisie] = useState<string[]>([])
  const [validee, setValidee] = useState(false)
  const [ecoute, setEcoute] = useState(false)

  const jouer = useCallback(
    async (temps: number[]) => {
      setEcoute(true)
      await jouerRythme(temps, tempo)
      differer(() => setEcoute(false), ((capacite + 1) * 60_000) / tempo)
    },
    [tempo, capacite],
  )

  useEffect(() => {
    setSaisie([])
    setValidee(false)
    if (!serie.terminee) void jouer(frappes(question.evenements))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serie.indice, serie.terminee])

  /** Durée déjà posée, en temps. */
  const remplie = saisie.reduce(
    (somme, id) => somme + valeur(id.replace('silence:', '')).temps,
    0,
  )
  const complete = Math.abs(remplie - capacite) < 1e-9

  const ajouter = (id: string) => {
    if (validee) return
    const duree = valeur(id.replace('silence:', '')).temps
    // Une valeur qui déborderait de la mesure est refusée : l'enfant doit
    // apprendre qu'une mesure se remplit exactement, ni plus ni moins.
    if (remplie + duree > capacite + 1e-9) return
    setSaisie([...saisie, id])
  }

  const effacer = () => {
    if (!validee) setSaisie(saisie.slice(0, -1))
  }

  const valider = () => {
    setValidee(true)
    const attendue = question.evenements.map((e) => e.valeurId)
    const justes = saisie.filter((id, i) => id === attendue[i]).length
    const part = attendue.length > 0 ? justes / attendue.length : 0

    differer(
      () =>
        serie.repondrePartiel(part, {
          attendue: question.cellules.map((c) => c.parle).join(' — '),
          notes: [],
        }),
      3200,
    )
  }

  const attendue = question.evenements.map((e) => e.valeurId)
  const toutJuste =
    validee && saisie.length === attendue.length && saisie.every((id, i) => id === attendue[i])

  /** Portée montrant soit la saisie, soit la correction colorée. */
  const affichage: NoteAffichee[] = (validee ? attendue : saisie).map((id, i) => {
    const silence = id.startsWith('silence:')
    return {
      midi: LIGNE,
      duree: silence ? id.slice('silence:'.length) : id,
      silence,
      couleur: validee ? (saisie[i] === id ? 'juste' : 'faux') : 'neutre',
    }
  })

  return (
    <CadreExercice titre="Dictée rythmique" emoji="📝" serie={serie}>
      <Carte teinte="rose" className="mb-5 text-center">
        <p className="text-encre-clair mb-3">
          Écoute la mesure, puis écris-la avec les figures de note.
        </p>
        <Bouton
          teinte="ciel"
          onClick={() => jouer(frappes(question.evenements))}
          disabled={ecoute}
          icone={<span aria-hidden="true">{ecoute ? '🔊' : '▶️'}</span>}
        >
          {ecoute ? 'Écoute…' : 'Réécouter'}
        </Bouton>
      </Carte>

      <Carte className="mb-5">
        {affichage.length > 0 ? (
          <Portee
            notes={affichage}
            mesure={question.mesure.nom}
            tempsParMesure={question.mesure.numerateur}
            hauteur={160}
          />
        ) : (
          <p className="text-center text-encre-pale py-10 font-titre">
            Pose les figures que tu entends…
          </p>
        )}
        <p className="text-center text-sm text-encre-clair mt-1">
          Mesure remplie : {remplie} / {capacite} temps
        </p>
      </Carte>

      {!validee && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {figuresJusquAu(niveau).map((id) => {
              const silence = id.startsWith('silence:')
              const v = valeur(id.replace('silence:', ''))
              const deborde = remplie + v.temps > capacite + 1e-9

              return (
                <button
                  key={id}
                  onClick={() => ajouter(id)}
                  disabled={deborde}
                  className="rounded-[var(--radius-bulle)] border-2 border-lavande-100 bg-white
                             px-2 py-3 shadow-[0_4px_0_0_var(--color-lavande-100)] sans-selection
                             transition-all active:translate-y-[3px] active:shadow-none
                             disabled:opacity-35 disabled:pointer-events-none"
                  aria-label={silence ? v.nomSilence : v.nom}
                >
                  <span className="block text-3xl leading-none mb-1" aria-hidden="true">
                    {silence ? '𝄽' : v.symbole}
                  </span>
                  <span className="block text-xs font-semibold text-encre-clair">
                    {silence ? v.nomSilence : v.nom}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <Bouton teinte="neutre" onClick={effacer} disabled={saisie.length === 0}>
              ← Effacer
            </Bouton>
            <Bouton teinte="menthe" onClick={valider} disabled={!complete}>
              Valider
            </Bouton>
          </div>

          {!complete && saisie.length > 0 && (
            <p className="text-center text-sm text-encre-pale mt-3">
              Il manque {Math.round((capacite - remplie) * 100) / 100} temps pour compléter la
              mesure.
            </p>
          )}
        </>
      )}

      {validee && (
        <Retour
          juste={toutJuste}
          detail={
            toutJuste
              ? 'La mesure est écrite exactement !'
              : `On dit : ${question.cellules.map((c) => c.parle).join(' — ')}. Les figures en vert étaient justes.`
          }
        />
      )}
    </CadreExercice>
  )
}
