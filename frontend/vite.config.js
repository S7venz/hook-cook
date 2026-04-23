import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Vite 8 + Rolldown utilise oxc pour la minification par défaut.
    // Split vendor chunks : React + router d'un côté, Leaflet (lourd,
    // ~150 kB), Fuse.js, etc. de l'autre. Le browser peut cacher
    // chaque chunk séparément → les updates app n'invalident pas
    // vendor, et la home n'a pas besoin de télécharger Leaflet.
    rollupOptions: {
      output: {
        // Vite 8 utilise Rolldown : manualChunks est une fonction qui
        // reçoit l'id du module et renvoie le nom du chunk cible.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/react|react-dom|react-router/.test(id)) return 'vendor-react';
            if (/leaflet/.test(id)) return 'vendor-leaflet';
            if (/fuse\.js/.test(id)) return 'vendor-fuse';
            return 'vendor';
          }
          return undefined;
        },
      },
    },
    // Warn seulement > 700 kB (nos chunks principaux sont vers 200 kB)
    chunkSizeWarningLimit: 700,
    // Pas de sourcemaps en prod (fichiers bien plus petits)
    sourcemap: false,
    // Cible navigateurs modernes → code ES2022 plus compact
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
        'src/**/*.d.ts',
      ],
    },
  },
});
