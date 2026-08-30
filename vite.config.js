import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        propiedades: resolve(__dirname, 'propiedades.html'),
        propiedad: resolve(__dirname, 'propiedad.html'),
        subirPropiedad: resolve(__dirname, 'subir-propiedad.html'),
        login: resolve(__dirname, 'login.html'),
      },
    },
  },
});
