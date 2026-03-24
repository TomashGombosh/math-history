import { requireAdmin } from "../../utils/auth";
import { Teacher } from "../../models/teacher";
import { createUniqueSlug, deleteImageFiles } from "./_helpers";

const DEFAULT_TEACHER_IMAGE_URL = "/profile-icon.webp";

function normalizeImageUrl(val) {
  if (val == null) return DEFAULT_TEACHER_IMAGE_URL;
  if (typeof val !== "string") return DEFAULT_TEACHER_IMAGE_URL;

  const trimmed = val.trim();
  return trimmed ? trimmed : DEFAULT_TEACHER_IMAGE_URL;
}

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

  const body = await readBody(event);

  const oldImageUrl = teacher.imageUrl || null;

  const updateData = {
    name: body.name ?? teacher.name,
    faculty: body.faculty ?? teacher.faculty,
    position: body.position ?? teacher.position,
    title: body.title ?? teacher.title,
    academicDegree: body.academicDegree ?? teacher.academicDegree,
    shortInformation: body.shortInformation ?? teacher.shortInformation,
    bio: body.bio ?? teacher.bio,
    publications: Array.isArray(body.publications)
      ? body.publications
      : teacher.publications,

    imageUrl: normalizeImageUrl(body.imageUrl),
  };

  if (body.name && body.name !== teacher.name) {
    updateData.slug = await createUniqueSlug(body.name);
  }

  await teacher.update(updateData);

  const newImageUrl = updateData.imageUrl || null;

  if (
    oldImageUrl &&
    oldImageUrl !== newImageUrl &&
    oldImageUrl !== DEFAULT_TEACHER_IMAGE_URL
  ) {
    await deleteImageFiles(oldImageUrl);
  }

  return teacher;
});
