/**
 * Programme d'apprentissage.
 *
 * La progression suit celle d'une deuxième année de formation musicale : on
 * consolide la clé de sol, on installe la clé de fa, on enrichit les cellules
 * rythmiques et on ouvre l'oreille aux intervalles.
 *
 * Chaque module reste court — dix questions par activité, quelques minutes —
 * parce que l'attention d'un enfant de cet âge décroche bien avant la fatigue
 * musicale, et qu'une séance quotidienne brève vaut mieux qu'une longue le
 * dimanche.
 */

/**
 * Teintes disponibles pour un module.
 *
 * Le type est déclaré ici plutôt qu'importé des composants : le programme est
 * de la donnée pure, et le magasin de progression a besoin de le lire sans
 * traîner React derrière lui.
 */
export type TeinteModule = 'menthe' | 'peche' | 'lavande' | 'ciel' | 'soleil' | 'rose' | 'blanc'

export interface Activite {
  id: string
  titre: string
  description: string
  /** Chemin de navigation. */
  chemin: string
  /** Palier de difficulté transmis au générateur. */
  palier: number
  /** Activités à trois étoiles requises pour débloquer celle-ci. */
  requiert?: string[]
}

export interface Module {
  id: string
  titre: string
  sousTitre: string
  emoji: string
  teinte: TeinteModule
  activites: Activite[]
}

export const MODULES: readonly Module[] = [
  {
    id: 'cours',
    titre: 'Les cours',
    sousTitre: 'Comprendre avant de jouer',
    emoji: '📚',
    teinte: 'lavande',
    activites: [],
  },
  {
    id: 'lecture-sol',
    titre: 'Lecture — clé de sol',
    sousTitre: 'Reconnaître les notes du dessus',
    emoji: '🎼',
    teinte: 'menthe',
    activites: [
      {
        id: 'lecture-sol-0',
        titre: 'Do, ré, mi',
        description: 'Les trois premières notes, posées sous la portée.',
        chemin: '/lecture/sol/0',
        palier: 0,
      },
      {
        id: 'lecture-sol-1',
        titre: 'Do, ré, mi, fa, sol',
        description: 'Toute la position de la main.',
        chemin: '/lecture/sol/1',
        palier: 1,
        requiert: ['lecture-sol-0'],
      },
      {
        id: 'lecture-sol-2',
        titre: "L'octave complète",
        description: 'De do à si, les sept notes.',
        chemin: '/lecture/sol/2',
        palier: 2,
        requiert: ['lecture-sol-1'],
      },
      {
        id: 'lecture-sol-3',
        titre: 'Jusqu’au do aigu',
        description: 'On ajoute le do au-dessus de la portée.',
        chemin: '/lecture/sol/3',
        palier: 3,
        requiert: ['lecture-sol-2'],
      },
      {
        id: 'lecture-sol-4',
        titre: 'Ambitus élargi',
        description: 'Les lignes supplémentaires, en haut comme en bas.',
        chemin: '/lecture/sol/4',
        palier: 4,
        requiert: ['lecture-sol-3'],
      },
    ],
  },
  {
    id: 'lecture-fa',
    titre: 'Lecture — clé de fa',
    sousTitre: 'Explorer les notes graves',
    emoji: '🔑',
    teinte: 'ciel',
    activites: [
      {
        id: 'lecture-fa-0',
        titre: 'Fa, sol, la',
        description: 'Premiers repères en clé de fa.',
        chemin: '/lecture/fa/0',
        palier: 0,
      },
      {
        id: 'lecture-fa-1',
        titre: 'Jusqu’au do',
        description: 'On monte vers le do du milieu.',
        chemin: '/lecture/fa/1',
        palier: 1,
        requiert: ['lecture-fa-0'],
      },
      {
        id: 'lecture-fa-2',
        titre: "L'octave complète",
        description: 'De do grave à do du milieu.',
        chemin: '/lecture/fa/2',
        palier: 2,
        requiert: ['lecture-fa-1'],
      },
      {
        id: 'lecture-fa-3',
        titre: 'Ambitus élargi',
        description: 'On descend encore plus grave.',
        chemin: '/lecture/fa/3',
        palier: 3,
        requiert: ['lecture-fa-2'],
      },
    ],
  },
  {
    id: 'rythme',
    titre: 'Le rythme',
    sousTitre: 'Frapper au bon moment',
    emoji: '🥁',
    teinte: 'rose',
    activites: [
      {
        id: 'rythme-0',
        titre: 'Noires et blanches',
        description: 'Les valeurs de base, en 4/4.',
        chemin: '/rythme/1',
        palier: 1,
      },
      {
        id: 'rythme-1',
        titre: 'Les croches',
        description: 'Deux notes dans un seul temps.',
        chemin: '/rythme/2',
        palier: 2,
        requiert: ['rythme-0'],
      },
      {
        id: 'rythme-2',
        titre: 'Rythmes pointés',
        description: 'Le point qui allonge, et les doubles-croches.',
        chemin: '/rythme/3',
        palier: 3,
        requiert: ['rythme-1'],
      },
      {
        id: 'dictee-rythme-1',
        titre: 'Écrire un rythme',
        description: 'Écoute une mesure, puis note-la avec les figures.',
        chemin: '/dictee-rythme/1',
        palier: 1,
        requiert: ['rythme-0'],
      },
      {
        id: 'dictee-rythme-2',
        titre: 'Écrire les croches',
        description: 'La dictée se corse : deux notes par temps.',
        chemin: '/dictee-rythme/2',
        palier: 2,
        requiert: ['dictee-rythme-1'],
      },
      {
        id: 'dictee-rythme-3',
        titre: 'Écrire les pointés',
        description: 'Points, doubles-croches : tout le vocabulaire.',
        chemin: '/dictee-rythme/3',
        palier: 3,
        requiert: ['dictee-rythme-2'],
      },
    ],
  },
  {
    id: 'intervalles',
    titre: 'L’oreille',
    sousTitre: 'Reconnaître les distances entre les notes',
    emoji: '👂',
    teinte: 'soleil',
    activites: [
      {
        id: 'intervalles-0',
        titre: 'Pareil ou très loin ?',
        description: 'Unisson et octave, le plus grand écart.',
        chemin: '/oreille/0',
        palier: 0,
      },
      {
        id: 'intervalles-1',
        titre: 'La quinte arrive',
        description: 'Unisson, quinte, octave.',
        chemin: '/oreille/1',
        palier: 1,
        requiert: ['intervalles-0'],
      },
      {
        id: 'intervalles-2',
        titre: 'Seconde et tierce',
        description: 'Les petits écarts, plus difficiles à séparer.',
        chemin: '/oreille/2',
        palier: 2,
        requiert: ['intervalles-1'],
      },
      {
        id: 'intervalles-3',
        titre: 'La quarte',
        description: 'Cinq intervalles à distinguer.',
        chemin: '/oreille/3',
        palier: 3,
        requiert: ['intervalles-2'],
      },
      {
        id: 'intervalles-4',
        titre: 'Tous les intervalles',
        description: 'De la seconde à l’octave.',
        chemin: '/oreille/4',
        palier: 4,
        requiert: ['intervalles-3'],
      },
    ],
  },
  {
    id: 'dictee',
    titre: 'La dictée',
    sousTitre: 'Écrire ce que tu entends',
    emoji: '✏️',
    teinte: 'peche',
    activites: [
      {
        id: 'dictee-0',
        titre: 'Trois notes',
        description: 'De courtes mélodies autour de do.',
        chemin: '/dictee/0',
        palier: 0,
      },
      {
        id: 'dictee-1',
        titre: 'Cinq notes',
        description: 'La mélodie s’allonge.',
        chemin: '/dictee/1',
        palier: 1,
        requiert: ['dictee-0'],
      },
      {
        id: 'dictee-2',
        titre: 'Avec des sauts',
        description: 'La mélodie ne monte plus seulement de proche en proche.',
        chemin: '/dictee/2',
        palier: 2,
        requiert: ['dictee-1'],
      },
    ],
  },
  {
    id: 'chant',
    titre: 'Le chant',
    sousTitre: 'Chanter juste, avec le micro',
    emoji: '🎤',
    teinte: 'peche',
    activites: [
      {
        id: 'chant-0',
        titre: 'Trouver la note',
        description: 'Écoute, puis chante la même note.',
        chemin: '/chant',
        palier: 0,
      },
    ],
  },
  {
    id: 'piano',
    titre: 'Le piano',
    sousTitre: 'Jouer librement',
    emoji: '🎹',
    teinte: 'blanc',
    activites: [
      {
        id: 'piano-libre',
        titre: 'Clavier libre',
        description: 'Explore les sons, retrouve les notes.',
        chemin: '/piano',
        palier: 0,
      },
    ],
  },
]

/** Toutes les activités, tous modules confondus. */
export const TOUTES_ACTIVITES: readonly Activite[] = MODULES.flatMap((m) => m.activites)

/** Retrouve une activité par identifiant. */
export function activiteParId(id: string): Activite | undefined {
  return TOUTES_ACTIVITES.find((a) => a.id === id)
}

/**
 * Une activité est-elle accessible ?
 *
 * Le déverrouillage demande une étoile, pas les trois : exiger la perfection
 * pour avancer bloque les enfants sur une activité qu'ils ont pourtant
 * comprise, et transforme le jeu en corvée.
 */
export function activiteDebloquee(
  activite: Activite,
  resultats: Record<string, { etoiles: number }>,
): boolean {
  if (!activite.requiert || activite.requiert.length === 0) return true
  return activite.requiert.every((id) => (resultats[id]?.etoiles ?? 0) >= 1)
}

/** Nombre de questions par activité. */
export const QUESTIONS_PAR_SERIE = 10
