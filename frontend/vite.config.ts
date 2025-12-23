import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Proxy specific endpoints that don't have a prefix yet (because I didn't add /api prefix to backend)
      '/transactions': 'http://localhost:8000',
      '/categories': 'http://localhost:8000',
      '/rules': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
      '/upload': 'http://localhost:8000',
      '/export': 'http://localhost:8000',
      '/backup': 'http://localhost:8000',
      '/recategorize': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/token': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    }
  }
})
