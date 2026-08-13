/**
 * Reconnaissance d'intervalles à l'oreille.
 *
 * L'intervalle est joué mélodiquement puis harmoniquement, et peut être
 * réécouté autant de fois que voulu. Limiter les réécoutes n'apprend rien à
 * ce stade : l'objectif est de construire un repère, pas d'évaluer.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CadreExercice, useSerie } from '../exercices/CadreExercice'
import { BoutonReponse, Bouton } from '../ui/Bouton'
import { Carte } from '../ui/Carte'
import { Retour } from '../ui/Retour'
import { Portee } from '../notation/Portee'
import { type QuestionIntervalle, genererIntervalle } from '../music/generateurs'
import { jouerIntervalle } from '../audio/lecture'
import { QUESTIONS_PAR_SERIE } from '../content/programme'

export default function Oreille() {
  const { palier: palierParam } = useParams()
  const palier = Number.parseInt(palierParam ?? '0', 10) || 0

  const serie = useSerie(`intervalles-${palier}`, QUESTIONS_PAR_SERIE)
  const [question, setQuestion] = useState<QuestionIntervalle>(() => genererIntervalle(palier))
  const [choix, setChoix] = useState<string | null>(null)
  const [ecoute, setEcoute] = useState(false)

  const jouer = useCallback(async (q: QuestionIntervalle) => {
    setEcoute(true)
    await jouerIntervalle(q.depart, q.arrivee)
    window.setTimeout(() => setEcoute(false), 2200)
  }, [])

  useEffect(() => {
    const suivante = genererIntervalle(palier)
    setQuestion(suivante)
    setChoix(null)
    // La première écoute est déclenchée automatiquement : c'est la consigne
    // même de l'exercice, l'enfant n'a pas à la demander.
    void jouer(suivante)
  }, [serie.indice, palier, jouer])

  const repondre = (nom: string) => {
    if (choix !== null) return
    setChoix(nom)
    const juste = nom === question.intervalle.nom
    window.setTimeout(() => serie.repondre(juste), juste ? 1000 : 2400)
  }

  const juste = choix === question.intervalle.nom

  return (
    <CadreExercice titre="L’oreille" emoji="👂" serie={serie} total={QUESTIONS_PAR_SERIE}>
      <Carte teinte="soleil" className="mb-5 text-center">
        <p className="text-encre-clair mb-3">Quel est cet intervalle ?</p>
        <Bouton
          teinte="ciel"
          taille="grand"
          onClick={() => jouer(question)}
          disabled={ecoute}
          icone={<span aria-hidden="true">{ecoute ? '🔊' : '▶️'}</span>}
        >
          {ecoute ? 'Écoute…' : 'Réécouter'}
        </Bouton>

        {choix !== null && (
          <div className="mt-4">
            <Portee
              notes={[
                { midi: question.depart, couleur: 'cible' },
                { midi: question.arrivee, couleur: 'cible' },
              ]}
              hauteur={150}
            />
          </div>
        )}
      </Carte>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {question.propositions.map((intervalle) => (
          <BoutonReponse
            key={intervalle.nom}
            etat={
              choix === null
                ? 'attente'
                : intervalle.nom === question.intervalle.nom
                  ? choix === intervalle.nom
                    ? 'juste'
                    : 'solution'
                  : choix === intervalle.nom
                    ? 'faux'
                    : 'attente'
            }
            onClick={() => repondre(intervalle.nom)}
            disabled={choix !== null}
          >
            {intervalle.nom}
          </BoutonReponse>
        ))}
      </div>

      {choix !== null && (
        <div className="mt-5">
          <Retour
            juste={juste}
            detail={
              <>
                C’était une <strong>{question.intervalle.nom}</strong> — pense à{' '}
                {question.intervalle.repere}.
              </>
            }
          />
        </div>
      )}
    </CadreExercice>
  )
}
