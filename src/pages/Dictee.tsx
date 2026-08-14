/**
 * Dictée mélodique : écouter une mélodie et la reconstituer.
 *
 * L'enfant construit sa réponse note à note et peut effacer la dernière —
 * corriger fait partie du travail de dictée, et interdire le retour en
 * arrière transformerait l'exercice en piège.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CadreExercice, useSerie } from '../exercices/CadreExercice'
import { Bouton, BoutonReponse } from '../ui/Bouton'
import { Carte } from '../ui/Carte'
import { Retour } from '../ui/Retour'
import { Portee, type NoteAffichee } from '../notation/Portee'
import { genererMelodie } from '../music/generateurs'
import { jouerMelodie, jouerNote } from '../audio/lecture'
import { midiVersNote, nomFrancais } from '../music/theory'

/** Cinq dictées par série : chacune demande plusieurs écoutes. */
const DICTEES_PAR_SERIE = 5

export default function Dictee() {
  const { palier: palierParam } = useParams()
  const palier = Number.parseInt(palierParam ?? '0', 10) || 0
  const longueur = palier === 0 ? 3 : palier === 1 ? 5 : 6

  const generer = useCallback(() => genererMelodie(longueur, palier), [longueur, palier])
  const serie = useSerie(`dictee-${palier}`, DICTEES_PAR_SERIE, generer)

  const question = serie.question
  const [saisie, setSaisie] = useState<number[]>([])
  const [validee, setValidee] = useState(false)
  const [ecoute, setEcoute] = useState(false)

  const jouer = useCallback(async (melodie: number[]) => {
    setEcoute(true)
    await jouerMelodie(melodie, { pas: 0.65 })
    window.setTimeout(() => setEcoute(false), melodie.length * 650 + 300)
  }, [])

  useEffect(() => {
    setSaisie([])
    setValidee(false)
    if (!serie.terminee) void jouer(question.notes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serie.indice, serie.terminee])

  const ajouter = (midi: number) => {
    if (validee || saisie.length >= question.notes.length) return
    setSaisie([...saisie, midi])
    void jouerNote(midi, { duree: 0.7 })
  }

  const effacer = () => {
    if (validee) return
    setSaisie(saisie.slice(0, -1))
  }

  const valider = () => {
    setValidee(true)
    const justes = saisie.filter((midi, i) => midi === question.notes[i]).length
    const part = justes / question.notes.length

    // La dictée est notée en proportion : retrouver quatre notes sur cinq est
    // un vrai résultat, qu'un tout-ou-rien effacerait.
    window.setTimeout(
      () =>
        serie.repondrePartiel(part, {
          attendue: question.notes.map((m) => nomFrancais(midiVersNote(m))).join(' '),
          donnee: saisie.map((m) => nomFrancais(midiVersNote(m))).join(' '),
          notes: question.notes,
        }),
      3000,
    )
  }

  const complete = saisie.length === question.notes.length
  const toutJuste = validee && saisie.every((midi, i) => midi === question.notes[i])

  const notesAffichees: NoteAffichee[] = validee
    ? question.notes.map((midi, i) => ({ midi, couleur: saisie[i] === midi ? 'juste' : 'faux' }))
    : saisie.map((midi) => ({ midi, couleur: 'neutre' }))

  return (
    <CadreExercice titre="La dictée" emoji="✏️" serie={serie}>
      <Carte teinte="peche" className="mb-5 text-center">
        <p className="text-encre-clair mb-3">
          Écoute la mélodie, puis retrouve les {question.notes.length} notes.
        </p>
        <Bouton
          teinte="ciel"
          onClick={() => jouer(question.notes)}
          disabled={ecoute}
          icone={<span aria-hidden="true">{ecoute ? '🔊' : '▶️'}</span>}
        >
          {ecoute ? 'Écoute…' : 'Réécouter'}
        </Bouton>
      </Carte>

      <Carte className="mb-5">
        {notesAffichees.length > 0 ? (
          <Portee notes={notesAffichees} hauteur={160} ligatures={false} />
        ) : (
          <p className="text-center text-encre-pale py-10 font-titre">
            Choisis les notes que tu entends…
          </p>
        )}
        <p className="text-center text-sm text-encre-clair mt-1">
          {saisie.length} / {question.notes.length} notes placées
        </p>
      </Carte>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
        {question.palette.map((midi) => (
          <BoutonReponse
            key={midi}
            onClick={() => ajouter(midi)}
            disabled={validee || complete}
            className="!text-lg !px-2 !py-3"
          >
            {nomFrancais(midiVersNote(midi))}
          </BoutonReponse>
        ))}
      </div>

      {!validee && (
        <div className="flex gap-3 justify-center">
          <Bouton teinte="neutre" onClick={effacer} disabled={saisie.length === 0}>
            ← Effacer
          </Bouton>
          <Bouton teinte="menthe" onClick={valider} disabled={!complete}>
            Valider
          </Bouton>
        </div>
      )}

      {validee && (
        <Retour
          juste={toutJuste}
          detail={
            toutJuste
              ? 'Toutes les notes sont justes !'
              : `${saisie.filter((m, i) => m === question.notes[i]).length} note(s) juste(s) sur ${question.notes.length}. Les notes en vert étaient bonnes.`
          }
        />
      )}
    </CadreExercice>
  )
}
