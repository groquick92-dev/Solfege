/**
 * Éléments interactifs réutilisés dans les cours.
 */

import { useState } from 'react'
import { jouerMelodie } from '../audio/lecture'
import { VALEURS } from '../music/rythme'
import { Bouton } from '../ui/Bouton'

/** Bouton qui joue un exemple sonore. */
export function BoutonEcoute({
  notes,
  libelle = 'Écouter',
  pas = 0.5,
}: {
  notes: number[]
  libelle?: string
  pas?: number
}) {
  const [enCours, setEnCours] = useState(false)

  const jouer = async () => {
    setEnCours(true)
    try {
      await jouerMelodie(notes, { pas })
      // On laisse le bouton inactif le temps de l'exemple pour éviter les
      // déclenchements superposés, très désagréables à l'oreille.
      await new Promise((r) => setTimeout(r, notes.length * pas * 1000))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="my-4 flex justify-center">
      <Bouton
        teinte="ciel"
        onClick={jouer}
        disabled={enCours}
        icone={<span aria-hidden="true">{enCours ? '🔊' : '▶️'}</span>}
      >
        {enCours ? 'En cours…' : libelle}
      </Bouton>
    </div>
  )
}

/** Tableau récapitulatif des valeurs de notes et de leurs silences. */
export function TableauValeurs() {
  const valeurs = VALEURS.filter((v) => !v.pointee)

  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Valeurs de notes, leur durée en temps et le silence correspondant
        </caption>
        <thead>
          <tr className="bg-lavande-50">
            <th scope="col" className="p-3 font-titre rounded-tl-[var(--radius-doux)]">Note</th>
            <th scope="col" className="p-3 font-titre">Nom</th>
            <th scope="col" className="p-3 font-titre">Durée</th>
            <th scope="col" className="p-3 font-titre rounded-tr-[var(--radius-doux)]">Silence</th>
          </tr>
        </thead>
        <tbody>
          {valeurs.map((v, i) => (
            <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-creme-fonce'}>
              <td className="p-3 text-3xl leading-none" aria-hidden="true">{v.symbole}</td>
              <td className="p-3 font-semibold">{v.nom}</td>
              <td className="p-3">
                {v.temps} temps
              </td>
              <td className="p-3 text-encre-clair">{v.nomSilence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
