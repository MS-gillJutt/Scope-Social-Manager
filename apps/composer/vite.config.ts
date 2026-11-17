import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      // /api/* is the Scope Social Manager Fastify API (port 4000). The API
      // serves its routes at the root (/auth, /content, /ai, ...), so the
      // /api prefix is stripped here. In production, serve the built files
      // behind a reverse proxy that maps /api/* to the API the same way,
      // or set VITE_API_URL (see src/lib/api.ts).
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
