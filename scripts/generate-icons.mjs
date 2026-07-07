/**
 * Generate PWA icons + favicon for Ngo Boat Race.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '..', 'public', 'icons');
const publicDir = join(__dir, '..', 'public');

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

function buildSvg(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#1a6b8a"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.12}" fill="url(#bg)"/>
  <ellipse cx="${size / 2}" cy="${size * 0.62}" rx="${size * 0.35}" ry="${size * 0.06}" fill="#2088a8" opacity="0.6"/>
  <path d="M${size * 0.22} ${size * 0.55} L${size * 0.72} ${size * 0.55} L${size * 0.82} ${size * 0.5} L${size * 0.72} ${size * 0.62} L${size * 0.22} ${size * 0.62} Z" fill="#c41e3a"/>
  <path d="M${size * 0.72} ${size * 0.55} L${size * 0.85} ${size * 0.58} L${size * 0.72} ${size * 0.62} Z" fill="#ffd700"/>
  <text x="50%" y="${size * 0.28}" text-anchor="middle" font-size="${size * 0.14}" fill="#ffd700" font-family="system-ui,sans-serif" font-weight="bold">GHE NGO</text>
</svg>`);
}

async function main() {
  for (const size of [192, 512]) {
    await sharp(buildSvg(size)).png().toFile(join(outDir, `icon-${size}.png`));
    console.log(`✓ icons/icon-${size}.png`);
  }

  await sharp(buildSvg(32)).png().toFile(join(publicDir, 'favicon.ico'));
  console.log('✓ public/favicon.ico');

  await sharp(buildSvg(180)).png().toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
