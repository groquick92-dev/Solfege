/**
 * Noyau de théorie musicale.
 *
 * Toutes les hauteurs sont manipulées en interne sous forme de numéro MIDI
 * (do central = 60), qui est la seule représentation non ambiguë. Les noms
 * français, les positions sur la portée et les clés de VexFlow en dérivent.
 *
 * Attention à la numérotation des octaves : la convention française décale
 * d'une unité la notation scientifique anglo-saxonne. Le do central est
 * « do3 » en France mais « C4 » en notation scientifique. Le code stocke
 * l'octave scientifique et ne convertit qu'à l'affichage.
 */

/** Degré de la gamme diatonique, de do (0) à si (6). */
export type Degre = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Altération : bémol (-1), bécarre (0), dièse (+1). */
export type Alteration = -1 | 0 | 1

export interface Note {
  /** Degré diatonique : 0 = do, 1 = ré, … 6 = si. */
  degre: Degre
  /** Altération appliquée au degré. */
  alteration: Alteration
  /** Octave en notation scientifique (do central = octave 4). */
  octave: number
}

/** Noms français des sept degrés, dans l'ordre. */
export const NOMS_FR = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'] as const

/** Lettres anglo-saxonnes correspondantes, requises par VexFlow. */
const LETTRES_EN = ['c', 'd', 'e', 'f', 'g', 'a', 'b'] as const

/** Nombre de demi-tons entre do et chaque degré de la gamme majeure. */
const DEMI_TONS_DEPUIS_DO = [0, 2, 4, 5, 7, 9, 11] as const

/** Décalage entre l'octave scientifique et l'octave française. */
const DECALAGE_OCTAVE_FR = 1

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

/** Convertit une note en numéro MIDI (do central = 60). */
export function noteVersMidi(note: Note): number {
  return (note.octave + 1) * 12 + DEMI_TONS_DEPUIS_DO[note.degre] + note.alteration
}

/**
 * Convertit un numéro MIDI en note écrite.
 *
 * Une même touche peut s'écrire de deux façons (do♯ ou ré♭). Le paramètre
 * `preferer` tranche : les tonalités à dièses écrivent do♯, celles à bémols
 * écrivent ré♭.
 */
export function midiVersNote(midi: number, preferer: 'diese' | 'bemol' = 'diese'): Note {
  const octave = Math.floor(midi / 12) - 1
  const classe = ((midi % 12) + 12) % 12

  const degreNaturel = DEMI_TONS_DEPUIS_DO.indexOf(classe as (typeof DEMI_TONS_DEPUIS_DO)[number])
  if (degreNaturel !== -1) {
    return { degre: degreNaturel as Degre, alteration: 0, octave }
  }

  if (preferer === 'diese') {
    // La note altérée est le degré naturel juste en dessous, haussé d'un demi-ton.
    const degre = DEMI_TONS_DEPUIS_DO.indexOf((classe - 1) as (typeof DEMI_TONS_DEPUIS_DO)[number])
    return { degre: degre as Degre, alteration: 1, octave }
  }

  const degre = DEMI_TONS_DEPUIS_DO.indexOf((classe + 1) as (typeof DEMI_TONS_DEPUIS_DO)[number])
  return { degre: degre as Degre, alteration: -1, octave }
}

/** Fréquence en hertz, au diapason la3 = 440 Hz. */
export function midiVersFrequence(midi: number, diapason = 440): number {
  return diapason * Math.pow(2, (midi - 69) / 12)
}

/** Numéro MIDI le plus proche d'une fréquence — utile pour l'écoute au micro. */
export function frequenceVersMidi(frequence: number, diapason = 440): number {
  return 69 + 12 * Math.log2(frequence / diapason)
}

/**
 * Écart en centièmes de demi-ton entre une fréquence et la note juste la plus
 * proche. Sert à afficher « un peu trop haut » plutôt qu'un simple faux.
 */
export function ecartEnCents(frequence: number, midiCible: number, diapason = 440): number {
  return 1200 * Math.log2(frequence / midiVersFrequence(midiCible, diapason))
}

// ---------------------------------------------------------------------------
// Noms affichables
// ---------------------------------------------------------------------------

const SIGNES: Record<Alteration, string> = { [-1]: '♭', 0: '', 1: '♯' }

/** Nom français sans octave : « do », « fa♯ ». */
export function nomFrancais(note: Note): string {
  return NOMS_FR[note.degre] + SIGNES[note.alteration]
}

/** Nom français avec octave à la française : « do3 », « fa♯3 ». */
export function nomFrancaisComplet(note: Note): string {
  return `${nomFrancais(note)}${note.octave - DECALAGE_OCTAVE_FR}`
}

/** Clé VexFlow, par exemple « c#/4 ». */
export function cleVexFlow(note: Note): string {
  const suffixe = note.alteration === 1 ? '#' : note.alteration === -1 ? 'b' : ''
  return `${LETTRES_EN[note.degre]}${suffixe}/${note.octave}`
}

/** Accidentel VexFlow, ou null si la note est naturelle. */
export function accidentVexFlow(note: Note): string | null {
  return note.alteration === 1 ? '#' : note.alteration === -1 ? 'b' : null
}

// ---------------------------------------------------------------------------
// Position sur la portée
// ---------------------------------------------------------------------------

export type Cle = 'sol' | 'fa'

/**
 * Indice diatonique absolu : compte les degrés depuis do0, en ignorant les
 * altérations. Deux notes qui partagent cet indice occupent la même ligne ou
 * le même interligne de la portée.
 */
export function indiceDiatonique(note: Note): number {
  return note.octave * 7 + note.degre
}

/** Note de référence posée sur la première ligne de la portée, par clé. */
const NOTE_PREMIERE_LIGNE: Record<Cle, Note> = {
  // Clé de sol : mi3 (scientifique mi4) sur la ligne du bas.
  sol: { degre: 2, alteration: 0, octave: 4 },
  // Clé de fa : sol1 (scientifique sol2) sur la ligne du bas.
  fa: { degre: 4, alteration: 0, octave: 2 },
}

/**
 * Position verticale sur la portée, en demi-interlignes au-dessus de la
 * première ligne. 0 = première ligne, 1 = premier interligne, 8 = cinquième
 * ligne. Les valeurs négatives descendent sous la portée.
 */
export function positionSurPortee(note: Note, cle: Cle): number {
  return indiceDiatonique(note) - indiceDiatonique(NOTE_PREMIERE_LIGNE[cle])
}

/** Ambitus confortable pour chaque clé au premier cycle. */
export const AMBITUS: Record<Cle, { grave: number; aigu: number }> = {
  // Clé de sol : do3 → do5 en notation française (do central à deux octaves).
  sol: { grave: 60, aigu: 84 },
  // Clé de fa : do1 → do3 en notation française.
  fa: { grave: 36, aigu: 60 },
}

// ---------------------------------------------------------------------------
// Intervalles
// ---------------------------------------------------------------------------

export interface Intervalle {
  /** Nom affiché à l'élève : « quinte », « tierce »… */
  nom: string
  /** Nombre de demi-tons. */
  demiTons: number
  /** Numéro de l'intervalle : 1 pour l'unisson, 5 pour la quinte… */
  degres: number
  /** Repère mélodique connu de l'enfant, pour ancrer l'écoute. */
  repere: string
}

/**
 * Intervalles ascendants au programme du premier cycle. Chaque entrée porte
 * un repère chanté : associer un intervalle à une mélodie familière est la
 * technique la plus efficace pour un débutant, bien avant le comptage de
 * demi-tons.
 */
export const INTERVALLES: readonly Intervalle[] = [
  { nom: 'unisson', demiTons: 0, degres: 1, repere: 'la même note, deux fois' },
  { nom: 'seconde', demiTons: 2, degres: 2, repere: 'les deux premières notes de « Frère Jacques »' },
  { nom: 'tierce', demiTons: 4, degres: 3, repere: 'le début de « Au clair de la lune » (do-do-do-ré)' },
  { nom: 'quarte', demiTons: 5, degres: 4, repere: 'le début de « La Marseillaise »' },
  { nom: 'quinte', demiTons: 7, degres: 5, repere: 'le thème de « Star Wars »' },
  { nom: 'sixte', demiTons: 9, degres: 6, repere: 'le début de « My Way »' },
  { nom: 'septième', demiTons: 11, degres: 7, repere: 'le générique des « Simpson » (presque l’octave)' },
  { nom: 'octave', demiTons: 12, degres: 8, repere: 'le début de « Somewhere Over the Rainbow »' },
]

/** Retrouve l'intervalle correspondant à un écart en demi-tons. */
export function intervalleDepuisDemiTons(demiTons: number): Intervalle | undefined {
  return INTERVALLES.find((i) => i.demiTons === Math.abs(demiTons))
}

// ---------------------------------------------------------------------------
// Gammes
// ---------------------------------------------------------------------------

/** Suite de tons et demi-tons de la gamme majeure. */
export const GAMME_MAJEURE = [2, 2, 1, 2, 2, 2, 1] as const

/** Gamme mineure naturelle. */
export const GAMME_MINEURE_NATURELLE = [2, 1, 2, 2, 1, 2, 2] as const

/** Construit les huit notes d'une gamme à partir de sa tonique. */
export function construireGamme(
  toniqueMidi: number,
  intervalles: readonly number[] = GAMME_MAJEURE,
): number[] {
  const notes = [toniqueMidi]
  let courante = toniqueMidi
  for (const pas of intervalles) {
    courante += pas
    notes.push(courante)
  }
  return notes
}

/** Noms des degrés de la gamme, tels qu'ils sont enseignés. */
export const NOMS_DEGRES = [
  'tonique',
  'sus-tonique',
  'médiante',
  'sous-dominante',
  'dominante',
  'sus-dominante',
  'sensible',
  'tonique',
] as const
