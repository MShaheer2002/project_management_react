import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  // A production build must reach the API over https (and so wss for the
  // socket). Without this a missing BASE_URL silently falls back to
  // http://localhost:8000 in the shipped bundle.
  if (mode === 'production' && !env.BASE_URL?.startsWith('https://')) {
    throw new Error('BASE_URL must be set to an https:// URL for production builds.');
  }
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.BASE_URL': JSON.stringify(env.BASE_URL),
      'process.env.CLERK_PUBLISHABLE_KEY': JSON.stringify(env.CLERK_PUBLISHABLE_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@app': path.resolve(__dirname, './src/app'),
        '@features': path.resolve(__dirname, './src/features'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@mocks': path.resolve(__dirname, './src/mocks'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Vite rejects requests with an unrecognized Host header by default (DNS
      // rebinding protection) — without this, testing company subdomains locally
      // (e.g. fissiontech.localhost:3000, which needs no /etc/hosts entry since
      // browsers resolve *.localhost to 127.0.0.1 on their own) gets a 403.
      allowedHosts: ['.localhost'],
    },
  };
});
