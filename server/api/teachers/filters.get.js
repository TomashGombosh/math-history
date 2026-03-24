import { Teacher } from "../../models/teacher.js";
import { Op, fn, col } from "sequelize";

export default defineEventHandler(async () => {
  const positionsRaw = await Teacher.findAll({
    attributes: [[fn("DISTINCT", col("position")), "position"]],
    where: { position: { [Op.ne]: null } },
    order: [["position", "ASC"]],
  });

  const degreesRaw = await Teacher.findAll({
    attributes: [[fn("DISTINCT", col("academicDegree")), "academicDegree"]],
    where: { academicDegree: { [Op.ne]: null } },
    order: [["academicDegree", "ASC"]],
  });

  const positions = positionsRaw.map((r) => r.get("position")).filter(Boolean);

  const degrees = degreesRaw
    .map((r) => r.get("academicDegree"))
    .filter(Boolean);

  return { positions, degrees };
});
