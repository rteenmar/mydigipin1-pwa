import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { ConfigEnv, PluginOption } from 'vite';

export default defineConfig(({ mode }: ConfigEnv): any => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  const plugins: PluginOption[] = [react()];
  
  if (mode === 'production') {
    plugins.push({
      name: 'vite-plugin-pwa',
      apply: 'build',
      config: () => ({
        build: {
          rollupOptions: {
            output: {
              manualChunks: {
                pwa: ['workbox-precaching', 'workbox-routing', 'workbox-strategies']
              }
            }
          }
        }
      })
    } as PluginOption);
  }
  
  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env': {}
    },
    server: {
      port: 5173,
      strictPort: true
    },
    plugins
  };
});
