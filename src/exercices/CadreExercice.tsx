/**
 * Ossature commune à tous les exercices.
 *
 * Chaque exercice est une série de questions au format identique : une barre
 * de progression, un décompte, puis un bilan étoilé. Centraliser ce cadre
 * garantit qu'un enfant qui a compris le fonctionnement d'un exercice sait
 * d'emblée utiliser tous les autres.
 */

import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bouton } from '../ui/Bouton'
import { Carte, Page } from '../ui/Carte'
import { BarreProgression, Etoiles } from '../ui/Retour'
import { etoilesPourScore, useProgression } from '../store/progression'
import type { ReactNode } from 'react'

export interface EtatSerie {
  /** Indice de la question en cours, à partir de 0. */
  indice: number
  /** Nombre de bonnes réponses. */
  justes: number
  /** La série est-elle terminée ? */
  terminee: boolean
  /** Score final sur 100. */
  score: number
  /** Enregistre une réponse et avance d'une question. */
  repondre: (juste: boolean) => void
  /** Enregistre un score partiel, pour les exercices notés en continu. */
  repondrePartiel: (points: number) => void
  /** Relance la série depuis le début. */
  recommencer: () => void
}

/**
 * Gère le déroulé d'une série.
 *
 * `repondrePartiel` sert aux exercices dont une réponse n'est pas simplement
 * juste ou fausse — un rythme frappé se note en proportion, pas en tout ou
 * rien.
 */
export function useSerie(activiteId: string, total: number): EtatSerie {
  const [indice, setIndice] = useState(0)
  const [points, setPoints] = useState(0)
  const [justes, setJustes] = useState(0)
  const [terminee, setTerminee] = useState(false)
  const enregistrerResultat = useProgression((etat) => etat.enregistrerResultat)

  const avancer = useCallback(
    (gagnes: number, compteJuste: boolean) => {
      const nouveauxPoints = points + gagnes
      const nouveauxJustes = justes + (compteJuste ? 1 : 0)
      setPoints(nouveauxPoints)
      setJustes(nouveauxJustes)

      if (indice + 1 >= total) {
        const score = Math.round((nouveauxPoints / total) * 100)
        enregistrerResultat(activiteId, score, nouveauxJustes)
        setTerminee(true)
      } else {
        setIndice(indice + 1)
      }
    },
    [activiteId, enregistrerResultat, indice, justes, points, total],
  )

  return {
    indice,
    justes,
    terminee,
    score: Math.round((points / total) * 100),
    repondre: useCallback((juste: boolean) => avancer(juste ? 1 : 0, juste), [avancer]),
    repondrePartiel: useCallback(
      (part: number) => avancer(Math.max(0, Math.min(1, part)), part >= 0.7),
      [avancer],
    ),
    recommencer: useCallback(() => {
      setIndice(0)
      setPoints(0)
      setJustes(0)
      setTerminee(false)
    }, []),
  }
}

export function CadreExercice({
  titre,
  emoji,
  serie,
  total,
  children,
}: {
  titre: string
  emoji: string
  serie: EtatSerie
  total: number
  children: ReactNode
}) {
  if (serie.terminee) {
    return <BilanSerie titre={titre} serie={serie} total={total} />
  }

  return (
    <Page>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Link
            to="/"
            className="font-titre font-bold text-encre-clair hover:text-encre flex items-center gap-1"
          >
            <span aria-hidden="true">←</span> Quitter
          </Link>
          <h1 className="font-titre font-bold text-lg text-encre flex items-center gap-2">
            <span aria-hidden="true">{emoji}</span>
            {titre}
          </h1>
        </div>
        <BarreProgression
          valeur={serie.indice}
          total={total}
          etiquette={`Question ${serie.indice + 1} sur ${total}`}
        />
      </div>
      {children}
    </Page>
  )
}

/** Écran de bilan affiché en fin de série. */
function BilanSerie({ titre, serie, total }: { titre: string; serie: EtatSerie; total: number }) {
  const navigate = useNavigate()
  const etoiles = etoilesPourScore(serie.score)

  const message =
    etoiles === 3
      ? 'Parfait ! Tu maîtrises.'
      : etoiles === 2
        ? 'Très bien ! Encore un petit effort pour la troisième étoile.'
        : etoiles === 1
          ? 'C’est un bon début. Recommence pour progresser !'
          : 'Ce n’est pas encore ça. Relis le cours, puis réessaie !'

  return (
    <Page>
      <Carte teinte="menthe" className="text-center py-10 animate-[apparition_0.35s_ease-out]">
        <p className="text-6xl mb-3" aria-hidden="true">
          {etoiles === 3 ? '🏆' : etoiles >= 1 ? '🎉' : '💪'}
        </p>
        <h1 className="text-2xl mb-1">{titre}</h1>
        <p className="text-encre-clair mb-4">
          {serie.justes} bonne{serie.justes > 1 ? 's' : ''} réponse
          {serie.justes > 1 ? 's' : ''} sur {total}
        </p>

        <div className="mb-4">
          <Etoiles nombre={etoiles} taille="grand" anime />
        </div>

        <p className="font-titre text-lg text-menthe-700 mb-6">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Bouton teinte="menthe" onClick={serie.recommencer}>
            Recommencer
          </Bouton>
          <Bouton teinte="neutre" onClick={() => navigate('/')}>
            Retour à l’accueil
          </Bouton>
        </div>
      </Carte>
    </Page>
  )
}
