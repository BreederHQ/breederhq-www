#!/usr/bin/env node
// Generates the public legal pages from the canonical markdown.
//
// THE PROBLEM THIS SOLVES
//
// The legal documents are authored in the breederhq repo, at
// packages/ui/src/legal/*.md, and rendered from there in the product. This
// site is a separate repository that Vercel builds on its own, so it cannot
// import them. Before this script, that gap was filled by hand: privacy.astro
// carried 184 lines of policy text dated February 2026 while the canonical
// Privacy Policy had moved to version 1.2 in May. The public page was serving
// a document nobody had accepted, and nothing said so.
//
// Copying text between repositories by hand always ends there. So the pages
// are GENERATED and committed, and `--check` fails when they no longer match
// the source — which is what turns "remember to update the website" into
// something CI catches.
//
//   node scripts/sync-legal-documents.mjs           # regenerate the pages
//   node scripts/sync-legal-documents.mjs --check   # fail if they are stale
//
// The generated pages are committed deliberately. A build-time fetch across
// repositories would make this site's deploy depend on another repository
// being present, which it is not on Vercel.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

// The canonical documents live in the sibling checkout. Overridable so CI can
// point at wherever it has cloned breederhq.
const LEGAL_SRC =
  process.env.BHQ_LEGAL_SOURCE ||
  resolve(repoRoot, '../breederhq/packages/ui/src/legal');

const OUT_DIR = resolve(repoRoot, 'src/pages/legal');

/**
 * The documents published here, in the order they appear to a reader. Each
 * names its current file: the version is part of the filename, so a version
 * bump is a visible edit to this list rather than a silent content change.
 */
const DOCUMENTS = [
  {
    slug: 'terms',
    file: 'terms-of-service-2.1.md',
    title: 'Terms of Service',
    description:
      'The terms governing use of BreederHQ, covering the platform, the marketplace and the client portal.',
  },
  {
    slug: 'privacy',
    file: 'privacy-policy-1.2.md',
    title: 'Privacy Policy',
    description:
      'How BreederHQ collects, uses, shares and protects your data across the platform and mobile apps.',
  },
  {
    slug: 'acceptable-use',
    file: 'acceptable-use-policy-1.1.md',
    title: 'Acceptable Use Policy',
    description:
      'What is and is not permitted on BreederHQ, and how BreederHQ responds to violations.',
  },
  {
    slug: 'buyer-terms',
    file: 'buyer-terms-2.1.md',
    title: 'Buyer Terms',
    description:
      'The terms that apply when browsing listings, joining waitlists, and buying animals or services on the BreederHQ Marketplace.',
  },
  {
    slug: 'seller-agreement',
    file: 'breeder-seller-agreement-2.1.md',
    title: 'Breeder/Seller Agreement',
    description:
      'The agreement breeders accept when listing animals on the BreederHQ Marketplace.',
  },
  {
    slug: 'service-provider-agreement',
    file: 'service-provider-agreement-1.1.md',
    title: 'Service Provider Agreement',
    description:
      'The agreement farriers, trainers, veterinarians, groomers, transporters and other animal-care professionals accept when offering services on BreederHQ.',
  },
  {
    slug: 'transaction-terms',
    file: 'marketplace-transaction-terms-1.2.md',
    title: 'Marketplace Transaction Terms',
    description:
      'The terms governing transactions on the BreederHQ Marketplace, including payments, refunds, chargebacks and taxes.',
  },
  {
    slug: 'legal-definitions',
    file: 'legal-definitions-1.0.md',
    title: 'Legal Definitions Schedule',
    description:
      'The defined terms used across BreederHQ’s user agreements, incorporated by reference into every one of them.',
  },
];

/** Escape a value being interpolated into an Astro frontmatter string. */
function jsString(value) {
  return JSON.stringify(String(value));
}

/**
 * Minimal markdown to HTML. Deliberately small: these documents use a narrow
 * subset — headings, paragraphs, bullets, bold, italic, links, horizontal
 * rules and tables — and a full parser would be a dependency this site does
 * not otherwise need. Anything unrecognised passes through as a paragraph,
 * so an unexpected construct degrades to plain text rather than vanishing.
 */
function renderMarkdown(md) {
  const escapeHtml = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  // Inline: bold, italic, links. Applied after escaping so document text
  // cannot inject markup.
  const inline = (s) =>
    escapeHtml(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-[hsl(24,95%,45%)] underline">$1</a>',
      );

  const lines = md.split(/\r?\n/);
  const out = [];
  let para = [];
  let list = null;
  let table = null;

  const flushPara = () => {
    if (para.length) {
      out.push(`<p class="mb-4 text-gray-700 leading-relaxed">${inline(para.join(' '))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(
        `<ul class="mb-4 ml-6 list-disc space-y-2 text-gray-700">${list
          .map((li) => `<li>${inline(li)}</li>`)
          .join('')}</ul>`,
      );
      list = null;
    }
  };
  const flushTable = () => {
    if (table && table.rows.length) {
      const head = table.rows[0];
      const body = table.rows.slice(1);
      out.push(
        `<div class="mb-6 overflow-x-auto"><table class="w-full text-left text-sm text-gray-700">` +
          `<thead><tr>${head.map((c) => `<th class="border-b border-gray-300 py-2 pr-4 font-semibold">${inline(c)}</th>`).join('')}</tr></thead>` +
          `<tbody>${body
            .map(
              (r) =>
                `<tr>${r.map((c) => `<td class="border-b border-gray-100 py-2 pr-4 align-top">${inline(c)}</td>`).join('')}</tr>`,
            )
            .join('')}</tbody></table></div>`,
      );
    }
    table = null;
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushTable();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushAll();
      continue;
    }

    // Table rows. The separator row (|---|---|) is skipped.
    if (/^\s*\|/.test(line)) {
      flushPara();
      flushList();
      const cells = line
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      table = table || { rows: [] };
      table.rows.push(cells);
      continue;
    }
    flushTable();

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const size =
        level === 1
          ? 'text-3xl font-bold mt-10 mb-4'
          : level === 2
            ? 'text-2xl font-semibold mt-8 mb-3'
            : level === 3
              ? 'text-xl font-semibold mt-6 mb-2'
              : 'text-lg font-semibold mt-4 mb-2';
      out.push(`<h${level} class="${size} text-gray-900">${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushAll();
      out.push('<hr class="my-8 border-gray-200" />');
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushPara();
      list = list || [];
      list.push(bullet[1]);
      continue;
    }
    flushList();

    para.push(line.trim());
  }
  flushAll();

  return out.join('\n        ');
}

/** The page source for one document. */
function renderPage(doc, html) {
  return `---
// GENERATED FILE — DO NOT EDIT.
//
// Written by scripts/sync-legal-documents.mjs from the canonical document at
// packages/ui/src/legal/${doc.file} in the breederhq repository. Editing this
// file by hand puts the public page out of step with the document users
// actually accept, which is the failure this generation exists to prevent.
//
// To change the text, edit the source document and re-run:
//   node scripts/sync-legal-documents.mjs
import BaseLayout from '../../layouts/BaseLayout.astro';

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Legal', url: '/legal' },
  { name: ${jsString(doc.title)}, url: ${jsString('/legal/' + doc.slug)} }
];
---

<BaseLayout
  title=${jsString(doc.title + ' - BreederHQ')}
  description=${jsString(doc.description)}
  breadcrumbs={breadcrumbs}
>
  <main>
    <section class="py-16 bg-white">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        ${html}

        <div class="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-600">
          <p>
            Questions about this document can go to
            <a href="mailto:legal@breederhq.com" class="text-[hsl(24,95%,45%)] underline">legal@breederhq.com</a>.
          </p>
          <p class="mt-3">
            <a href="/legal" class="text-[hsl(24,95%,45%)] underline">All legal documents</a>
          </p>
        </div>
      </div>
    </section>
  </main>
</BaseLayout>
`;
}

/** The index page listing every document. */
function renderIndex(docs) {
  const items = docs
    .map(
      (d) => `          <li class="border-b border-gray-100 py-4">
            <a href=${jsString('/legal/' + d.slug)} class="text-lg font-semibold text-[hsl(24,95%,45%)] underline">${d.title}</a>
            <p class="mt-1 text-gray-700">${d.description}</p>
          </li>`,
    )
    .join('\n');

  return `---
// GENERATED FILE — DO NOT EDIT. See scripts/sync-legal-documents.mjs.
import BaseLayout from '../../layouts/BaseLayout.astro';

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Legal', url: '/legal' }
];
---

<BaseLayout
  title="Legal - BreederHQ"
  description="The agreements and policies governing use of BreederHQ, for breeders, service providers and buyers."
  breadcrumbs={breadcrumbs}
>
  <main>
    <section class="py-16 bg-white">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 mb-6">Legal</h1>
        <p class="text-lg text-gray-700 mb-8">
          These are the agreements and policies that govern use of BreederHQ.
          Which of them apply to you depends on how you use the platform.
        </p>
        <ul class="list-none p-0">
${items}
        </ul>
        <div class="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-600">
          <p>
            Questions can go to
            <a href="mailto:legal@breederhq.com" class="text-[hsl(24,95%,45%)] underline">legal@breederhq.com</a>.
          </p>
        </div>
      </div>
    </section>
  </main>
</BaseLayout>
`;
}

async function main() {
  const check = process.argv.includes('--check');

  if (!existsSync(LEGAL_SRC)) {
    // The generated pages are committed, so a build without the source
    // checkout still ships the right content — it simply cannot verify that it
    // is current. Vercel builds this repository alone, so this is the normal
    // case there and must not fail the deploy. The check earns its keep
    // locally and in CI, where the sibling checkout exists.
    if (check) {
      console.warn(
        `[sync-legal] Source documents not available (${LEGAL_SRC}); skipping the staleness check.`,
      );
      console.warn(
        '[sync-legal] The committed pages will be published as they stand.',
      );
      return;
    }
    console.error(`[sync-legal] Source documents not found: ${LEGAL_SRC}`);
    console.error(
      'Set BHQ_LEGAL_SOURCE to the legal directory in the breederhq repository.',
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const generated = [];
  let stale = [];

  for (const doc of DOCUMENTS) {
    const srcPath = resolve(LEGAL_SRC, doc.file);
    if (!existsSync(srcPath)) {
      console.error(`[sync-legal] Missing source document: ${srcPath}`);
      console.error(
        `The DOCUMENTS list names ${doc.file}. If the version moved, update the list.`,
      );
      process.exit(1);
    }

    const md = await readFile(srcPath, 'utf8');
    const page = renderPage(doc, renderMarkdown(md));
    const outPath = resolve(OUT_DIR, `${doc.slug}.astro`);

    const existing = existsSync(outPath) ? await readFile(outPath, 'utf8') : null;
    const changed = existing !== page;

    if (changed) {
      if (check) {
        stale.push(`${doc.slug}.astro (from ${doc.file})`);
      } else {
        await writeFile(outPath, page, 'utf8');
        console.log(`[sync-legal] wrote src/pages/legal/${doc.slug}.astro`);
      }
    }
    generated.push(doc);
  }

  const indexPage = renderIndex(DOCUMENTS);
  const indexPath = resolve(OUT_DIR, 'index.astro');
  const existingIndex = existsSync(indexPath) ? await readFile(indexPath, 'utf8') : null;
  if (existingIndex !== indexPage) {
    if (check) {
      stale.push('index.astro');
    } else {
      await writeFile(indexPath, indexPage, 'utf8');
      console.log('[sync-legal] wrote src/pages/legal/index.astro');
    }
  }

  if (check) {
    if (stale.length) {
      console.error(
        '\n[sync-legal] The published legal pages are OUT OF DATE with the canonical documents:\n',
      );
      for (const s of stale) console.error(`  - ${s}`);
      console.error(
        '\nRun `node scripts/sync-legal-documents.mjs` and commit the result.\n' +
          'A stale page publishes a document nobody accepted.',
      );
      process.exit(1);
    }
    console.log(`[sync-legal] up to date (${DOCUMENTS.length} documents)`);
    return;
  }

  console.log(`[sync-legal] ${generated.length} documents synced`);
}

main().catch((err) => {
  console.error('[sync-legal] failed:', err);
  process.exit(1);
});
