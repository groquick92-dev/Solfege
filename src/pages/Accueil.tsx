/**
 * Écran d'accueil : le parcours complet, module par module.
 */

import { MODULES, activiteDebloquee } from '../content/programme'
import { COURS } from '../content/cours'
import { useProgression, useTotalEtoiles } from '../store/progression'
import { Carte, CarteLien, Page } from '../ui/Carte'
import { Etoiles, Pastille, Serie } from '../ui/Retour'
import { BoutonLien } from '../ui/Bouton'

export default function Accueil() {
  const { prenom, avatar, resultats, coursLus, serie } = useProgression()
  const totalEtoiles = useTotalEtoiles()

  return (
    <Page>
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <span className="text-5xl" aria-hidden="true">
              {avatar}
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl">
                {prenom ? `Salut ${prenom} !` : 'Bienvenue !'}
              </h1>
              <p className="text-encre-clair">Prêt à faire de la musique ?</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Serie jours={serie} />
            <span className="inline-flex items-center gap-1 font-titre font-bold text-soleil-600">
              <span aria-hidden="true">⭐</span>
              {totalEtoiles}
            </span>
          </div>
        </div>

        {!prenom && (
          <Carte teinte="soleil" className="mt-4">
            <p className="mb-3">
              Dis-moi comment tu t’appelles, et choisis ton animal préféré !
            </p>
            <BoutonLien vers="/profil" teinte="soleil" taille="petit">
              Créer mon profil
            </BoutonLien>
          </Carte>
        )}
      </header>

      {/* Les cours sont un module à part : ils ne se jouent pas, ils se lisent. */}
      <section className="mb-8" aria-labelledby="titre-cours">
        <h2 id="titre-cours" className="text-xl mb-3 flex items-center gap-2">
          <span aria-hidden="true">📚</span> Les cours
        </h2>
        <CarteLien vers="/cours" teinte="lavande">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-titre font-bold text-lg">Comprendre le solfège</p>
              <p className="text-encre-clair text-sm">
                {COURS.length} leçons illustrées, avec des exemples à écouter.
              </p>
            </div>
            <Pastille teinte="lavande">
              {coursLus.length}/{COURS.length}
            </Pastille>
          </div>
        </CarteLien>
      </section>

      {MODULES.filter((m) => m.activites.length > 0).map((module) => (
        <section key={module.id} className="mb-8" aria-labelledby={`titre-${module.id}`}>
          <h2 id={`titre-${module.id}`} className="text-xl mb-1 flex items-center gap-2">
            <span aria-hidden="true">{module.emoji}</span> {module.titre}
          </h2>
          <p className="text-encre-clair text-sm mb-3">{module.sousTitre}</p>

          <ul className="grid gap-3 sm:grid-cols-2">
            {module.activites.map((activite) => {
              const resultat = resultats[activite.id]
              const debloquee = activiteDebloquee(activite, resultats)

              if (!debloquee) {
                return (
                  <li key={activite.id}>
                    <div
                      className="rounded-[var(--radius-bulle)] border-2 border-dashed border-lavande-100 bg-creme-fonce p-5 opacity-70"
                      aria-label={`${activite.titre} — verrouillé`}
                    >
                      <p className="font-titre font-bold text-lg text-encre-pale flex items-center gap-2">
                        <span aria-hidden="true">🔒</span> {activite.titre}
                      </p>
                      <p className="text-encre-pale text-sm">
                        Termine l’activité précédente pour débloquer.
                      </p>
                    </div>
                  </li>
                )
              }

              return (
                <li key={activite.id}>
                  <CarteLien
                    vers={activite.chemin}
                    teinte={module.teinte}
                    aria-label={`${activite.titre} — ${resultat?.etoiles ?? 0} étoiles sur 3`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-titre font-bold text-lg">{activite.titre}</p>
                      <Etoiles nombre={resultat?.etoiles ?? 0} taille="petit" />
                    </div>
                    <p className="text-encre-clair text-sm">{activite.description}</p>
                  </CarteLien>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </Page>
  )
}
