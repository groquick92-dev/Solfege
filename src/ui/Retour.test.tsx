import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BarreProgression, Etoiles, Pastille, Retour, Serie } from './Retour'

describe('étoiles', () => {
  it('annonce le score aux lecteurs d’écran', () => {
    render(<Etoiles nombre={2} />)
    expect(screen.getByRole('img', { name: '2 étoiles sur 3' })).toBeInTheDocument()
  })

  it('accorde le singulier', () => {
    render(<Etoiles nombre={1} />)
    expect(screen.getByRole('img', { name: '1 étoile sur 3' })).toBeInTheDocument()
  })

  it('affiche toujours le total, même à zéro', () => {
    const { container } = render(<Etoiles nombre={0} />)
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(3)
  })

  it('accepte un total différent de trois', () => {
    render(<Etoiles nombre={3} total={5} />)
    expect(screen.getByRole('img', { name: '3 étoiles sur 5' })).toBeInTheDocument()
  })
})

describe('barre de progression', () => {
  it('expose les attributs ARIA attendus', () => {
    render(<BarreProgression valeur={3} total={10} etiquette="Question 4 sur 10" />)
    const barre = screen.getByRole('progressbar', { name: 'Question 4 sur 10' })

    expect(barre).toHaveAttribute('aria-valuenow', '3')
    expect(barre).toHaveAttribute('aria-valuemin', '0')
    expect(barre).toHaveAttribute('aria-valuemax', '10')
  })

  it('reste valide avec un total nul', () => {
    // Cas limite : une série vide ne doit pas produire de division par zéro.
    render(<BarreProgression valeur={0} total={0} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('porte une étiquette par défaut sans libellé fourni', () => {
    render(<BarreProgression valeur={1} total={2} />)
    expect(screen.getByRole('progressbar', { name: 'Progression' })).toBeInTheDocument()
  })
})

describe('retour de réponse', () => {
  it('annonce le résultat sans voler le focus', () => {
    render(<Retour juste message="Bravo !" />)
    const zone = screen.getByRole('status')

    expect(zone).toHaveAttribute('aria-live', 'polite')
    expect(zone).toHaveTextContent('Bravo !')
  })

  it('affiche le détail de la correction', () => {
    render(<Retour juste={false} message="Presque !" detail="C’était un sol." />)
    expect(screen.getByRole('status')).toHaveTextContent('C’était un sol.')
  })
})

describe('série quotidienne', () => {
  it('n’affiche rien à zéro jour', () => {
    const { container } = render(<Serie jours={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche le décompte au-delà', () => {
    render(<Serie jours={5} />)
    expect(screen.getByTitle('5 jours d’affilée')).toHaveTextContent('5')
  })

  it('accorde le singulier', () => {
    render(<Serie jours={1} />)
    expect(screen.getByTitle('1 jour d’affilée')).toBeInTheDocument()
  })
})

describe('pastille', () => {
  it('affiche son contenu', () => {
    render(<Pastille>3 min</Pastille>)
    expect(screen.getByText('3 min')).toBeInTheDocument()
  })
})
