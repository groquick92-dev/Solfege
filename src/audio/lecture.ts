/**
 * Lecture de notes, mélodies et rythmes.
 *
 * Tous les enchaînements sont programmés à l'avance sur l'horloge du contexte
 * audio plutôt que déclenchés par `setTimeout`. C'est la seule façon d'obtenir
 * un placement régulier : le minuteur JavaScript dérive de plusieurs dizaines
 * de millisecondes dès que l'interface s'anime, ce qui s'entend immédiatement
 * sur une gamme ou une dictée.
 */

import { debloquerAudio, maintenant, obtenirContexte, sortieInstruments } from './contexte'
import { chargerPiano } from './instruments'

/** Vélocité MIDI par défaut : un jeu moyen, ni écrasé ni martelé. */
const VELOCITE_DEFAUT = 80

/**
 * Prépare le piano en absorbant les échecs de chargement.
 *
 * Si les échantillons ne sont pas joignables — connexion coupée, hébergement
 * indisponible — l'exercice doit continuer sans son plutôt que de s'arrêter
 * sur une erreur. L'écran du piano, lui, affiche le message porté par l'état
 * de chargement.
 */
async function pianoOuRien() {
  try {
    await debloquerAudio()
    return await chargerPiano()
  } catch {
    return null
  }
}

export interface OptionsNote {
  /** Vélocité MIDI, de 1 à 127. */
  velocite?: number
  /** Durée en secondes. */
  duree?: number
  /** Instant de départ sur l'horloge audio ; par défaut, immédiatement. */
  instant?: number
}

/** Joue une note isolée. */
export async function jouerNote(midi: number, options: OptionsNote = {}): Promise<void> {
  const piano = await pianoOuRien()
  if (!piano) return

  piano.start({
    note: midi,
    velocity: options.velocite ?? VELOCITE_DEFAUT,
    time: options.instant ?? maintenant(),
    duration: options.duree ?? 1.4,
  })
}

/** Joue plusieurs notes ensemble. */
export async function jouerAccord(notes: number[], options: OptionsNote = {}): Promise<void> {
  const piano = await pianoOuRien()
  if (!piano) return
  const depart = options.instant ?? maintenant()

  for (const midi of notes) {
    piano.start({
      note: midi,
      velocity: options.velocite ?? VELOCITE_DEFAUT,
      time: depart,
      duration: options.duree ?? 2,
    })
  }
}

export interface OptionsMelodie extends OptionsNote {
  /** Durée d'une note en secondes. */
  pas?: number
  /** Proportion du pas réellement tenue, de 0 à 1. Sous 1, les notes sont détachées. */
  legato?: number
  /** Appelé à chaque note, avec son indice — pour synchroniser l'affichage. */
  surNote?: (indice: number, midi: number) => void
}

/**
 * Joue une suite de notes.
 *
 * Rend une fonction d'arrêt : quitter un exercice pendant la lecture doit
 * couper le son, sinon la mélodie continue par-dessus l'écran suivant.
 */
export async function jouerMelodie(
  notes: number[],
  options: OptionsMelodie = {},
): Promise<() => void> {
  const piano = await pianoOuRien()
  if (!piano) return () => {}

  const pas = options.pas ?? 0.6
  const legato = options.legato ?? 0.9
  const depart = (options.instant ?? maintenant()) + 0.08 // petite marge d'ordonnancement
  const minuteurs: number[] = []

  notes.forEach((midi, indice) => {
    const instant = depart + indice * pas

    piano.start({
      note: midi,
      velocity: options.velocite ?? VELOCITE_DEFAUT,
      time: instant,
      duration: pas * legato,
    })

    if (options.surNote) {
      // L'affichage n'a pas besoin de la précision de l'audio : un minuteur
      // suffit pour surligner la note au bon moment à l'œil.
      const delai = Math.max(0, (instant - maintenant()) * 1000)
      minuteurs.push(window.setTimeout(() => options.surNote!(indice, midi), delai))
    }
  })

  return () => {
    for (const minuteur of minuteurs) window.clearTimeout(minuteur)
    piano.stop()
  }
}

/** Joue une gamme montante puis descendante. */
export async function jouerGamme(notes: number[], pas = 0.35): Promise<() => void> {
  const allerRetour = [...notes, ...notes.slice(0, -1).reverse()]
  return jouerMelodie(allerRetour, { pas })
}

/**
 * Joue un intervalle, d'abord note par note puis les deux ensemble.
 *
 * Cet enchaînement est celui utilisé en cours : entendre les notes séparées
 * puis fondues aide à relier la distance mélodique à la couleur harmonique.
 */
export async function jouerIntervalle(
  depart: number,
  arrivee: number,
  options: { ensemble?: boolean; pas?: number } = {},
): Promise<void> {
  const pas = options.pas ?? 0.7
  await jouerMelodie([depart, arrivee], { pas })

  if (options.ensemble !== false) {
    await jouerAccord([depart, arrivee], { instant: maintenant() + pas * 2 + 0.15, duree: 2 })
  }
}

// ---------------------------------------------------------------------------
// Percussion de démonstration pour les rythmes
// ---------------------------------------------------------------------------

/**
 * Joue une frappe rythmique synthétisée.
 *
 * Un bois frappé se synthétise très bien : une sinusoïde brève avec une
 * enveloppe percussive. Préférer la synthèse à un échantillon évite un
 * téléchargement et garantit une attaque parfaitement nette, ce qui compte
 * quand l'enfant doit caler sa frappe dessus.
 */
export function jouerFrappe(instant: number, accentuee = false): void {
  const ctx = obtenirContexte()
  const oscillateur = ctx.createOscillator()
  const enveloppe = ctx.createGain()

  oscillateur.type = 'triangle'
  oscillateur.frequency.value = accentuee ? 1200 : 800

  enveloppe.gain.setValueAtTime(0, instant)
  enveloppe.gain.linearRampToValueAtTime(accentuee ? 0.5 : 0.32, instant + 0.002)
  enveloppe.gain.exponentialRampToValueAtTime(0.0001, instant + 0.09)

  oscillateur.connect(enveloppe)
  enveloppe.connect(sortieInstruments())

  oscillateur.start(instant)
  oscillateur.stop(instant + 0.12)
}

/** Joue une suite de frappes rythmiques à un tempo donné. */
export async function jouerRythme(
  tempsDesFrappes: number[],
  tempo: number,
  options: { instant?: number; surFrappe?: (indice: number) => void } = {},
): Promise<() => void> {
  await debloquerAudio()

  const secondesParTemps = 60 / tempo
  const depart = (options.instant ?? maintenant()) + 0.1
  const minuteurs: number[] = []

  tempsDesFrappes.forEach((temps, indice) => {
    const instant = depart + temps * secondesParTemps
    jouerFrappe(instant, temps % 4 === 0)

    if (options.surFrappe) {
      const delai = Math.max(0, (instant - maintenant()) * 1000)
      minuteurs.push(window.setTimeout(() => options.surFrappe!(indice), delai))
    }
  })

  return () => {
    for (const minuteur of minuteurs) window.clearTimeout(minuteur)
  }
}
