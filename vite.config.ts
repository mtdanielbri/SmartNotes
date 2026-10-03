/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Relative base: the build works from any sub-path (e.g. GitHub Pages).
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        // Explicit identity. Changing id/start_url makes browsers treat the
        // app as a new one (used once to clear a stuck "already installed").
        id: 'smartnotes',
        start_url: './?source=pwa',
        scope: './',
        name: 'SmartNotes · Notas kanban',
        short_name: 'SmartNotes',
        description: 'Notas en un tablero kanban con prioridades, etiquetas, fechas límite y estilos a tu gusto.',
        lang: 'es',
        theme_color: '#5b5bd6',
        background_color: '#f3f4f7',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Spanish only needs the "latin" subset of each font for offline use.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,latin-ext}-*.woff2'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
