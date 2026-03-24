import path from "node:path";
import { promises as fs, existsSync } from "node:fs";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);

  if (!form) {
    throw createError({
      statusCode: 400,
      statusMessage: "Форма без файлів",
    });
  }

  const filePart = form.find((item) => item.name === "image" && item.data);
  if (!filePart) {
    throw createError({
      statusCode: 400,
      statusMessage: "Поле image не знайдено",
    });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (filePart.type && !allowedTypes.includes(filePart.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Непідтримуваний формат зображення",
    });
  }

  const originalName = filePart.filename || "image.jpg";
  const ext = path.extname(originalName).toLowerCase() || ".jpg";

  const timeStamp = Date.now();
  const fileName = `${timeStamp}${ext}`;
  const webpName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, ".webp");

  const query = getQuery(event);
  const scope = (query.scope || query.type || "common").toString();

  function getSubDirsForScope(scope) {
    if (scope === "teacher") {
      return ["teachers_img"];
    }
    if (scope === "graduate" || scope === "graduates") {
      return ["graduates_img"];
    }

    return [];
  }

  const subDirs = getSubDirsForScope(scope);

  const rootDir = process.cwd();
  const candidateRoots = [
    path.join(rootDir, "public"),
    path.join(rootDir, ".output", "public"),
  ];

  const publicRoots = [];
  for (const dir of candidateRoots) {
    if (existsSync(dir)) {
      publicRoots.push(dir);
    }
  }

  if (publicRoots.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: "Не знайдено жодної public-папки для збереження зображень",
    });
  }

  const webpBuffer = await sharp(filePart.data)
    .resize(800, 1000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const thumbBuffer = await sharp(filePart.data)
    .resize(250, 250, { fit: "cover", position: "entropy" })
    .webp({ quality: 80 })
    .toBuffer();

  for (const root of publicRoots) {
    const imagesDir = path.join(root, ...subDirs, "images");
    const webpDir = path.join(root, ...subDirs, "images-webp");
    const thumbsDir = path.join(root, ...subDirs, "images-thumbs-webp");

    await fs.mkdir(imagesDir, { recursive: true });
    await fs.mkdir(webpDir, { recursive: true });
    await fs.mkdir(thumbsDir, { recursive: true });

    await fs.writeFile(path.join(imagesDir, fileName), filePart.data);
    await fs.writeFile(path.join(webpDir, webpName), webpBuffer);
    await fs.writeFile(path.join(thumbsDir, webpName), thumbBuffer);
  }

  return {
    imageUrl: `/images/${fileName}`,
    webpUrl: `/images-webp/${webpName}`,
  };
});
