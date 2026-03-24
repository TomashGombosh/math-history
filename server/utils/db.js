import { Sequelize } from "sequelize";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const DB_NAME = process.env.DB_NAME || "teachers_db";
const DB_USER = process.env.DB_USER || "admin";

const rawPassword = process.env.DB_PASSWORD ?? "";
const DB_PASSWORD = String(rawPassword);

console.log("[DB CONFIG]", {
  host: DB_HOST,
  port: DB_PORT,
  name: DB_NAME,
  user: DB_USER,
  rawPassword,
  rawType: typeof rawPassword,
  finalPasswordType: typeof DB_PASSWORD,
});

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres",
  logging: false,
  dialectOptions:
    process.env.DB_SSL === "true"
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
});
