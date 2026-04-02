import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { awsSdkLogger } from '@lib/aws-sdk-logger';

/**
 * Stages where secrets are allowed to be loaded
 */
const ALLOWED_SECRET_STAGES = ['dev', 'development', 'stage', 'production', 'prod', 'test'] as const;

/**
 * Shape of secrets object
 */
type AppSecrets = Record<string, string>;

/**
 * Cache for already loaded secrets (per Lambda container / process)
 */
let cachedSecrets: AppSecrets | null = null;
let inFlight: Promise<AppSecrets | null> | null = null;

/**
 * Decide whether secrets should be loaded in the current environment
 */
const shouldLoadSecrets = (stage: string): boolean =>
	process.env.APP_SECRETS_ENABLED !== 'false' && (ALLOWED_SECRET_STAGES as readonly string[]).includes(stage);

/**
 * Parse and validate secret payload
 */
const parseSecretPayload = (payload: string): AppSecrets => {
	const parsed: unknown = JSON.parse(payload);

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('App secrets must be a JSON object');
	}

	return parsed as AppSecrets;
};

/**
 * Fetch secrets from AWS Secrets Manager
 */
const fetchSecret = async (secretId: string, region: string): Promise<AppSecrets> => {
	const client = new SecretsManagerClient({ region, logger: awsSdkLogger });

	const res = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

	const payload =
		res.SecretString ?? (res.SecretBinary ? Buffer.from(res.SecretBinary as Uint8Array).toString('utf8') : undefined);

	if (!payload) {
		throw new Error(`Secret "${secretId}" has no SecretString/SecretBinary payload`);
	}

	return parseSecretPayload(payload);
};

/**
 * Load secrets once and cache them in memory
 */
export async function ensureAppSecretsLoaded(): Promise<AppSecrets | null> {
	const stage = process.env.NODE_ENV ?? 'dev';

	// Skip loading secrets for disallowed environments
	if (!shouldLoadSecrets(stage)) return null;

	// Return cached secrets if they were already loaded
	if (cachedSecrets) return cachedSecrets;
	if (inFlight) return inFlight;

	const region = process.env.APP_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

	if (!region) {
		throw new Error('APP_REGION (or AWS_REGION) is required to load secrets from Secrets Manager');
	}

	const secretId = process.env.APP_SECRET_ID;
	if (!secretId) return null;

	inFlight = fetchSecret(secretId, region)
		.then((secrets) => {
			cachedSecrets = secrets;
			return secrets;
		})
		.finally(() => {
			inFlight = null;
		});

	return inFlight;
}

/**
 * Get cached secrets (if already loaded)
 */
export function getCachedAppSecrets(): AppSecrets | null {
	return cachedSecrets;
}
