import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { getRequestListener } from '@hono/node-server';

function honoDevPlugin(): Plugin {
  return {
    name: 'hono-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.startsWith('/api/') || req.url === '/api')) {
          try {
            const { default: app } = await server.ssrLoadModule('/src/server/app.ts');
            getRequestListener(app.fetch)(req, res);
          } catch (e) {
            console.error('Hono dev server error:', e);
            res.statusCode = 500;
            res.end(String(e));
          }
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    honoDevPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
