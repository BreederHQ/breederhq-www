import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const dir = 'public/images/screenshots';
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/png2webp.mjs <file1.png> [file2.png ...]');
  process.exit(1);
}

for (const f of files) {
  const src = path.join(dir, f);
  const dst = path.join(dir, f.replace(/\.png$/, '.webp'));
  await sharp(src).webp({ quality: 85 }).toFile(dst);
  const sIn = fs.statSync(src).size;
  const sOut = fs.statSync(dst).size;
  console.log(`${f}: ${(sIn/1024).toFixed(0)}KB -> ${(sOut/1024).toFixed(0)}KB`);
}
