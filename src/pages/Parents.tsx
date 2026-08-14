/**
 * Espace parent.
 *
 * Volontairement hors du parcours de l'enfant : il n'apparaît pas dans la
 * barre de navigation, seulement en bas de son profil. Un enfant de huit ans
 * n'a rien à gagner à lire chaque jour la liste de ses points faibles, et le
 * ton employé ici — factuel, chiffré — n'est pas celui du reste de
 * l'application.
 *
 * Le but est de répondre à trois questions concrètes : est-ce qu'il pratique
 * régulièrement, qu'est-ce qui coince, et que faire cette semaine.
 */

import { Link } from 'react-router-dom'
import { decrireCleMaitrise } from '../exercices/useAdaptatif'
import { MODULES, TOUTES_ACTIVITES, activiteDebloquee } from '../content/programme'
import { COURS } from '../content/cours'
import { pointsFaibles, tempsTotalPasse, useProgression } from '../store/progression'
import { Carte, EnTete, Page } from '../ui/Carte'
import { BarreProgression, Pastille } from '../ui/Retour'

export default function Parents() {
  const { resultats, maitrise, coursLus, bonnesReponses, serie, prenom } = useProgression()

  const faibles = pointsFaibles(maitrise)
  const secondes = tempsTotalPasse(resultats)
  const activitesJouees = Object.keys(resultats).length
  const troisEtoiles = Object.values(resultats).filter((r) => r.etoiles === 3).length

  return (
    <Page>
      <EnTete
        titre="Espace parent"
        sousTitre={prenom ? `Suivi de ${prenom}` : 'Suivi de la progression'}
        emoji="👋"
      />

      <Carte teinte="lavande" className="mb-5">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <Statistique libelle="Temps de pratique" valeur={formaterDuree(secondes)} />
          <Statistique libelle="Bonnes réponses" valeur={String(bonnesReponses)} />
          <Statistique
            libelle="Activités maîtrisées"
            valeur={`${troisEtoiles}/${TOUTES_ACTIVITES.length}`}
          />
          <Statistique libelle="Jours d’affilée" valeur={serie > 0 ? String(serie) : '—'} />
        </dl>
      </Carte>

      {activitesJouees === 0 ? (
        <Carte teinte="soleil">
          <p>
            Aucune activité n’a encore été faite. Les statistiques apparaîtront dès la première
            série terminée.
          </p>
        </Carte>
      ) : (
        <>
          <section className="mb-6" aria-labelledby="titre-faiblesses">
            <h2 id="titre-faiblesses" className="text-xl mb-3 flex items-center gap-2">
              <span aria-hidden="true">🎯</span> Ce qui coince
            </h2>

            {faibles.length === 0 ? (
              <Carte teinte="menthe">
                <p>
                  Rien à signaler pour l’instant : aucune note ni intervalle ne descend sous 80 %
                  de réussite.
                </p>
                <p className="text-sm text-encre-clair mt-2">
                  Un élément n’est retenu ici qu’après trois rencontres au moins — une note vue
                  une seule fois et ratée ne veut statistiquement rien dire.
                </p>
              </Carte>
            ) : (
              <Carte>
                <p className="text-encre-clair text-sm mb-3">
                  Classé du plus fragile au moins fragile. Ces éléments sont déjà proposés plus
                  souvent que les autres pendant les exercices.
                </p>
                <ul className="grid gap-2">
                  {faibles.map((point) => (
                    <li
                      key={point.cle}
                      className="flex items-center justify-between gap-3 py-2 border-b border-lavande-100 last:border-0"
                    >
                      <span className="font-semibold">{decrireCleMaitrise(point.cle)}</span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="text-sm text-encre-pale">
                          {point.maitrise.vues} essais
                        </span>
                        <Pastille teinte={point.taux < 50 ? 'peche' : 'soleil'}>
                          {point.taux} %
                        </Pastille>
                      </span>
                    </li>
                  ))}
                </ul>
              </Carte>
            )}
          </section>

          <section className="mb-6" aria-labelledby="titre-conseils">
            <h2 id="titre-conseils" className="text-xl mb-3 flex items-center gap-2">
              <span aria-hidden="true">💡</span> À travailler cette semaine
            </h2>
            <Carte teinte="soleil">
              <ul className="grid gap-2 list-disc pl-5">
                {conseils({ resultats, coursLus, faiblesses: faibles.length, serie }).map(
                  (conseil, i) => (
                    <li key={i}>{conseil}</li>
                  ),
                )}
              </ul>
            </Carte>
          </section>

          <section className="mb-6" aria-labelledby="titre-detail">
            <h2 id="titre-detail" className="text-xl mb-3 flex items-center gap-2">
              <span aria-hidden="true">📊</span> Détail par module
            </h2>

            <div className="grid gap-3">
              {MODULES.filter((m) => m.activites.length > 0).map((module) => {
                const faites = module.activites.filter((a) => resultats[a.id])
                const acquises = module.activites.filter((a) => resultats[a.id]?.etoiles === 3)

                return (
                  <Carte key={module.id}>
                    <p className="font-titre font-bold mb-2 flex items-center gap-2">
                      <span aria-hidden="true">{module.emoji}</span>
                      {module.titre}
                    </p>
                    <BarreProgression
                      valeur={acquises.length}
                      total={module.activites.length}
                      etiquette={`${acquises.length} activité(s) maîtrisée(s) sur ${module.activites.length}`}
                    />
                    {faites.length > 0 && (
                      <p className="text-sm text-encre-clair mt-2">
                        Réussite moyenne :{' '}
                        {Math.round(
                          faites.reduce((s, a) => s + (resultats[a.id]?.meilleurScore ?? 0), 0) /
                            faites.length,
                        )}{' '}
                        %
                      </p>
                    )}
                  </Carte>
                )
              })}
            </div>
          </section>
        </>
      )}

      <Carte teinte="ciel">
        <h2 className="text-lg mb-2">Comment lire ces chiffres</h2>
        <p className="text-encre-clair text-sm mb-2">
          Le <strong>temps de pratique</strong> ne compte que les périodes où l’application est au
          premier plan : une tablette laissée ouverte n’ajoute rien.
        </p>
        <p className="text-encre-clair text-sm mb-2">
          Une activité est dite <strong>maîtrisée</strong> à trois étoiles, soit 90 % de réussite
          au moins. Deux étoiles suffisent pour progresser dans le parcours.
        </p>
        <p className="text-encre-clair text-sm">
          Toutes ces données restent dans ce navigateur et ne sont jamais transmises. La sauvegarde
          se fait depuis <Link to="/profil" className="underline font-semibold">le profil</Link>.
        </p>
      </Carte>
    </Page>
  )
}

function Statistique({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div>
      <dt className="text-sm text-encre-clair">{libelle}</dt>
      <dd className="font-titre font-bold text-2xl text-lavande-700">{valeur}</dd>
    </div>
  )
}

/** Met en forme une durée en secondes, sans jamais afficher « 0 min ». */
function formaterDuree(secondes: number): string {
  if (secondes < 60) return 'moins d’1 min'
  const minutes = Math.round(secondes / 60)
  if (minutes < 60) return `${minutes} min`
  const heures = Math.floor(minutes / 60)
  const reste = minutes % 60
  return reste === 0 ? `${heures} h` : `${heures} h ${reste}`
}

/**
 * Conseils déduits de l'état réel de la progression.
 *
 * Trois au maximum : une liste longue n'est pas lue, et les priorités
 * s'annulent entre elles.
 */
function conseils({
  resultats,
  coursLus,
  faiblesses,
  serie,
}: {
  resultats: Record<string, { etoiles: number }>
  coursLus: string[]
  faiblesses: number
  serie: number
}): string[] {
  const liste: string[] = []

  if (faiblesses > 0) {
    liste.push(
      'Utilisez « Rejouer mes erreurs » à la fin de chaque série : c’est le moment où la correction porte le plus.',
    )
  }

  const coursRestants = COURS.filter((c) => !coursLus.includes(c.id))
  if (coursRestants.length > 0) {
    liste.push(
      `Lire la leçon « ${coursRestants[0]!.titre} » — ${coursRestants.length} cours pas encore ouverts.`,
    )
  }

  const suivante = TOUTES_ACTIVITES.find(
    (a) => activiteDebloquee(a, resultats) && !resultats[a.id],
  )
  if (suivante) {
    liste.push(`Prochaine activité à découvrir : « ${suivante.titre} ».`)
  }

  if (serie === 0) {
    liste.push('Une séance courte chaque jour vaut mieux qu’une longue le week-end.')
  }

  return liste.slice(0, 3)
}
