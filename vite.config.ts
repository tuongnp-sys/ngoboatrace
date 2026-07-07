import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/player': 'http://localhost:3000',
      '/daily': 'http://localhost:3000',
      '/scores': 'http://localhost:3000',
      '/leaderboard': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['manifest.webmanifest'],
      manifest: {
        name: 'Đua Ghe Ngo Sóc Trăng',
        short_name: 'Ghe Ngo',
        description: 'Đua ghe Ngo — Lễ hội Oóc Om Bóc',
        theme_color: '#c41e3a',
        background_color: '#0a1628',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
