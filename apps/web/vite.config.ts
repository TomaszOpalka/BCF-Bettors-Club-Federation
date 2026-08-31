import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const SERVER_TARGET = process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Dzięki temu każdy *.module.scss ma od razu zmienne i miksiny —
        // NIE dopisuj w modułach własnego `@use 'variables'` (podwójny @use = błąd Sass).
        loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
        additionalData: `@use 'variables' as *;\n@use 'mixins' as *;\n`,
      },
    },
  },
  server: {
    port: 5173,
    // Dev bez CORS: backend jest widoczny pod tym samym originem co frontend.
    proxy: {
      '/api': { target: SERVER_TARGET, changeOrigin: true },
      '/socket.io': { target: SERVER_TARGET, changeOrigin: true, ws: true },
    },
  },
});
