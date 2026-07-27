import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the app works both standalone and mounted under /solarsystem
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
  },
})
