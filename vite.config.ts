import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The custom domain serves the app from the site root.
export default defineConfig({
  base: '/',
  plugins: [react()],
})
