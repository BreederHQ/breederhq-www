#!/usr/bin/env node
// Pagefind generates its search index into dist/client/pagefind/ after
// `astro build`. The Vercel adapter, however, has already copied static
// files into .vercel/output/static/ at that point — meaning the freshly
// generated index never ships to production. This script mirrors the
// generated index into the Vercel output so the deploy includes it.
//
// Run via the build script: `astro build && pagefind ... && node scripts/copy-pagefind-to-vercel.mjs`

import { cp, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const src = resolve('dist/client/pagefind');
const vercelDest = resolve('.vercel/output/static/pagefind');

async function main() {
  if (!existsSync(src)) {
    console.error('[copy-pagefind-to-vercel] Source not found:', src);
    console.error('Did Pagefind run? Expected dist/client/pagefind/ to exist after `pagefind --site dist/client --output-subdir pagefind`.');
    process.exit(1);
  }

  // The Vercel adapter only generates .vercel/output when targeting Vercel.
  // If we're not deploying to Vercel (e.g. running pagefind manually), skip
  // silently rather than erroring.
  const vercelOutputExists = existsSync(resolve('.vercel/output/static'));
  if (!vercelOutputExists) {
    console.log('[copy-pagefind-to-vercel] .vercel/output/static not found — skipping (not a Vercel build).');
    return;
  }

  if (existsSync(vercelDest)) {
    await rm(vercelDest, { recursive: true, force: true });
  }

  await cp(src, vercelDest, { recursive: true });

  const stats = await stat(vercelDest);
  if (!stats.isDirectory()) {
    console.error('[copy-pagefind-to-vercel] Copy failed — destination is not a directory:', vercelDest);
    process.exit(1);
  }

  console.log('[copy-pagefind-to-vercel] Mirrored Pagefind index into .vercel/output/static/pagefind/');
}

main().catch((err) => {
  console.error('[copy-pagefind-to-vercel] Failed:', err);
  process.exit(1);
});
