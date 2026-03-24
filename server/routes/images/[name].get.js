import path from "node:path";
import { createReadStream, existsSync } from "node:fs";

function getPublicRoots() {
  const rootDir = process.cwd();
  return [
    path.join(rootDir, "public"),
    path.join(rootDir, ".output", "public"),
  ];
}

function getMimeByExt(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export default defineEventHandler((event) => {
  const name = event.context.params.name;

  const roots = getPublicRoots();

  const relativeDirs = [
    ["images"],
    ["teachers_img", "images"],
    ["graduates_img", "images"],
  ];

  for (const root of roots) {
    for (const parts of relativeDirs) {
      const filePath = path.join(root, ...parts, name);
      if (existsSync(filePath)) {
        setHeader(event, "Content-Type", getMimeByExt(name));
        setHeader(
          event,
          "Cache-Control",
          "public, max-age=31536000, immutable"
        );
        return createReadStream(filePath);
      }
    }
  }

  throw createError({
    statusCode: 404,
    statusMessage: `Image not found: ${name}`,
  });
});
