import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages hosts this project under /fk-planner/; keep local development at /.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/fk-planner/' : '/',
  plugins: [react()],
})
