// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Pages that should NOT appear in the sitemap
const excludedPages = [
  'https://breederhq.com/coming-soon',
  'https://breederhq.com/404',
  'https://breederhq.com/share',
  'https://breederhq.com/pricing', // Redirects to /coming-soon — remove from sitemap when pricing launches
  'https://breederhq.com/site-updates', // Internal update log for marketing manager — not for public indexing
  'https://breederhq.com/demo',
  'https://breederhq.com/demo/login',
];

// https://astro.build/config
export default defineConfig({
  site: 'https://breederhq.com',
  output: 'static', // Static pages by default; SSR opt-in via `export const prerender = false`
  trailingSlash: 'never', // Canonical URLs without trailing slash (e.g. /about not /about/)
  adapter: vercel(),
  security: { checkOrigin: false }, // Allow POST on SSR demo pages
  integrations: [
    sitemap({
      filter: (page) => !excludedPages.includes(page),
      serialize(item) {
        // Homepage — highest priority, changes frequently
        if (item.url === 'https://breederhq.com/') {
          item.changefreq = 'weekly';
          item.priority = 1.0;
        }
        // Species pages — high priority
        else if (/^https:\/\/breederhq\.com\/(dogs|cats|horses|goats|rabbits|sheep)$/.test(item.url)) {
          item.changefreq = 'monthly';
          item.priority = 0.9;
        }
        // Comparison pages — high value for SEO
        else if (item.url.includes('/compare/')) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        }
        // Workflow pages — core feature content
        else if (item.url.includes('/workflows/') || item.url.endsWith('/workflows')) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        }
        // Business pages (FAQ, contact, service-providers)
        else if (/\/(faq|contact|service-providers)$/.test(item.url)) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        }
        // Buyer education pages
        else if (item.url.includes('/buyers')) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        }
        // About page
        else if (item.url.endsWith('/about')) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        }
        // Legal pages (privacy, terms) — low priority but should be indexed
        else if (/\/(privacy|terms)$/.test(item.url)) {
          item.changefreq = 'yearly';
          item.priority = 0.3;
        }
        // Default
        else {
          item.changefreq = 'monthly';
          item.priority = 0.5;
        }

        item.lastmod = new Date();
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: true,
    allowedHosts: ['www.breederhq.test', 'localhost'],
  },
});
