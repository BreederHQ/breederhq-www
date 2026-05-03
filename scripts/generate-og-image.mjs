import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const logoPath = resolve(root, 'public/logo.png');
const outPath = resolve(root, 'public/og-image.jpg');

const W = 1200;
const H = 630;

const logo = await sharp(logoPath)
  .resize({ height: 360, fit: 'inside' })
  .toBuffer();
const logoMeta = await sharp(logo).metadata();

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0f17"/>
      <stop offset="100%" stop-color="#1a1410"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#f77b1a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#f77b1a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W * 0.78}" cy="${H * 0.35}" r="320" fill="url(#glow)"/>
  <text x="60" y="${H - 80}" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700" fill="#ffffff">BreederHQ</text>
  <text x="60" y="${H - 38}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="400" fill="#a8b0bd">Professional breeding program management</text>
  <rect x="60" y="${H - 130}" width="60" height="4" fill="#f77b1a"/>
</svg>
`;

const logoLeft = Math.round((W - (logoMeta.width ?? 360)) / 2);
const logoTop = 90;

await sharp(Buffer.from(svg))
  .composite([{ input: logo, left: logoLeft, top: logoTop }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(outPath);

console.log(`Wrote ${outPath} (${W}x${H})`);
