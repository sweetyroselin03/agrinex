import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/__tests__/**/*.{test,spec}.{js,mjs,ts,mts,jsx,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui';
            }
            if (id.includes('zustand') || id.includes('@tanstack') || id.includes('axios')) {
              return 'state';
            }
          }
        },
      },
    },
  },
});
