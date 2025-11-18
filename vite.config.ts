import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // CDN Configuration
  experimental: {
    renderBuiltUrl(filename: string, { type }: { type: 'public' | 'asset' }) {
      if (mode === 'production' && type === 'asset') {
        const cdnUrl = (process.env.VITE_CDN_URL || '').replace(/\/$/, '');
        const assetPath = filename.startsWith('/') ? filename : `/${filename}`;
        return cdnUrl ? `${cdnUrl}${assetPath}` : assetPath;
      }
      return filename;
    },
  },
  build: {
    // Optimize build for performance
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        // Better caching with content-based hashing
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.');
          const ext = info[info.length - 1];
          
          // Different folders for different asset types for better caching
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/mp4|webm|ogg|mp3|wav|flac|aac/i.test(ext)) {
            return `assets/media/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          convex: ['convex/react'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
  },
  // Asset optimization
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf'],
}));
