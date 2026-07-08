import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // allows phone access on local network
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
