import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths() // Automatically resolves paths from tsconfig.json
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
      '@components': resolve(process.cwd(), 'src/components'),
      '@hooks': resolve(process.cwd(), 'src/hooks'),
      '@services': resolve(process.cwd(), 'src/services'),
      '@types': resolve(process.cwd(), 'src/types'),
      '@utils': resolve(process.cwd(), 'src/utils'),
      '@styles': resolve(process.cwd(), 'src/styles')
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  }
})