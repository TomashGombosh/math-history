import { promises as fs } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "layoutConfig.json");

const DEFAULT_CONFIG = {
  headerFields: [
    { id: "title", label: "Title", visible: true, order: 1 },
    {
      id: "academicDegree",
      label: "Науковий ступінь",
      visible: true,
      order: 2,
    },
    { id: "position", label: "Посада", visible: true, order: 3 },
    { id: "faculty", label: "Факультет", visible: true, order: 4 },
  ],
  sections: [
    {
      id: "shortInformation",
      title: "Коротка інформація",
      visible: true,
      order: 1,
    },
    { id: "bio", title: "Біографія", visible: true, order: 2 },
    { id: "publications", title: "Публікації", visible: true, order: 3 },
  ],
};

async function readConfig() {
  try {
    const content = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    await fs.writeFile(
      CONFIG_PATH,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
      "utf-8"
    );
    return DEFAULT_CONFIG;
  }
}

export default defineEventHandler(async () => {
  try {
    const cfg = await readConfig();
    return cfg;
  } catch (e) {
    console.error("Read layout config error:", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Cannot read layout config",
    });
  }
});
