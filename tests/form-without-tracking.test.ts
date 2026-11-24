import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const ROOT = new URL('../', import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, ROOT), 'utf8');

// Ad blockers refuse the bundled tracking chunk. A form script that imports it
// statically never runs, so the applicant cannot apply. Each form script must
// reach analytics only through ../lib/optionalTracking.
const FORM_SCRIPTS = ['src/pages/pricing/index.astro', 'src/components/ContactForm.astro'];

function importSpecifiers(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/^\s*import\s[^;]*?from\s+['"]([^'"]+)['"]/gm)) out.push(m[1]);
  return out;
}

for (const file of FORM_SCRIPTS) {
  test(`${file} has no static import of the tracking module`, () => {
    const specs = importSpecifiers(read(file));
    assert.ok(
      specs.some((s) => s.endsWith('lib/optionalTracking')),
      'form script must use optionalTracking',
    );
    const direct = specs.filter((s) => /(^|\/)tracking$/.test(s));
    assert.deepEqual(direct, []);
  });
}

test('optionalTracking has no static import of the tracking module', () => {
  const specs = importSpecifiers(read('src/lib/optionalTracking.ts'));
  assert.deepEqual(
    specs.filter((s) => /(^|\/)tracking$/.test(s)),
    [],
  );
});

test('optionalTracking degrades to no-ops and still reads UTM when the tracking chunk fails', async () => {
  const dom = new JSDOM('<!doctype html><html></html>', { url: 'https://www.breederhq.com/pricing' });
  const g = globalThis as any;
  g.sessionStorage = dom.window.sessionStorage;
  dom.window.sessionStorage.setItem('utm_params', JSON.stringify({ source: 'ads', campaign: 'c1' }));
  const mod = await import('../src/lib/optionalTracking.ts');
  assert.deepEqual(mod.getUTMParams(), { source: 'ads', campaign: 'c1' });
  assert.doesNotThrow(() => mod.trackFormStart('t'));
  assert.doesNotThrow(() => mod.trackFormSubmit('t'));
  dom.window.sessionStorage.setItem('utm_params', '{not json');
  assert.deepEqual(mod.getUTMParams(), {});
});

test('a first visit on a campaign link keeps its attribution with the tracking chunk blocked', async () => {
  // Empty storage: the blocked chunk is what normally saves the query parameters.
  const dom = new JSDOM('<!doctype html><html></html>', {
    url: 'https://www.breederhq.com/pricing?utm_source=ads&utm_campaign=spring',
  });
  const g = globalThis as any;
  g.sessionStorage = dom.window.sessionStorage;
  g.location = dom.window.location;
  const mod = await import('../src/lib/optionalTracking.ts');
  const utm = mod.getUTMParams();
  assert.equal(utm.source, 'ads');
  assert.equal(utm.campaign, 'spring');
  // Saved for the pages that follow, as initTracking does.
  assert.equal(JSON.parse(dom.window.sessionStorage.getItem('utm_params')!).source, 'ads');
});
