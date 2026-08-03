import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const projectRoot = dirname(fileURLToPath(import.meta.url))
export const GITHUB_REPOSITORY = 'vfx-flow'
const personalDataPath = resolve(projectRoot, 'src/data.ts')
const localDataPath = existsSync(personalDataPath) ? personalDataPath : resolve(projectRoot, 'src/publicData.ts')

export default defineConfig(({ mode }) => {
  const github = mode === 'github'
  const base = github ? `/${GITHUB_REPOSITORY}/` : '/'
  const modeDataAlias = {
    name: 'vfx-flow-mode-data-alias',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string) {
      if (source === './dataMode' && importer?.endsWith('/src/App.tsx')) return github ? resolve(projectRoot, 'src/publicData.ts') : localDataPath
      return null
    },
  }
  return {
    base,
    plugins: [
      modeDataAlias,
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        includeAssets: ['icons/*.svg'],
        manifest: {
          name: 'VFX / FLOW',
          short_name: 'VFX FLOW',
          description: 'A local-first VFX workflow notebook.',
          display: 'standalone',
          theme_color: '#0d171d',
          background_color: '#0d171d',
          start_url: base,
          scope: base,
          icons: [
            { src: 'icons/vfx-flow-192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: 'icons/vfx-flow-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          ],
        },
        workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'] },
      }),
    ],
  }
})
