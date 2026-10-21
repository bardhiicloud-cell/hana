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
      // faqet publike e admin-i punojnë me skripte të thjeshta (jo bundle) —
      // Vite i lë si files statikë; ndërtoni vetëm një output minimal
      preserveEntrySignatures: false,
      treeshake: false,
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
    port: 3005,
    host: '0.0.0.0',
    open: false,
  },
  // /market → /market/index.html (në prodhim këtë e bën Firebase Hosting me cleanUrls)
  plugins: [{
    name: 'clean-urls-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url || '/';
        const q = raw.indexOf('?');
        const path = q === -1 ? raw : raw.slice(0, q);
        if (path !== '/' && !path.endsWith('/') && !/\.\w+$/.test(path) && !path.startsWith('/@') && !path.startsWith('/node_modules')) {
          req.url = path + '/index.html' + (q === -1 ? '' : raw.slice(q));
        }
        next();
      });
    },
  }],
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
