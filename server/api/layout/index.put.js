import { promises as fs } from "fs";
import { join } from "path";
import { requireAdmin } from "../../utils/auth.js";

const CONFIG_PATH = join(process.cwd(), "layoutConfig.json");

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);

  if (
    !body ||
    !Array.isArray(body.headerFields) ||
    !Array.isArray(body.sections)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid config format",
    });
  }

  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(body, null, 2), "utf-8");
    return { ok: true };
  } catch (e) {
    console.error("Write layout config error:", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Cannot save layout config",
    });
  }
});
