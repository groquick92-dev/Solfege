import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleIntervalle,
  cleNote,
  etoilesPourScore,
  poidsMaitrise,
  pointsFaibles,
  tauxReussite,
  tempsTotalPasse,
  useProgression,
} from './progression'
import { MODULES } from '../content/programme'

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
    maitrise: {},
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

  it('n’accorde « As de la clé de sol » qu’une fois tout le module à trois étoiles', () => {
    const activites = MODULES.find((m) => m.id === 'lecture-sol')!.activites
    expect(activites.length).toBeGreaterThan(1)

    const { enregistrerResultat } = useProgression.getState()

    // Toutes les activités sauf la dernière, parfaitement réussies.
    for (const activite of activites.slice(0, -1)) {
      enregistrerResultat(activite.id, 100)
    }
    expect(useProgression.getState().badges).not.toContain('lecteur-sol')

    enregistrerResultat(activites.at(-1)!.id, 100)
    expect(useProgression.getState().badges).toContain('lecteur-sol')
  })

  it('n’accorde pas « As de la clé de sol » sur une seule activité réussie', () => {
    // Le défaut historique : `every` sur les seules activités jouées était
    // vrai dès la première, et décernait le badge beaucoup trop tôt.
    useProgression.getState().enregistrerResultat('lecture-sol-0', 100)
    expect(useProgression.getState().badges).not.toContain('lecteur-sol')
  })

  it('ne retire jamais un badge déjà obtenu', () => {
    const { enregistrerResultat } = useProgression.getState()
    enregistrerResultat('intervalles-2', 95)
    enregistrerResultat('lecture-sol-0', 10)
    expect(useProgression.getState().badges).toContain('oreille-fine')
  })
})

describe('maîtrise par élément', () => {
  it('construit des clés lisibles et distinctes', () => {
    expect(cleNote('sol', 64)).toBe('lecture-sol:64')
    expect(cleNote('fa', 53)).toBe('lecture-fa:53')
    expect(cleNote('sol', 64)).not.toBe(cleNote('fa', 64))
    expect(cleIntervalle('quinte')).toBe('intervalle:quinte')
  })

  it('cumule vues et erreurs', () => {
    const { enregistrerReponses } = useProgression.getState()
    enregistrerReponses([
      { cle: cleNote('sol', 64), juste: true },
      { cle: cleNote('sol', 64), juste: false },
      { cle: cleNote('sol', 67), juste: true },
    ])

    const maitrise = useProgression.getState().maitrise
    expect(maitrise['lecture-sol:64']).toMatchObject({ vues: 2, erreurs: 1 })
    expect(maitrise['lecture-sol:67']).toMatchObject({ vues: 1, erreurs: 0 })
  })

  it('accumule d’une série à l’autre', () => {
    const { enregistrerReponses } = useProgression.getState()
    enregistrerReponses([{ cle: cleNote('sol', 64), juste: false }])
    enregistrerReponses([{ cle: cleNote('sol', 64), juste: false }])
    expect(useProgression.getState().maitrise['lecture-sol:64']).toMatchObject({
      vues: 2,
      erreurs: 2,
    })
  })

  it('ignore une liste vide sans écrire', () => {
    useProgression.getState().enregistrerReponses([])
    expect(useProgression.getState().maitrise).toEqual({})
  })

  it('calcule le taux de réussite', () => {
    expect(tauxReussite({ vues: 10, erreurs: 2, derniereFois: '' })).toBe(80)
    expect(tauxReussite({ vues: 0, erreurs: 0, derniereFois: '' })).toBeNull()
    expect(tauxReussite(undefined)).toBeNull()
  })
})

describe('poids de tirage', () => {
  it('donne un poids intermédiaire à un élément jamais vu', () => {
    expect(poidsMaitrise(undefined)).toBe(1.5)
  })

  it('pèse plus lourd quand l’élément résiste', () => {
    const acquis = poidsMaitrise({ vues: 10, erreurs: 0, derniereFois: '' })
    const fragile = poidsMaitrise({ vues: 10, erreurs: 5, derniereFois: '' })
    const rate = poidsMaitrise({ vues: 10, erreurs: 10, derniereFois: '' })

    expect(acquis).toBeLessThan(fragile)
    expect(fragile).toBeLessThan(rate)
  })

  it('ne descend jamais à zéro, même parfaitement acquis', () => {
    // Un élément qui ne reviendrait plus jamais finirait par être oublié.
    expect(poidsMaitrise({ vues: 50, erreurs: 0, derniereFois: '' })).toBeGreaterThan(0)
  })
})

describe('points faibles', () => {
  const maitrise = {
    'lecture-sol:64': { vues: 10, erreurs: 6, derniereFois: '' }, // 40 %
    'lecture-sol:67': { vues: 10, erreurs: 3, derniereFois: '' }, // 70 %
    'lecture-sol:71': { vues: 10, erreurs: 0, derniereFois: '' }, // 100 %
    'lecture-sol:72': { vues: 1, erreurs: 1, derniereFois: '' }, // trop peu vu
  }

  it('classe du plus fragile au moins fragile', () => {
    const faibles = pointsFaibles(maitrise)
    expect(faibles.map((f) => f.cle)).toEqual(['lecture-sol:64', 'lecture-sol:67'])
  })

  it('écarte les éléments trop peu rencontrés', () => {
    // Une note vue une seule fois et ratée ne prouve rien.
    expect(pointsFaibles(maitrise).map((f) => f.cle)).not.toContain('lecture-sol:72')
  })

  it('écarte les éléments acquis', () => {
    expect(pointsFaibles(maitrise).map((f) => f.cle)).not.toContain('lecture-sol:71')
  })

  it('respecte la limite demandée', () => {
    expect(pointsFaibles(maitrise, { limite: 1 })).toHaveLength(1)
  })
})

describe('temps passé', () => {
  it('cumule le temps par activité', () => {
    const { enregistrerResultat } = useProgression.getState()
    enregistrerResultat('lecture-sol-0', 90, 9, 120)
    enregistrerResultat('lecture-sol-0', 80, 8, 90)
    enregistrerResultat('rythme-0', 70, 3, 60)

    const resultats = useProgression.getState().resultats
    expect(resultats['lecture-sol-0']?.tempsTotal).toBe(210)
    expect(tempsTotalPasse(resultats)).toBe(270)
  })

  it('ignore une durée négative', () => {
    useProgression.getState().enregistrerResultat('lecture-sol-0', 90, 9, -50)
    expect(useProgression.getState().resultats['lecture-sol-0']?.tempsTotal).toBe(0)
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
