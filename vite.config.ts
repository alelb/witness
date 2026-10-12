/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Served from the GitHub Pages project sub-path: https://<user>.github.io/witness/
export default defineConfig({
  base: '/witness/',
  plugins: [react()],
  build: {
    // One stylesheet in the initial load: the lazy chart chunk then has no CSS of its own that could fail to load
    // and be skipped when Retry imports the chunk again.
    cssCodeSplit: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
