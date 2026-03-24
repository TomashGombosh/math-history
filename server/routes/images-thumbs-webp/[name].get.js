import path from "node:path";
import { createReadStream, existsSync } from "node:fs";

function getPublicRoots() {
  const rootDir = process.cwd();
  return [
    path.join(rootDir, "public"),
    path.join(rootDir, ".output", "public"),
  ];
}

export default defineEventHandler((event) => {
  const name = event.context.params.name;

  const roots = getPublicRoots();
  const relativeDirs = [
    ["images-thumbs-webp"],
    ["teachers_img", "images-thumbs-webp"],
    ["graduates_img", "images-thumbs-webp"],
  ];

  for (const root of roots) {
    for (const parts of relativeDirs) {
      const filePath = path.join(root, ...parts, name);
      if (existsSync(filePath)) {
        setHeader(event, "Content-Type", "image/webp");
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
    statusMessage: `Thumb WebP image not found: ${name}`,
  });
});
