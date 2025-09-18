import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

import { config } from "../config";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      '/api': {
        target: config.BACKEND_URL,
        changeOrigin: true,
        secure: true,
      },
    },
  },

})

