import { Amplify } from "aws-amplify";

let configured = false;

export function isCognitoConfigured(): boolean {
  const pool = import.meta.env.VITE_COGNITO_USER_POOL_ID?.trim();
  const clientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID?.trim();
  return Boolean(pool && clientId);
}

/** Safe to call multiple times; configures from Vite env. */
export function ensureAmplifyConfigured(): void {
  if (configured || !isCognitoConfigured()) {
    return;
  }
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID!.trim();
  const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID!.trim();
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
      },
    },
  });
  configured = true;
}
