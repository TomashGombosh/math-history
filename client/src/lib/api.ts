import { fetchAuthSession } from "aws-amplify/auth";
import { ApiError, messageFromApiBody } from "./apiError";
import { ensureAmplifyConfigured, isCognitoConfigured } from "./cognito-config";

export { ApiError } from "./apiError";

async function throwIfNotOk(response: Response): Promise<never> {
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text.trim() ? JSON.parse(text) : undefined;
  } catch {
    parsed = text;
  }
  const msg = messageFromApiBody(parsed, `Request failed: ${response.status}`);
  throw new ApiError(response.status, msg, parsed);
}

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.replace(/\/$/, "");
  }
  return window.location.origin;
}

/** Cognito ID token for API Gateway JWT authorizer (`aud` = app client id). */
async function authorizationHeader(): Promise<Record<string, string>> {
  if (!isCognitoConfigured()) {
    return {};
  }
  ensureAmplifyConfigured();
  try {
    const session = await fetchAuthSession();
    const id = session.tokens?.idToken?.toString();
    if (!id) {
      return {};
    }
    return { Authorization: `Bearer ${id}` };
  } catch {
    return {};
  }
}

export async function apiGet<T>(path: string, params?: Record<string, unknown>) {
  const url = new URL(path, `${resolveApiBaseUrl()}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!response.ok) {
    await throwIfNotOk(response);
  }
  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown) {
  const url = new URL(path, `${resolveApiBaseUrl()}/`);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    await throwIfNotOk(response);
  }
  return (await response.json()) as T;
}

export async function apiGetAuthed<T>(path: string, params?: Record<string, unknown>) {
  const url = new URL(path, `${resolveApiBaseUrl()}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  const auth = await authorizationHeader();
  const response = await fetch(url.toString(), {
    credentials: "include",
    headers: { ...auth },
  });
  if (!response.ok) {
    await throwIfNotOk(response);
  }
  return (await response.json()) as T;
}

export async function apiPostAuthed<T>(path: string, body: unknown) {
  const url = new URL(path, `${resolveApiBaseUrl()}/`);
  const auth = await authorizationHeader();
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    await throwIfNotOk(response);
  }
  return (await response.json()) as T;
}

export async function apiPutAuthed<T>(path: string, body: unknown) {
  const url = new URL(path, `${resolveApiBaseUrl()}/`);
  const auth = await authorizationHeader();
  const response = await fetch(url.toString(), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    await throwIfNotOk(response);
  }
  return (await response.json()) as T;
}

export async function apiDeleteAuthed(path: string) {
  const url = new URL(path, `${resolveApiBaseUrl()}/`);
  const auth = await authorizationHeader();
  const response = await fetch(url.toString(), {
    method: "DELETE",
    credentials: "include",
    headers: { ...auth },
  });
  if (!response.ok) {
    await throwIfNotOk(response);
  }
  const text = await response.text();
  if (!text.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
