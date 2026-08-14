/**
 * Progression de l'élève.
 *
 * Tout est conservé dans le navigateur, sans compte ni serveur. Ce choix est
 * délibéré : l'application s'adresse à un enfant, et ne rien collecter reste
 * la façon la plus sûre de traiter ses données. La contrepartie est que la
 * progression est liée à un appareil et à un navigateur — d'où la possibilité
 * d'exporter et de réimporter un profil.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MODULES } from '../content/programme'

/** Résultat conservé pour une activité. */
export interface ResultatActivite {
  /** Meilleur nombre d'étoiles obtenu, de 0 à 3. */
  etoiles: number
  /** Meilleur score en pourcentage. */
  meilleurScore: number
  /** Nombre de fois où l'activité a été jouée. */
  tentatives: number
  /** Date ISO de la dernière pratique. */
  derniereFois: string
  /** Temps cumulé passé sur l'activité, en secondes. */
  tempsTotal: number
}

/**
 * Maîtrise d'un élément isolé — une note, un intervalle.
 *
 * C'est le grain fin de la progression : savoir qu'une série vaut 70 % ne dit
 * pas *quoi* retravailler. Ces compteurs alimentent à la fois le tirage
 * adaptatif et le bilan destiné aux parents.
 */
export interface Maitrise {
  vues: number
  erreurs: number
  /** Date ISO de la dernière rencontre. */
  derniereFois: string
}

/** Identifiant d'un élément travaillé, par exemple « lecture-sol:64 ». */
export type CleMaitrise = string

/** Construit la clé de maîtrise d'une note lue dans une clé donnée. */
export function cleNote(cle: 'sol' | 'fa', midi: number): CleMaitrise {
  return `lecture-${cle}:${midi}`
}

/** Construit la clé de maîtrise d'un intervalle. */
export function cleIntervalle(nom: string): CleMaitrise {
  return `intervalle:${nom}`
}

export interface Badge {
  id: string
  nom: string
  description: string
  emoji: string
}

/** Badges décernés automatiquement selon la progression. */
export const BADGES: readonly Badge[] = [
  { id: 'premiere-note', nom: 'Première note', description: 'Terminer une première activité', emoji: '🎵' },
  { id: 'lecteur-sol', nom: 'As de la clé de sol', description: 'Trois étoiles sur toute la lecture en clé de sol', emoji: '🎼' },
  { id: 'lecteur-fa', nom: 'Explorateur des graves', description: 'Trois étoiles sur une activité en clé de fa', emoji: '🔑' },
  { id: 'oreille-fine', nom: 'Oreille fine', description: 'Trois étoiles à un exercice d’intervalles', emoji: '👂' },
  { id: 'dans-le-rythme', nom: 'Dans le rythme', description: 'Trois étoiles à un exercice de rythme', emoji: '🥁' },
  { id: 'chanteur', nom: 'Belle voix', description: 'Réussir un exercice de chant', emoji: '🎤' },
  { id: 'serie-3', nom: 'Régulier', description: 'Jouer trois jours d’affilée', emoji: '🔥' },
  { id: 'serie-7', nom: 'Une semaine entière', description: 'Jouer sept jours d’affilée', emoji: '🏆' },
  { id: 'cent-notes', nom: 'Cent notes', description: 'Répondre juste à cent questions', emoji: '💯' },
  { id: 'theoricien', nom: 'Petit théoricien', description: 'Lire tous les cours', emoji: '📚' },
]

export interface Reglages {
  /** Volume principal, de 0 à 1. */
  volume: number
  /** Quantité de réverbération, de 0 à 1. */
  ambiance: number
  /** Tempo de travail par défaut. */
  tempo: number
  /** Affiche le nom des notes sous la portée — béquille des premières séances. */
  aideNoms: boolean
}

interface EtatProgression {
  prenom: string
  avatar: string
  resultats: Record<string, ResultatActivite>
  coursLus: string[]
  badges: string[]
  /** Nombre total de bonnes réponses, toutes activités confondues. */
  bonnesReponses: number
  /** Date ISO du dernier jour joué. */
  dernierJour: string | null
  /** Nombre de jours consécutifs. */
  serie: number
  /** Maîtrise élément par élément, pour le tirage adaptatif et le bilan. */
  maitrise: Record<CleMaitrise, Maitrise>
  reglages: Reglages

  definirProfil: (prenom: string, avatar: string) => void
  enregistrerResultat: (
    activiteId: string,
    score: number,
    bonnesReponses?: number,
    secondes?: number,
  ) => number
  enregistrerReponses: (reponses: { cle: CleMaitrise; juste: boolean }[]) => void
  marquerCoursLu: (coursId: string) => void
  modifierReglages: (reglages: Partial<Reglages>) => void
  reinitialiser: () => void
  exporter: () => string
  importer: (donnees: string) => boolean
}

/** Convertit un score sur 100 en nombre d'étoiles. */
export function etoilesPourScore(score: number): number {
  if (score >= 90) return 3
  if (score >= 70) return 2
  if (score >= 50) return 1
  return 0
}

/** Date du jour au format AAAA-MM-JJ, en heure locale. */
function aujourdhui(): string {
  const maintenant = new Date()
  const decalage = maintenant.getTimezoneOffset() * 60_000
  return new Date(maintenant.getTime() - decalage).toISOString().slice(0, 10)
}

/** Nombre de jours entre deux dates au format AAAA-MM-JJ. */
function ecartEnJours(depuis: string, jusqua: string): number {
  const a = Date.parse(`${depuis}T00:00:00`)
  const b = Date.parse(`${jusqua}T00:00:00`)
  return Math.round((b - a) / 86_400_000)
}

const REGLAGES_DEFAUT: Reglages = { volume: 0.8, ambiance: 0.18, tempo: 80, aideNoms: true }

const ETAT_INITIAL = {
  prenom: '',
  avatar: '🦊',
  resultats: {} as Record<string, ResultatActivite>,
  coursLus: [] as string[],
  badges: [] as string[],
  bonnesReponses: 0,
  dernierJour: null as string | null,
  serie: 0,
  maitrise: {} as Record<CleMaitrise, Maitrise>,
  reglages: REGLAGES_DEFAUT,
}

export const useProgression = create<EtatProgression>()(
  persist(
    (set, get) => ({
      ...ETAT_INITIAL,

      definirProfil: (prenom, avatar) => set({ prenom: prenom.trim().slice(0, 20), avatar }),

      /**
       * Enregistre le résultat d'une activité et rend le nombre d'étoiles.
       *
       * Seul le meilleur résultat est conservé : rejouer une activité déjà
       * réussie ne doit jamais faire baisser le score affiché, sinon l'enfant
       * évite de s'entraîner sur ce qu'il maîtrise.
       */
      enregistrerResultat: (activiteId, score, bonnesReponses = 0, secondes = 0) => {
        const etat = get()
        const etoiles = etoilesPourScore(score)
        const precedent = etat.resultats[activiteId]
        const jour = aujourdhui()

        // Série quotidienne : conservée si la veille a été jouée, remise à 1
        // après une interruption. Rejouer le même jour ne la change pas.
        let serie = etat.serie
        if (etat.dernierJour !== jour) {
          const ecart = etat.dernierJour ? ecartEnJours(etat.dernierJour, jour) : Infinity
          serie = ecart === 1 ? etat.serie + 1 : 1
        }

        const resultats = {
          ...etat.resultats,
          [activiteId]: {
            etoiles: Math.max(precedent?.etoiles ?? 0, etoiles),
            meilleurScore: Math.max(precedent?.meilleurScore ?? 0, score),
            tentatives: (precedent?.tentatives ?? 0) + 1,
            derniereFois: new Date().toISOString(),
            tempsTotal: (precedent?.tempsTotal ?? 0) + Math.max(0, Math.round(secondes)),
          },
        }

        const total = etat.bonnesReponses + bonnesReponses
        set({
          resultats,
          bonnesReponses: total,
          dernierJour: jour,
          serie,
          badges: attribuerBadges({ ...etat, resultats, bonnesReponses: total, serie }),
        })

        return etoiles
      },

      /**
       * Enregistre le détail des réponses, élément par élément.
       *
       * Appelé une fois en fin de série plutôt qu'à chaque question : écrire
       * dans le stockage local à chaque clic ferait ramer l'exercice sur une
       * tablette d'entrée de gamme.
       */
      enregistrerReponses: (reponses) => {
        if (reponses.length === 0) return
        const maitrise = { ...get().maitrise }
        const horodatage = new Date().toISOString()

        for (const { cle, juste } of reponses) {
          const precedent = maitrise[cle]
          maitrise[cle] = {
            vues: (precedent?.vues ?? 0) + 1,
            erreurs: (precedent?.erreurs ?? 0) + (juste ? 0 : 1),
            derniereFois: horodatage,
          }
        }

        set({ maitrise })
      },

      marquerCoursLu: (coursId) => {
        const etat = get()
        if (etat.coursLus.includes(coursId)) return
        const coursLus = [...etat.coursLus, coursId]
        set({ coursLus, badges: attribuerBadges({ ...etat, coursLus }) })
      },

      modifierReglages: (reglages) =>
        set((etat) => ({ reglages: { ...etat.reglages, ...reglages } })),

      reinitialiser: () => set({ ...ETAT_INITIAL, reglages: get().reglages }),

      exporter: () => {
        const { prenom, avatar, resultats, coursLus, badges, bonnesReponses, dernierJour, serie, maitrise } =
          get()
        return JSON.stringify(
          { version: 2, prenom, avatar, resultats, coursLus, badges, bonnesReponses, dernierJour, serie, maitrise },
          null,
          2,
        )
      },

      /**
       * Recharge un profil exporté.
       *
       * Le contenu vient d'un fichier choisi par l'utilisateur : chaque champ
       * est donc vérifié avant d'être injecté dans l'état, plutôt que d'étaler
       * l'objet reçu tel quel.
       */
      importer: (donnees) => {
        try {
          const brut: unknown = JSON.parse(donnees)
          if (typeof brut !== 'object' || brut === null) return false
          const profil = brut as Record<string, unknown>

          set({
            prenom: typeof profil.prenom === 'string' ? profil.prenom.slice(0, 20) : '',
            avatar: typeof profil.avatar === 'string' ? profil.avatar : '🦊',
            resultats: estObjet(profil.resultats)
              ? (profil.resultats as Record<string, ResultatActivite>)
              : {},
            coursLus: Array.isArray(profil.coursLus) ? profil.coursLus.filter(estChaine) : [],
            badges: Array.isArray(profil.badges) ? profil.badges.filter(estChaine) : [],
            bonnesReponses: typeof profil.bonnesReponses === 'number' ? profil.bonnesReponses : 0,
            dernierJour: typeof profil.dernierJour === 'string' ? profil.dernierJour : null,
            serie: typeof profil.serie === 'number' ? profil.serie : 0,
            // Absent des profils exportés en version 1 : on repart d'une
            // maîtrise vide plutôt que de refuser un fichier plus ancien.
            maitrise: estObjet(profil.maitrise)
              ? (profil.maitrise as Record<CleMaitrise, Maitrise>)
              : {},
          })
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'solfege-progression',
      version: 2,
      /**
       * Complète les profils enregistrés avant l'ajout du suivi de maîtrise
       * et du temps passé. Sans cela, un enfant qui a déjà joué retrouverait
       * un état incomplet et l'application planterait à la première lecture
       * de `tempsTotal`.
       */
      migrate: (persiste, versionPrecedente) => {
        const etat = persiste as Partial<EtatProgression>
        if (versionPrecedente >= 2) return etat

        return {
          ...etat,
          maitrise: {},
          resultats: Object.fromEntries(
            Object.entries(etat.resultats ?? {}).map(([id, resultat]) => [
              id,
              { ...resultat, tempsTotal: resultat.tempsTotal ?? 0 },
            ]),
          ),
        }
      },
    },
  ),
)

function estChaine(valeur: unknown): valeur is string {
  return typeof valeur === 'string'
}

function estObjet(valeur: unknown): boolean {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/** Recalcule la liste des badges obtenus. */
function attribuerBadges(etat: {
  resultats: Record<string, ResultatActivite>
  coursLus: string[]
  badges: string[]
  bonnesReponses: number
  serie: number
}): string[] {
  const obtenus = new Set(etat.badges)
  const entrees = Object.entries(etat.resultats)
  const troisEtoiles = (prefixe: string) =>
    entrees.some(([id, r]) => id.startsWith(prefixe) && r.etoiles === 3)

  /**
   * Toutes les activités d'un module sont-elles à trois étoiles ?
   *
   * La liste de référence vient du programme, jamais des résultats déjà
   * enregistrés : mesurer la complétude sur les seules activités jouées
   * décernerait le badge dès la première réussie.
   */
  const moduleComplet = (moduleId: string) => {
    const attendues = MODULES.find((m) => m.id === moduleId)?.activites ?? []
    return (
      attendues.length > 0 && attendues.every((a) => etat.resultats[a.id]?.etoiles === 3)
    )
  }

  if (entrees.length > 0) obtenus.add('premiere-note')
  if (moduleComplet('lecture-sol')) obtenus.add('lecteur-sol')
  if (troisEtoiles('lecture-fa')) obtenus.add('lecteur-fa')
  if (troisEtoiles('intervalles')) obtenus.add('oreille-fine')
  if (troisEtoiles('rythme')) obtenus.add('dans-le-rythme')
  if (entrees.some(([id, r]) => id.startsWith('chant') && r.etoiles > 0)) obtenus.add('chanteur')
  if (etat.serie >= 3) obtenus.add('serie-3')
  if (etat.serie >= 7) obtenus.add('serie-7')
  if (etat.bonnesReponses >= 100) obtenus.add('cent-notes')

  return [...obtenus]
}

/** Résultat d'une activité, ou null si jamais jouée. */
export function useResultat(activiteId: string): ResultatActivite | null {
  return useProgression((etat) => etat.resultats[activiteId] ?? null)
}

// ---------------------------------------------------------------------------
// Lecture de la maîtrise
// ---------------------------------------------------------------------------

/**
 * Poids de tirage d'un élément : plus il résiste, plus il revient.
 *
 * Un élément jamais rencontré reçoit un poids intermédiaire, pour être
 * découvert sans écraser le travail des points faibles. Un élément acquis
 * tombe à 0,5 sans jamais atteindre zéro — l'enfant doit continuer de le
 * croiser, sans quoi il l'oublie.
 */
export function poidsMaitrise(maitrise: Maitrise | undefined): number {
  if (!maitrise || maitrise.vues === 0) return 1.5
  const tauxErreur = maitrise.erreurs / maitrise.vues
  return 0.5 + 3 * tauxErreur
}

/** Taux de réussite d'un élément, ou null s'il n'a jamais été rencontré. */
export function tauxReussite(maitrise: Maitrise | undefined): number | null {
  if (!maitrise || maitrise.vues === 0) return null
  return Math.round(((maitrise.vues - maitrise.erreurs) / maitrise.vues) * 100)
}

export interface PointFaible {
  cle: CleMaitrise
  maitrise: Maitrise
  taux: number
}

/**
 * Éléments les moins bien maîtrisés, du plus fragile au moins fragile.
 *
 * Le seuil de trois rencontres évite de désigner comme « point faible » une
 * note vue une seule fois et ratée — statistiquement, cela ne veut rien dire.
 */
export function pointsFaibles(
  maitrise: Record<CleMaitrise, Maitrise>,
  { minimumVues = 3, seuil = 80, limite = 8 } = {},
): PointFaible[] {
  return Object.entries(maitrise)
    .filter(([, m]) => m.vues >= minimumVues)
    .map(([cle, m]) => ({ cle, maitrise: m, taux: tauxReussite(m)! }))
    .filter((p) => p.taux < seuil)
    .sort((a, b) => a.taux - b.taux)
    .slice(0, limite)
}

/** Temps total passé sur l'application, en secondes. */
export function tempsTotalPasse(resultats: Record<string, ResultatActivite>): number {
  return Object.values(resultats).reduce((somme, r) => somme + (r.tempsTotal ?? 0), 0)
}

/** Total d'étoiles gagnées. */
export function useTotalEtoiles(): number {
  return useProgression((etat) =>
    Object.values(etat.resultats).reduce((somme, r) => somme + r.etoiles, 0),
  )
}
