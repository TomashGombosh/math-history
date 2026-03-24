import { Graduate } from "../../models/graduate.js";

export default defineEventHandler(async (event) => {
  const { year } = event.context.params;
  const yearNum = parseInt(year, 10);

  if (Number.isNaN(yearNum)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid year" });
  }

  const cohorts = await Graduate.findAll({
    where: { year: yearNum },
    order: [
      ["number", "ASC"],
      ["id", "ASC"],
    ],
  });

  if (!cohorts.length) {
    return {
      year: yearNum,
      title: `Випуск ${yearNum} року`,
      images: [],
      students: [],
    };
  }

  const mainTitle = cohorts[0].title || `Випуск ${yearNum} року`;

  const images = [];
  const allStudents = [];
  let nextGeneratedId = 1;

  for (const cohort of cohorts) {
    const c = cohort.toJSON();

    if (Array.isArray(c.images)) {
      for (const img of c.images) {
        images.push(img);
      }
    }

    if (Array.isArray(c.students)) {
      for (const st of c.students) {
        let id = st.id ?? st.index2 ?? null;
        if (id == null) {
          id = nextGeneratedId++;
        }

        const honors =
          st.honorsDegree === true ||
          st.honorsDegree === "true" ||
          st.isBold === true ||
          st.isBold === "true";

        allStudents.push({
          id,
          index: st.index ?? st.index1 ?? 0,
          name: st.name ?? st.text ?? "",
          specialty: st.specialty || "",
          section: st.section || "",
          honorsDegree: honors,
        });
      }
    }
  }

  return {
    year: yearNum,
    title: mainTitle,
    images,
    students: allStudents,
  };
});
