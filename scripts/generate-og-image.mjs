// Generate client/public/og-image.png (1200×630) for Open Graph share previews.
// Composites the UzNU header logo on a brand-colored canvas with the Ukrainian site title.
// Re-run when branding changes: `npm run og:generate` from the repo root.

import path from "node:path";
import { promises as fs } from "node:fs";
import sharp from "sharp";

const rootDir = path.resolve(import.meta.dirname, "..");
const logoPath = path.join(rootDir, "client/src/assets/UzNU_logo_header.png");
const outPath = path.join(rootDir, "client/public/og-image.png");

const WIDTH = 1200;
const HEIGHT = 630;
const BG = "#a3c8f2";
const TITLE_COLOR = "#0c2747";
const SUBTITLE_COLOR = "#143866";
const ACCENT = "#0c2747";
const LOGO_SIZE = 220;

async function main() {
	await fs.access(logoPath).catch(() => {
		throw new Error(`Logo not found: ${logoPath}`);
	});

	const logo = await sharp(logoPath)
		.resize(LOGO_SIZE, LOGO_SIZE, {
			fit: "contain",
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer();

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#7fb0e6"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="60" y="60" width="${WIDTH - 120}" height="${HEIGHT - 120}" rx="24" ry="24"
        fill="none" stroke="${ACCENT}" stroke-opacity="0.15" stroke-width="2"/>
  <text x="${WIDTH / 2}" y="${HEIGHT * 0.62}"
        font-family="Helvetica, Arial, 'Liberation Sans', sans-serif"
        font-size="92" font-weight="700"
        fill="${TITLE_COLOR}" text-anchor="middle" dominant-baseline="middle">Математики УжНУ</text>
  <text x="${WIDTH / 2}" y="${HEIGHT * 0.78}"
        font-family="Helvetica, Arial, 'Liberation Sans', sans-serif"
        font-size="30" font-weight="400"
        fill="${SUBTITLE_COLOR}" text-anchor="middle" dominant-baseline="middle">Історія кафедри математики Ужгородського національного університету</text>
</svg>`;

	const base = await sharp(Buffer.from(svg)).png().toBuffer();

	await sharp(base)
		.composite([
			{
				input: logo,
				top: Math.round(HEIGHT * 0.12),
				left: Math.round((WIDTH - LOGO_SIZE) / 2),
			},
		])
		.png({ compressionLevel: 9 })
		.toFile(outPath);

	const stat = await fs.stat(outPath);
	const meta = await sharp(outPath).metadata();
	console.log(
		`✅ ${path.relative(rootDir, outPath)} — ${meta.width}×${meta.height} ${meta.format}, ${stat.size} bytes`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
