import { z } from 'zod';
import type { AppConfig, NodeEnv } from './types';
import { ensureAppSecretsLoaded } from './appSecrets';

// Load local .env (safe for local/dev usage)
import dotenv from 'dotenv';

// Initialize dotenv once at module load
dotenv.config();

// Zod schema for env validation and defaults
export const envSchema = z.object({
	NODE_ENV: z.enum(['dev', 'stage', 'prod', 'test', 'local', 'development', 'production'] as const).default('dev'),
	JWT_SECRET: z.string().default('dev_secret'),
	JWT_EXPIRES_IN: z.string().default('8h'),
	ADMIN_USERNAME: z.string().default('admin'),
	ADMIN_PASSWORD: z.string().default('admin'),
});

// Input shape for process.env + secrets before parsing
export type EnvInput = z.input<typeof envSchema>;

// Cache parsed config for reuse in a single runtime
let cachedConfig: AppConfig | null = null;

// Build and validate config from secrets + process.env
export const getConfig = async (): Promise<AppConfig> => {
	if (cachedConfig) return cachedConfig;

	const secrets = await ensureAppSecretsLoaded();

	const input = {
		...(secrets ?? {}),
		...process.env,
	};

	const env = envSchema.parse(input);

	// Map validated env to app config shape
	cachedConfig = {
		nodeEnv: env.NODE_ENV as NodeEnv,
		jwtSecret: env.JWT_SECRET,
		jwtExpiresIn: env.JWT_EXPIRES_IN,
		adminUsername: env.ADMIN_USERNAME,
		adminPassword: env.ADMIN_PASSWORD,
	};

	return cachedConfig;
};

export default getConfig;
