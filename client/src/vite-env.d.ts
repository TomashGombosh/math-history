/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Public origin for canonical URLs and JSON-LD (no trailing slash). */
  readonly VITE_SITE_URL?: string;
  /** Cognito User Pool id, e.g. `eu-north-1_xxxx`. */
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  /** App client id (no secret). Must allow SRP + refresh (see Terraform `app-cognito`). */
  readonly VITE_COGNITO_USER_POOL_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
