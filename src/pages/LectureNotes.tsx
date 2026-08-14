/**
 * Exercice de lecture de notes.
 *
 * Une note s'affiche sur la portée, l'enfant choisit son nom. La note est
 * jouée à chaque réponse : associer systématiquement le signe écrit au son
 * réel est ce qui distingue la lecture musicale du simple décodage visuel.
 *
 * Le tirage est pondéré par la maîtrise : une note qui résiste revient plus
 * souvent qu'une note acquise.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CadreExercice, useDelai, useSerie } from '../exercices/CadreExercice'
import { usePoidsNotes } from '../exercices/useAdaptatif'
import { Portee } from '../notation/Portee'
import { BoutonReponse } from '../ui/Bouton'
import { Carte } from '../ui/Carte'
import { Retour } from '../ui/Retour'
import { genererLectureNote } from '../music/generateurs'
import { type Cle, nomFrancaisComplet } from '../music/theory'
import { jouerNote } from '../audio/lecture'
import { QUESTIONS_PAR_SERIE } from '../content/programme'
import { cleNote, useProgression } from '../store/progression'

export default function LectureNotes() {
  const { cle: cleParam, palier: palierParam } = useParams()
  const cle: Cle = cleParam === 'fa' ? 'fa' : 'sol'
  const palier = Number.parseInt(palierParam ?? '0', 10) || 0

  const aideNoms = useProgression((etat) => etat.reglages.aideNoms)
  const poids = usePoidsNotes(cle)

  const generer = useCallback(
    () => genererLectureNote(palier, cle, Math.random, 4, poids),
    [palier, cle, poids],
  )

  const serie = useSerie(`lecture-${cle}-${palier}`, QUESTIONS_PAR_SERIE, generer, {
    cleMaitrise: (question) => cleNote(cle, question.midi),
  })

  const question = serie.question
  const differer = useDelai()
  const [choix, setChoix] = useState<string | null>(null)

  // Une nouvelle question efface la réponse précédente.
  useEffect(() => setChoix(null), [serie.indice, serie.terminee])

  const repondre = (proposition: string) => {
    if (choix !== null) return // une seule réponse par question
    setChoix(proposition)

    const juste = proposition === question.reponse
    void jouerNote(question.midi, { velocite: juste ? 85 : 65 })

    // Un temps d'arrêt laisse à l'enfant le temps de voir la correction et
    // d'entendre la note avant que l'écran ne change.
    differer(
      () =>
        serie.repondre(juste, {
          attendue: question.reponse,
          donnee: proposition,
          notes: [question.midi],
          cle,
        }),
      juste ? 850 : 1900,
    )
  }

  const juste = choix === question.reponse

  return (
    <CadreExercice titre={`Lecture — clé de ${cle}`} emoji={cle === 'sol' ? '🎼' : '🔑'} serie={serie}>
      <Carte className="mb-5">
        <p className="text-center text-encre-clair mb-2">Quelle est cette note ?</p>
        <Portee
          notes={[{ midi: question.midi, couleur: choix === null ? 'neutre' : 'cible' }]}
          cle={cle}
          hauteur={170}
        />
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
