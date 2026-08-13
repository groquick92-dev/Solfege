/**
 * Boutons de l'application.
 *
 * Le relief porté par une ombre basse plutôt que par un dégradé donne un
 * repère visuel immédiat de ce qui est cliquable, et l'enfoncement au clic
 * fournit un retour tactile net — deux points qui comptent beaucoup pour un
 * enfant qui ne lit pas encore finement les affordances d'une interface.
 */

import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type TeinteBouton = 'menthe' | 'peche' | 'lavande' | 'ciel' | 'soleil' | 'neutre'
export type TailleBouton = 'petit' | 'moyen' | 'grand'

const TEINTES: Record<TeinteBouton, string> = {
  menthe: 'bg-menthe-400 hover:bg-menthe-300 text-white shadow-[0_4px_0_0_var(--color-menthe-600)]',
  peche: 'bg-peche-300 hover:bg-peche-200 text-[#7a3418] shadow-[0_4px_0_0_var(--color-peche-500)]',
  lavande:
    'bg-lavande-400 hover:bg-lavande-300 text-white shadow-[0_4px_0_0_var(--color-lavande-600)]',
  ciel: 'bg-ciel-300 hover:bg-ciel-200 text-[#17505f] shadow-[0_4px_0_0_var(--color-ciel-500)]',
  soleil:
    'bg-soleil-300 hover:bg-soleil-200 text-[#6b4a05] shadow-[0_4px_0_0_var(--color-soleil-500)]',
  neutre:
    'bg-white hover:bg-creme-fonce text-encre border-2 border-[color:var(--color-lavande-100)] shadow-[0_4px_0_0_var(--color-lavande-100)]',
}

const TAILLES: Record<TailleBouton, string> = {
  petit: 'px-4 py-2 text-base rounded-[var(--radius-doux)]',
  moyen: 'px-6 py-3 text-lg rounded-[var(--radius-bulle)]',
  grand: 'px-8 py-4 text-xl rounded-[var(--radius-galet)]',
}

export interface ProprietesBouton extends ButtonHTMLAttributes<HTMLButtonElement> {
  teinte?: TeinteBouton
  taille?: TailleBouton
  /** Occupe toute la largeur disponible. */
  pleineLargeur?: boolean
  /** Pictogramme placé avant le libellé. */
  icone?: ReactNode
}

export function Bouton({
  teinte = 'menthe',
  taille = 'moyen',
  pleineLargeur = false,
  icone,
  className,
  children,
  disabled,
  ...reste
}: ProprietesBouton) {
  return (
    <button
      className={clsx(
        'font-titre font-bold inline-flex items-center justify-center gap-2',
        'transition-all duration-100 ease-out sans-selection',
        // L'enfoncement remplace l'ombre : le bouton « descend » sous le doigt.
        'active:translate-y-[3px] active:shadow-none',
        TEINTES[teinte],
        TAILLES[taille],
        pleineLargeur && 'w-full',
        disabled && 'opacity-45 pointer-events-none saturate-50',
        className,
      )}
      disabled={disabled}
      {...reste}
    >
      {icone}
      {children}
    </button>
  )
}

/**
 * Bouton de réponse d'un exercice.
 *
 * Il se distingue du bouton courant par son état : après validation il vire au
 * vert ou à l'orangé, et la bonne réponse reste toujours visible même quand
 * l'enfant s'est trompé — voir la solution est plus formateur que subir
 * l'échec seul.
 */
export interface ProprietesReponse extends ButtonHTMLAttributes<HTMLButtonElement> {
  etat?: 'attente' | 'juste' | 'faux' | 'solution'
}

const ETATS_REPONSE: Record<NonNullable<ProprietesReponse['etat']>, string> = {
  attente:
    'bg-white text-encre border-[color:var(--color-lavande-100)] shadow-[0_4px_0_0_var(--color-lavande-100)] hover:border-[color:var(--color-lavande-300)] hover:-translate-y-0.5',
  juste:
    'bg-menthe-100 text-menthe-700 border-menthe-400 shadow-[0_4px_0_0_var(--color-menthe-400)] animate-[rebond-doux_0.5s_ease-out]',
  faux: 'bg-peche-100 text-peche-700 border-peche-400 shadow-[0_4px_0_0_var(--color-peche-400)] animate-[tremblement_0.4s_ease-in-out]',
  solution: 'bg-menthe-50 text-menthe-700 border-menthe-300 border-dashed shadow-none',
}

export function BoutonReponse({
  etat = 'attente',
  className,
  children,
  ...reste
}: ProprietesReponse) {
  return (
    <button
      className={clsx(
        'font-titre font-bold text-xl px-5 py-4 min-h-[3.5rem]',
        'rounded-[var(--radius-bulle)] border-2 transition-all duration-150 sans-selection',
        'active:translate-y-[3px] active:shadow-none',
        ETATS_REPONSE[etat],
        className,
      )}
      {...reste}
    >
      {children}
    </button>
  )
}
