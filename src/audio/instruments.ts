/**
 * Chargement des instruments échantillonnés.
 *
 * Le piano retenu est le SplendidGrandPiano de smplr : des échantillons de
 * Steinway répartis sur quatre couches de vélocité. C'est ce qui se fait de
 * mieux en accès libre pour le web, et les couches de vélocité comptent
 * beaucoup ici — un piano à une seule couche sonne artificiel dès qu'on
 * nuance, et l'enfant doit entendre la différence entre doux et fort.
 *
 * Les échantillons pèsent lourd : le chargement est différé jusqu'au premier
 * besoin réel de son, et sa progression est exposée pour l'afficher.
 */

import { CacheStorage, SplendidGrandPiano } from 'smplr'
import { obtenirContexte, sortieInstruments } from './contexte'

export interface EtatChargement {
  /** Fraction chargée, de 0 à 1. */
  progression: number
  pret: boolean
  erreur: string | null
}

type Instrument = ReturnType<typeof SplendidGrandPiano>

let piano: Instrument | null = null
let chargement: Promise<Instrument> | null = null

const etat: EtatChargement = { progression: 0, pret: false, erreur: null }
const abonnes = new Set<(etat: EtatChargement) => void>()

function notifier(): void {
  for (const abonne of abonnes) abonne({ ...etat })
}

/** S'abonne à la progression du chargement. Rend la fonction de désabonnement. */
export function suivreChargement(rappel: (etat: EtatChargement) => void): () => void {
  abonnes.add(rappel)
  rappel({ ...etat })
  return () => abonnes.delete(rappel)
}

/**
 * Charge le piano, ou rend l'instance déjà chargée.
 *
 * Les appels concurrents partagent la même promesse : plusieurs exercices
 * peuvent demander le piano en même temps sans déclencher plusieurs
 * téléchargements.
 */
export function chargerPiano(): Promise<Instrument> {
  if (piano) return Promise.resolve(piano)
  if (chargement) return chargement

  chargement = (async () => {
    const contexte = obtenirContexte()

    const instrument = SplendidGrandPiano(contexte, {
      destination: sortieInstruments(),
      volume: 100,
      // Les échantillons sont conservés dans le cache du navigateur : sans
      // cela ils se retéléchargent à chaque session, ce qui rend
      // l'application inutilisable sur une connexion capricieuse — et
      // impossible hors-ligne.
      storage: new CacheStorage('solfege-piano'),
      onLoadProgress: (progres) => {
        const total = progres.total || 1
        etat.progression = Math.min(1, progres.loaded / total)
        notifier()
      },
    })

    try {
      await instrument.ready
    } catch (cause) {
      etat.erreur =
        'Le piano n’a pas pu être chargé. Vérifie ta connexion internet, puis recharge la page.'
      notifier()
      chargement = null
      throw cause
    }

    piano = instrument
    etat.progression = 1
    etat.pret = true
    etat.erreur = null
    notifier()
    return instrument
  })()

  return chargement
}

/** Rend le piano s'il est déjà chargé, sans déclencher de chargement. */
export function pianoCharge(): Instrument | null {
  return piano
}

/** Coupe toutes les notes en cours. */
export function toutArreter(): void {
  piano?.stop()
}
