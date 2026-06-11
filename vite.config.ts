import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// For GitHub Pages served at https://user.github.io/REPO/, set BASE_PATH=/REPO/
// For Cloudflare Pages / Vercel (root domain), leave it as '/'.
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'StudyAI — Cahier Intelligent',
        short_name: 'StudyAI',
        theme_color: '#6c63ff',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: { port: 5173 }
})
