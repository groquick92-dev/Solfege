/**
 * Contexte audio partagé et chaîne de sortie.
 *
 * Un seul AudioContext existe pour toute l'application : les navigateurs en
 * limitent le nombre, et en ouvrir un par exercice finit par saturer l'onglet.
 *
 * Chaîne de sortie :
 *
 *     instrument ─┬─► gain principal ─► limiteur ─► sortie
 *                 └─► réverbération ─► gain d'ambiance ─┘
 *
 * Le limiteur est indispensable ici : un enfant qui plaque dix touches de
 * piano échantillonné en même temps sature une sortie casque sans lui, et la
 * distorsion qui en résulte est désagréable autant que mauvaise pour l'oreille.
 */

let contexte: AudioContext | null = null
let gainPrincipal: GainNode | null = null
let entreeInstruments: GainNode | null = null
let gainAmbiance: GainNode | null = null

/** Volume principal par défaut, sur une échelle linéaire de 0 à 1. */
const VOLUME_DEFAUT = 0.8

/** Proportion de réverbération ajoutée au signal direct. */
const AMBIANCE_DEFAUT = 0.18

/**
 * Rend le contexte audio, en le créant au besoin.
 *
 * Le contexte démarre souvent suspendu : les navigateurs exigent un geste de
 * l'utilisateur avant de laisser un site émettre du son. `debloquerAudio` doit
 * donc être appelé depuis un gestionnaire d'événement réel.
 */
export function obtenirContexte(): AudioContext {
  if (contexte) return contexte

  contexte = new AudioContext({
    // « interactive » demande la plus faible latence possible : un métronome
    // ou un clavier joué en direct doit répondre sous les 20 ms.
    latencyHint: 'interactive',
    sampleRate: 48000,
  })

  construireChaine(contexte)
  return contexte
}

function construireChaine(ctx: AudioContext): void {
  entreeInstruments = ctx.createGain()
  entreeInstruments.gain.value = 1

  gainPrincipal = ctx.createGain()
  gainPrincipal.gain.value = VOLUME_DEFAUT

  // Compresseur réglé en limiteur doux : il n'agit qu'aux crêtes et laisse
  // intacte la dynamique normale du jeu.
  const limiteur = ctx.createDynamicsCompressor()
  limiteur.threshold.value = -6
  limiteur.knee.value = 6
  limiteur.ratio.value = 12
  limiteur.attack.value = 0.003
  limiteur.release.value = 0.25

  // Réverbération par convolution, sur une impulsion synthétisée : pas de
  // fichier à télécharger, et une queue sonore suffisante pour poser les notes.
  const reverberation = ctx.createConvolver()
  reverberation.buffer = construireImpulsion(ctx, 1.6, 2.2)

  gainAmbiance = ctx.createGain()
  gainAmbiance.gain.value = AMBIANCE_DEFAUT

  entreeInstruments.connect(gainPrincipal)
  entreeInstruments.connect(reverberation)
  reverberation.connect(gainAmbiance)
  gainAmbiance.connect(gainPrincipal)

  gainPrincipal.connect(limiteur)
  limiteur.connect(ctx.destination)
}

/**
 * Synthétise une réponse impulsionnelle : bruit blanc en décroissance
 * exponentielle, décorrélé entre les deux canaux pour élargir l'image stéréo.
 */
function construireImpulsion(ctx: AudioContext, duree: number, decroissance: number): AudioBuffer {
  const longueur = Math.floor(ctx.sampleRate * duree)
  const buffer = ctx.createBuffer(2, longueur, ctx.sampleRate)

  for (let canal = 0; canal < 2; canal++) {
    const donnees = buffer.getChannelData(canal)
    for (let i = 0; i < longueur; i++) {
      donnees[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / longueur, decroissance)
    }
  }

  return buffer
}

/** Nœud sur lequel brancher tous les instruments. */
export function sortieInstruments(): AudioNode {
  obtenirContexte()
  return entreeInstruments!
}

/**
 * Réveille le contexte audio. À appeler depuis un vrai geste de l'utilisateur
 * (clic, appui) sans quoi le navigateur refuse de démarrer le son.
 */
export async function debloquerAudio(): Promise<void> {
  const ctx = obtenirContexte()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

/** Le son est-il utilisable immédiatement ? */
export function audioPret(): boolean {
  return contexte !== null && contexte.state === 'running'
}

/** Règle le volume principal, de 0 à 1. */
export function reglerVolume(valeur: number): void {
  obtenirContexte()
  const borne = Math.max(0, Math.min(1, valeur))
  // Une rampe courte évite le claquement produit par un saut de gain brutal.
  gainPrincipal!.gain.setTargetAtTime(borne, contexte!.currentTime, 0.02)
}

/** Règle la quantité de réverbération, de 0 à 1. */
export function reglerAmbiance(valeur: number): void {
  obtenirContexte()
  const borne = Math.max(0, Math.min(1, valeur))
  gainAmbiance!.gain.setTargetAtTime(borne, contexte!.currentTime, 0.02)
}

/** Horloge du contexte audio, en secondes. */
export function maintenant(): number {
  return obtenirContexte().currentTime
}

/** Libère le contexte — utilisé par les tests. */
export async function fermerContexte(): Promise<void> {
  if (!contexte) return
  await contexte.close()
  contexte = null
  gainPrincipal = null
  entreeInstruments = null
  gainAmbiance = null
}
