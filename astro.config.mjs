// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable SSR for API routes and middleware
  vite: {
    plugins: [tailwindcss()],
  },

  // Image optimization
  image: {
    domains: ['www.breederhq.com'],
    remotePatterns: [{ protocol: 'https' }],
  },

  // Performance optimizations
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },

  // Security
  security: {
    checkOrigin: true,
  },
});
