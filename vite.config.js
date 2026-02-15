import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // ✅ use relative paths so assets load correctly on Hostinger
  plugins: [react()],
  build: {
    outDir: 'dist', // default, but added for clarity
    emptyOutDir: true, // cleans old files before building
  },
  server: {
    port: 5173, // dev server port (default for Vite)
    open: true, // auto-open browser on dev
  },
})
