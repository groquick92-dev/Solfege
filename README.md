# Solfège

Application web d'apprentissage du solfège, conçue pour un enfant de 7-8 ans
entrant en deuxième année de formation musicale.

Cours illustrés, exercices interactifs, piano échantillonné et reconnaissance de
la voix au micro. Tout fonctionne dans le navigateur, sans compte ni serveur.

## Démarrer

```bash
npm install
npm run dev
```

L'application est alors disponible sur <http://localhost:5173>.

| Commande            | Effet                                        |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Serveur de développement                     |
| `npm run build`     | Vérification des types puis build production |
| `npm run preview`   | Sert le build de production                  |
| `npm test`          | Lance la suite de tests                      |
| `npm run typecheck` | Vérifie les types sans construire            |

## Ce que contient l'application

**Dix cours de théorie** — la portée, la clé de sol, la clé de fa, les valeurs
de notes, les silences, la mesure, les altérations, la gamme de do majeur, les
intervalles, les nuances et le tempo. Chaque leçon comporte des portées
gravées et des exemples à écouter.

**Six familles d'exercices**, chacune découpée en paliers qui se débloquent au
fur et à mesure :

- **Lecture en clé de sol** — cinq paliers, de trois notes à l'ambitus élargi
- **Lecture en clé de fa** — quatre paliers
- **Rythme** — écoute puis frappe, avec décompte et évaluation de la précision
- **Oreille** — reconnaissance d'intervalles, cinq paliers
- **Dictée mélodique** — reconstituer une mélodie entendue
- **Chant** — reproduire une note à la voix, avec retour de justesse en direct

**Un piano virtuel** de deux octaves, jouable à la souris, au doigt ou au
clavier de l'ordinateur.

**Une progression** : étoiles par activité, dix badges, série quotidienne,
avatar, et export du profil en JSON.

## Choix techniques

### Audio

La qualité sonore a été le premier critère. Un enfant construit sa
représentation du son à partir de ce qu'il entend : un piano synthétique et
métallique dessert directement l'apprentissage.

- **[smplr](https://github.com/danigb/smplr)** avec le *SplendidGrandPiano* —
  des échantillons de Steinway répartis sur **quatre couches de vélocité**. Le
  timbre change réellement entre un jeu doux et un jeu fort, ce qu'un
  échantillon unique transposé ne sait pas rendre.
- **Web Audio API directement**, sans surcouche. Tone.js a été envisagé puis
  écarté : l'application a besoin d'un métronome juste et d'une lecture de
  mélodies à l'heure, ce qu'un ordonnanceur à anticipation de 120 ms fait en
  une soixantaine de lignes — pour 200 Ko de moins à télécharger.
- **Chaîne de sortie** avec limiteur : dix touches plaquées ensemble saturent
  une sortie casque sans lui. Une réverbération par convolution, sur une
  impulsion synthétisée localement, pose les notes sans fichier à charger.
- **[pitchy](https://github.com/ianprime0509/pitchy)** (algorithme de McLeod)
  pour la détection de hauteur au micro : c'est la famille d'algorithmes la
  plus résistante aux erreurs d'octave, fréquentes sur une voix d'enfant riche
  en harmoniques.

Le métronome et la lecture des exercices sont programmés sur l'horloge du
contexte audio, jamais sur `setTimeout` : le minuteur JavaScript dérive de
plusieurs dizaines de millisecondes dès que l'interface s'anime, ce qui
s'entend immédiatement sur une gamme.

### Notation

**[VexFlow 5](https://www.vexflow.com/)**, importé via son point d'entrée
`vexflow/bravura` : le point d'entrée par défaut embarque six polices
musicales, celui-ci une seule, ce qui divise par trois le poids du module. Le
rendu SVG reste net à toute échelle et se colore pour les retours d'exercice.

OpenSheetMusicDisplay a été écarté : il excelle à afficher des partitions
MusicXML existantes, alors que toutes les portées d'ici sont générées à la
volée à partir d'exercices tirés au hasard.

### Interface

React 19, Vite 8, TypeScript et Tailwind 4. Les écrans d'exercice sont chargés
à la demande pour garder l'accueil léger.

La palette est volontairement peu saturée : sur un écran regardé longtemps par
un enfant, les couleurs vives fatiguent et parasitent la lecture des portées.
Le noir pur est évité au profit d'un violet-ardoise plus doux. Les cibles
tactiles font au minimum 44 px, et le réglage système « moins d'animations »
est respecté.

### Données

La progression vit dans le `localStorage` du navigateur. **Aucun compte, aucun
serveur, aucune collecte** : c'est la façon la plus sûre de traiter les données
d'un enfant. Le micro est analysé sur l'appareil et rien n'en sort.

La contrepartie est que la progression est liée à un navigateur — d'où l'export
et l'import de profil dans l'écran « Moi ».

## Organisation du code

```
src/
├── audio/        Contexte, instruments, lecture, métronome, micro
├── music/        Théorie, rythme, générateurs d'exercices  (testé)
├── notation/     Rendu des portées avec VexFlow
├── content/      Programme et cours de théorie
├── exercices/    Ossature commune aux séries d'exercices
├── store/        Progression et réglages                   (testé)
├── ui/           Composants du design system
└── pages/        Écrans
```

Le noyau musical et le magasin de progression sont couverts par 75 tests. Ce
sont les deux endroits où une erreur est à la fois invisible et grave : une
note mal convertie enseigne quelque chose de faux, une série mal comptée
décourage.

## Déploiement

L'application est publiée sur GitHub Pages à l'adresse
<https://groquick92-dev.github.io/Solfege/>.

Un push sur `main` déclenche le workflow `deploy.yml`, qui reconstruit et
republie automatiquement. Rien à lancer à la main.

### Mise en place initiale

Une seule fois, dans les réglages du dépôt : **Settings → Pages → Source**,
choisir **GitHub Actions** (et non « Deploy from a branch »).

Cette étape ne peut pas être automatisée. Créer un site Pages demande un droit
d'administration que le jeton d'un workflow n'obtient jamais, même avec la
permission `pages: write` — le paramètre `enablement` de `configure-pages`
échoue donc sur `Resource not accessible by integration`.

Le workflow copie `index.html` vers `404.html` avant publication. GitHub Pages
ne connaît pas les routes de l'application : sans ce repli, ouvrir directement
`/cours` renverrait une erreur au lieu de laisser le routeur reprendre la main.

### Autres hébergeurs

`npm run build` produit un dossier `dist/` autonome, déposable chez n'importe
quel hébergeur de fichiers statiques. Netlify et Vercel se connectent au dépôt
en quelques clics et acceptent les dépôts privés, si la visibilité devait
changer.

### Sur l'usage au quotidien

Une fois en ligne, l'adresse s'ajoute à l'écran d'accueil d'une tablette ou
d'un téléphone comme une application : plus de terminal, plus de commande.

Le dépôt est public, donc le code est visible de tous — mais l'activité de
l'enfant, elle, ne l'est jamais. La progression ne quitte pas le navigateur et
aucune donnée n'est transmise.

## Pistes de suite

- Dictée rythmique — écrire le rythme entendu, et non plus seulement le frapper
- Lecture de notes chronométrée, avec record personnel
- Chant d'intervalles et de courtes mélodies, pas seulement de notes isolées
- Mode hors-ligne complet, en mettant les échantillons du piano en cache
- Écran parent : temps passé, points faibles, activités conseillées
