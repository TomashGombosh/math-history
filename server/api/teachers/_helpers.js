import path from "node:path";
import { promises as fs, existsSync } from "node:fs";
import { Teacher } from "../../models/teacher";

function getPublicRoots() {
  const rootDir = process.cwd();
  const candidates = [
    path.join(rootDir, "public"),
    path.join(rootDir, ".output", "public"),
  ];
  return candidates.filter((dir) => existsSync(dir));
}

export async function deleteImageFiles(imageUrl) {
  if (!imageUrl) return;

  try {
    const roots = getPublicRoots();
    if (roots.length === 0) return;

    const fileName = path.basename(imageUrl);
    const webpName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, ".webp");

    const pathsToDelete = [];

    for (const root of roots) {
      pathsToDelete.push(path.join(root, "images", fileName));
      pathsToDelete.push(path.join(root, "images-webp", webpName));
      pathsToDelete.push(path.join(root, "images-thumbs-webp", webpName));

      pathsToDelete.push(path.join(root, "teachers_img", "images", fileName));
      pathsToDelete.push(
        path.join(root, "teachers_img", "images-webp", webpName)
      );
      pathsToDelete.push(
        path.join(root, "teachers_img", "images-thumbs-webp", webpName)
      );

      pathsToDelete.push(path.join(root, "graduates_img", "images", fileName));
      pathsToDelete.push(
        path.join(root, "graduates_img", "images-webp", webpName)
      );
      pathsToDelete.push(
        path.join(root, "graduates_img", "images-thumbs-webp", webpName)
      );
    }

    for (const filePath of pathsToDelete) {
      await fs.unlink(filePath).catch((e) => {
        if (e.code !== "ENOENT") {
          console.error("Delete image error:", filePath, e);
        }
      });
    }
  } catch (e) {
    console.error("deleteImageFiles error:", e);
  }
}

function slugify(str) {
  if (!str) return "";

  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ye",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "yi",
    й: "i",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ю: "yu",
    я: "ya",
    ъ: "",
    ь: "",
    ё: "yo",
    э: "e",
    ы: "y",
  };

  return String(str)
    .toLowerCase()
    .split("")
    .map((ch) => {
      if (map[ch]) return map[ch];
      if (/[a-z0-9]/.test(ch)) return ch;
      return "-";
    })
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createUniqueSlug(name) {
  let base = slugify(name);
  if (!base) base = "teacher";

  let slug = base;
  let counter = 1;

  while (true) {
    const exists = await Teacher.findOne({ where: { slug } });
    if (!exists) break;
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}
