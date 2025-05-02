import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Specify port for dev server
    // Optional: Configure proxy for API requests if backend is on a different port during dev
    // proxy: {
    //   '/api': {
    //     target: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', // Your backend server
    //     changeOrigin: true,
    //     // rewrite: (path) => path.replace(/^\/api/, '') // If backend doesn't expect /api prefix
    //   }
    // }
  },
  resolve: {
    alias: {
      // Setup alias to match tsconfig paths (optional but good practice)
      '@': path.resolve(__dirname, './src'),
      // Ensure alias for shared package works
      '@presentx/shared': path.resolve(__dirname, '../../packages/shared/src/types.ts'),
    },
  },
}); 