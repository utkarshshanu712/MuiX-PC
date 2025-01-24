import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['idb'], // Exclude idb from optimization
  },
  build: {
    rollupOptions: {
      external: ['idb'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
