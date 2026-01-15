// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static', // Static pages with on-demand SSR for API routes (via prerender: false)
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: true,
    allowedHosts: ['www.breederhq.test', 'localhost'],
  },
});
