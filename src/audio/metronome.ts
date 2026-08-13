/**
 * Métronome à ordonnancement anticipé.
 *
 * Le principe est celui décrit par Chris Wilson dans « A Tale of Two Clocks » :
 * un minuteur JavaScript peu fréquent réveille l'ordonnanceur, qui programme
 * à l'avance les clics sur l'horloge audio. Le minuteur peut dériver sans
 * conséquence, puisqu'il ne fait que préparer des événements dont l'instant
 * exact est déjà fixé.
 *
 * Battre la mesure est l'exercice le plus exigeant du premier cycle en matière
 * de régularité : un métronome qui flotte de 30 ms rend le travail impossible.
 */

import { debloquerAudio, maintenant } from './contexte'
import { jouerFrappe } from './lecture'

/** Fréquence de réveil de l'ordonnanceur, en millisecondes. */
const PERIODE_REVEIL = 25

/** Horizon d'ordonnancement, en secondes. */
const ANTICIPATION = 0.12

export interface OptionsMetronome {
  tempo: number
  /** Nombre de temps par mesure ; le premier est accentué. */
  tempsParMesure: number
  /** Appelé à chaque temps, pour animer l'affichage. */
  surTemps?: (temps: number, mesure: number) => void
  /** Nombre de mesures à jouer ; illimité si absent. */
  nbMesures?: number
  /** Appelé quand le nombre de mesures demandé est atteint. */
  surFin?: () => void
}

export class Metronome {
  #options: OptionsMetronome
  #minuteur: number | null = null
  #prochainTemps = 0
  #compteur = 0
  #enMarche = false

  constructor(options: OptionsMetronome) {
    this.#options = options
  }

  get enMarche(): boolean {
    return this.#enMarche
  }

  get tempo(): number {
    return this.#options.tempo
  }

  /**
   * Change le tempo en cours de route.
   *
   * Le prochain temps déjà programmé n'est pas replanifié : modifier le tempo
   * pendant que l'enfant bat la mesure ne doit pas produire de saccade.
   */
  reglerTempo(tempo: number): void {
    this.#options.tempo = Math.max(30, Math.min(240, tempo))
  }

  async demarrer(): Promise<void> {
    if (this.#enMarche) return
    await debloquerAudio()

    this.#enMarche = true
    this.#compteur = 0
    this.#prochainTemps = maintenant() + 0.1
    this.#ordonnancer()
  }

  arreter(): void {
    if (this.#minuteur !== null) {
      window.clearInterval(this.#minuteur)
      this.#minuteur = null
    }
    this.#enMarche = false
  }

  #ordonnancer(): void {
    this.#minuteur = window.setInterval(() => {
      const { tempsParMesure, nbMesures, surTemps, surFin } = this.#options
      const secondesParTemps = 60 / this.#options.tempo

      while (this.#prochainTemps < maintenant() + ANTICIPATION) {
        if (nbMesures !== undefined && this.#compteur >= nbMesures * tempsParMesure) {
          this.arreter()
          surFin?.()
          return
        }

        const temps = this.#compteur % tempsParMesure
        const mesure = Math.floor(this.#compteur / tempsParMesure)

        jouerFrappe(this.#prochainTemps, temps === 0)

        if (surTemps) {
          const delai = Math.max(0, (this.#prochainTemps - maintenant()) * 1000)
          window.setTimeout(() => surTemps(temps, mesure), delai)
        }

        this.#prochainTemps += secondesParTemps
        this.#compteur++
      }
    }, PERIODE_REVEIL)
  }
}

/**
 * Joue un décompte préparatoire d'une mesure, puis résout.
 *
 * Indispensable avant tout exercice rythmique : sans décompte, l'enfant n'a
 * aucun moyen de savoir à quelle vitesse il devra frapper.
 */
export async function decompte(tempo: number, temps: number): Promise<void> {
  await debloquerAudio()

  const secondesParTemps = 60 / tempo
  const depart = maintenant() + 0.1

  for (let i = 0; i < temps; i++) {
    jouerFrappe(depart + i * secondesParTemps, i === 0)
  }

  const duree = (depart + temps * secondesParTemps - maintenant()) * 1000
  await new Promise((resoudre) => window.setTimeout(resoudre, duree))
}
