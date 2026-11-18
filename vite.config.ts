import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  // The Cloudflare plugin only matters for build/deploy; tests run without it.
  plugins: [react(), tailwindcss(), ...(process.env.VITEST ? [] : [cloudflare()])],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, fs: { allow: ['.'] } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'], exclude: ['**/node_modules/**', '**/._*'] },
})