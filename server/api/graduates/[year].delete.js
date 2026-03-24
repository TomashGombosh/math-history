import { Graduate } from "../../models/graduate.js";
import { requireAdmin } from "../../utils/auth.js";
import { deleteImageFiles } from "../teachers/_helpers.js";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { year } = event.context.params;
  const yearNum = Number(year);

  if (!yearNum || Number.isNaN(yearNum)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некоректний рік у URL",
    });
  }

  const grad = await Graduate.findOne({ where: { year: yearNum } });

  if (!grad) {
    throw createError({
      statusCode: 404,
      statusMessage: `Випуск за ${yearNum} рік не знайдено`,
    });
  }

  const images = Array.isArray(grad.images) ? grad.images : [];
  for (const img of images) {
    if (img && img.url) {
      await deleteImageFiles(img.url);
    }
  }

  await grad.destroy();

  return {
    ok: true,
    year: yearNum,
    id: grad.id,
  };
});
