#!/usr/bin/env node
/**
 * Reads migrations/teachers_db_dump.sql PostgreSQL COPY block for public."Teachers"
 * and writes migration/data/teachers-seed.json (plain objects matching TeacherItem).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const sqlPath = join(repoRoot, "migrations/teachers_db_dump.sql");
const outDir = join(__dirname, "../migration/data");
const outPath = join(outDir, "teachers-seed.json");

/** Public CDN host for teacher photos (S3 keys under `teachers/`; separate CloudFront distribution). */
const TEACHER_IMAGE_CDN_BASE =
  process.env.TEACHER_IMAGE_CDN_BASE || "https://assets-math-stage.afj-solution.com";

const PK_TEACHER = "TEACHER";

function teacherSortKey(id) {
  return `T#${String(id).padStart(9, "0")}`;
}

function gsi1SlugKeys(slug, sk) {
  return { gsi1pk: `SLUG#${slug}`, gsi1sk: sk };
}

function pgVal(s) {
  if (s === "\\N" || s === undefined) return "";
  return s;
}

function normalizeImageUrl(val) {
  const trimmed = String(val ?? "").trim();
  if (!trimmed) return "/profile-icon.webp";
  const m = /^\/images\/(.+)$/.exec(trimmed);
  if (m) {
    const rest = m[1];
    return `${TEACHER_IMAGE_CDN_BASE}/${rest.startsWith("teachers/") ? rest : `teachers/${rest}`}`;
  }
  return trimmed;
}

function rowToItem(parts) {
  const n = parts.length;
  if (n < 12) {
    throw new Error(`Expected at least 12 tab parts, got ${n}`);
  }
  const updatedAt = parts[n - 1];
  const createdAt = parts[n - 2];
  const slug = parts[n - 3];
  const imageUrlRaw = parts[n - 4];
  const id = Number(parts[0]);
  if (!Number.isFinite(id)) {
    throw new Error(`Bad id: ${parts[0]}`);
  }
  let publicationsStr = parts.slice(8, n - 4).join("\t");
  /** pg_dump text COPY can double-escape quotes inside jsonb as \\" → normalize for JSON.parse */
  publicationsStr = publicationsStr.replace(/\\{2}"/g, '\\"');
  let publications;
  try {
    publications = JSON.parse(publicationsStr);
  } catch {
    throw new Error(`Invalid publications JSON for id ${id}: ${publicationsStr.slice(0, 80)}…`);
  }
  if (!Array.isArray(publications)) {
    throw new Error(`publications not array for id ${id}`);
  }

  const sk = teacherSortKey(id);
  const gsi = gsi1SlugKeys(slug, sk);
  void createdAt;
  void updatedAt;

  return {
    pk: PK_TEACHER,
    sk,
    entityType: "Teacher",
    id,
    name: pgVal(parts[1]),
    title: pgVal(parts[2]),
    academicDegree: pgVal(parts[3]),
    position: pgVal(parts[4]),
    faculty: pgVal(parts[5]),
    shortInformation: pgVal(parts[6]),
    bio: pgVal(parts[7]),
    publications,
    imageUrl: normalizeImageUrl(imageUrlRaw === "\\N" ? "" : imageUrlRaw),
    slug,
    gsi1pk: gsi.gsi1pk,
    gsi1sk: gsi.gsi1sk,
  };
}

function extractCopyBody(sql) {
  const copyLine = /^COPY public\."Teachers"[^\n]*\n/m;
  const m = copyLine.exec(sql);
  if (!m) {
    throw new Error(`COPY public."Teachers" not found in ${sqlPath}`);
  }
  const start = m.index + m[0].length;
  const sub = sql.slice(start);
  const hit = /\n\\\.\r?\n/.exec(sub);
  if (!hit) {
    throw new Error("COPY terminator \\. not found");
  }
  return sub.slice(0, hit.index);
}

function main() {
  const sql = readFileSync(sqlPath, "utf8");
  const body = extractCopyBody(sql);
  const lines = body.split("\n").filter((l) => l.length > 0);

  const items = [];
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    try {
      const parts = line.split("\t");
      items.push(rowToItem(parts));
    } catch (e) {
      throw new Error(`Line ${li + 1}: ${e.message}\n${line.slice(0, 200)}…`);
    }
  }

  const maxId = items.reduce((m, it) => Math.max(m, it.id), 0);
  const payload = {
    version: 1,
    source: "migrations/teachers_db_dump.sql",
    teacherSeq: maxId,
    items,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload)}\n`, "utf8");
  console.error(`Wrote ${items.length} teachers (teacherSeq=${maxId}) -> ${outPath}`);
}

main();
