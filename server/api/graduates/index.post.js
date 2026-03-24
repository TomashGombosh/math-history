import { Graduate } from "../../models/graduate.js";
import { requireAdmin } from "../../utils/auth.js";

async function getMaxStudentId() {
  const grads = await Graduate.findAll({
    attributes: ["students"],
  });

  let maxId = 0;

  for (const g of grads) {
    const arr = Array.isArray(g.students) ? g.students : [];
    for (const st of arr) {
      const idNum = Number(st.id);
      if (!Number.isNaN(idNum) && idNum > maxId) {
        maxId = idNum;
      }
    }
  }

  return maxId;
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);

  const yearNum = Number(body.year);
  if (!yearNum || Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некоректний рік випуску",
    });
  }

  const title = (body.title || "").toString().trim();
  const images = Array.isArray(body.images) ? body.images : [];
  const studentsRaw = Array.isArray(body.students) ? body.students : [];

  if (!studentsRaw.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Потрібно передати хоча б одного студента",
    });
  }

  const existing = await Graduate.findOne({ where: { year: yearNum } });
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: `Випуск за ${yearNum} рік уже існує`,
    });
  }

  const maxExistingId = await getMaxStudentId();
  let nextId = maxExistingId + 1;

  const students = [];

  for (const s of studentsRaw) {
    const name = (s.name || "").toString().trim();
    if (!name) continue;

    const specialty = (s.specialty || "").toString().trim();
    const section = (s.section || "").toString().trim();
    const honors = !!s.honorsDegree;

    const indexVal = Number(s.index);
    const index =
      !Number.isNaN(indexVal) && indexVal > 0 ? indexVal : students.length + 1;

    const incomingId = Number(s.id);
    let id =
      Number.isInteger(incomingId) && incomingId > maxExistingId
        ? incomingId
        : nextId++;

    students.push({
      id,
      index,
      name,
      specialty,
      section,
      year: yearNum,
      honorsDegree: honors,
    });
  }

  if (!students.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Список студентів порожній",
    });
  }

  const totalStudents = students.length;
  const totalWithHonours = students.filter((s) => s.honorsDegree).length;

  const grad = await Graduate.create({
    year: yearNum,
    title,
    images,
    students,
    totalStudents,
    totalWithHonours,
  });

  return {
    ok: true,
    id: grad.id,
    year: grad.year,
  };
});
