/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the site works under any GitHub Pages folder name.
  base: './',
  test: {
    // Several tests play thousands of hands; CI machines can be a few times slower than a laptop.
    testTimeout: 60_000,
  },
  build: {
    // The poker engine and hand evaluator are large (about 135 KB compressed
    // together). They load only on the pages that need them (see App.tsx and
    // src/learn/content/index.ts), so a bigger chunk there is expected.
    chunkSizeWarningLimit: 700,
  },
})
