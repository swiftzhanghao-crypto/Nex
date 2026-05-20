import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isApiMode = env.VITE_API_MODE === 'true';

  return {
    plugins: [react()],
    define: {
      __MOCK_MODE__: JSON.stringify(!isApiMode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        ...(isApiMode ? { './data/staticData': path.resolve(__dirname, 'data/mockStub.ts') } : {}),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router') || id.includes('scheduler')) return 'vendor-react';
              if (id.includes('recharts') || id.includes('d3-')) return 'vendor-recharts';
              if (id.includes('xlsx')) return 'vendor-xlsx';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('unified') || id.includes('mdast') || id.includes('micromark') || id.includes('hast')) return 'vendor-markdown';
              if (id.includes('zod')) return 'vendor-zod';
            }
            if (!isApiMode && (id.includes('data/staticData') || id.includes('data/generators'))) return 'app-data';
          },
        },
      },
    },
  };
});
