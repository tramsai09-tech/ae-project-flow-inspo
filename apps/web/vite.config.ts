import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite configuration for AE Motion Tools web app.
 *
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [
    react({
      // Use the automatic JSX runtime (no need to import React in every file)
      jsxRuntime: 'automatic',
    }),
  ],

  resolve: {
    alias: {
      // @ maps to src/ for clean absolute imports
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },

  build: {
    target: 'es2022',
    sourcemap: true,
    // Performance budget: keep initial bundle < 150 KB gzipped
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'state-vendor': ['zustand', 'immer'],
        },
      },
    },
  },

  // Use Vitest's config integration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
