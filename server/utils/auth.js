import jwt from "jsonwebtoken";
import { H3Event, getHeader, createError } from "h3";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export function signAdminToken(username) {
  return jwt.sign({ username, role: "admin" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function requireAdmin(event) {
  const authHeader = getHeader(event, "authorization") || "";
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw createError({
      statusCode: 401,
      statusMessage: "No or invalid token",
    });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
    return payload;
  } catch (err) {
    console.error("JWT verify error:", err.message);
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid or expired token",
    });
  }
}

export function validateAdminCredentials(username, password) {
  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Потрібно ввести логін і пароль",
    });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    throw createError({
      statusCode: 401,
      statusMessage: "Невірний логін або пароль",
    });
  }

  return true;
}
