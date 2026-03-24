// server/api/graduates/index.get.js
import { Graduate } from "../../models/graduate.js";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const year = query.year ? Number(query.year) : null;

  const where = {};
  if (!Number.isNaN(year) && year) {
    where.year = year;
  }

  const rows = await Graduate.findAll({
    where,
    order: [
      ["year", "ASC"],
      ["number", "ASC"],
      ["id", "ASC"],
    ],
  });

  return rows;
});
