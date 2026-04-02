#!/usr/bin/env node
/**
 * Reads repo-root graduates.xml → migration/data/graduate-seed.json
 * Items match GraduateItem (same DynamoDB table as teachers: pk=GRADUATE).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const xmlPath = join(repoRoot, "graduates.xml");
const outDir = join(__dirname, "../migration/data");
const outPath = join(outDir, "graduates-seed.json");

const PK = "GRADUATE";

function graduateSortKey(year, cohortId) {
  return `Y#${year}#${String(cohortId).padStart(9, "0")}`;
}

function parseAttrs(attrStr) {
  const o = {};
  for (const m of attrStr.matchAll(/(\w+)="([^"]*)"/g)) {
    o[m[1]] = m[2];
  }
  return o;
}

function parseGraduatesXml(xml) {
  const items = [];
  const gradRe = /<graduate\s+number="(\d+)"\s+year="(\d+)">([\s\S]*?)<\/graduate>/g;
  let cohortId = 0;
  let m;
  while ((m = gradRe.exec(xml)) !== null) {
    cohortId += 1;
    const cohortNumber = Number(m[1]);
    const year = Number(m[2]);
    const inner = m[3];
    const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(inner);
    const title = titleMatch ? titleMatch[1].replace(/\r\n/g, "\n").trim() : "";

    const students = [];
    const pRe = /<p\s+([^>]+)>([^<]*)<\/p>/g;
    let pm;
    while ((pm = pRe.exec(inner)) !== null) {
      const a = parseAttrs(pm[1]);
      const name = (pm[2] || "").trim();
      if (!name) continue;
      const index1 = Number(a.index1);
      const index2 = Number(a.index2);
      students.push({
        id: Number.isFinite(index2) ? index2 : students.length + 1,
        index: Number.isFinite(index1) && index1 > 0 ? index1 : students.length + 1,
        name,
        specialty: (a.specialty || "").trim(),
        section: (a.section || "").trim(),
        year,
        honorsDegree: a.isBold === "True",
      });
    }

    const totalStudents = students.length;
    const totalWithHonours = students.filter((s) => s.honorsDegree).length;
    const sk = graduateSortKey(year, cohortId);

    items.push({
      pk: PK,
      sk,
      entityType: "Graduate",
      id: cohortId,
      year,
      number: cohortNumber,
      title,
      images: [],
      students,
      totalStudents,
      totalWithHonours,
    });
  }
  return items;
}

function main() {
  const xml = readFileSync(xmlPath, "utf8");
  const items = parseGraduatesXml(xml);
  if (!items.length) {
    throw new Error(`No <graduate> rows parsed from ${xmlPath}`);
  }
  const graduateSeq = items.length;
  const payload = {
    version: 1,
    source: "graduates.xml",
    graduateSeq,
    items,
  };
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload)}\n`, "utf8");
  console.error(`Wrote ${items.length} graduate cohorts (graduateSeq=${graduateSeq}) -> ${outPath}`);
}

main();
