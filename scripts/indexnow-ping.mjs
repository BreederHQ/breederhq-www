/**
 * IndexNow ping script — submit new/updated URLs to Bing (and via Bing, other engines).
 *
 * Usage:
 *   node scripts/indexnow-ping.mjs                  # pings all article URLs
 *   node scripts/indexnow-ping.mjs /articles/foo    # pings a single URL
 *
 * Set INDEXNOW_KEY in your environment (or .env.local) before running.
 * The key file must be served at https://breederhq.com/<key>.txt containing just the key.
 * Docs: https://www.indexnow.org/documentation
 */

import { articles } from '../src/data/articles.ts' with { type: 'ts-module' };

const KEY = process.env.INDEXNOW_KEY;
const HOST = 'breederhq.com';
const BASE = `https://${HOST}`;

if (!KEY) {
  console.error('INDEXNOW_KEY env var is not set. Get a key from https://www.indexnow.org/');
  process.exit(1);
}

// Build URL list
const specificPath = process.argv[2];

let urls;
if (specificPath) {
  urls = [`${BASE}${specificPath}`];
} else {
  // All article pages + the index
  urls = [
    `${BASE}/articles`,
    ...articles.map(a => `${BASE}/articles/${a.slug}`),
  ];
}

console.log(`Submitting ${urls.length} URL(s) to IndexNow...`);

const body = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `${BASE}/${KEY}.txt`,
  urlList: urls,
});

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body,
});

if (res.ok || res.status === 202) {
  console.log(`Done. Status: ${res.status}`);
  urls.forEach(u => console.log(`  + ${u}`));
} else {
  const text = await res.text().catch(() => '');
  console.error(`Failed. Status: ${res.status}`, text);
  process.exit(1);
}
