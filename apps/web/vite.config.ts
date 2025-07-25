import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@services': resolve(__dirname, 'src/services'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // PDF processing libraries
          'pdf-libs': ['pdf-lib', 'pdfjs-dist', 'react-pdf'],

          // Workflow and diagram libraries
          'workflow-libs': ['reactflow', '@reactflow/core', '@reactflow/controls', '@reactflow/background', 'dagre'],

          // UI and styling libraries
          'ui-libs': ['lucide-react', 'clsx', 'tailwind-merge'],

          // Utility libraries
          'utils': ['axios', 'date-fns'],

          // Supabase and auth
          'auth': ['@supabase/supabase-js'],

          // AI and processing libraries
          'ai-libs': ['openai', '@huggingface/inference', 'tesseract.js'],

          // Heavy processing libraries
          'processing': ['canvas', 'natural', 'compromise'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],
    exclude: ['canvas'],
  },
})
