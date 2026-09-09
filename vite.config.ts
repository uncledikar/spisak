import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/spisak/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Spisok',
        short_name: 'Spisok',
        description: 'Lists for trips, shopping, and everyday packing',
        theme_color: '#2d6a4f',
        background_color: '#f5f6f4',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/spisak/',
        scope: '/spisak/',
        lang: 'en',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2}'],
        navigateFallback: '/spisak/index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
