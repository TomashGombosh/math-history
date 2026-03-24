import { Teacher } from "../../models/teacher.js";
import { requireAdmin } from "../../utils/auth.js";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const teachers = await Teacher.findAll({
    attributes: ["position", "academicDegree"],
    raw: true,
  });

  const positionsSet = new Set();
  const degreesSet = new Set();

  for (const t of teachers) {
    if (t.position) {
      const pos = t.position.toString().trim();
      if (pos) positionsSet.add(pos);
    }

    const rawDeg = (t.academicDegree || "").toString();
    if (!rawDeg) continue;

    rawDeg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((deg) => degreesSet.add(deg));
  }

  const positions = Array.from(positionsSet).sort((a, b) =>
    a.localeCompare(b, "uk-UA")
  );
  const degrees = Array.from(degreesSet).sort((a, b) =>
    a.localeCompare(b, "uk-UA")
  );

  return {
    positions,
    degrees,
  };
});
