import { createError, readBody } from "h3";
import { validateAdminCredentials, signAdminToken } from "../../utils/auth";

let legacyJwtLoginWarned = false;

export default defineEventHandler(async (event) => {
  if (process.env.LEGACY_JWT_LOGIN === "disabled") {
    throw createError({
      statusCode: 410,
      statusMessage:
        "Legacy JWT login is disabled. Use the React app with Amazon Cognito and server_v2.",
    });
  }

  if (!legacyJwtLoginWarned) {
    legacyJwtLoginWarned = true;
    console.warn(
      "[legacy server] /api/auth/login uses custom JWT. Prefer Cognito + server_v2 for new work."
    );
  }

  const body = await readBody(event);
  const { username, password } = body || {};

  validateAdminCredentials(username, password);

  const token = signAdminToken(username);

  return { token };
});
