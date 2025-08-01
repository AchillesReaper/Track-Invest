import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Track Invest',
        short_name: 'Track Invest',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#007AFF',
        icons: [
          {
            src: 'track-invest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'track-invest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})