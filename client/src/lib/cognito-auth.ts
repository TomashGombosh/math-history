import { fetchAuthSession, signIn, signOut } from "aws-amplify/auth";
import { claimsGrantAdminAccess, parseJwtPayload } from "./cognito-claims";
import { ensureAmplifyConfigured, isCognitoConfigured } from "./cognito-config";

async function idTokenJwtString(): Promise<string | null> {
  const session = await fetchAuthSession();
  const id = session.tokens?.idToken;
  return id ? id.toString() : null;
}

export class CognitoAuthError extends Error {
  readonly code: "NOT_CONFIGURED" | "NOT_ADMIN" | "INVALID_CREDENTIALS" | "SIGN_IN_INCOMPLETE" | "UNKNOWN";

  constructor(
    message: string,
    code: "NOT_CONFIGURED" | "NOT_ADMIN" | "INVALID_CREDENTIALS" | "SIGN_IN_INCOMPLETE" | "UNKNOWN"
  ) {
    super(message);
    this.name = "CognitoAuthError";
    this.code = code;
  }
}

function amplifyErrorName(e: unknown): string {
  if (e && typeof e === "object" && "name" in e && typeof (e as { name: unknown }).name === "string") {
    return (e as { name: string }).name;
  }
  return "";
}

export async function cognitoSignInAdmin(email: string, password: string): Promise<void> {
  if (!isCognitoConfigured()) {
    throw new CognitoAuthError("Cognito is not configured (missing Vite env).", "NOT_CONFIGURED");
  }
  ensureAmplifyConfigured();

  let signInResult: Awaited<ReturnType<typeof signIn>>;
  try {
    signInResult = await signIn({
      username: email.trim(),
      password,
    });
  } catch (e) {
    const name = amplifyErrorName(e);
    if (name === "NotAuthorizedException" || name === "UserNotFoundException") {
      throw new CognitoAuthError("Невірна пошта або пароль.", "INVALID_CREDENTIALS");
    }
    throw new CognitoAuthError("Помилка входу. Спробуйте ще раз.", "UNKNOWN");
  }

  const jwt = await idTokenJwtString();
  if (!jwt) {
    const step = signInResult.nextStep?.signInStep;
    if (step && step !== "DONE") {
      throw new CognitoAuthError("Потрібен додатковий крок входу (наприклад, новий пароль або MFA).", "SIGN_IN_INCOMPLETE");
    }
    throw new CognitoAuthError("Не вдалося отримати токен.", "UNKNOWN");
  }

  const claims = parseJwtPayload(jwt);
  if (!claims || !claimsGrantAdminAccess(claims)) {
    await signOut();
    throw new CognitoAuthError(
      "Обліковий запис не має прав адміністратора (група admin у Cognito).",
      "NOT_ADMIN"
    );
  }
}

/** Returns true if a persisted session exists and ID token grants admin. */
export async function loadPersistedAdminSession(): Promise<boolean> {
  if (!isCognitoConfigured()) {
    return false;
  }
  ensureAmplifyConfigured();
  try {
    const jwt = await idTokenJwtString();
    if (!jwt) {
      return false;
    }
    const claims = parseJwtPayload(jwt);
    if (!claims || !claimsGrantAdminAccess(claims)) {
      await signOut();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function cognitoSignOut(): Promise<void> {
  if (!isCognitoConfigured()) {
    return;
  }
  ensureAmplifyConfigured();
  await signOut();
}
