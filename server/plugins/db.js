import { sequelize } from "../utils/db.js";
import { Teacher } from "../models/teacher.js";
import { Graduate } from "../models/graduate.js";

export default defineNitroPlugin(async () => {
  console.log(
    "[Sequelize config.password]",
    sequelize.config.password,
    "type:",
    typeof sequelize.config.password
  );

  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    await sequelize.sync();
    console.log("✅ Models synced (Teacher + Graduate)");
  } catch (err) {
    console.error("❌ DB connection error:", err);
  }
});
