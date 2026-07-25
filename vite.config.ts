/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  // GitHub Pages serves from /<repo>/; Netlify and dev serve from /.
  // scripts/deploy-ghpages.sh sets DEPLOY_BASE=/harmonies/.
  base: process.env.DEPLOY_BASE ?? '/',
  plugins: [svelte()],
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
