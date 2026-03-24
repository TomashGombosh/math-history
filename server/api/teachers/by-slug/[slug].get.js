import { Teacher } from "../../../models/teacher.js";

export default defineEventHandler(async (event) => {
  const { slug } = event.context.params;

  const teacher = await Teacher.findOne({
    where: { slug },
  });

  if (!teacher) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not found",
    });
  }

  return teacher;
});
