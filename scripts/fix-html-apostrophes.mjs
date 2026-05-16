/**
 * Fix literal `\'` artifacts in Astro page bodies.
 *
 * Astro frontmatter (between the first two `---` markers) is JS where
 * `'don\'t'` is the correct way to escape an apostrophe inside a
 * single-quoted string. Below the frontmatter, the same sequence is HTML
 * body content where `\` renders literally as a backslash, producing
 * visible artifacts like "Doesn\'t Live in Your Inbox".
 *
 * This script walks each file line-by-line, ignores everything inside the
 * frontmatter block, and replaces `\'` with `'` everywhere else.
 */
import fs from 'fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/fix-html-apostrophes.mjs <file.astro> [...]');
  process.exit(1);
}

const BS_APOS = String.fromCharCode(92) + String.fromCharCode(39); // \'
const APOS = String.fromCharCode(39); // '

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  let inFrontmatter = false;
  let seenFrontmatterStart = false;
  let changes = 0;
  const out = lines.map((line) => {
    // Track frontmatter boundaries (first --- opens, second --- closes)
    if (line.trim() === '---') {
      if (!seenFrontmatterStart) {
        seenFrontmatterStart = true;
        inFrontmatter = true;
      } else if (inFrontmatter) {
        inFrontmatter = false;
      }
      return line;
    }
    if (inFrontmatter) return line;
    if (!line.includes(BS_APOS)) return line;
    const fixed = line.split(BS_APOS).join(APOS);
    if (fixed !== line) changes++;
    return fixed;
  });
  fs.writeFileSync(f, out.join('\n'), 'utf8');
  console.log(`${f}: ${changes}`);
}
