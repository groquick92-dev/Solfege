/**
 * Retours visuels : étoiles, progression, encouragements.
 *
 * Le ton des messages est délibérément non culpabilisant. Un enfant qui
 * abandonne parce qu'il se sent mauvais n'apprend plus rien, et l'erreur est
 * ici présentée comme une étape normale — on montre la bonne réponse, on
 * encourage, on continue.
 */

import clsx from 'clsx'
import type { ReactNode } from 'react'

/** Affiche une note sur trois étoiles. */
export function Etoiles({
  nombre,
  total = 3,
  taille = 'moyen',
  anime = false,
}: {
  nombre: number
  total?: number
  taille?: 'petit' | 'moyen' | 'grand'
  anime?: boolean
}) {
  const tailles = { petit: 'text-lg', moyen: 'text-2xl', grand: 'text-4xl' }

  return (
    <span
      className={clsx('inline-flex gap-0.5 sans-selection', tailles[taille])}
      role="img"
      aria-label={`${nombre} étoile${nombre > 1 ? 's' : ''} sur ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={clsx(
            i < nombre ? 'opacity-100' : 'opacity-25 grayscale',
            anime && i < nombre && 'animate-[etoile_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]',
          )}
          style={anime && i < nombre ? { animationDelay: `${i * 0.15}s` } : undefined}
          aria-hidden="true"
        >
          ⭐
        </span>
      ))}
    </span>
  )
}

/** Barre de progression d'une série d'exercices. */
export function BarreProgression({
  valeur,
  total,
  teinte = 'menthe',
  etiquette,
}: {
  valeur: number
  total: number
  teinte?: 'menthe' | 'lavande' | 'ciel' | 'soleil'
  etiquette?: string
}) {
  const pourcentage = total > 0 ? Math.min(100, (valeur / total) * 100) : 0
  const couleurs = {
    menthe: 'bg-menthe-400',
    lavande: 'bg-lavande-400',
    ciel: 'bg-ciel-300',
    soleil: 'bg-soleil-300',
  }

  return (
    <div className="w-full">
      {etiquette && <p className="text-sm text-encre-clair mb-1 font-semibold">{etiquette}</p>}
      <div
        className="h-3.5 w-full rounded-full bg-lavande-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={valeur}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={etiquette ?? 'Progression'}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', couleurs[teinte])}
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Messages d'encouragement.
 *
 * Ils sont tirés au hasard pour éviter la répétition mécanique : entendre
 * « Bravo ! » à l'identique vingt fois de suite perd tout effet.
 */
const MESSAGES_REUSSITE = [
  'Bravo !',
  'Parfait !',
  'Excellent !',
  'Tu assures !',
  'Bien joué !',
  'Super !',
  'Continue comme ça !',
]

const MESSAGES_ERREUR = [
  'Presque !',
  'Pas tout à fait…',
  'Essaie encore !',
  'On regarde ensemble.',
  'Ce n’est pas grave, on continue !',
]

export function messageReussite(): string {
  return MESSAGES_REUSSITE[Math.floor(Math.random() * MESSAGES_REUSSITE.length)]!
}

export function messageErreur(): string {
  return MESSAGES_ERREUR[Math.floor(Math.random() * MESSAGES_ERREUR.length)]!
}

/** Bandeau de retour après une réponse. */
export function Retour({
  juste,
  message,
  detail,
  children,
}: {
  juste: boolean
  message?: string
  detail?: ReactNode
  children?: ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-bulle)] border-2 p-4 animate-[apparition_0.35s_ease-out]',
        juste ? 'bg-menthe-50 border-menthe-300' : 'bg-peche-50 border-peche-300',
      )}
      role="status"
      aria-live="polite"
    >
      <p
        className={clsx(
          'font-titre font-bold text-xl flex items-center gap-2',
          juste ? 'text-menthe-700' : 'text-peche-700',
        )}
      >
        <span aria-hidden="true">{juste ? '🎉' : '🤔'}</span>
        {message ?? (juste ? messageReussite() : messageErreur())}
      </p>
      {detail && <p className="text-encre-clair mt-1">{detail}</p>}
      {children}
    </div>
  )
}

/** Compteur de série quotidienne. */
export function Serie({ jours }: { jours: number }) {
  if (jours === 0) return null

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-peche-100 px-3 py-1.5 font-titre font-bold text-peche-700"
      title={`${jours} jour${jours > 1 ? 's' : ''} d’affilée`}
    >
      <span aria-hidden="true">🔥</span>
      {jours}
      <span className="sr-only">jours d’affilée</span>
    </span>
  )
}

/** Pastille de niveau ou de statut. */
export function Pastille({
  children,
  teinte = 'lavande',
}: {
  children: ReactNode
  teinte?: 'menthe' | 'lavande' | 'ciel' | 'soleil' | 'peche'
}) {
  const couleurs = {
    menthe: 'bg-menthe-100 text-menthe-700',
    lavande: 'bg-lavande-100 text-lavande-700',
    ciel: 'bg-ciel-100 text-ciel-600',
    soleil: 'bg-soleil-100 text-soleil-600',
    peche: 'bg-peche-100 text-peche-700',
  }

  return (
    <span
      className={clsx(
        'inline-block rounded-full px-3 py-1 text-sm font-bold font-titre',
        couleurs[teinte],
      )}
    >
      {children}
    </span>
  )
}
