import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        market: resolve(__dirname, 'market/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if(assetInfo.name.endsWith('.css')) return 'css/[name]-[hash][extname]';
          if(assetInfo.name.match(/\.(png|jpe?g|webp|svg|gif|avif)$/)) return 'images/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          vendor: ['dompurify'],
          pwa: ['./js/pwa.js'],
          security: ['./js/security.js'],
          features: ['./js/features-100k.js'],
        }
      }
    },
    cssCodeSplit: true,
    cssMinify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: false,
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
  },
  css: {
    devSourcemap: false,
  }
});
