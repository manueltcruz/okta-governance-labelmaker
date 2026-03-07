import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__dirname, '..');

  // This is still useful for reading env inside vite.config (proxy target, etc.)
  const env = loadEnv(mode, repoRoot, '');

  return {
    envDir: repoRoot, // <-- THIS is the critical piece
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
