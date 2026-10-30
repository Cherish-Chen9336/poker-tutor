import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the site works under any GitHub Pages folder name.
  base: './',
  build: {
    // The poker engine and hand evaluator are large (about 135 KB compressed
    // together). They load only on the pages that need them (see App.tsx and
    // src/learn/content/index.ts), so a bigger chunk there is expected.
    chunkSizeWarningLimit: 700,
  },
})
