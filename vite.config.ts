import { fileURLToPath, URL } from 'node:url'
// `defineConfig` vient de vitest : c'est la variante qui accepte la section
// `test` en plus de la configuration Vite habituelle.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// `base` suit le déploiement GitHub Pages (https://<user>.github.io/Solfege/).
// En développement on reste à la racine.
const base = process.env.GITHUB_PAGES === 'true' ? '/Solfege/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Solfège — Apprendre la musique',
        short_name: 'Solfège',
        description:
          'Cours et exercices de solfège pour les enfants : lecture de notes, rythme et oreille musicale.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fffcf7',
        theme_color: '#5cc9b0',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // La police musicale Bravura pèse lourd mais conditionne tout
        // l'affichage des portées : elle doit être précachée comme le reste.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            // Les échantillons du piano sont volumineux et ne changent jamais :
            // une fois téléchargés, ils sont servis depuis le cache.
            urlPattern: /^https:\/\/smpldsnds\.github\.io\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'echantillons-piano',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // Le module de notation dépasse forcément le seuil par défaut : il
    // embarque la police musicale Bravura, incompressible et indispensable.
    // Il est chargé à la demande, jamais sur l'écran d'accueil.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Les bibliothèques audio et de notation sont lourdes : on les isole
        // pour que l'écran d'accueil s'affiche sans les attendre.
        manualChunks: (id: string) => {
          if (id.includes('node_modules/vexflow')) return 'notation'
          if (id.includes('node_modules/react')) return 'react'
          if (id.includes('node_modules/smplr') || id.includes('node_modules/pitchy')) return 'audio'
          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
