import { Graduate } from "../../models/graduate.js";
import { Sequelize } from "sequelize";

export default defineEventHandler(async () => {
  const rows = await Graduate.findAll({
    attributes: [
      "year",
      [Sequelize.fn("SUM", Sequelize.col("totalStudents")), "totalStudents"],
      [
        Sequelize.fn("SUM", Sequelize.col("totalWithHonours")),
        "totalWithHonours",
      ],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "cohortsCount"],
    ],
    group: ["year"],
    order: [["year", "ASC"]],
    raw: true,
  });

  return rows;
});
