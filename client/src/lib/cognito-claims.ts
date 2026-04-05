/**
 * Client-side hint only — API Gateway + Lambda enforce admin via JWT claims.
 * Mirrors server_v2 `admin-auth.ts` (role + cognito:groups).
 */

function groupsIncludeAdmin(groups: unknown): boolean {
  if (Array.isArray(groups)) {
    return groups.some((g) => String(g) === "admin");
  }
  if (typeof groups === "string") {
    const s = groups.trim();
    if (s.startsWith("[")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        return Array.isArray(parsed) && parsed.some((g) => String(g) === "admin");
      } catch {
        /* fall through */
      }
    }
    return s
      .split(",")
      .map((x) => x.trim())
      .includes("admin");
  }
  return false;
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function claimsGrantAdminAccess(claims: Record<string, unknown>): boolean {
  if (claims.role === "admin") {
    return true;
  }
  return groupsIncludeAdmin(claims["cognito:groups"]);
}
