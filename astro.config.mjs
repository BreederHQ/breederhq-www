// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static', // Static pages by default; SSR opt-in via `export const prerender = false`
  trailingSlash: 'never', // Canonical URLs without trailing slash (e.g. /about not /about/)
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: true,
    allowedHosts: ['www.breederhq.test', 'localhost'],
  },
});
