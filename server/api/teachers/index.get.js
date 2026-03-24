import { Teacher } from "../../models/teacher.js";
import { Op } from "sequelize";

export default defineEventHandler(async (event) => {
  const q = getQuery(event);

  let { page = 1, limit = 24, search = "", sortBy, sortDir = "asc" } = q;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 24;
  const offset = (page - 1) * limit;

  const where = {};

  if (search && String(search).trim()) {
    where.name = { [Op.iLike]: `%${String(search).trim()}%` };
  }

  const normalizeToArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === "string") {
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const positionsParam = q.positions ?? q["positions[]"];
  const degreesParam = q.degrees ?? q["degrees[]"];

  const positionsArr = normalizeToArray(positionsParam);
  if (positionsArr.length) {
    where.position = { [Op.in]: positionsArr };
  }

  const degreesArr = normalizeToArray(degreesParam);
  if (degreesArr.length) {
    where.academicDegree = { [Op.in]: degreesArr };
  }

  const direction =
    typeof sortDir === "string" && sortDir.toUpperCase() === "DESC"
      ? "DESC"
      : "ASC";

  const order = [];

  if (sortBy === "position") {
    order.push(["position", direction]);
  } else if (sortBy === "degree") {
    order.push(["academicDegree", direction]);
  } else if (sortBy === "name") {
    order.push(["name", direction]);
  }

  order.push(["id", "ASC"]);

  const { rows, count } = await Teacher.findAndCountAll({
    where,
    limit,
    offset,
    order,
  });

  const totalPages = Math.max(1, Math.ceil(count / limit));

  return {
    teachers: rows,
    total: count,
    totalPages,
    currentPage: page,
  };
});
