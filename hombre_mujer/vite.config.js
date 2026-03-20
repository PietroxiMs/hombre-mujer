import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    https: false, // set to true if deploying with SSL cert for camera access
    port: 5173,
  },
  optimizeDeps: {
    include: ['@tensorflow/tfjs', '@teachablemachine/image'],
  },
})
