/**
 * Profil, badges et réglages.
 *
 * Rassemble aussi la sauvegarde du profil : la progression vivant dans le
 * navigateur, l'export est le seul moyen de la conserver en cas de changement
 * d'appareil ou de nettoyage des données de navigation.
 */

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BADGES, useProgression, useTotalEtoiles } from '../store/progression'
import { COURS } from '../content/cours'
import { TOUTES_ACTIVITES } from '../content/programme'
import { Carte, EnTete, Page } from '../ui/Carte'
import { Bouton } from '../ui/Bouton'
import { Etoiles, Serie } from '../ui/Retour'
import { reglerAmbiance, reglerVolume } from '../audio/contexte'

const AVATARS = ['🦊', '🐼', '🐨', '🦉', '🐧', '🐢', '🦁', '🐰', '🐸', '🦄', '🐱', '🐶']

export default function Profil() {
  const etat = useProgression()
  const totalEtoiles = useTotalEtoiles()
  const [prenom, setPrenom] = useState(etat.prenom)
  const [messageImport, setMessageImport] = useState<string | null>(null)
  const champFichier = useRef<HTMLInputElement>(null)

  const etoilesMax = TOUTES_ACTIVITES.length * 3

  const exporter = () => {
    const contenu = etat.exporter()
    const lien = document.createElement('a')
    const url = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }))
    lien.href = url
    lien.download = `solfege-${etat.prenom || 'profil'}.json`
    lien.click()
    URL.revokeObjectURL(url)
  }

  const importer = async (fichier: File) => {
    const texte = await fichier.text()
    setMessageImport(
      etat.importer(texte)
        ? 'Profil rechargé !'
        : 'Ce fichier n’est pas un profil valide.',
    )
  }

  return (
    <Page>
      <EnTete titre="Mon profil" emoji={etat.avatar} />

      <Carte className="mb-5">
        <label htmlFor="prenom" className="block font-titre font-bold mb-2">
          Comment tu t’appelles ?
        </label>
        <input
          id="prenom"
          type="text"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          onBlur={() => etat.definirProfil(prenom, etat.avatar)}
          maxLength={20}
          placeholder="Ton prénom"
          className="w-full rounded-[var(--radius-doux)] border-2 border-lavande-100 px-4 py-3
                     text-lg focus:border-lavande-300 outline-none"
        />

        <p className="font-titre font-bold mt-4 mb-2">Choisis ton animal</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              onClick={() => etat.definirProfil(prenom, avatar)}
              className={`text-3xl p-2 rounded-[var(--radius-doux)] transition-transform hover:scale-110 ${
                etat.avatar === avatar ? 'bg-lavande-100 scale-110' : 'bg-creme-fonce'
              }`}
              aria-label={`Choisir ${avatar}`}
              aria-pressed={etat.avatar === avatar}
            >
              {avatar}
            </button>
          ))}
        </div>
      </Carte>

      <Carte teinte="soleil" className="mb-5">
        <h2 className="text-xl mb-3">Mes résultats</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <div>
            <dt className="text-sm text-encre-clair">Étoiles</dt>
            <dd className="font-titre font-bold text-2xl text-soleil-600">
              {totalEtoiles}/{etoilesMax}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-encre-clair">Bonnes réponses</dt>
            <dd className="font-titre font-bold text-2xl text-menthe-600">{etat.bonnesReponses}</dd>
          </div>
          <div>
            <dt className="text-sm text-encre-clair">Cours lus</dt>
            <dd className="font-titre font-bold text-2xl text-lavande-600">
              {etat.coursLus.length}/{COURS.length}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-encre-clair">Série</dt>
            <dd className="font-titre font-bold text-2xl">
              <Serie jours={etat.serie} />
              {etat.serie === 0 && <span className="text-encre-pale">—</span>}
            </dd>
          </div>
        </dl>
      </Carte>

      <Carte className="mb-5">
        <h2 className="text-xl mb-3">Mes badges</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map((badge) => {
            const obtenu = etat.badges.includes(badge.id)
            return (
              <li
                key={badge.id}
                className={`rounded-[var(--radius-doux)] p-3 text-center border-2 ${
                  obtenu
                    ? 'bg-soleil-50 border-soleil-200'
                    : 'bg-creme-fonce border-lavande-100 opacity-50 grayscale'
                }`}
              >
                <span className="text-3xl block" aria-hidden="true">
                  {obtenu ? badge.emoji : '🔒'}
                </span>
                <p className="font-titre font-bold text-sm mt-1">{badge.nom}</p>
                <p className="text-xs text-encre-clair">{badge.description}</p>
              </li>
            )
          })}
        </ul>
      </Carte>

      <Carte className="mb-5">
        <h2 className="text-xl mb-3">Réglages</h2>

        <label htmlFor="volume" className="block font-semibold mb-1">
          Volume — {Math.round(etat.reglages.volume * 100)} %
        </label>
        <input
          id="volume"
          type="range"
          min={0}
          max={100}
          value={etat.reglages.volume * 100}
          onChange={(e) => {
            const valeur = Number(e.target.value) / 100
            etat.modifierReglages({ volume: valeur })
            reglerVolume(valeur)
          }}
          className="w-full mb-4 accent-[color:var(--color-menthe-400)]"
        />

        <label htmlFor="ambiance" className="block font-semibold mb-1">
          Réverbération — {Math.round(etat.reglages.ambiance * 100)} %
        </label>
        <input
          id="ambiance"
          type="range"
          min={0}
          max={60}
          value={etat.reglages.ambiance * 100}
          onChange={(e) => {
            const valeur = Number(e.target.value) / 100
            etat.modifierReglages({ ambiance: valeur })
            reglerAmbiance(valeur)
          }}
          className="w-full mb-4 accent-[color:var(--color-ciel-300)]"
        />

        <label htmlFor="tempo" className="block font-semibold mb-1">
          Tempo de travail — {etat.reglages.tempo}
        </label>
        <input
          id="tempo"
          type="range"
          min={50}
          max={140}
          step={5}
          value={etat.reglages.tempo}
          onChange={(e) => etat.modifierReglages({ tempo: Number(e.target.value) })}
          className="w-full mb-4 accent-[color:var(--color-peche-300)]"
        />

        <label className="flex items-center gap-3 font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={etat.reglages.aideNoms}
            onChange={(e) => etat.modifierReglages({ aideNoms: e.target.checked })}
            className="w-5 h-5 accent-[color:var(--color-lavande-400)]"
          />
          Afficher le nom des notes
        </label>
      </Carte>

      <Carte teinte="lavande">
        <h2 className="text-xl mb-2">Sauvegarde</h2>
        <p className="text-encre-clair text-sm mb-3">
          La progression est enregistrée dans ce navigateur uniquement. Exporte-la pour la garder
          en sécurité ou la transférer sur un autre appareil.
        </p>
        <div className="flex flex-wrap gap-3">
          <Bouton teinte="neutre" taille="petit" onClick={exporter}>
            Exporter mon profil
          </Bouton>
          <Bouton teinte="neutre" taille="petit" onClick={() => champFichier.current?.click()}>
            Importer un profil
          </Bouton>
          <input
            ref={champFichier}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const fichier = e.target.files?.[0]
              if (fichier) void importer(fichier)
            }}
          />
          <Bouton
            teinte="peche"
            taille="petit"
            onClick={() => {
              if (window.confirm('Effacer toute la progression ? Cette action est définitive.')) {
                etat.reinitialiser()
              }
            }}
          >
            Tout effacer
          </Bouton>
        </div>
        {messageImport && (
          <p className="mt-3 font-semibold text-lavande-700" role="status">
            {messageImport}
          </p>
        )}
      </Carte>

      <div className="mt-6 text-center">
        <Etoiles nombre={Math.min(3, Math.ceil(totalEtoiles / 10))} />
      </div>

      {/* Discret et en bas de page : cet écran s'adresse aux parents, pas à
          l'enfant, et n'a rien à faire dans la barre de navigation. */}
      <p className="mt-8 text-center">
        <Link to="/parents" className="text-encre-pale hover:text-encre-clair underline text-sm">
          👋 Espace parent — suivi détaillé
        </Link>
      </p>
    </Page>
  )
}
