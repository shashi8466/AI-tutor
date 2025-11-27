import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['framer-motion'],
          icons: ['react-icons']
        }
      }
    }
  },
  server: {
    port: 3010,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5179',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173,
    cors: true
  }
});