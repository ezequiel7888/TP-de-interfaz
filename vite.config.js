import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración mínima de Vite para un proyecto React.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
