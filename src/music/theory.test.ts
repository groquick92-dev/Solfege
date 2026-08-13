import { describe, expect, it } from 'vitest'
import {
  AMBITUS,
  type Note,
  cleVexFlow,
  construireGamme,
  ecartEnCents,
  frequenceVersMidi,
  indiceDiatonique,
  intervalleDepuisDemiTons,
  midiVersFrequence,
  midiVersNote,
  nomFrancais,
  nomFrancaisComplet,
  noteVersMidi,
  positionSurPortee,
} from './theory'

const doCentral: Note = { degre: 0, alteration: 0, octave: 4 }
const la440: Note = { degre: 5, alteration: 0, octave: 4 }

describe('conversion note ↔ MIDI', () => {
  it('place le do central sur 60', () => {
    expect(noteVersMidi(doCentral)).toBe(60)
  })

  it('place le la du diapason sur 69', () => {
    expect(noteVersMidi(la440)).toBe(69)
  })

  it('applique les altérations', () => {
    expect(noteVersMidi({ degre: 0, alteration: 1, octave: 4 })).toBe(61)
    expect(noteVersMidi({ degre: 1, alteration: -1, octave: 4 })).toBe(61)
  })

  it('fait un aller-retour fidèle sur toutes les notes naturelles', () => {
    for (let midi = 21; midi <= 108; midi++) {
      expect(noteVersMidi(midiVersNote(midi))).toBe(midi)
    }
  })

  it('écrit do♯ ou ré♭ selon la préférence demandée', () => {
    expect(midiVersNote(61, 'diese')).toEqual({ degre: 0, alteration: 1, octave: 4 })
    expect(midiVersNote(61, 'bemol')).toEqual({ degre: 1, alteration: -1, octave: 4 })
  })
})

describe('fréquences', () => {
  it('donne 440 Hz pour le la3', () => {
    expect(midiVersFrequence(69)).toBeCloseTo(440, 6)
  })

  it('double la fréquence à l’octave', () => {
    expect(midiVersFrequence(81)).toBeCloseTo(880, 6)
  })

  it('retrouve le numéro MIDI depuis la fréquence', () => {
    expect(frequenceVersMidi(440)).toBeCloseTo(69, 6)
    expect(frequenceVersMidi(261.6255653)).toBeCloseTo(60, 5)
  })

  it('mesure l’écart en cents', () => {
    expect(ecartEnCents(440, 69)).toBeCloseTo(0, 6)
    // Un demi-ton vaut 100 cents.
    expect(ecartEnCents(midiVersFrequence(70), 69)).toBeCloseTo(100, 6)
  })
})

describe('noms français', () => {
  it('nomme les degrés en français', () => {
    expect(nomFrancais(doCentral)).toBe('do')
    expect(nomFrancais({ degre: 3, alteration: 1, octave: 4 })).toBe('fa♯')
    expect(nomFrancais({ degre: 6, alteration: -1, octave: 4 })).toBe('si♭')
  })

  it('utilise la numérotation française des octaves', () => {
    // Le do central est « do3 » en France, « C4 » en notation scientifique.
    expect(nomFrancaisComplet(doCentral)).toBe('do3')
    expect(nomFrancaisComplet(la440)).toBe('la3')
  })
})

describe('clés VexFlow', () => {
  it('traduit les notes au format attendu par VexFlow', () => {
    expect(cleVexFlow(doCentral)).toBe('c/4')
    expect(cleVexFlow({ degre: 3, alteration: 1, octave: 5 })).toBe('f#/5')
    expect(cleVexFlow({ degre: 6, alteration: -1, octave: 3 })).toBe('bb/3')
  })
})

describe('position sur la portée', () => {
  it('compte les degrés en ignorant les altérations', () => {
    const doDiese: Note = { degre: 0, alteration: 1, octave: 4 }
    expect(indiceDiatonique(doDiese)).toBe(indiceDiatonique(doCentral))
  })

  it('pose le mi sur la première ligne en clé de sol', () => {
    expect(positionSurPortee({ degre: 2, alteration: 0, octave: 4 }, 'sol')).toBe(0)
  })

  it('pose le fa sur la cinquième ligne en clé de sol', () => {
    expect(positionSurPortee({ degre: 3, alteration: 0, octave: 5 }, 'sol')).toBe(8)
  })

  it('place le do central sous la portée en clé de sol', () => {
    // Le do central est sur la première ligne supplémentaire inférieure.
    expect(positionSurPortee(doCentral, 'sol')).toBe(-2)
  })

  it('pose le sol sur la première ligne en clé de fa', () => {
    expect(positionSurPortee({ degre: 4, alteration: 0, octave: 2 }, 'fa')).toBe(0)
  })

  it('place le do central au-dessus de la portée en clé de fa', () => {
    // Le do central est la ligne supplémentaire supérieure de la clé de fa.
    expect(positionSurPortee(doCentral, 'fa')).toBe(10)
  })
})

describe('ambitus', () => {
  it('couvre au moins deux octaves dans chaque clé', () => {
    for (const cle of ['sol', 'fa'] as const) {
      expect(AMBITUS[cle].aigu - AMBITUS[cle].grave).toBeGreaterThanOrEqual(24)
    }
  })
})

describe('intervalles', () => {
  it('reconnaît un intervalle par son nombre de demi-tons', () => {
    expect(intervalleDepuisDemiTons(7)?.nom).toBe('quinte')
    expect(intervalleDepuisDemiTons(12)?.nom).toBe('octave')
  })

  it('traite un intervalle descendant comme son équivalent ascendant', () => {
    expect(intervalleDepuisDemiTons(-7)?.nom).toBe('quinte')
  })
})

describe('gammes', () => {
  it('construit la gamme de do majeur sans altération', () => {
    expect(construireGamme(60)).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
  })

  it('construit la gamme de sol majeur avec un fa dièse', () => {
    const sol = construireGamme(67)
    expect(sol).toEqual([67, 69, 71, 72, 74, 76, 78, 79])
    // Le 7ᵉ degré est fa♯ (78), non fa naturel (77).
    expect(sol[6]).toBe(78)
  })

  it('ferme la gamme sur l’octave de la tonique', () => {
    for (const tonique of [60, 62, 65, 67]) {
      const gamme = construireGamme(tonique)
      expect(gamme[7]! - gamme[0]!).toBe(12)
    }
  })
})
