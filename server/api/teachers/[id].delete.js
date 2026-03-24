import { requireAdmin } from "../../utils/auth";
import { Teacher } from "../../models/teacher";
import { deleteImageFiles } from "./_helpers";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const { id } = event.context.params;
  const teacher = await Teacher.findByPk(id);

  if (!teacher) {
    throw createError({
      statusCode: 404,
      statusMessage: "Teacher not found",
    });
  }

  const imageUrl = teacher.imageUrl;

  await teacher.destroy();
  await deleteImageFiles(imageUrl);

  return { message: "Deleted" };
});
