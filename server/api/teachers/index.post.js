import { readBody } from "h3";
import { requireAdmin } from "../../utils/auth";
import { Teacher } from "../../models/teacher";
import { createUniqueSlug } from "./_helpers";

const DEFAULT_TEACHER_IMAGE_URL = "/profile-icon.webp";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = (await readBody(event)) || {};

  const {
    name,
    faculty,
    position,
    title,
    academicDegree,
    shortInformation,
    bio,
    imageUrl,
    publications,
  } = body;

  if (!name || !name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Поле name є обов'язковим",
    });
  }

  const trimmedName = name.trim();

  let slug = await createUniqueSlug(trimmedName);
  if (!slug) slug = `teacher-${Date.now()}`;

  const safePublications = Array.isArray(publications) ? publications : [];

  const normalizedImageUrl =
    typeof imageUrl === "string" && imageUrl.trim()
      ? imageUrl.trim()
      : DEFAULT_TEACHER_IMAGE_URL;

  try {
    const teacher = await Teacher.create({
      name: trimmedName,
      slug,
      faculty: faculty || "",
      position: position || "",
      title: title || "",
      academicDegree: academicDegree || "",
      shortInformation: shortInformation || "",
      bio: bio || "",
      imageUrl: normalizedImageUrl,
      publications: safePublications,
    });

    return teacher;
  } catch (err) {
    console.error("Create teacher error:", err);

    if (err?.name === "SequelizeUniqueConstraintError") {
      throw createError({
        statusCode: 400,
        statusMessage: "Викладач із таким slug уже існує",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Error creating teacher",
    });
  }
});
