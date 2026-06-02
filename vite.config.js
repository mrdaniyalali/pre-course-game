import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base + HashRouter => works on GitHub Pages project sites,
// custom domains, or any static host without server rewrites.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Pairs — Mini Arcade',
        short_name: 'Pairs',
        description: 'Four addictive mini-games: Memory, Word Search, 2048 and Minesweeper. Free, offline, no ads.',
        theme_color: '#14110b',
        background_color: '#14110b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html'
      },
      devOptions: { enabled: false }
    })
  ]
})
