// scripts/generate-thumbs.mjs
import path from "node:path";
import { promises as fs } from "node:fs";
import sharp from "sharp";

const rootDir = process.cwd();

const srcDir = path.join(rootDir, "public", "teachers_img", "images-webp");
const dstDir = path.join(
  rootDir,
  "public",
  "teachers_img",
  "images-thumbs-webp"
);

async function main() {
  try {
    await fs.access(srcDir);
  } catch {
    console.error("❌ Не знайдено папку:", srcDir);
    process.exit(1);
  }

  await fs.mkdir(dstDir, { recursive: true });

  const files = await fs.readdir(srcDir);
  const webpFiles = files.filter((f) => f.toLowerCase().endsWith(".webp"));

  console.log(`Знайдено ${webpFiles.length} webp-файлів.`);

  for (const file of webpFiles) {
    const srcPath = path.join(srcDir, file);
    const dstPath = path.join(dstDir, file);

    console.log(` → створюю thumbnail для ${file}`);

    await sharp(srcPath)
      .resize(250, 250, { fit: "cover", position: "entropy" })
      .toFile(dstPath);
  }

  console.log("✅ Готово! Thumbnails у:", dstDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
