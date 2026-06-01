import { confirmSignIn, fetchAuthSession, signIn, signOut } from "aws-amplify/auth";
import { claimsGrantAdminAccess, parseJwtPayload } from "./cognito-claims";
import { ensureAmplifyConfigured, isCognitoConfigured } from "./cognito-config";

async function idTokenJwtString(): Promise<string | null> {
  const session = await fetchAuthSession();
  const id = session.tokens?.idToken;
  return id ? id.toString() : null;
}

/** After a successful token-bearing sign-in or confirm step, ensures ID token exists and user is in admin group. */
async function verifyIdTokenIsAdminOrSignOut(): Promise<void> {
  const jwt = await idTokenJwtString();
  if (!jwt) {
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

export type CognitoSignInAdminResult =
  | { status: "signed_in" }
  | { status: "new_password_required"; missingAttributes?: string[] };

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

export async function cognitoSignInAdmin(email: string, password: string): Promise<CognitoSignInAdminResult> {
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
  if (jwt) {
    await verifyIdTokenIsAdminOrSignOut();
    return { status: "signed_in" };
  }

  const nextStep = signInResult.nextStep;
  if (nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
    const missing = nextStep.missingAttributes;
    return {
      status: "new_password_required",
      missingAttributes: missing?.map(String),
    };
  }
  const step = nextStep?.signInStep;
  if (step && step !== "DONE") {
    throw new CognitoAuthError(
      "Потрібен додатковий крок входу (наприклад, MFA). Поки що підтримується лише встановлення нового пароля.",
      "SIGN_IN_INCOMPLETE"
    );
  }
  throw new CognitoAuthError("Не вдалося отримати токен.", "UNKNOWN");
}

/**
 * Completes NEW_PASSWORD_REQUIRED after `cognitoSignInAdmin` returned `new_password_required`.
 * Must be called in the same session (no page reload) before other sign-in attempts.
 */
export async function cognitoConfirmNewPasswordAdmin(
  newPassword: string,
  userAttributes?: Record<string, string>
): Promise<void> {
  if (!isCognitoConfigured()) {
    throw new CognitoAuthError("Cognito is not configured (missing Vite env).", "NOT_CONFIGURED");
  }
  ensureAmplifyConfigured();

  let confirmResult: Awaited<ReturnType<typeof confirmSignIn>>;
  try {
    const hasAttrs = userAttributes && Object.keys(userAttributes).length > 0;
    confirmResult = await confirmSignIn({
      challengeResponse: newPassword,
      ...(hasAttrs ? { options: { userAttributes } } : {}),
    });
  } catch (e) {
    const name = amplifyErrorName(e);
    if (name === "InvalidPasswordException") {
      throw new CognitoAuthError("Пароль не відповідає вимогам безпеки пулу.", "UNKNOWN");
    }
    if (name === "NotAuthorizedException") {
      throw new CognitoAuthError("Не вдалося підтвердити новий пароль. Спробуйте увійти знову.", "INVALID_CREDENTIALS");
    }
    throw new CognitoAuthError("Помилка встановлення пароля. Спробуйте ще раз.", "UNKNOWN");
  }

  const step = confirmResult.nextStep?.signInStep;
  if (step && step !== "DONE") {
    throw new CognitoAuthError(
      "Потрібен додатковий крок після зміни пароля (наприклад, MFA).",
      "SIGN_IN_INCOMPLETE"
    );
  }

  await verifyIdTokenIsAdminOrSignOut();
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
