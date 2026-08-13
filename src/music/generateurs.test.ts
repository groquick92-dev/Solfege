import { describe, expect, it } from 'vitest'
import {
  PALIERS_INTERVALLES,
  PALIERS_LECTURE,
  aleaAvecGraine,
  entierEntre,
  evaluerFrappes,
  genererIntervalle,
  genererLectureNote,
  genererMelodie,
  genererRythme,
  melanger,
  scoreFrappes,
} from './generateurs'
import { MESURES, developperCellules, frappes, tempsParMesure } from './rythme'

describe('tirage aléatoire', () => {
  it('rend la même série pour une même graine', () => {
    const a = aleaAvecGraine(42)
    const b = aleaAvecGraine(42)
    const serieA = Array.from({ length: 20 }, a)
    const serieB = Array.from({ length: 20 }, b)
    expect(serieA).toEqual(serieB)
  })

  it('reste dans [0, 1[', () => {
    const alea = aleaAvecGraine(7)
    for (let i = 0; i < 500; i++) {
      const v = alea()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('tire des entiers dans les bornes demandées, incluses', () => {
    const alea = aleaAvecGraine(3)
    const vus = new Set<number>()
    for (let i = 0; i < 300; i++) vus.add(entierEntre(-2, 2, alea))
    expect([...vus].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2])
  })

  it('conserve tous les éléments en mélangeant', () => {
    const source = [1, 2, 3, 4, 5, 6]
    const melange = melanger(source, aleaAvecGraine(9))
    expect([...melange].sort((a, b) => a - b)).toEqual(source)
    expect(source).toEqual([1, 2, 3, 4, 5, 6]) // l'original n'est pas modifié
  })
})

describe('lecture de notes', () => {
  it('tire une note du palier demandé', () => {
    const alea = aleaAvecGraine(1)
    for (let i = 0; i < 50; i++) {
      const q = genererLectureNote(1, 'sol', alea)
      expect(PALIERS_LECTURE.sol[1]).toContain(q.midi)
    }
  })

  it('inclut toujours la bonne réponse parmi les propositions', () => {
    const alea = aleaAvecGraine(2)
    for (let i = 0; i < 50; i++) {
      const q = genererLectureNote(3, 'sol', alea)
      expect(q.propositions).toContain(q.reponse)
    }
  })

  it('ne propose jamais deux fois la même réponse', () => {
    const alea = aleaAvecGraine(4)
    for (let i = 0; i < 50; i++) {
      const q = genererLectureNote(4, 'fa', alea)
      expect(new Set(q.propositions).size).toBe(q.propositions.length)
    }
  })

  it('reste dans le palier le plus large si l’indice dépasse', () => {
    const q = genererLectureNote(99, 'sol', aleaAvecGraine(5))
    expect(PALIERS_LECTURE.sol.at(-1)).toContain(q.midi)
  })

  it('travaille un ambitus grave en clé de fa', () => {
    const alea = aleaAvecGraine(6)
    for (let i = 0; i < 30; i++) {
      const q = genererLectureNote(2, 'fa', alea)
      expect(q.midi).toBeLessThanOrEqual(60)
    }
  })
})

describe('intervalles', () => {
  it('respecte l’écart annoncé entre les deux notes', () => {
    const alea = aleaAvecGraine(11)
    for (let i = 0; i < 60; i++) {
      const q = genererIntervalle(4, alea, 'les-deux')
      expect(Math.abs(q.arrivee - q.depart)).toBe(q.intervalle.demiTons)
    }
  })

  it('ne descend jamais quand seul le sens montant est autorisé', () => {
    const alea = aleaAvecGraine(12)
    for (let i = 0; i < 40; i++) {
      const q = genererIntervalle(3, alea, 'montant')
      expect(q.sens).toBe('montant')
      expect(q.arrivee).toBeGreaterThanOrEqual(q.depart)
    }
  })

  it('n’utilise que les intervalles du palier', () => {
    const alea = aleaAvecGraine(13)
    for (let i = 0; i < 40; i++) {
      const q = genererIntervalle(1, alea)
      expect(PALIERS_INTERVALLES[1]).toContain(q.intervalle.nom)
    }
  })

  it('propose la bonne réponse parmi les choix', () => {
    const alea = aleaAvecGraine(14)
    for (let i = 0; i < 40; i++) {
      const q = genererIntervalle(2, alea)
      expect(q.propositions.map((p) => p.nom)).toContain(q.intervalle.nom)
    }
  })
})

describe('dictée mélodique', () => {
  it('produit la longueur demandée', () => {
    const alea = aleaAvecGraine(21)
    for (const longueur of [4, 5, 6, 8]) {
      expect(genererMelodie(longueur, 2, alea).notes).toHaveLength(longueur)
    }
  })

  it('commence et finit sur la tonique', () => {
    const alea = aleaAvecGraine(22)
    for (let i = 0; i < 30; i++) {
      const m = genererMelodie(6, 2, alea)
      expect(m.notes[0]).toBe(60)
      expect(m.notes.at(-1)).toBe(60)
    }
  })

  it('n’utilise que des notes de la palette', () => {
    const alea = aleaAvecGraine(23)
    for (let i = 0; i < 30; i++) {
      const m = genererMelodie(7, 3, alea)
      for (const note of m.notes) expect(m.palette).toContain(note)
    }
  })

  it('procède par degrés conjoints aux premiers paliers', () => {
    const alea = aleaAvecGraine(24)
    for (let i = 0; i < 30; i++) {
      const m = genererMelodie(6, 1, alea)
      // Aux paliers 0 et 1 le pas est limité à un degré, soit au plus un ton
      // (2 demi-tons) dans la gamme majeure.
      for (let n = 1; n < m.notes.length - 1; n++) {
        expect(Math.abs(m.notes[n]! - m.notes[n - 1]!)).toBeLessThanOrEqual(2)
      }
    }
  })
})

describe('rythme', () => {
  it('remplit exactement les mesures demandées', () => {
    const alea = aleaAvecGraine(31)
    for (const nom of ['2/4', '3/4', '4/4'] as const) {
      for (let n = 1; n <= 4; n++) {
        const q = genererRythme(n, 3, nom, alea)
        const total = q.evenements.reduce((s, e) => s + e.duree, 0)
        expect(total).toBeCloseTo(n * tempsParMesure(MESURES[nom]!), 10)
        expect(total).toBeCloseTo(q.duree, 10)
      }
    }
  })

  it('n’utilise que des cellules du niveau autorisé', () => {
    const alea = aleaAvecGraine(32)
    for (let i = 0; i < 30; i++) {
      for (const cellule of genererRythme(2, 1, '4/4', alea).cellules) {
        expect(cellule.niveau).toBeLessThanOrEqual(1)
      }
    }
  })

  it('horodate les événements sans trou ni chevauchement', () => {
    const q = genererRythme(3, 3, '3/4', aleaAvecGraine(33))
    let attendu = 0
    for (const e of q.evenements) {
      expect(e.debut).toBeCloseTo(attendu, 10)
      attendu += e.duree
    }
  })

  it('exclut les silences de la liste des frappes', () => {
    const evenements = developperCellules([
      { id: 'x', valeurs: ['noire', 'silence:noire', 'noire'], temps: 3, niveau: 1, parle: '' },
    ])
    expect(frappes(evenements)).toEqual([0, 2])
  })
})

describe('évaluation des frappes', () => {
  const attendus = [0, 1, 2, 3]

  it('donne 100 pour une exécution exacte', () => {
    const resultats = evaluerFrappes(attendus, [0, 1, 2, 3])
    expect(resultats.every((r) => r.appreciation === 'parfait')).toBe(true)
    expect(scoreFrappes(resultats)).toBe(100)
  })

  it('tolère un léger décalage', () => {
    const resultats = evaluerFrappes(attendus, [0.05, 1.1, 1.9, 3.05])
    expect(resultats.every((r) => r.appreciation === 'parfait')).toBe(true)
  })

  it('signale une frappe manquante', () => {
    const resultats = evaluerFrappes(attendus, [0, 1, 3])
    expect(resultats[2]!.appreciation).toBe('manque')
    expect(scoreFrappes(resultats)).toBeLessThan(100)
  })

  it('n’associe pas deux cibles à la même frappe', () => {
    // Une seule frappe pour quatre cibles : trois doivent manquer.
    const resultats = evaluerFrappes(attendus, [1])
    expect(resultats.filter((r) => r.appreciation === 'manque')).toHaveLength(3)
  })

  it('note le retard comme l’avance', () => {
    const enAvance = evaluerFrappes([1], [0.7])
    const enRetard = evaluerFrappes([1], [1.3])
    expect(enAvance[0]!.appreciation).toBe(enRetard[0]!.appreciation)
    expect(enAvance[0]!.ecart).toBeLessThan(0)
    expect(enRetard[0]!.ecart).toBeGreaterThan(0)
  })

  it('rend 0 pour une exécution vide', () => {
    expect(scoreFrappes(evaluerFrappes(attendus, []))).toBe(0)
    expect(scoreFrappes([])).toBe(0)
  })
})
