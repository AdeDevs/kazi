import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Bundle the landing/auth illustrations into the JS (see src/assets/landing/index.ts) so they
      // draw with the page on slow connections instead of arriving as separate requests.
      assetsInlineLimit: (filePath: string) => (filePath.includes('/src/assets/landing/') ? true : undefined),
      rollupOptions: {
        output: {
          // Libraries in their own files. Every page still loads up front (they're preloaded with
          // the app), but a deploy that only changes our code leaves these cached in the browser.
          manualChunks: {
            react: ['react', 'react-dom', 'react-dom/client', 'scheduler', 'react-router-dom'],
            ui: ['sonner', 'lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
