import { fileURLToPath, URL } from 'node:url'
// `defineConfig` vient de vitest : c'est la variante qui accepte la section
// `test` en plus de la configuration Vite habituelle.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base` suit le déploiement GitHub Pages (https://<user>.github.io/Solfege/).
// En développement on reste à la racine.
const base = process.env.GITHUB_PAGES === 'true' ? '/Solfege/' : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
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
