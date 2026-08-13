import { beforeEach, describe, expect, it, vi } from 'vitest'
import { etoilesPourScore, useProgression } from './progression'

/** Remet le magasin à zéro entre deux tests. */
function reinitialiser() {
  useProgression.setState({
    prenom: '',
    avatar: '🦊',
    resultats: {},
    coursLus: [],
    badges: [],
    bonnesReponses: 0,
    dernierJour: null,
    serie: 0,
  })
}

/** Date locale au format AAAA-MM-JJ, comme le magasin la calcule. */
function jourLocal(decalageEnJours = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + decalageEnJours)
  const compense = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return compense.toISOString().slice(0, 10)
}

beforeEach(reinitialiser)

describe('étoiles', () => {
  it('accorde trois étoiles à partir de 90 %', () => {
    expect(etoilesPourScore(100)).toBe(3)
    expect(etoilesPourScore(90)).toBe(3)
    expect(etoilesPourScore(89)).toBe(2)
  })

  it('accorde deux étoiles à partir de 70 %', () => {
    expect(etoilesPourScore(70)).toBe(2)
    expect(etoilesPourScore(69)).toBe(1)
  })

  it('n’accorde aucune étoile sous 50 %', () => {
    expect(etoilesPourScore(50)).toBe(1)
    expect(etoilesPourScore(49)).toBe(0)
    expect(etoilesPourScore(0)).toBe(0)
  })
})

describe('enregistrement des résultats', () => {
  it('conserve le meilleur score, jamais le dernier', () => {
    const { enregistrerResultat } = useProgression.getState()

    enregistrerResultat('lecture-sol-0', 100)
    enregistrerResultat('lecture-sol-0', 40)

    const resultat = useProgression.getState().resultats['lecture-sol-0']!
    expect(resultat.meilleurScore).toBe(100)
    expect(resultat.etoiles).toBe(3)
    expect(resultat.tentatives).toBe(2)
  })

  it('cumule les bonnes réponses', () => {
    const { enregistrerResultat } = useProgression.getState()
    enregistrerResultat('lecture-sol-0', 80, 8)
    enregistrerResultat('lecture-sol-1', 90, 9)
    expect(useProgression.getState().bonnesReponses).toBe(17)
  })
})

describe('série quotidienne', () => {
  it('démarre à un le premier jour', () => {
    useProgression.getState().enregistrerResultat('lecture-sol-0', 80)
    expect(useProgression.getState().serie).toBe(1)
  })

  it('ne compte pas deux fois le même jour', () => {
    const { enregistrerResultat } = useProgression.getState()
    enregistrerResultat('lecture-sol-0', 80)
    enregistrerResultat('lecture-sol-1', 80)
    expect(useProgression.getState().serie).toBe(1)
  })

  it('s’incrémente après une journée consécutive', () => {
    useProgression.setState({ dernierJour: jourLocal(-1), serie: 4 })
    useProgression.getState().enregistrerResultat('lecture-sol-0', 80)
    expect(useProgression.getState().serie).toBe(5)
  })

  it('repart à un après une interruption', () => {
    useProgression.setState({ dernierJour: jourLocal(-3), serie: 9 })
    useProgression.getState().enregistrerResultat('lecture-sol-0', 80)
    expect(useProgression.getState().serie).toBe(1)
  })
})

describe('badges', () => {
  it('décerne le premier badge dès la première activité', () => {
    useProgression.getState().enregistrerResultat('lecture-sol-0', 60)
    expect(useProgression.getState().badges).toContain('premiere-note')
  })

  it('décerne l’oreille fine sur trois étoiles en intervalles', () => {
    useProgression.getState().enregistrerResultat('intervalles-2', 95)
    expect(useProgression.getState().badges).toContain('oreille-fine')
  })

  it('ne décerne pas l’oreille fine sans les trois étoiles', () => {
    useProgression.getState().enregistrerResultat('intervalles-2', 75)
    expect(useProgression.getState().badges).not.toContain('oreille-fine')
  })

  it('décerne le badge de régularité à trois jours de série', () => {
    useProgression.setState({ dernierJour: jourLocal(-1), serie: 2 })
    useProgression.getState().enregistrerResultat('rythme-0', 60)
    expect(useProgression.getState().badges).toContain('serie-3')
  })

  it('décerne le badge des cent notes', () => {
    useProgression.getState().enregistrerResultat('lecture-sol-0', 100, 100)
    expect(useProgression.getState().badges).toContain('cent-notes')
  })

  it('ne retire jamais un badge déjà obtenu', () => {
    const { enregistrerResultat } = useProgression.getState()
    enregistrerResultat('intervalles-2', 95)
    enregistrerResultat('lecture-sol-0', 10)
    expect(useProgression.getState().badges).toContain('oreille-fine')
  })
})

describe('cours lus', () => {
  it('n’enregistre pas deux fois la même leçon', () => {
    const { marquerCoursLu } = useProgression.getState()
    marquerCoursLu('portee')
    marquerCoursLu('portee')
    expect(useProgression.getState().coursLus).toEqual(['portee'])
  })
})

describe('export et import', () => {
  it('restitue un profil exporté', () => {
    const etat = useProgression.getState()
    etat.definirProfil('Camille', '🐼')
    etat.enregistrerResultat('lecture-sol-0', 95, 10)
    const sauvegarde = useProgression.getState().exporter()

    reinitialiser()
    expect(useProgression.getState().importer(sauvegarde)).toBe(true)

    const restaure = useProgression.getState()
    expect(restaure.prenom).toBe('Camille')
    expect(restaure.avatar).toBe('🐼')
    expect(restaure.resultats['lecture-sol-0']?.etoiles).toBe(3)
    expect(restaure.bonnesReponses).toBe(10)
  })

  it('refuse un fichier illisible sans planter', () => {
    expect(useProgression.getState().importer('ceci nest pas du json')).toBe(false)
  })

  it('refuse un JSON valide mais hors format', () => {
    expect(useProgression.getState().importer('"une chaîne"')).toBe(false)
    expect(useProgression.getState().importer('42')).toBe(false)
  })

  it('ignore les champs d’un type inattendu', () => {
    // Le fichier vient de l'utilisateur : un champ corrompu ne doit pas
    // contaminer l'état avec une valeur inutilisable.
    const importe = useProgression
      .getState()
      .importer(JSON.stringify({ prenom: 42, coursLus: 'nope', badges: [1, 'vrai'], serie: null }))

    expect(importe).toBe(true)
    const etat = useProgression.getState()
    expect(etat.prenom).toBe('')
    expect(etat.coursLus).toEqual([])
    expect(etat.badges).toEqual(['vrai'])
    expect(etat.serie).toBe(0)
  })
})

describe('réinitialisation', () => {
  it('efface la progression mais garde les réglages', () => {
    const etat = useProgression.getState()
    etat.modifierReglages({ volume: 0.3, tempo: 120 })
    etat.enregistrerResultat('lecture-sol-0', 90, 9)

    useProgression.getState().reinitialiser()

    const apres = useProgression.getState()
    expect(apres.resultats).toEqual({})
    expect(apres.bonnesReponses).toBe(0)
    expect(apres.reglages.volume).toBe(0.3)
    expect(apres.reglages.tempo).toBe(120)
  })
})

describe('profil', () => {
  it('tronque un prénom trop long', () => {
    useProgression.getState().definirProfil('a'.repeat(50), '🦊')
    expect(useProgression.getState().prenom).toHaveLength(20)
  })

  it('retire les espaces autour du prénom', () => {
    useProgression.getState().definirProfil('  Léo  ', '🦊')
    expect(useProgression.getState().prenom).toBe('Léo')
  })
})

// Le magasin écrit dans localStorage : on vérifie que jsdom le fournit bien,
// sinon tous les tests ci-dessus passeraient sur un état purement mémoire.
describe('persistance', () => {
  it('écrit dans le stockage local', () => {
    const ecrire = vi.spyOn(Storage.prototype, 'setItem')
    useProgression.getState().enregistrerResultat('lecture-sol-0', 90)
    expect(ecrire).toHaveBeenCalledWith('solfege-progression', expect.stringContaining('lecture-sol-0'))
    ecrire.mockRestore()
  })
})
