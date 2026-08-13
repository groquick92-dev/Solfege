/**
 * Valeurs rythmiques, mesures et cellules.
 *
 * Les durées sont exprimées en temps (un temps = une noire dans toutes les
 * mesures simples du premier cycle). Ce choix garde les calculs lisibles :
 * une mesure à 3/4 vaut 3, une blanche vaut 2.
 */

/** Code de durée utilisé par VexFlow. */
export type CodeDuree = 'w' | 'h' | 'q' | '8' | '16'

export interface ValeurRythmique {
  /** Identifiant stable, utilisé dans les données d'exercice. */
  id: string
  /** Nom de la note. */
  nom: string
  /** Nom du silence de même durée. */
  nomSilence: string
  /** Durée en temps (noire = 1). */
  temps: number
  /** Code VexFlow. */
  code: CodeDuree
  /** La valeur est-elle pointée ? */
  pointee: boolean
  /** Symbole affiché dans les tableaux de cours. */
  symbole: string
}

/** Valeurs au programme du premier cycle, de la plus longue à la plus courte. */
export const VALEURS: readonly ValeurRythmique[] = [
  { id: 'ronde', nom: 'ronde', nomSilence: 'pause', temps: 4, code: 'w', pointee: false, symbole: '𝅝' },
  { id: 'blanche-pointee', nom: 'blanche pointée', nomSilence: 'demi-pause pointée', temps: 3, code: 'h', pointee: true, symbole: '𝅗𝅥.' },
  { id: 'blanche', nom: 'blanche', nomSilence: 'demi-pause', temps: 2, code: 'h', pointee: false, symbole: '𝅗𝅥' },
  { id: 'noire-pointee', nom: 'noire pointée', nomSilence: 'soupir pointé', temps: 1.5, code: 'q', pointee: true, symbole: '♩.' },
  { id: 'noire', nom: 'noire', nomSilence: 'soupir', temps: 1, code: 'q', pointee: false, symbole: '♩' },
  { id: 'croche', nom: 'croche', nomSilence: 'demi-soupir', temps: 0.5, code: '8', pointee: false, symbole: '♪' },
  { id: 'double-croche', nom: 'double-croche', nomSilence: 'quart de soupir', temps: 0.25, code: '16', pointee: false, symbole: '𝅘𝅥𝅯' },
]

export const VALEUR_PAR_ID = new Map(VALEURS.map((v) => [v.id, v]))

/** Récupère une valeur par identifiant, en signalant les identifiants inconnus. */
export function valeur(id: string): ValeurRythmique {
  const v = VALEUR_PAR_ID.get(id)
  if (!v) throw new Error(`Valeur rythmique inconnue : ${id}`)
  return v
}

// ---------------------------------------------------------------------------
// Mesures
// ---------------------------------------------------------------------------

export interface Mesure {
  /** Nombre de temps par mesure. */
  numerateur: number
  /** Unité de temps (4 = la noire). */
  denominateur: number
  /** Libellé affiché. */
  nom: string
  /** Temps portant un accent naturel, à partir de 0. */
  tempsForts: number[]
}

export const MESURES: Record<string, Mesure> = {
  '2/4': { numerateur: 2, denominateur: 4, nom: '2/4', tempsForts: [0] },
  '3/4': { numerateur: 3, denominateur: 4, nom: '3/4', tempsForts: [0] },
  '4/4': { numerateur: 4, denominateur: 4, nom: '4/4', tempsForts: [0, 2] },
}

/** Durée totale d'une mesure, en temps. */
export function tempsParMesure(mesure: Mesure): number {
  return mesure.numerateur * (4 / mesure.denominateur)
}

// ---------------------------------------------------------------------------
// Cellules rythmiques
// ---------------------------------------------------------------------------

export interface Cellule {
  id: string
  /** Identifiants de valeurs occupant la cellule. */
  valeurs: string[]
  /** Durée totale en temps. */
  temps: number
  /** Niveau à partir duquel la cellule peut apparaître. */
  niveau: 1 | 2 | 3
  /** Formule parlée qui aide l'enfant à intérioriser le rythme. */
  parle: string
}

/**
 * Cellules d'un temps ou deux, dans l'ordre où elles sont introduites en
 * formation musicale. Les formules parlées viennent de la méthode Ward et de
 * la pratique courante en conservatoire : dire le rythme avant de le jouer
 * lève l'essentiel des erreurs de placement.
 */
export const CELLULES: readonly Cellule[] = [
  { id: 'noire', valeurs: ['noire'], temps: 1, niveau: 1, parle: 'ta' },
  { id: 'deux-croches', valeurs: ['croche', 'croche'], temps: 1, niveau: 1, parle: 'ti-ti' },
  { id: 'blanche', valeurs: ['blanche'], temps: 2, niveau: 1, parle: 'ta-a' },
  { id: 'ronde', valeurs: ['ronde'], temps: 4, niveau: 1, parle: 'ta-a-a-a' },
  { id: 'silence-noire', valeurs: ['silence:noire'], temps: 1, niveau: 1, parle: 'chut' },
  { id: 'blanche-pointee', valeurs: ['blanche-pointee'], temps: 3, niveau: 2, parle: 'ta-a-a' },
  { id: 'noire-pointee-croche', valeurs: ['noire-pointee', 'croche'], temps: 2, niveau: 2, parle: 'ta-a-ti' },
  { id: 'croche-noire-croche', valeurs: ['croche', 'noire', 'croche'], temps: 2, niveau: 3, parle: 'ti-ta-ti' },
  { id: 'quatre-doubles', valeurs: ['double-croche', 'double-croche', 'double-croche', 'double-croche'], temps: 1, niveau: 3, parle: 'ti-ri-ti-ri' },
  { id: 'croche-deux-doubles', valeurs: ['croche', 'double-croche', 'double-croche'], temps: 1, niveau: 3, parle: 'ti-ti-ri' },
  { id: 'deux-doubles-croche', valeurs: ['double-croche', 'double-croche', 'croche'], temps: 1, niveau: 3, parle: 'ti-ri-ti' },
]

/** Cellules disponibles jusqu'à un niveau donné. */
export function cellulesJusquAu(niveau: 1 | 2 | 3): Cellule[] {
  return CELLULES.filter((c) => c.niveau <= niveau)
}

// ---------------------------------------------------------------------------
// Événements rythmiques
// ---------------------------------------------------------------------------

export interface EvenementRythmique {
  /** Identifiant de la valeur, ou identifiant préfixé de « silence: ». */
  valeurId: string
  /** Position en temps depuis le début de l'exercice. */
  debut: number
  /** Durée en temps. */
  duree: number
  /** Vrai s'il s'agit d'un silence. */
  silence: boolean
}

/** Développe une suite de cellules en événements horodatés. */
export function developperCellules(cellules: Cellule[]): EvenementRythmique[] {
  const evenements: EvenementRythmique[] = []
  let position = 0

  for (const cellule of cellules) {
    for (const id of cellule.valeurs) {
      const silence = id.startsWith('silence:')
      const v = valeur(silence ? id.slice('silence:'.length) : id)
      evenements.push({ valeurId: id, debut: position, duree: v.temps, silence })
      position += v.temps
    }
  }

  return evenements
}

/** Ne garde que les frappes réellement jouées, silences exclus. */
export function frappes(evenements: EvenementRythmique[]): number[] {
  return evenements.filter((e) => !e.silence).map((e) => e.debut)
}
