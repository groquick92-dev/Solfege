/**
 * Cartes, en-têtes et conteneurs de mise en page.
 */

import clsx from 'clsx'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export type TeinteCarte = 'menthe' | 'peche' | 'lavande' | 'ciel' | 'soleil' | 'rose' | 'blanc'

const FONDS: Record<TeinteCarte, string> = {
  menthe: 'bg-menthe-50 border-menthe-200',
  peche: 'bg-peche-50 border-peche-200',
  lavande: 'bg-lavande-50 border-lavande-200',
  ciel: 'bg-ciel-50 border-ciel-200',
  soleil: 'bg-soleil-50 border-soleil-200',
  rose: 'bg-rose-doux-100 border-rose-doux-200',
  blanc: 'bg-white border-lavande-100',
}

export function Carte({
  teinte = 'blanc',
  className,
  children,
}: {
  teinte?: TeinteCarte
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-bulle)] border-2 p-5 ombre-douce',
        FONDS[teinte],
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Carte cliquable menant à une activité. */
export function CarteLien({
  vers,
  teinte = 'blanc',
  className,
  children,
  ...reste
}: {
  vers: string
  teinte?: TeinteCarte
  className?: string
  children: ReactNode
} & { 'aria-label'?: string }) {
  return (
    <Link
      to={vers}
      className={clsx(
        'block rounded-[var(--radius-bulle)] border-2 p-5 ombre-douce',
        'transition-transform duration-150 hover:-translate-y-1 focus-visible:-translate-y-1',
        FONDS[teinte],
        className,
      )}
      {...reste}
    >
      {children}
    </Link>
  )
}

/** Bandeau de titre d'une page. */
export function EnTete({
  titre,
  sousTitre,
  emoji,
  action,
}: {
  titre: string
  sousTitre?: string
  emoji?: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {emoji && (
          <span className="text-4xl sm:text-5xl" aria-hidden="true">
            {emoji}
          </span>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl text-encre">{titre}</h1>
          {sousTitre && <p className="text-encre-clair text-base sm:text-lg">{sousTitre}</p>}
        </div>
      </div>
      {action}
    </header>
  )
}

/** Conteneur centré, largeur de lecture confortable. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={clsx('mx-auto w-full max-w-3xl px-4 py-6 sm:py-8', className)}>
      {children}
    </main>
  )
}

/**
 * Encadré pédagogique.
 *
 * Sert à isoler une astuce ou un point de vigilance du corps du cours. Le
 * pictogramme et la couleur permettent de le repérer sans le lire.
 */
export function Encadre({
  type = 'astuce',
  titre,
  children,
}: {
  type?: 'astuce' | 'attention' | 'ecoute' | 'memo'
  titre?: string
  children: ReactNode
}) {
  const styles = {
    astuce: { fond: 'bg-soleil-50 border-soleil-200', emoji: '💡', defaut: 'Astuce' },
    attention: { fond: 'bg-peche-50 border-peche-200', emoji: '⚠️', defaut: 'Attention' },
    ecoute: { fond: 'bg-ciel-50 border-ciel-200', emoji: '👂', defaut: 'Écoute bien' },
    memo: { fond: 'bg-lavande-50 border-lavande-200', emoji: '📌', defaut: 'À retenir' },
  }[type]

  return (
    <aside className={clsx('rounded-[var(--radius-doux)] border-2 p-4 my-4', styles.fond)}>
      <p className="font-titre font-bold text-encre mb-1 flex items-center gap-2">
        <span aria-hidden="true">{styles.emoji}</span>
        {titre ?? styles.defaut}
      </p>
      <div className="text-encre-clair [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </aside>
  )
}
