import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: 'localhost',
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
            target: 'http://localhost:5000',
            ws: true,
        },
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Raise the warning threshold — large ISP apps with many lazy pages are expected
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Split heavy vendor libraries into separate cached chunks
          manualChunks(id) {
            if (id.includes('node_modules/firebase')) return 'vendor-firebase';
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react';
            if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
            if (id.includes('node_modules/socket.io-client')) return 'vendor-socket';
          }
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['tests/**/*.test.ts'],
      server: {
        deps: {
          inline: ['firebase', '@firebase']
        }
      }
    }
  };
});
