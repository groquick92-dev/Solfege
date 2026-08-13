/**
 * Rendu d'une portée avec VexFlow.
 *
 * VexFlow dessine dans un élément du DOM qu'il gère lui-même. Le composant
 * vide donc son conteneur puis relance un rendu complet à chaque changement :
 * les partitions affichées ici tiennent en quelques mesures, et un rendu
 * intégral reste bien plus simple à garder juste qu'un rendu incrémental.
 */

import { useEffect, useRef, useState } from 'react'
// Le point d'entrée par défaut embarque six polices musicales (Bravura,
// Gonville, Petaluma…). Celui-ci n'en charge qu'une, la seule utilisée ici, et
// divise par trois le poids du module.
import {
  Accidental,
  BarNote,
  Beam,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  type Note as NoteVexFlow,
} from 'vexflow/bravura'
import { type Cle, type Note, accidentVexFlow, cleVexFlow, midiVersNote } from '../music/theory'
import { valeur } from '../music/rythme'

/** Couleurs de retour, reprises des jetons de la feuille de style. */
export const COULEURS = {
  neutre: '#4a4458',
  juste: '#2f8c78',
  faux: '#d4552f',
  cible: '#7d5cc2',
  estompee: '#c9c4d4',
} as const

export type CouleurNote = keyof typeof COULEURS

export interface NoteAffichee {
  /** Hauteur en MIDI ; absente pour un silence. */
  midi?: number
  /** Identifiant de valeur rythmique ; noire par défaut. */
  duree?: string
  /** Couleur de la tête de note. */
  couleur?: CouleurNote
  /** Silence plutôt que note. */
  silence?: boolean
}

export interface ProprietesPortee {
  notes: NoteAffichee[]
  cle?: Cle
  /** Chiffrage affiché, par exemple « 4/4 ». */
  mesure?: string
  /** Hauteur du rendu en pixels. */
  hauteur?: number
  /** Largeur minimale avant défilement horizontal. */
  largeurMin?: number
  /** Regroupe les croches sous des barres de ligature. */
  ligatures?: boolean
  /**
   * Nombre de temps par mesure. Quand il est fourni, une barre de mesure est
   * tracée à chaque groupe complet — sans quoi une ligne de huit temps se lit
   * comme une seule longue mesure.
   */
  tempsParMesure?: number
  /** Texte de remplacement pour les lecteurs d'écran. */
  description?: string
  className?: string
}

/** Correspondance entre les clés du solfège français et celles de VexFlow. */
const CLE_VEXFLOW: Record<Cle, string> = { sol: 'treble', fa: 'bass' }

/**
 * Position de repos des silences, par clé.
 *
 * VexFlow ne devine pas où poser un silence : sans indication il l'empile sur
 * la ligne du bas. On le centre sur la troisième ligne, comme dans l'usage.
 */
const LIGNE_SILENCE: Record<Cle, string> = { sol: 'b/4', fa: 'd/3' }

export function Portee({
  notes,
  cle = 'sol',
  mesure,
  hauteur = 160,
  largeurMin = 320,
  ligatures = true,
  tempsParMesure,
  description,
  className,
}: ProprietesPortee) {
  const conteneur = useRef<HTMLDivElement>(null)
  const [largeur, setLargeur] = useState(largeurMin)

  // La portée doit suivre la largeur disponible : l'application est utilisée
  // aussi bien sur un téléphone que sur l'écran d'un ordinateur familial.
  useEffect(() => {
    const element = conteneur.current
    if (!element) return

    const observateur = new ResizeObserver(([entree]) => {
      if (entree) setLargeur(Math.max(largeurMin, entree.contentRect.width))
    })
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [largeurMin])

  useEffect(() => {
    const element = conteneur.current
    if (!element || notes.length === 0) return

    element.replaceChildren()

    const renderer = new Renderer(element, Renderer.Backends.SVG)
    renderer.resize(largeur, hauteur)
    const contexte = renderer.getContext()

    // VexFlow répartit les notes sur toute la largeur de la portée. Sur une
    // question à une seule note, cela la colle contre la clé et laisse un vide
    // à droite : la portée est donc dimensionnée d'après son contenu, puis
    // centrée.
    const largeurBase = 60 + (mesure ? 30 : 0)
    const largeurUtile = Math.min(largeur - 20, largeurBase + notes.length * 58)
    const x = Math.max(10, (largeur - largeurUtile) / 2)

    const portee = new Stave(x, 20, largeurUtile)
    portee.addClef(CLE_VEXFLOW[cle])
    if (mesure) portee.addTimeSignature(mesure)
    portee.setContext(contexte).draw()

    // Les notes sont groupées par mesure : les barres de mesure s'insèrent
    // entre les groupes, et les ligatures ne doivent jamais les enjamber.
    const groupes = grouperParMesure(notes, tempsParMesure)
    const tickables: NoteVexFlow[] = []
    const barresLigature: Beam[] = []

    groupes.forEach((groupe, index) => {
      if (index > 0) tickables.push(new BarNote())
      const notesGroupe = groupe.map((n) => construireNote(n, cle))

      // Les ligatures se calculent avant la mise en page : elles fixent le sens
      // des hampes et suppriment les crochets, dont le formateur doit tenir
      // compte pour espacer correctement.
      if (ligatures) barresLigature.push(...Beam.generateBeams(notesGroupe))
      tickables.push(...notesGroupe)
    })

    // `FormatAndDraw` est typé `StemmableNote[]`, mais construit en interne une
    // voix acceptant n'importe quel tickable — c'est ainsi que VexFlow insère
    // lui-même les barres de mesure. Le transtypage compense un type trop
    // étroit, pas un usage détourné.
    Formatter.FormatAndDraw(contexte, portee, tickables as StaveNote[])
    for (const barre of barresLigature) barre.setContext(contexte).draw()

    // VexFlow produit un SVG sans étiquette : sans cela, un lecteur d'écran
    // annonce un bloc graphique vide.
    const svg = element.querySelector('svg')
    if (svg) {
      svg.setAttribute('role', 'img')
      svg.setAttribute('aria-label', description ?? decrirePortee(notes, cle))
      svg.style.display = 'block'
      svg.style.margin = '0 auto'
    }
  }, [notes, cle, mesure, hauteur, largeur, ligatures, tempsParMesure, description])

  return (
    <div
      ref={conteneur}
      className={className}
      style={{ minWidth: largeurMin, overflowX: 'auto' }}
    />
  )
}

/**
 * Découpe les notes en mesures.
 *
 * Sans nombre de temps par mesure, tout tient dans un seul groupe et aucune
 * barre n'est tracée — le cas des exemples de cours, où l'on montre quelques
 * notes hors de tout contexte métrique.
 */
function grouperParMesure(notes: NoteAffichee[], tempsParMesure?: number): NoteAffichee[][] {
  if (!tempsParMesure || tempsParMesure <= 0) return [notes]

  const groupes: NoteAffichee[][] = []
  let courant: NoteAffichee[] = []
  let cumul = 0

  for (const note of notes) {
    courant.push(note)
    cumul += valeur(note.duree ?? 'noire').temps

    // La tolérance absorbe les durées fractionnaires comme la double-croche.
    if (cumul >= tempsParMesure - 1e-9) {
      groupes.push(courant)
      courant = []
      cumul = 0
    }
  }

  if (courant.length > 0) groupes.push(courant)
  return groupes
}

/** Construit une note VexFlow à partir de sa description. */
function construireNote(affichee: NoteAffichee, cle: Cle): StaveNote {
  const v = valeur(affichee.duree ?? 'noire')
  const duree = affichee.silence ? `${v.code}r` : v.code

  const cles = affichee.silence
    ? [LIGNE_SILENCE[cle]]
    : [cleVexFlow(midiVersNote(affichee.midi ?? 60))]

  const note = new StaveNote({ keys: cles, duration: duree, clef: CLE_VEXFLOW[cle] })

  if (!affichee.silence && affichee.midi !== undefined) {
    const alteration = accidentVexFlow(midiVersNote(affichee.midi))
    if (alteration) note.addModifier(new Accidental(alteration), 0)
  }

  if (v.pointee) Dot.buildAndAttach([note], { all: true })

  const couleur = COULEURS[affichee.couleur ?? 'neutre']
  note.setStyle({ fillStyle: couleur, strokeStyle: couleur })

  return note
}

/** Description textuelle de la portée, pour les lecteurs d'écran. */
function decrirePortee(notes: NoteAffichee[], cle: Cle): string {
  const noms = notes.map((n) => {
    if (n.silence) return 'silence'
    return nomLisible(midiVersNote(n.midi ?? 60))
  })
  return `Portée en clé de ${cle} : ${noms.join(', ')}`
}

function nomLisible(note: Note): string {
  const noms = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si']
  const suffixe = note.alteration === 1 ? ' dièse' : note.alteration === -1 ? ' bémol' : ''
  return noms[note.degre] + suffixe
}
