import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Ignore the backend data dir so Vite doesn't HMR-reload when assessment scores are saved
    watch: {
      ignored: [
        path.resolve(__dirname, 'backend/data/**'),
        path.resolve(__dirname, 'backend/**/*.json'),
        '**/__pycache__/**',
        '**/*.py',
      ],
    },
  },
})
