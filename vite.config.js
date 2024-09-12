import { defineConfig } from 'vite';

export default ({mode}) => defineConfig({
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  base: mode === 'development' ? '/' : './',  // Use '/' for dev and './' for production
});