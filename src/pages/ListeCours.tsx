/**
 * Sommaire des cours.
 */

import { COURS } from '../content/cours'
import { useProgression } from '../store/progression'
import { CarteLien, EnTete, Page } from '../ui/Carte'
import { BarreProgression, Pastille } from '../ui/Retour'

export default function ListeCours() {
  const coursLus = useProgression((etat) => etat.coursLus)

  return (
    <Page>
      <EnTete titre="Les cours" sousTitre="Comprendre avant de jouer" emoji="📚" />

      <div className="mb-6">
        <BarreProgression
          valeur={coursLus.length}
          total={COURS.length}
          teinte="lavande"
          etiquette="Leçons lues"
        />
      </div>

      <ol className="grid gap-3">
        {COURS.map((cours, index) => {
          const lu = coursLus.includes(cours.id)
          return (
            <li key={cours.id}>
              <CarteLien vers={`/cours/${cours.id}`} teinte={lu ? 'menthe' : 'lavande'}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl shrink-0" aria-hidden="true">
                    {cours.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-titre font-bold text-lg flex items-center gap-2">
                      <span className="text-encre-pale text-base">{index + 1}.</span>
                      {cours.titre}
                      {lu && (
                        <span className="text-menthe-600" aria-label="Leçon lue">
                          ✓
                        </span>
                      )}
                    </p>
                    <p className="text-encre-clair text-sm">{cours.resume}</p>
                  </div>
                  <Pastille teinte={lu ? 'menthe' : 'lavande'}>{cours.duree} min</Pastille>
                </div>
              </CarteLien>
            </li>
          )
        })}
      </ol>
    </Page>
  )
}
