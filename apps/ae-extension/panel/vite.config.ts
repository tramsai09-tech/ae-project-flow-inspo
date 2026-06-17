import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL for CEP: loads assets relatively via file:// protocol
  build: {
    outDir: '../dist/panel', // Output one level up into the main extension dist folder
    emptyOutDir: true,
  },
  server: {
    port: 5176,
  },
});
