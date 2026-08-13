/**
 * Exercice de lecture de notes.
 *
 * Une note s'affiche sur la portée, l'enfant choisit son nom. La note est
 * jouée à chaque réponse : associer systématiquement le signe écrit au son
 * réel est ce qui distingue la lecture musicale du simple décodage visuel.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CadreExercice, useSerie } from '../exercices/CadreExercice'
import { Portee } from '../notation/Portee'
import { BoutonReponse } from '../ui/Bouton'
import { Carte } from '../ui/Carte'
import { Retour } from '../ui/Retour'
import { type QuestionLecture, genererLectureNote } from '../music/generateurs'
import { type Cle, nomFrancaisComplet } from '../music/theory'
import { jouerNote } from '../audio/lecture'
import { QUESTIONS_PAR_SERIE } from '../content/programme'
import { useProgression } from '../store/progression'

export default function LectureNotes() {
  const { cle: cleParam, palier: palierParam } = useParams()
  const cle: Cle = cleParam === 'fa' ? 'fa' : 'sol'
  const palier = Number.parseInt(palierParam ?? '0', 10) || 0

  const activiteId = `lecture-${cle}-${palier}`
  const serie = useSerie(activiteId, QUESTIONS_PAR_SERIE)
  const aideNoms = useProgression((etat) => etat.reglages.aideNoms)

  const [question, setQuestion] = useState<QuestionLecture>(() =>
    genererLectureNote(palier, cle),
  )
  const [choix, setChoix] = useState<string | null>(null)

  const nouvelleQuestion = useCallback(() => {
    setQuestion(genererLectureNote(palier, cle))
    setChoix(null)
  }, [cle, palier])

  // Une nouvelle question à chaque avancée dans la série.
  useEffect(() => {
    nouvelleQuestion()
  }, [serie.indice, nouvelleQuestion])

  const repondre = (proposition: string) => {
    if (choix !== null) return // une seule réponse par question
    setChoix(proposition)

    const juste = proposition === question.reponse
    void jouerNote(question.midi, { velocite: juste ? 85 : 65 })

    // Un temps d'arrêt laisse à l'enfant le temps de voir la correction et
    // d'entendre la note avant que l'écran ne change.
    window.setTimeout(() => serie.repondre(juste), juste ? 850 : 1900)
  }

  const notesAffichees = useMemo(
    () => [{ midi: question.midi, couleur: choix === null ? ('neutre' as const) : ('cible' as const) }],
    [question.midi, choix],
  )

  const juste = choix === question.reponse

  return (
    <CadreExercice
      titre={`Lecture — clé de ${cle}`}
      emoji={cle === 'sol' ? '🎼' : '🔑'}
      serie={serie}
      total={QUESTIONS_PAR_SERIE}
    >
      <Carte className="mb-5">
        <p className="text-center text-encre-clair mb-2">Quelle est cette note ?</p>
        <Portee notes={notesAffichees} cle={cle} hauteur={170} />
        {aideNoms && choix !== null && (
          <p className="text-center font-titre font-bold text-lavande-600 mt-2">
            {nomFrancaisComplet(question.note)}
          </p>
        )}
      </Carte>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {question.propositions.map((proposition) => (
          <BoutonReponse
            key={proposition}
            etat={
              choix === null
                ? 'attente'
                : proposition === question.reponse
                  ? choix === proposition
                    ? 'juste'
                    : 'solution'
                  : choix === proposition
                    ? 'faux'
                    : 'attente'
            }
            onClick={() => repondre(proposition)}
            disabled={choix !== null}
          >
            {proposition}
          </BoutonReponse>
        ))}
      </div>

      {choix !== null && (
        <div className="mt-5">
          <Retour
            juste={juste}
            detail={
              juste ? undefined : (
                <>
                  C’était un <strong>{question.reponse}</strong>.
                </>
              )
            }
          />
        </div>
      )}
    </CadreExercice>
  )
}
