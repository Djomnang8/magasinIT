/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})*/

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'React Store App',
        short_name: 'StoreApp',
        description: 'Application de gestion de magasin',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',    // Écoute sur toutes les interfaces
    port: 5173,
    strictPort: true,
    // Améliore la détection réseau
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.local', // Tous les hôtes .local
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
});