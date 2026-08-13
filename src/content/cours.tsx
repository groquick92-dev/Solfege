/**
 * Cours de théorie.
 *
 * Chaque leçon suit la même structure : une explication courte, un exemple
 * qu'on peut écouter, puis un point à retenir. L'ordre des leçons reprend
 * celui d'une deuxième année de formation musicale, en repartant des bases
 * de première année pour ne rien supposer d'acquis.
 *
 * Les exemples sonores sont indispensables : lire qu'une blanche dure deux
 * temps n'apprend rien tant qu'on ne l'a pas entendue à côté d'une noire.
 */

import type { ReactNode } from 'react'
import { Portee } from '../notation/Portee'
import { Encadre } from '../ui/Carte'
import { BoutonEcoute, TableauValeurs } from './elementsCours'

export interface Cours {
  id: string
  titre: string
  emoji: string
  resume: string
  /** Durée de lecture estimée, en minutes. */
  duree: number
  contenu: ReactNode
}

export const COURS: readonly Cours[] = [
  {
    id: 'portee',
    titre: 'La portée',
    emoji: '📏',
    resume: 'Cinq lignes, quatre interlignes : la maison des notes.',
    duree: 3,
    contenu: (
      <>
        <p>
          La musique s’écrit sur une <strong>portée</strong> : cinq lignes horizontales, et quatre
          espaces entre elles qu’on appelle des <strong>interlignes</strong>.
        </p>
        <p>
          Les lignes se comptent <strong>du bas vers le haut</strong>. La ligne du bas est la
          première, celle du haut est la cinquième.
        </p>
        <Portee
          notes={[
            { midi: 64 },
            { midi: 65 },
            { midi: 67 },
            { midi: 69 },
            { midi: 71 },
            { midi: 72 },
            { midi: 74 },
            { midi: 77 },
          ]}
          description="Portée montrant huit notes qui montent progressivement, de mi à fa"
        />
        <p>
          Plus une note est <strong>haute</strong> sur la portée, plus le son est{' '}
          <strong>aigu</strong>. Plus elle est basse, plus le son est <strong>grave</strong>.
        </p>
        <BoutonEcoute notes={[64, 65, 67, 69, 71, 72, 74, 77]} libelle="Écouter la montée" />
        <Encadre type="astuce">
          <p>
            Quand une note est trop grave ou trop aiguë pour tenir sur les cinq lignes, on lui
            ajoute une petite ligne rien que pour elle : une{' '}
            <strong>ligne supplémentaire</strong>.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'cle-de-sol',
    titre: 'La clé de sol',
    emoji: '🎼',
    resume: 'Elle entoure la deuxième ligne, où se trouve le sol.',
    duree: 4,
    contenu: (
      <>
        <p>
          Une portée toute seule ne suffit pas : il faut savoir <em>quelle</em> note se place sur
          quelle ligne. C’est le rôle de la <strong>clé</strong>.
        </p>
        <p>
          La <strong>clé de sol</strong> s’enroule autour de la <strong>deuxième ligne</strong>.
          Cette ligne, c’est le <strong>sol</strong>. Tout le reste se déduit à partir de là.
        </p>
        <Portee notes={[{ midi: 67, couleur: 'cible' }]} description="Sol sur la deuxième ligne" />
        <p>
          À partir du sol, on monte ou on descend en suivant l’ordre des notes :{' '}
          <strong>do, ré, mi, fa, sol, la, si</strong>, puis on recommence. Une note sur une ligne,
          la suivante dans l’interligne juste au-dessus, et ainsi de suite.
        </p>
        <Portee
          notes={[{ midi: 60 }, { midi: 62 }, { midi: 64 }, { midi: 65 }, { midi: 67, couleur: 'cible' }, { midi: 69 }, { midi: 71 }, { midi: 72 }]}
          description="Gamme de do majeur en clé de sol, avec le sol en évidence"
        />
        <BoutonEcoute notes={[60, 62, 64, 65, 67, 69, 71, 72]} libelle="Écouter la gamme" />
        <Encadre type="memo">
          <p>
            Le <strong>do du milieu</strong> se pose sur une ligne supplémentaire, juste{' '}
            <em>sous</em> la portée. C’est le repère le plus utile de toute la clé de sol.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'cle-de-fa',
    titre: 'La clé de fa',
    emoji: '🔑',
    resume: 'Pour les sons graves : la main gauche du piano.',
    duree: 4,
    contenu: (
      <>
        <p>
          Les sons graves obligeraient à empiler des dizaines de lignes supplémentaires sous la clé
          de sol. On change donc de clé : la <strong>clé de fa</strong>.
        </p>
        <p>
          Ses deux points encadrent la <strong>quatrième ligne</strong>, qui devient le{' '}
          <strong>fa</strong>.
        </p>
        <Portee
          cle="fa"
          notes={[{ midi: 53, couleur: 'cible' }]}
          description="Fa sur la quatrième ligne en clé de fa"
        />
        <p>
          Attention : <strong>la même position ne donne plus la même note</strong> selon la clé. Une
          note posée sur la deuxième ligne est un sol en clé de sol, mais un si en clé de fa.
        </p>
        <Portee
          cle="fa"
          notes={[{ midi: 48 }, { midi: 50 }, { midi: 52 }, { midi: 53, couleur: 'cible' }, { midi: 55 }, { midi: 57 }, { midi: 59 }, { midi: 60 }]}
          description="Gamme de do en clé de fa"
        />
        <BoutonEcoute notes={[48, 50, 52, 53, 55, 57, 59, 60]} libelle="Écouter les graves" />
        <Encadre type="attention">
          <p>
            Le <strong>do du milieu</strong> est sur une ligne supplémentaire{' '}
            <em>au-dessus</em> de la portée en clé de fa, alors qu’il est <em>en dessous</em> en clé
            de sol. C’est la même note, écrite à deux endroits : les deux clés se rejoignent
            exactement là.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'valeurs',
    titre: 'Les valeurs de notes',
    emoji: '⏱️',
    resume: 'Ronde, blanche, noire, croche : combien de temps dure chaque note.',
    duree: 5,
    contenu: (
      <>
        <p>
          La position d’une note indique sa hauteur. Sa <strong>forme</strong> indique sa{' '}
          <strong>durée</strong>.
        </p>
        <TableauValeurs />
        <p>
          Chaque valeur vaut exactement <strong>deux fois</strong> la suivante. Une blanche vaut
          deux noires, une noire vaut deux croches. C’est une division par deux à chaque étage.
        </p>
        <Portee
          notes={[
            { midi: 60, duree: 'ronde' },
            { midi: 62, duree: 'blanche' },
            { midi: 64, duree: 'blanche' },
            { midi: 65, duree: 'noire' },
            { midi: 67, duree: 'noire' },
            { midi: 69, duree: 'noire' },
            { midi: 71, duree: 'noire' },
          ]}
          mesure="4/4"
          description="Une ronde, deux blanches puis quatre noires"
        />
        <Encadre type="astuce" titre="Le point qui allonge">
          <p>
            Un <strong>point</strong> placé après une note ajoute la{' '}
            <strong>moitié de sa durée</strong>. Une blanche vaut 2 temps, une blanche pointée en
            vaut 3. Une noire vaut 1 temps, une noire pointée en vaut 1 et demi.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'silences',
    titre: 'Les silences',
    emoji: '🤫',
    resume: 'Se taire fait partie de la musique.',
    duree: 3,
    contenu: (
      <>
        <p>
          À chaque valeur de note correspond un <strong>silence</strong> de même durée. Pendant un
          silence, on ne joue pas — mais on continue de <strong>compter</strong>.
        </p>
        <ul className="list-disc pl-6 space-y-1 my-4">
          <li>La <strong>pause</strong> dure autant qu’une ronde (4 temps).</li>
          <li>La <strong>demi-pause</strong> dure autant qu’une blanche (2 temps).</li>
          <li>Le <strong>soupir</strong> dure autant qu’une noire (1 temps).</li>
          <li>Le <strong>demi-soupir</strong> dure autant qu’une croche (un demi-temps).</li>
        </ul>
        <Portee
          notes={[
            { midi: 60, duree: 'noire' },
            { duree: 'noire', silence: true },
            { midi: 64, duree: 'noire' },
            { duree: 'noire', silence: true },
          ]}
          mesure="4/4"
          description="Une noire, un soupir, une noire, un soupir"
        />
        <BoutonEcoute notes={[60, 64]} pas={1.2} libelle="Écouter avec les silences" />
        <Encadre type="attention">
          <p>
            Un silence n’est pas une pause dans le décompte. La musique continue d’avancer :
            c’est seulement <em>toi</em> qui te tais.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'mesure',
    titre: 'La mesure',
    emoji: '📊',
    resume: 'Ranger les temps en petits paquets réguliers.',
    duree: 4,
    contenu: (
      <>
        <p>
          Les <strong>barres de mesure</strong> découpent la portée en paquets égaux : les{' '}
          <strong>mesures</strong>. Chacune contient le même nombre de temps.
        </p>
        <p>
          Le <strong>chiffrage</strong>, au début de la portée, l’annonce. En{' '}
          <strong>4/4</strong>, chaque mesure contient 4 temps, et un temps vaut une noire.
        </p>
        <Portee
          notes={[
            { midi: 60 },
            { midi: 62 },
            { midi: 64 },
            { midi: 65 },
            { midi: 67 },
            { midi: 65 },
            { midi: 64 },
            { midi: 62 },
          ]}
          mesure="4/4"
          description="Deux mesures à quatre temps"
        />
        <p>Les mesures les plus courantes au début :</p>
        <ul className="list-disc pl-6 space-y-1 my-4">
          <li><strong>2/4</strong> — 2 temps par mesure. On y marche : gauche, droite.</li>
          <li><strong>3/4</strong> — 3 temps par mesure. C’est la valse.</li>
          <li><strong>4/4</strong> — 4 temps par mesure. La plus fréquente de toutes.</li>
        </ul>
        <Encadre type="memo" titre="Temps forts et temps faibles">
          <p>
            Le <strong>premier temps</strong> de chaque mesure est le plus fort : c’est lui qui
            donne l’élan. En 4/4, le troisième temps est un peu appuyé lui aussi, mais moins que le
            premier.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'alterations',
    titre: 'Les altérations',
    emoji: '♯',
    resume: 'Dièse, bémol, bécarre : monter ou descendre d’un demi-ton.',
    duree: 4,
    contenu: (
      <>
        <p>
          Entre deux notes voisines, il existe parfois une note intermédiaire — la touche noire du
          piano. On l’écrit avec une <strong>altération</strong> placée{' '}
          <em>avant</em> la note.
        </p>
        <ul className="list-disc pl-6 space-y-1 my-4">
          <li>Le <strong>dièse ♯</strong> monte la note d’un demi-ton.</li>
          <li>Le <strong>bémol ♭</strong> descend la note d’un demi-ton.</li>
          <li>Le <strong>bécarre ♮</strong> annule l’altération et rend la note naturelle.</li>
        </ul>
        <Portee
          notes={[{ midi: 60 }, { midi: 61, couleur: 'cible' }, { midi: 62 }]}
          description="Do, do dièse, ré"
        />
        <BoutonEcoute notes={[60, 61, 62]} pas={0.8} libelle="Écouter do, do♯, ré" />
        <Encadre type="astuce" titre="Le demi-ton, la plus petite distance">
          <p>
            Un <strong>demi-ton</strong> est le plus petit écart de notre musique : au piano, deux
            touches voisines, noire ou blanche. Deux demi-tons font un <strong>ton</strong>.
          </p>
          <p>
            Il n’y a pas de touche noire entre <strong>mi et fa</strong>, ni entre{' '}
            <strong>si et do</strong> : ces deux paires sont déjà séparées d’un seul demi-ton.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'gamme',
    titre: 'La gamme de do majeur',
    emoji: '🪜',
    resume: 'Huit notes, une échelle, et deux demi-tons bien placés.',
    duree: 4,
    contenu: (
      <>
        <p>
          Une <strong>gamme</strong> est une échelle de notes qui monte jusqu’à retrouver son point
          de départ, une <strong>octave</strong> plus haut.
        </p>
        <p>
          La gamme de <strong>do majeur</strong> n’utilise que les touches blanches :{' '}
          <strong>do ré mi fa sol la si do</strong>.
        </p>
        <Portee
          notes={[{ midi: 60 }, { midi: 62 }, { midi: 64 }, { midi: 65 }, { midi: 67 }, { midi: 69 }, { midi: 71 }, { midi: 72 }]}
          description="Gamme de do majeur"
        />
        <BoutonEcoute notes={[60, 62, 64, 65, 67, 69, 71, 72]} libelle="Écouter la gamme" />
        <p>
          Mais les marches ne sont pas toutes de la même taille. Entre{' '}
          <strong>mi et fa</strong>, puis entre <strong>si et do</strong>, il n’y a qu’un{' '}
          <strong>demi-ton</strong>. Partout ailleurs, un ton entier.
        </p>
        <p className="font-titre text-lg text-center my-4 text-lavande-700">
          do — ton — ré — ton — mi — <span className="text-peche-600">½</span> — fa — ton — sol —
          ton — la — ton — si — <span className="text-peche-600">½</span> — do
        </p>
        <Encadre type="memo">
          <p>
            Cette suite de tons et de demi-tons est ce qui donne à la gamme majeure sa couleur
            joyeuse. Reproduite à partir d’une autre note, elle donne une autre gamme majeure — et
            c’est là qu’apparaissent les dièses et les bémols.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'intervalles',
    titre: 'Les intervalles',
    emoji: '📐',
    resume: 'Mesurer la distance entre deux notes.',
    duree: 5,
    contenu: (
      <>
        <p>
          Un <strong>intervalle</strong> est la distance entre deux notes. Pour le nommer, on{' '}
          <strong>compte les notes</strong>, en incluant celle du départ et celle d’arrivée.
        </p>
        <p>
          De <strong>do</strong> à <strong>sol</strong> : do (1), ré (2), mi (3), fa (4), sol (5).
          C’est une <strong>quinte</strong>.
        </p>
        <Portee
          notes={[{ midi: 60, couleur: 'cible' }, { midi: 67, couleur: 'cible' }]}
          description="Do et sol, une quinte"
        />
        <BoutonEcoute notes={[60, 67]} pas={0.7} libelle="Écouter la quinte" />
        <ul className="list-disc pl-6 space-y-1 my-4">
          <li><strong>Seconde</strong> — deux notes voisines (do-ré).</li>
          <li><strong>Tierce</strong> — une note sautée (do-mi).</li>
          <li><strong>Quarte</strong> — do-fa.</li>
          <li><strong>Quinte</strong> — do-sol.</li>
          <li><strong>Octave</strong> — do-do, la même note plus haut.</li>
        </ul>
        <Encadre type="ecoute">
          <p>
            Chaque intervalle a sa <strong>couleur</strong> propre. Le meilleur moyen de les
            reconnaître est de les associer à une chanson connue : la quinte, c’est le début de{' '}
            <em>Star Wars</em> ; la quarte, celui de <em>La Marseillaise</em>.
          </p>
        </Encadre>
      </>
    ),
  },
  {
    id: 'nuances',
    titre: 'Nuances et tempo',
    emoji: '🎭',
    resume: 'Jouer fort ou doux, vite ou lentement.',
    duree: 3,
    contenu: (
      <>
        <p>
          Les <strong>nuances</strong> indiquent l’intensité du son. Elles s’écrivent en italien,
          sous la portée.
        </p>
        <ul className="list-disc pl-6 space-y-1 my-4">
          <li><strong>pp</strong> — <em>pianissimo</em>, très doux</li>
          <li><strong>p</strong> — <em>piano</em>, doux</li>
          <li><strong>mf</strong> — <em>mezzo forte</em>, moyennement fort</li>
          <li><strong>f</strong> — <em>forte</em>, fort</li>
          <li><strong>ff</strong> — <em>fortissimo</em>, très fort</li>
        </ul>
        <p>
          Le <strong>tempo</strong>, lui, indique la vitesse. Il se mesure en battements par minute
          — le chiffre affiché sur un métronome.
        </p>
        <ul className="list-disc pl-6 space-y-1 my-4">
          <li><strong>Lento</strong> — lent (autour de 50)</li>
          <li><strong>Andante</strong> — allant, à l’allure d’une marche (autour de 80)</li>
          <li><strong>Allegro</strong> — vif et gai (autour de 130)</li>
          <li><strong>Presto</strong> — très rapide (au-delà de 170)</li>
        </ul>
        <Encadre type="astuce">
          <p>
            Un morceau joué deux fois plus vite ne devient pas deux fois meilleur. La{' '}
            <strong>régularité</strong> compte bien plus que la vitesse : mieux vaut lent et juste
            que rapide et bancal.
          </p>
        </Encadre>
      </>
    ),
  },
]

export function coursParId(id: string): Cours | undefined {
  return COURS.find((c) => c.id === id)
}
