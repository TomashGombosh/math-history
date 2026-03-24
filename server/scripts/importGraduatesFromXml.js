import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Parser } from "xml2js";
import "dotenv/config";

import { sequelize } from "../utils/db.js";
import { Graduate } from "../models/graduate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function makeSlug(name) {
  if (!name) return "";

  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ie",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "i",
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
    ю: "iu",
    я: "ia",
    ь: "",
    ъ: "",
    э: "e",
    ё: "e",
  };

  const lower = name.toLowerCase();
  let res = "";

  for (const ch of lower) {
    if (map[ch]) res += map[ch];
    else if (/[a-z0-9]/.test(ch)) res += ch;
    else if (/\s|-/.test(ch)) res += "-";
  }

  res = res.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return res || "graduate";
}

async function importGraduates() {
  try {
    const rootDir = path.join(__dirname, "..", "..");
    const xmlPath = path.join(rootDir, "graduates.xml");

    console.log("📄 Reading:", xmlPath);
    const xml = fs.readFileSync(xmlPath, "utf8");

    const parser = new Parser({
      explicitArray: false,
      attrkey: "$",
      charkey: "_",
    });

    const parsed = await parser.parseStringPromise(xml);

    let graduates = parsed.graduates?.graduate;
    if (!graduates) {
      throw new Error("Не знайдено вузлів <graduate> у graduates.xml");
    }
    if (!Array.isArray(graduates)) graduates = [graduates];

    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL");

    await Graduate.sync({ force: true });
    console.log("✅ Table Graduates recreated");

    let imported = 0;

    for (const gradNode of graduates) {
      const attrs = gradNode.$ || {};
      const year = attrs.year ? parseInt(attrs.year, 10) : null;
      const number = attrs.number ? parseInt(attrs.number, 10) : null;

      let title = "";
      if (typeof gradNode.title === "string") {
        title = gradNode.title.trim();
      } else if (gradNode.title && typeof gradNode.title._ === "string") {
        title = gradNode.title._.trim();
      }

      let pList = gradNode.p || [];
      if (!Array.isArray(pList)) pList = [pList];

      const students = [];
      for (const p of pList) {
        if (!p) continue;

        let text = "";
        let a = {};

        if (typeof p === "string") {
          text = p.trim();
        } else {
          text = (p._ || "").trim();
          a = p.$ || {};
        }

        const sYear = a.year ? parseInt(a.year, 10) : year;
        const index1 = a.index1 ? parseInt(a.index1, 10) : null;
        const index2 = a.index2 ? parseInt(a.index2, 10) : null;

        const studentId = index2 ?? index1 ?? students.length + 1;

        const isBold =
          String(a.isBold || "")
            .toLowerCase()
            .trim() === "true";

        students.push({
          id: studentId,
          name: text,
          year: sYear,
          index: index1,
          section: a.section || "",
          specialty: a.specialty || "",
          group: a.group || "",
          isBold,
          originalIndex2: index2,
        });
      }

      const totalStudents = students.length;
      const totalWithHonours = students.filter((s) => s.isBold).length;

      const slugBase = `${year}-${title || `graduate-${number || ""}`}`;
      const slug = makeSlug(slugBase);

      await Graduate.create({
        year,
        number,
        title,
        slug,
        students,
        images: [],
        totalStudents,
        totalWithHonours,
      });

      imported++;
    }

    console.log(`✅ Imported ${imported} graduate records`);
  } catch (err) {
    console.error("❌ Import error:", err);
  } finally {
    await sequelize.close();
    console.log("🔌 DB connection closed");
  }
}

importGraduates();
