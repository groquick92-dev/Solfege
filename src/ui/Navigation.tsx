/**
 * Barre de navigation principale, fixée en bas de l'écran.
 *
 * Le bas de l'écran est le seul endroit atteignable au pouce sur un téléphone
 * comme sur une tablette tenue à deux mains. Quatre entrées au maximum : au
 * delà, les cibles deviennent trop étroites pour un doigt d'enfant.
 */

import clsx from 'clsx'
import { NavLink } from 'react-router-dom'

const ENTREES = [
  { vers: '/', libelle: 'Accueil', emoji: '🏠' },
  { vers: '/cours', libelle: 'Cours', emoji: '📚' },
  { vers: '/piano', libelle: 'Piano', emoji: '🎹' },
  { vers: '/profil', libelle: 'Moi', emoji: '⭐' },
]

export function Navigation() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 border-t-2 border-lavande-100 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigation principale"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ENTREES.map((entree) => (
          <li key={entree.vers} className="flex-1">
            <NavLink
              to={entree.vers}
              end={entree.vers === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors sans-selection',
                  'font-titre font-bold text-sm',
                  isActive ? 'text-lavande-600' : 'text-encre-pale hover:text-encre-clair',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx('text-2xl leading-none transition-transform', isActive && 'scale-110')}
                    aria-hidden="true"
                  >
                    {entree.emoji}
                  </span>
                  {entree.libelle}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
