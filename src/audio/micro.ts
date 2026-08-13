/**
 * Écoute du micro et détection de la hauteur chantée.
 *
 * L'algorithme retenu (McLeod, fourni par pitchy) est une autocorrélation
 * normalisée : c'est la famille la plus fiable sur une voix seule, et surtout
 * la plus résistante aux erreurs d'octave — une voix d'enfant est riche en
 * harmoniques, et un détecteur naïf annonce régulièrement l'octave au-dessus.
 *
 * Rien ne sort de l'appareil : le flux du micro est analysé sur place et
 * n'est ni enregistré, ni transmis.
 */

import { PitchDetector } from 'pitchy'
import { obtenirContexte } from './contexte'
import { ecartEnCents, frequenceVersMidi } from '../music/theory'

/** Taille de fenêtre d'analyse : compromis entre précision et réactivité. */
const TAILLE_FENETRE = 2048

/**
 * Seuil de netteté sous lequel la mesure est ignorée.
 *
 * En dessous, il s'agit presque toujours de bruit de fond ou d'un souffle :
 * afficher une note dans ce cas donne un retour faux qui déroute l'enfant.
 */
const NETTETE_MINIMALE = 0.9

/** Bornes de fréquence d'une voix d'enfant, en hertz. */
const FREQUENCE_MIN = 130 // ~do2
const FREQUENCE_MAX = 1100 // ~do6

export interface MesureHauteur {
  /** Fréquence détectée en hertz, ou null si rien d'exploitable. */
  frequence: number | null
  /** Numéro MIDI le plus proche, arrondi. */
  midi: number | null
  /** Écart en centièmes de demi-ton avec la note juste. */
  cents: number | null
  /** Netteté de la mesure, de 0 à 1. */
  nettete: number
  /** Niveau sonore perçu, de 0 à 1. */
  niveau: number
}

export class EcouteMicro {
  #flux: MediaStream | null = null
  #analyseur: AnalyserNode | null = null
  #detecteur: PitchDetector<Float32Array> | null = null
  // Le type précise le tampon sous-jacent : `getFloatTimeDomainData` refuse un
  // Float32Array potentiellement adossé à un SharedArrayBuffer.
  #tampon: Float32Array<ArrayBuffer> | null = null
  #animation: number | null = null
  #actif = false

  get actif(): boolean {
    return this.#actif
  }

  /**
   * Demande l'accès au micro et démarre l'analyse.
   *
   * Lève une erreur explicite si l'accès est refusé : c'est le cas le plus
   * fréquent, et le message doit rester compréhensible par un parent.
   */
  async demarrer(surMesure: (mesure: MesureHauteur) => void): Promise<void> {
    if (this.#actif) return

    try {
      this.#flux = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Ces traitements sont conçus pour la parole et déforment la hauteur
          // d'une note tenue : ils sont désactivés.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
    } catch (cause) {
      throw new Error(
        'Le micro n’est pas accessible. Autorise le microphone dans ton navigateur, puis réessaie.',
        { cause },
      )
    }

    const contexte = obtenirContexte()
    if (contexte.state === 'suspended') await contexte.resume()

    const source = contexte.createMediaStreamSource(this.#flux)

    this.#analyseur = contexte.createAnalyser()
    this.#analyseur.fftSize = TAILLE_FENETRE
    // Le micro n'est jamais renvoyé vers les haut-parleurs : cela provoquerait
    // un larsen immédiat.
    source.connect(this.#analyseur)

    this.#detecteur = PitchDetector.forFloat32Array(this.#analyseur.fftSize)
    this.#detecteur.minVolumeDecibels = -50
    this.#tampon = new Float32Array(this.#analyseur.fftSize)
    this.#actif = true

    const analyser = () => {
      if (!this.#actif) return
      surMesure(this.#mesurer())
      this.#animation = requestAnimationFrame(analyser)
    }
    analyser()
  }

  #mesurer(): MesureHauteur {
    const analyseur = this.#analyseur!
    const tampon = this.#tampon!
    analyseur.getFloatTimeDomainData(tampon)

    // Niveau efficace du signal, pour animer un témoin de volume.
    let somme = 0
    for (const echantillon of tampon) somme += echantillon * echantillon
    const niveau = Math.min(1, Math.sqrt(somme / tampon.length) * 6)

    const [frequence, nettete] = this.#detecteur!.findPitch(tampon, analyseur.context.sampleRate)

    const exploitable =
      nettete >= NETTETE_MINIMALE && frequence >= FREQUENCE_MIN && frequence <= FREQUENCE_MAX

    if (!exploitable) {
      return { frequence: null, midi: null, cents: null, nettete, niveau }
    }

    const midi = Math.round(frequenceVersMidi(frequence))
    return { frequence, midi, cents: ecartEnCents(frequence, midi), nettete, niveau }
  }

  /** Coupe l'analyse et libère le micro. */
  arreter(): void {
    this.#actif = false

    if (this.#animation !== null) {
      cancelAnimationFrame(this.#animation)
      this.#animation = null
    }

    // Libérer explicitement les pistes éteint le témoin d'enregistrement du
    // navigateur, ce qui rassure sur le fait que l'écoute est bien terminée.
    this.#flux?.getTracks().forEach((piste) => piste.stop())
    this.#flux = null
    this.#analyseur = null
    this.#detecteur = null
    this.#tampon = null
  }
}

/**
 * Décrit la justesse en mots plutôt qu'en chiffres.
 *
 * Un enfant de huit ans ne sait pas quoi faire d'un écart de « -37 cents ».
 * La marge de 25 cents pour « juste » correspond à ce qu'un auditeur perçoit
 * comme correct sur une note tenue.
 */
export function decrireJustesse(cents: number | null): {
  texte: string
  etat: 'juste' | 'haut' | 'bas' | 'inconnu'
} {
  if (cents === null) return { texte: 'Chante une note…', etat: 'inconnu' }
  if (Math.abs(cents) <= 25) return { texte: 'Juste !', etat: 'juste' }
  if (cents > 0) return { texte: cents > 60 ? 'Trop haut' : 'Un peu haut', etat: 'haut' }
  return { texte: cents < -60 ? 'Trop bas' : 'Un peu bas', etat: 'bas' }
}
