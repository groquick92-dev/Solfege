/**
 * Ossature commune à tous les exercices.
 *
 * Le hook `useSerie` orchestre tout le déroulé : génération des questions,
 * décompte, collecte des erreurs, enregistrement de la progression et rejeu
 * des questions ratées. Les écrans d'exercice n'ont plus qu'à décrire *une*
 * question et à dire si la réponse est juste.
 *
 * Centraliser ainsi garantit qu'un enfant qui a compris un exercice sait
 * d'emblée utiliser tous les autres — et que la revue des erreurs, la mesure
 * du temps et le suivi de maîtrise fonctionnent partout sans être réécrits.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bouton } from '../ui/Bouton'
import { Carte, Page } from '../ui/Carte'
import { BarreProgression, Etoiles } from '../ui/Retour'
import { Portee } from '../notation/Portee'
import { type CleMaitrise, etoilesPourScore, useProgression } from '../store/progression'
import type { Cle } from '../music/theory'
import type { ReactNode } from 'react'

/** Ce que l'écran d'exercice retient d'une réponse fausse. */
export interface DetailErreur {
  /** Ce qu'il fallait répondre. */
  attendue: string
  /** Ce que l'enfant a répondu ; absent s'il n'a rien proposé. */
  donnee?: string
  /** Notes à redessiner sur une portée dans le bilan. */
  notes?: number[]
  /** Clé de la portée du bilan. */
  cle?: Cle
  /** Aide mémorielle rappelée avec la correction. */
  repere?: string
}

export interface Erreur<Q> extends DetailErreur {
  question: Q
}

export interface EtatSerie<Q> {
  /** Question en cours. */
  question: Q
  /** Indice de la question, à partir de 0. */
  indice: number
  /** Nombre de questions de la série en cours. */
  total: number
  /** Nombre de bonnes réponses. */
  justes: number
  terminee: boolean
  /** Score final sur 100. */
  score: number
  /** Questions ratées, dans l'ordre. */
  erreurs: Erreur<Q>[]
  /** La série en cours est-elle une reprise des erreurs ? */
  modeRevision: boolean
  /** Enregistre une réponse et avance d'une question. */
  repondre: (juste: boolean, detail?: DetailErreur) => void
  /** Enregistre un score partiel, pour les réponses qui ne sont pas binaires. */
  repondrePartiel: (points: number, detail?: DetailErreur) => void
  /** Relance une série neuve. */
  recommencer: () => void
  /** Relance une série composée uniquement des questions ratées. */
  rejouerErreurs: () => void
}

export interface OptionsSerie<Q> {
  /** Élément de maîtrise travaillé par une question, pour le suivi fin. */
  cleMaitrise?: (question: Q) => CleMaitrise
}

/**
 * Programme une action différée, annulée si l'écran est quitté entre-temps.
 *
 * Les exercices marquent une pause avant de passer à la question suivante,
 * pour laisser voir la correction. Sans annulation, un enfant qui appuie sur
 * « Quitter » pendant cette pause verrait quand même sa réponse comptée et le
 * résultat enregistré, une fois l'écran déjà refermé.
 */
export function useDelai() {
  const minuteurs = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const minuteur of minuteurs.current) window.clearTimeout(minuteur)
      minuteurs.current = []
    },
    [],
  )

  return useMemo(
    () => (action: () => void, millisecondes: number) => {
      minuteurs.current.push(window.setTimeout(action, millisecondes))
    },
    [],
  )
}

/**
 * Chronomètre qui se fige quand l'onglet passe en arrière-plan.
 *
 * Sans cela, une tablette laissée ouverte toute la nuit compterait huit
 * heures de travail et rendrait le bilan destiné aux parents inutilisable.
 */
function useTempsActif() {
  const cumul = useRef(0)
  const depuis = useRef<number | null>(null)

  useEffect(() => {
    // Le décompte démarre au montage, et seulement si l'onglet est visible :
    // un exercice ouvert dans un onglet d'arrière-plan ne compte pas.
    depuis.current = document.hidden ? null : Date.now()

    const surChangement = () => {
      if (document.hidden) {
        if (depuis.current !== null) {
          cumul.current += Date.now() - depuis.current
          depuis.current = null
        }
      } else {
        depuis.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', surChangement)
    return () => document.removeEventListener('visibilitychange', surChangement)
  }, [])

  return useMemo(
    () => ({
      /** Secondes actives écoulées depuis la dernière remise à zéro. */
      lire: () =>
        (cumul.current + (depuis.current === null ? 0 : Date.now() - depuis.current)) / 1000,
      reinitialiser: () => {
        cumul.current = 0
        depuis.current = document.hidden ? null : Date.now()
      },
    }),
    [],
  )
}

/**
 * Gère le déroulé d'une série.
 *
 * `repondrePartiel` sert aux exercices dont une réponse n'est pas simplement
 * juste ou fausse — un rythme frappé se note en proportion, pas en tout ou
 * rien.
 */
export function useSerie<Q>(
  activiteId: string,
  totalDemande: number,
  generer: () => Q,
  options: OptionsSerie<Q> = {},
): EtatSerie<Q> {
  const enregistrerResultat = useProgression((etat) => etat.enregistrerResultat)
  const enregistrerReponses = useProgression((etat) => etat.enregistrerReponses)

  // `generer` et `cleMaitrise` sont redéfinis à chaque rendu par les écrans.
  // Les garder dans une référence évite de relancer la série à chaque frappe.
  const genererRef = useRef(generer)
  genererRef.current = generer
  const cleMaitriseRef = useRef(options.cleMaitrise)
  cleMaitriseRef.current = options.cleMaitrise

  const [question, setQuestion] = useState<Q>(() => generer())
  const [indice, setIndice] = useState(0)
  const [points, setPoints] = useState(0)
  const [justes, setJustes] = useState(0)
  const [terminee, setTerminee] = useState(false)
  const [erreurs, setErreurs] = useState<Erreur<Q>[]>([])
  const [fileRevision, setFileRevision] = useState<Q[] | null>(null)

  const chrono = useTempsActif()
  const reponses = useRef<{ cle: CleMaitrise; juste: boolean }[]>([])

  const total = fileRevision?.length ?? totalDemande

  const avancer = useCallback(
    (gagnes: number, compteJuste: boolean, detail?: DetailErreur) => {
      const nouveauxPoints = points + gagnes
      const nouveauxJustes = justes + (compteJuste ? 1 : 0)

      const cle = cleMaitriseRef.current?.(question)
      if (cle) reponses.current.push({ cle, juste: compteJuste })

      const nouvellesErreurs = compteJuste
        ? erreurs
        : [...erreurs, { question, ...(detail ?? { attendue: '' }) }]

      setPoints(nouveauxPoints)
      setJustes(nouveauxJustes)
      setErreurs(nouvellesErreurs)

      if (indice + 1 >= total) {
        const score = Math.round((nouveauxPoints / total) * 100)
        const secondes = chrono.lire()

        // Une reprise d'erreurs n'écrase pas le résultat de l'activité : elle
        // porte sur une poignée de questions choisies, et gonflerait
        // artificiellement le score. Seule la maîtrise fine en tient compte.
        if (!fileRevision) {
          enregistrerResultat(activiteId, score, nouveauxJustes, secondes)
        }
        enregistrerReponses(reponses.current)
        reponses.current = []
        setTerminee(true)
        return
      }

      const suivante = fileRevision ? fileRevision[indice + 1]! : genererRef.current()
      setQuestion(suivante)
      setIndice(indice + 1)
    },
    [
      activiteId,
      chrono,
      enregistrerResultat,
      enregistrerReponses,
      erreurs,
      fileRevision,
      indice,
      justes,
      points,
      question,
      total,
    ],
  )

  const relancer = useCallback(
    (file: Q[] | null) => {
      setFileRevision(file)
      setQuestion(file ? file[0]! : genererRef.current())
      setIndice(0)
      setPoints(0)
      setJustes(0)
      setErreurs([])
      setTerminee(false)
      reponses.current = []
      chrono.reinitialiser()
    },
    [chrono],
  )

  return {
    question,
    indice,
    total,
    justes,
    terminee,
    score: Math.round((points / total) * 100),
    erreurs,
    modeRevision: fileRevision !== null,
    repondre: useCallback(
      (juste: boolean, detail?: DetailErreur) => avancer(juste ? 1 : 0, juste, detail),
      [avancer],
    ),
    repondrePartiel: useCallback(
      (part: number, detail?: DetailErreur) =>
        avancer(Math.max(0, Math.min(1, part)), part >= 0.7, detail),
      [avancer],
    ),
    recommencer: useCallback(() => relancer(null), [relancer]),
    rejouerErreurs: useCallback(() => {
      if (erreurs.length > 0) relancer(erreurs.map((e) => e.question))
    }, [erreurs, relancer]),
  }
}

export function CadreExercice<Q>({
  titre,
  emoji,
  serie,
  children,
}: {
  titre: string
  emoji: string
  serie: EtatSerie<Q>
  children: ReactNode
}) {
  if (serie.terminee) {
    return <BilanSerie titre={titre} serie={serie} />
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
            {serie.modeRevision && (
              <span className="text-sm font-normal text-lavande-600">— reprise</span>
            )}
          </h1>
        </div>
        <BarreProgression
          valeur={serie.indice}
          total={serie.total}
          teinte={serie.modeRevision ? 'lavande' : 'menthe'}
          etiquette={`Question ${serie.indice + 1} sur ${serie.total}`}
        />
      </div>
      {children}
    </Page>
  )
}

/** Écran de bilan affiché en fin de série. */
function BilanSerie<Q>({ titre, serie }: { titre: string; serie: EtatSerie<Q> }) {
  const navigate = useNavigate()
  const etoiles = etoilesPourScore(serie.score)

  const message = serie.modeRevision
    ? serie.erreurs.length === 0
      ? 'Cette fois, tout est juste !'
      : 'Ça vient. Retente ces questions !'
    : etoiles === 3
      ? 'Parfait ! Tu maîtrises.'
      : etoiles === 2
        ? 'Très bien ! Encore un petit effort pour la troisième étoile.'
        : etoiles === 1
          ? 'C’est un bon début. Recommence pour progresser !'
          : 'Ce n’est pas encore ça. Relis le cours, puis réessaie !'

  return (
    <Page>
      <Carte teinte="menthe" className="text-center py-8 animate-[apparition_0.35s_ease-out]">
        <p className="text-6xl mb-3" aria-hidden="true">
          {etoiles === 3 ? '🏆' : etoiles >= 1 ? '🎉' : '💪'}
        </p>
        <h1 className="text-2xl mb-1">{titre}</h1>
        <p className="text-encre-clair mb-4">
          {serie.justes} bonne{serie.justes > 1 ? 's' : ''} réponse
          {serie.justes > 1 ? 's' : ''} sur {serie.total}
        </p>

        {/* Une reprise ne rapporte pas d'étoiles : elle sert à réparer, pas à noter. */}
        {!serie.modeRevision && (
          <div className="mb-4">
            <Etoiles nombre={etoiles} taille="grand" anime />
          </div>
        )}

        <p className="font-titre text-lg text-menthe-700">{message}</p>
      </Carte>

      {serie.erreurs.length > 0 && <RevueErreurs erreurs={serie.erreurs} />}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        {serie.erreurs.length > 0 && (
          <Bouton teinte="lavande" onClick={serie.rejouerErreurs}>
            Rejouer mes erreurs ({serie.erreurs.length})
          </Bouton>
        )}
        <Bouton teinte="menthe" onClick={serie.recommencer}>
          {serie.modeRevision ? 'Nouvelle série' : 'Recommencer'}
        </Bouton>
        <Bouton teinte="neutre" onClick={() => navigate('/')}>
          Accueil
        </Bouton>
      </div>
    </Page>
  )
}

/**
 * Liste des questions ratées.
 *
 * Sans cet écran, l'enfant apprend qu'il a fait « 6 sur 10 » mais jamais
 * lesquelles — l'erreur passe et rien ne la rattrape. La revoir en portée,
 * avec la bonne réponse à côté, est le moment où l'exercice devient
 * formateur.
 */
function RevueErreurs<Q>({ erreurs }: { erreurs: Erreur<Q>[] }) {
  // Une même note ratée cinq fois produisait cinq cartes identiques : la liste
  // devenait illisible alors qu'elle ne portait qu'une seule information.
  const groupes = regrouperErreurs(erreurs)

  return (
    <section className="mt-6" aria-labelledby="titre-revue">
      <h2 id="titre-revue" className="text-xl mb-3 flex items-center gap-2">
        <span aria-hidden="true">🔍</span> À revoir
      </h2>

      <ul className="grid gap-3">
        {groupes.map((groupe) => (
          <li key={groupe.cleGroupe}>
            <Carte teinte="peche">
              {groupe.erreur.notes && groupe.erreur.notes.length > 0 && (
                <Portee
                  notes={groupe.erreur.notes.map((midi) => ({ midi, couleur: 'cible' }))}
                  cle={groupe.erreur.cle ?? 'sol'}
                  hauteur={120}
                  ligatures={false}
                />
              )}
              <p className="text-center">
                <span className="font-titre font-bold text-menthe-700 text-lg">
                  {groupe.erreur.attendue}
                </span>
                {groupe.reponsesDonnees.length > 0 && (
                  <span className="text-encre-clair">
                    {' '}
                    — tu avais répondu <strong>{groupe.reponsesDonnees.join(', ')}</strong>
                  </span>
                )}
              </p>
              {groupe.occurrences > 1 && (
                <p className="text-center text-sm font-semibold text-peche-700 mt-1">
                  Raté {groupe.occurrences} fois
                </p>
              )}
              {groupe.erreur.repere && (
                <p className="text-center text-sm text-encre-clair mt-1">
                  💡 {groupe.erreur.repere}
                </p>
              )}
            </Carte>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface GroupeErreur<Q> {
  cleGroupe: string
  erreur: Erreur<Q>
  occurrences: number
  /** Réponses distinctes proposées, dans l'ordre de première apparition. */
  reponsesDonnees: string[]
}

/** Regroupe les erreurs portant sur la même réponse attendue. */
function regrouperErreurs<Q>(erreurs: Erreur<Q>[]): GroupeErreur<Q>[] {
  const groupes = new Map<string, GroupeErreur<Q>>()

  for (const erreur of erreurs) {
    // Les notes entrent dans la clé : deux « do » d'octaves différentes sont
    // deux difficultés distinctes, malgré un même nom de note.
    const cleGroupe = `${erreur.attendue}|${erreur.notes?.join(',') ?? ''}`
    const existant = groupes.get(cleGroupe)

    if (!existant) {
      groupes.set(cleGroupe, {
        cleGroupe,
        erreur,
        occurrences: 1,
        reponsesDonnees: erreur.donnee ? [erreur.donnee] : [],
      })
      continue
    }

    existant.occurrences++
    if (erreur.donnee && !existant.reponsesDonnees.includes(erreur.donnee)) {
      existant.reponsesDonnees.push(erreur.donnee)
    }
  }

  return [...groupes.values()].sort((a, b) => b.occurrences - a.occurrences)
}

