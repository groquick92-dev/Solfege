/**
 * Générateurs d'exercices.
 *
 * Chaque générateur prend un niveau et rend un exercice complet. Le tirage
 * aléatoire passe par une fonction injectable : les tests fournissent une
 * suite déterministe, l'application utilise `Math.random`.
 */

import {
  AMBITUS,
  INTERVALLES,
  type Cle,
  type Intervalle,
  type Note,
  construireGamme,
  midiVersNote,
  noteVersMidi,
} from './theory'
import {
  CELLULES,
  MESURES,
  type Cellule,
  type EvenementRythmique,
  type Mesure,
  cellulesJusquAu,
  developperCellules,
  tempsParMesure,
} from './rythme'

/** Source de nombres aléatoires dans [0, 1[. */
export type Alea = () => number

/**
 * Générateur pseudo-aléatoire déterministe (mulberry32). Rend les exercices
 * reproductibles : un même numéro de graine redonne la même série, ce qui
 * permet de rejouer exactement une séance ratée.
 */
export function aleaAvecGraine(graine: number): Alea {
  let etat = graine >>> 0
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Tire un élément au hasard dans un tableau non vide. */
export function choisir<T>(tableau: readonly T[], alea: Alea = Math.random): T {
  if (tableau.length === 0) throw new Error('Tirage dans un tableau vide')
  return tableau[Math.floor(alea() * tableau.length)]!
}

/** Tire un entier dans l'intervalle fermé [min, max]. */
export function entierEntre(min: number, max: number, alea: Alea = Math.random): number {
  return min + Math.floor(alea() * (max - min + 1))
}

/** Mélange un tableau sans modifier l'original (Fisher-Yates). */
export function melanger<T>(tableau: readonly T[], alea: Alea = Math.random): T[] {
  const copie = [...tableau]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j]!, copie[i]!]
  }
  return copie
}

// ---------------------------------------------------------------------------
// Lecture de notes
// ---------------------------------------------------------------------------

export interface NiveauLecture {
  /** Notes autorisées, en MIDI. */
  notes: number[]
  /** Clé travaillée. */
  cle: Cle
}

/**
 * Ambitus travaillé palier par palier. On part des notes posées sur la portée
 * autour de la position de repos de la main, puis on élargit vers les lignes
 * supplémentaires. Les notes ajoutées à chaque palier restent peu nombreuses :
 * un enfant retient mieux trois notes vraiment acquises que sept approximatives.
 */
export const PALIERS_LECTURE: Record<Cle, number[][]> = {
  sol: [
    [60, 62, 64], // do3 ré3 mi3 — les trois premières notes
    [60, 62, 64, 65, 67], // + fa3 sol3, la main entière
    [60, 62, 64, 65, 67, 69, 71], // + la3 si3, l'octave complète
    [60, 62, 64, 65, 67, 69, 71, 72], // + do4
    [59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76], // ambitus élargi de 2ᵉ année
  ],
  fa: [
    [53, 55, 57], // fa1 sol1 la1 — installation de la clé de fa
    [53, 55, 57, 59, 60], // + si1 do2
    [48, 50, 52, 53, 55, 57, 59, 60], // octave do1 → do2
    [45, 47, 48, 50, 52, 53, 55, 57, 59, 60], // ambitus élargi
  ],
}

export interface QuestionLecture {
  note: Note
  midi: number
  cle: Cle
  /** Propositions affichées, dont une seule est juste. */
  propositions: string[]
  /** Réponse attendue, présente dans les propositions. */
  reponse: string
}

/** Tire une note à identifier, avec ses propositions de réponse. */
export function genererLectureNote(
  palier: number,
  cle: Cle,
  alea: Alea = Math.random,
  nbPropositions = 4,
): QuestionLecture {
  const paliers = PALIERS_LECTURE[cle]
  const notes = paliers[Math.min(palier, paliers.length - 1)]!
  const midi = choisir(notes, alea)
  const note = midiVersNote(midi)

  // Les distracteurs sont pris dans le même palier : proposer une note que
  // l'enfant n'a pas encore vue n'apprend rien et décourage.
  const nomsDisponibles = [...new Set(notes.map((m) => nomDegre(m)))]
  const bonne = nomDegre(midi)
  const distracteurs = melanger(
    nomsDisponibles.filter((n) => n !== bonne),
    alea,
  ).slice(0, Math.max(0, nbPropositions - 1))

  return {
    note,
    midi,
    cle,
    propositions: melanger([bonne, ...distracteurs], alea),
    reponse: bonne,
  }
}

/** Nom du degré sans octave ni altération, tel qu'attendu en réponse. */
function nomDegre(midi: number): string {
  const note = midiVersNote(midi)
  return ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'][note.degre]!
}

// ---------------------------------------------------------------------------
// Intervalles
// ---------------------------------------------------------------------------

export interface QuestionIntervalle {
  depart: number
  arrivee: number
  intervalle: Intervalle
  sens: 'montant' | 'descendant'
  propositions: Intervalle[]
}

/** Intervalles proposés à chaque palier, du plus contrasté au plus fin. */
export const PALIERS_INTERVALLES: string[][] = [
  ['unisson', 'octave'], // le plus large contraste possible
  ['unisson', 'quinte', 'octave'],
  ['seconde', 'tierce', 'quinte', 'octave'],
  ['seconde', 'tierce', 'quarte', 'quinte', 'octave'],
  ['seconde', 'tierce', 'quarte', 'quinte', 'sixte', 'septième', 'octave'],
]

export function genererIntervalle(
  palier: number,
  alea: Alea = Math.random,
  sensAutorise: 'montant' | 'les-deux' = 'montant',
): QuestionIntervalle {
  const nomsPalier = PALIERS_INTERVALLES[Math.min(palier, PALIERS_INTERVALLES.length - 1)]!
  const disponibles = INTERVALLES.filter((i) => nomsPalier.includes(i.nom))
  const intervalle = choisir(disponibles, alea)

  const sens = sensAutorise === 'montant' ? 'montant' : alea() < 0.5 ? 'montant' : 'descendant'

  // On part d'une note de la gamme de do majeur, dans un registre central
  // confortable à chanter comme à écouter.
  const gamme = construireGamme(60)
  const depart = choisir(gamme.slice(0, 5), alea)
  const arrivee = sens === 'montant' ? depart + intervalle.demiTons : depart - intervalle.demiTons

  return {
    depart,
    arrivee,
    intervalle,
    sens,
    propositions: melanger(disponibles, alea),
  }
}

// ---------------------------------------------------------------------------
// Dictée mélodique
// ---------------------------------------------------------------------------

export interface QuestionMelodie {
  /** Notes de la mélodie, en MIDI. */
  notes: number[]
  /** Notes autorisées à la saisie. */
  palette: number[]
  cle: Cle
}

/**
 * Construit une mélodie par degrés conjoints et petits sauts.
 *
 * Contrainte pédagogique : la mélodie commence et finit sur la tonique, et
 * évite les sauts supérieurs à la quinte. Une dictée qui « tourne » autour de
 * do reste chantable de tête, condition pour être relevée.
 */
export function genererMelodie(
  longueur: number,
  palier: number,
  alea: Alea = Math.random,
  cle: Cle = 'sol',
): QuestionMelodie {
  const gamme = construireGamme(60)
  const etendue = Math.min(3 + palier, gamme.length - 1)
  const palette = gamme.slice(0, etendue + 1)

  const notes: number[] = [palette[0]!]
  let indice = 0

  for (let i = 1; i < longueur - 1; i++) {
    const sautMax = palier < 2 ? 1 : 2
    const pas = entierEntre(-sautMax, sautMax, alea)
    indice = Math.max(0, Math.min(palette.length - 1, indice + (pas === 0 ? 1 : pas)))
    notes.push(palette[indice]!)
  }

  notes.push(palette[0]!) // retour à la tonique
  return { notes, palette, cle }
}

// ---------------------------------------------------------------------------
// Rythme
// ---------------------------------------------------------------------------

export interface QuestionRythme {
  mesure: Mesure
  cellules: Cellule[]
  evenements: EvenementRythmique[]
  /** Durée totale en temps. */
  duree: number
}

/**
 * Remplit un nombre de mesures avec des cellules du niveau demandé.
 *
 * Le remplissage est glouton mais borné : on ne pioche que parmi les cellules
 * qui tiennent dans la place restante, ce qui garantit des mesures toujours
 * complètes — une mesure incomplète serait fausse et impossible à battre.
 */
export function genererRythme(
  nbMesures: number,
  niveau: 1 | 2 | 3,
  nomMesure: keyof typeof MESURES = '4/4',
  alea: Alea = Math.random,
): QuestionRythme {
  const mesure = MESURES[nomMesure]!
  const capacite = tempsParMesure(mesure)
  const disponibles = cellulesJusquAu(niveau)
  const cellules: Cellule[] = []

  for (let m = 0; m < nbMesures; m++) {
    let restant = capacite

    while (restant > 0) {
      const possibles = disponibles.filter((c) => c.temps <= restant)
      if (possibles.length === 0) {
        // Aucune cellule ne tient : on complète avec des noires, toujours
        // disponibles au niveau 1 et d'une durée d'un temps.
        const noire = CELLULES.find((c) => c.id === 'noire')!
        while (restant >= 1) {
          cellules.push(noire)
          restant -= 1
        }
        break
      }
      const choisie = choisir(possibles, alea)
      cellules.push(choisie)
      restant -= choisie.temps
    }
  }

  const evenements = developperCellules(cellules)
  return {
    mesure,
    cellules,
    evenements,
    duree: nbMesures * capacite,
  }
}

// ---------------------------------------------------------------------------
// Évaluation d'une frappe rythmique
// ---------------------------------------------------------------------------

export interface ResultatFrappe {
  /** Écart en temps entre la frappe et la cible ; négatif = en avance. */
  ecart: number
  /** Appréciation affichée. */
  appreciation: 'parfait' | 'bien' | 'approximatif' | 'manque'
}

/**
 * Compare les frappes de l'enfant aux temps attendus.
 *
 * La tolérance est volontairement généreuse — un huitième de temps pour
 * « parfait » — car l'objectif du premier cycle est la régularité, pas la
 * précision d'un séquenceur.
 */
export function evaluerFrappes(
  attendus: number[],
  joues: number[],
  tolerance = { parfait: 0.125, bien: 0.25, approximatif: 0.4 },
): ResultatFrappe[] {
  const restants = [...joues]

  return attendus.map((cible) => {
    let meilleurIndice = -1
    let meilleurEcart = Infinity

    restants.forEach((joue, i) => {
      const ecart = joue - cible
      if (Math.abs(ecart) < Math.abs(meilleurEcart)) {
        meilleurEcart = ecart
        meilleurIndice = i
      }
    })

    if (meilleurIndice === -1 || Math.abs(meilleurEcart) > tolerance.approximatif) {
      return { ecart: NaN, appreciation: 'manque' }
    }

    restants.splice(meilleurIndice, 1)
    const absolu = Math.abs(meilleurEcart)
    const appreciation =
      absolu <= tolerance.parfait ? 'parfait' : absolu <= tolerance.bien ? 'bien' : 'approximatif'

    return { ecart: meilleurEcart, appreciation }
  })
}

/** Convertit un résultat de frappes en score sur 100. */
export function scoreFrappes(resultats: ResultatFrappe[]): number {
  if (resultats.length === 0) return 0
  const points = { parfait: 1, bien: 0.75, approximatif: 0.4, manque: 0 }
  const total = resultats.reduce((somme, r) => somme + points[r.appreciation], 0)
  return Math.round((total / resultats.length) * 100)
}

export { noteVersMidi, AMBITUS }
