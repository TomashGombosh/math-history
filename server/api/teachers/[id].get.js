import { requireAdmin } from "../../utils/auth";
import { Teacher } from "../../models/teacher.js";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const { id } = event.context.params;

  const teacher = await Teacher.findByPk(id);

  if (!teacher) {
    throw createError({
      statusCode: 404,
      statusMessage: "Teacher not found",
    });
  }

  return teacher;
});
