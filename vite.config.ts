import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { ConfigEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }: ConfigEnv) => {
  loadEnv(mode, process.cwd(), '');
  const base = mode === 'production' ? '/mydigipin1-pwa/' : '/';
  
  const plugins = [
    react({
      // Fast refresh is enabled by default in Vite 3+
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'MyDigiPin',
        short_name: 'DigiPin',
        description: 'Digital Address System for easy location sharing',
        start_url: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4a90e2',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Cache static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Skip waiting for service worker to take control
        skipWaiting: true,
        clientsClaim: true,
        // Enable runtime caching for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geocoding-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ];

  return {
    base,
    plugins,
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      open: true,
      cors: true,
      host: true
    },
    preview: {
      port: 3001,
      strictPort: true
    },
    build: {
      sourcemap: mode !== 'production',
      minify: 'esbuild' as const,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-dom/client'],
            leaflet: ['leaflet', 'react-leaflet']
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash][extname]'
        },
        // Externalize dependencies that don't need to be bundled
        external: []
      },
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      target: 'esnext',
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  };
});
