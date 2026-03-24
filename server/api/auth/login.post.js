import { readBody } from "h3";
import { validateAdminCredentials, signAdminToken } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body || {};

  validateAdminCredentials(username, password);

  const token = signAdminToken(username);

  return { token };
});
