/**
 * Affichage d'une leçon.
 */

import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { COURS, coursParId } from '../content/cours'
import { useProgression } from '../store/progression'
import { Carte, Page } from '../ui/Carte'
import { BoutonLien } from '../ui/Bouton'

export default function PageCours() {
  const { id } = useParams()
  const cours = id ? coursParId(id) : undefined
  const marquerCoursLu = useProgression((etat) => etat.marquerCoursLu)

  // La leçon est marquée lue à l'ouverture. Exiger un défilement complet
  // pénaliserait l'enfant qui revient consulter un point précis.
  useEffect(() => {
    if (cours) marquerCoursLu(cours.id)
  }, [cours, marquerCoursLu])

  if (!cours) return <Navigate to="/cours" replace />

  const indice = COURS.findIndex((c) => c.id === cours.id)
  const precedent = indice > 0 ? COURS[indice - 1] : null
  const suivant = indice < COURS.length - 1 ? COURS[indice + 1] : null

  return (
    <Page>
      <Link
        to="/cours"
        className="font-titre font-bold text-encre-clair hover:text-encre inline-flex items-center gap-1 mb-4"
      >
        <span aria-hidden="true">←</span> Tous les cours
      </Link>

      <article>
        <header className="mb-6">
          <span className="text-5xl block mb-2" aria-hidden="true">
            {cours.emoji}
          </span>
          <h1 className="text-3xl mb-1">{cours.titre}</h1>
          <p className="text-encre-clair">{cours.resume}</p>
        </header>

        <Carte className="[&_p]:mb-3 [&_p:last-child]:mb-0 text-lg leading-relaxed">
          {cours.contenu}
        </Carte>
      </article>

      <nav className="flex justify-between gap-3 mt-6" aria-label="Navigation entre les leçons">
        {precedent ? (
          <BoutonLien vers={`/cours/${precedent.id}`} teinte="neutre" taille="petit">
            ← {precedent.titre}
          </BoutonLien>
        ) : (
          <span />
        )}
        {suivant && (
          <BoutonLien vers={`/cours/${suivant.id}`} teinte="lavande" taille="petit">
            {suivant.titre} →
          </BoutonLien>
        )}
      </nav>
    </Page>
  )
}
