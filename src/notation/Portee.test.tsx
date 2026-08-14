import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Portee } from './Portee'

/**
 * VexFlow dessine dans le DOM et mesure ses glyphes : jsdom suffit pour
 * vérifier la structure produite (nombre de portées, barres de mesure,
 * étiquette d'accessibilité), pas le rendu visuel exact.
 *
 * Ces tests couvrent précisément les défauts trouvés tardivement à la main :
 * les notes collées au bord et les barres de mesure absentes.
 */

describe('rendu de la portée', () => {
  it('produit un SVG', () => {
    const { container } = render(<Portee notes={[{ midi: 60 }]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('décrit son contenu aux lecteurs d’écran', () => {
    const { container } = render(<Portee notes={[{ midi: 60 }, { midi: 64 }]} />)
    const svg = container.querySelector('svg')!

    expect(svg).toHaveAttribute('role', 'img')
    expect(svg.getAttribute('aria-label')).toContain('do')
    expect(svg.getAttribute('aria-label')).toContain('mi')
  })

  it('accepte une description explicite', () => {
    const { container } = render(
      <Portee notes={[{ midi: 60 }]} description="Le do du milieu" />,
    )
    expect(container.querySelector('svg')).toHaveAttribute('aria-label', 'Le do du milieu')
  })

  it('mentionne la clé travaillée', () => {
    const { container } = render(<Portee notes={[{ midi: 53 }]} cle="fa" />)
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain('clé de fa')
  })

  it('nomme les silences', () => {
    const { container } = render(<Portee notes={[{ duree: 'noire', silence: true }]} />)
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain('silence')
  })

  it('nomme les altérations', () => {
    const { container } = render(<Portee notes={[{ midi: 61 }]} />)
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain('dièse')
  })

  it('ne dessine rien sans note', () => {
    const { container } = render(<Portee notes={[]} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('redessine entièrement quand les notes changent', () => {
    // Le composant vide son conteneur avant chaque rendu : sans cela les
    // portées s'empileraient à chaque question.
    const { container, rerender } = render(<Portee notes={[{ midi: 60 }]} />)
    rerender(<Portee notes={[{ midi: 64 }]} />)
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })
})

describe('barres de mesure', () => {
  /** Compte les traits verticaux susceptibles d'être des barres de mesure. */
  function compterBarres(container: HTMLElement): number {
    return container.querySelectorAll('rect, path').length
  }

  it('n’en ajoute aucune sans nombre de temps par mesure', () => {
    const sans = render(
      <Portee notes={[{ midi: 60 }, { midi: 62 }, { midi: 64 }, { midi: 65 }]} />,
    )
    const avec = render(
      <Portee
        notes={[{ midi: 60 }, { midi: 62 }, { midi: 64 }, { midi: 65 }]}
        tempsParMesure={2}
      />,
    )

    // Deux mesures de deux temps ajoutent une barre intermédiaire : le rendu
    // avec découpage contient donc davantage d'éléments graphiques.
    expect(compterBarres(avec.container)).toBeGreaterThan(compterBarres(sans.container))
  })

  it('supporte un nombre de temps qui ne tombe pas juste', () => {
    // Trois noires dans des mesures de deux temps : la dernière est
    // incomplète et ne doit pas faire échouer le rendu.
    const { container } = render(
      <Portee notes={[{ midi: 60 }, { midi: 62 }, { midi: 64 }]} tempsParMesure={2} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('gère les durées fractionnaires sans dériver', () => {
    const croches = Array.from({ length: 8 }, () => ({ midi: 67, duree: 'croche' }))
    const { container } = render(<Portee notes={croches} tempsParMesure={4} mesure="4/4" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('chiffrage de mesure', () => {
  it('accepte un chiffrage sans planter', () => {
    const { container } = render(
      <Portee notes={[{ midi: 60, duree: 'ronde' }]} mesure="4/4" tempsParMesure={4} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
