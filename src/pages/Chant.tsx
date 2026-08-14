/**
 * Chant : reproduire une note avec la voix.
 *
 * Le micro n'est activé que pendant l'exercice et rien n'est enregistré : le
 * signal est analysé en direct puis jeté. Le témoin d'activité du navigateur
 * s'éteint dès qu'on quitte l'écran.
 *
 * La note cible est transposée dans un registre d'enfant, et la tolérance de
 * justesse reste large : une voix qui mue ou qui débute ne tient pas une note
 * au centième de demi-ton près.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { CadreExercice, useDelai, useSerie } from '../exercices/CadreExercice'
import { Bouton } from '../ui/Bouton'
import { Carte } from '../ui/Carte'
import { Retour } from '../ui/Retour'
import { Portee } from '../notation/Portee'
import { EcouteMicro, type MesureHauteur, decrireJustesse } from '../audio/micro'
import { jouerNote } from '../audio/lecture'
import { midiVersNote, nomFrancais } from '../music/theory'
import { choisir } from '../music/generateurs'

/** Notes cibles : registre confortable pour une voix d'enfant. */
const NOTES_CIBLES = [60, 62, 64, 65, 67, 69]

const NOTES_PAR_SERIE = 5

/** Durée pendant laquelle la note doit être tenue juste, en millisecondes. */
const DUREE_TENUE = 1200

export default function Chant() {
  const generer = useCallback(() => choisir(NOTES_CIBLES), [])
  const serie = useSerie('chant-0', NOTES_PAR_SERIE, generer)

  const cible = serie.question
  const differer = useDelai()
  const [mesure, setMesure] = useState<MesureHauteur | null>(null)
  const [ecouteActive, setEcouteActive] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [reussi, setReussi] = useState(false)

  const microRef = useRef<EcouteMicro | null>(null)
  const debutJusteRef = useRef<number | null>(null)

  // Le micro est systématiquement relâché au démontage : sans cela il reste
  // ouvert après un retour à l'accueil.
  useEffect(() => {
    return () => microRef.current?.arreter()
  }, [])

  useEffect(() => {
    setReussi(false)
    debutJusteRef.current = null
  }, [serie.indice, serie.terminee])

  const surMesure = useCallback(
    (nouvelle: MesureHauteur) => {
      setMesure(nouvelle)
      if (reussi) return

      // On accepte la note à l'octave près : un enfant chante souvent une
      // octave au-dessus ou en dessous du piano sans que ce soit une erreur.
      const memeNote = nouvelle.midi !== null && (nouvelle.midi - cible) % 12 === 0
      const juste = memeNote && nouvelle.cents !== null && Math.abs(nouvelle.cents) <= 40

      if (!juste) {
        debutJusteRef.current = null
        return
      }

      // La note doit être tenue : une justesse fugace au passage ne compte pas.
      debutJusteRef.current ??= performance.now()
      if (performance.now() - debutJusteRef.current >= DUREE_TENUE) {
        setReussi(true)
        differer(() => serie.repondre(true), 1600)
      }
    },
    [cible, reussi, serie],
  )

  const demarrer = async () => {
    setErreur(null)
    const micro = new EcouteMicro()
    microRef.current = micro
    try {
      await micro.demarrer(surMesure)
      setEcouteActive(true)
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'Le micro n’est pas accessible.')
    }
  }

  const passer = () => {
    debutJusteRef.current = null
    serie.repondre(false)
  }

  const justesse = decrireJustesse(reussi ? 0 : (mesure?.cents ?? null))
  const couleurs = {
    juste: 'text-menthe-600',
    haut: 'text-peche-600',
    bas: 'text-ciel-600',
    inconnu: 'text-encre-pale',
  }

  return (
    <CadreExercice titre="Le chant" emoji="🎤" serie={serie}>
      <Carte teinte="peche" className="mb-5 text-center">
        <p className="text-encre-clair mb-2">Écoute cette note, puis chante-la !</p>
        <Portee notes={[{ midi: cible, couleur: 'cible' }]} hauteur={150} />
        <p className="font-titre font-bold text-2xl text-peche-700 mb-3">
          {nomFrancais(midiVersNote(cible))}
        </p>
        <Bouton
          teinte="ciel"
          onClick={() => void jouerNote(cible, { duree: 2 })}
          icone={<span aria-hidden="true">▶️</span>}
        >
          Écouter la note
        </Bouton>
      </Carte>

      {!ecouteActive && !erreur && (
        <div className="text-center">
          <Bouton
            teinte="peche"
            taille="grand"
            onClick={demarrer}
            icone={<span aria-hidden="true">🎤</span>}
          >
            Activer le micro
          </Bouton>
          <p className="text-encre-pale text-sm mt-3">
            Ta voix est analysée sur ton appareil. Rien n’est enregistré ni envoyé.
          </p>
        </div>
      )}

      {erreur && (
        <Carte teinte="peche" className="text-center">
          <p className="text-peche-700 font-semibold mb-3">{erreur}</p>
          <Bouton teinte="neutre" onClick={demarrer}>
            Réessayer
          </Bouton>
        </Carte>
      )}

      {ecouteActive && !reussi && (
        <Carte className="text-center">
          {/* Témoin de niveau : montre que le micro capte bien quelque chose. */}
          <div
            className="h-3 w-full rounded-full bg-lavande-100 overflow-hidden mb-4"
            aria-hidden="true"
          >
            <div
              className="h-full bg-menthe-300 transition-[width] duration-75"
              style={{ width: `${(mesure?.niveau ?? 0) * 100}%` }}
            />
          </div>

          <p className={`font-titre font-bold text-3xl ${couleurs[justesse.etat]}`} aria-live="polite">
            {justesse.texte}
          </p>
          {mesure?.midi != null && (
            <p className="text-encre-clair mt-1">
              Tu chantes un <strong>{nomFrancais(midiVersNote(mesure.midi))}</strong>
            </p>
          )}

          <div className="mt-5">
            <Bouton teinte="neutre" taille="petit" onClick={passer}>
              Passer cette note
            </Bouton>
          </div>
        </Carte>
      )}

      {reussi && <Retour juste message="Note trouvée !" detail="Tu l’as tenue bien juste." />}
    </CadreExercice>
  )
}
