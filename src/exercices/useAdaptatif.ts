/**
 * Pont entre le suivi de maîtrise et les générateurs d'exercices.
 *
 * Les générateurs restent des fonctions pures : ils reçoivent une fonction de
 * poids, sans rien connaître du magasin. Ce hook fabrique cette fonction à
 * partir de la maîtrise enregistrée.
 *
 * L'instantané de maîtrise est figé au montage de l'exercice. Le recalculer à
 * chaque réponse ferait dériver la difficulté au milieu d'une série, ce qui
 * est déroutant : une série garde le profil qu'elle avait au départ, et
 * l'adaptation s'applique à la suivante.
 */

import { useMemo } from 'react'
import {
  type CleMaitrise,
  cleIntervalle,
  cleNote,
  poidsMaitrise,
  useProgression,
} from '../store/progression'
import type { PoidsParIntervalle, PoidsParMidi } from '../music/generateurs'
import type { Cle } from '../music/theory'

/**
 * Lit la maîtrise une seule fois, sans s'abonner au magasin.
 *
 * S'y abonner ferait re-rendre l'exercice à chaque écriture de progression
 * pour une valeur qu'on fige de toute façon — et l'écriture a justement lieu
 * en fin de série, au pire moment.
 */
function maitriseFigee() {
  return useProgression.getState().maitrise
}

/** Fonction de poids pour la lecture de notes dans une clé donnée. */
export function usePoidsNotes(cle: Cle): PoidsParMidi {
  return useMemo(() => {
    const figee = maitriseFigee()
    return (midi: number) => poidsMaitrise(figee[cleNote(cle, midi)])
  }, [cle])
}

/** Fonction de poids pour les intervalles. */
export function usePoidsIntervalles(): PoidsParIntervalle {
  return useMemo(() => {
    const figee = maitriseFigee()
    return (nom: string) => poidsMaitrise(figee[cleIntervalle(nom)])
  }, [])
}

/** Traduit une clé de maîtrise en libellé lisible par un parent. */
export function decrireCleMaitrise(cle: CleMaitrise): string {
  const [type, valeur] = cle.split(':')
  if (!valeur) return cle

  if (type === 'intervalle') return `Intervalle : ${valeur}`

  if (type === 'lecture-sol' || type === 'lecture-fa') {
    const nomCle = type === 'lecture-sol' ? 'clé de sol' : 'clé de fa'
    return `${nomNoteDepuisMidi(Number(valeur))} en ${nomCle}`
  }

  return cle
}

/** Nom français d'une note à partir de son numéro MIDI, octave comprise. */
function nomNoteDepuisMidi(midi: number): string {
  const noms = ['do', 'do♯', 'ré', 'ré♯', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'la♯', 'si']
  const nom = noms[((midi % 12) + 12) % 12]!
  // Octave à la française : le do central est « do3 ».
  const octave = Math.floor(midi / 12) - 2
  return `${nom}${octave}`
}
