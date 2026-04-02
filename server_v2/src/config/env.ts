import { z } from 'zod';
import type { AppConfig, NodeEnv } from './types';

// Load local .env (safe for local/dev usage)
import dotenv from 'dotenv';

// Initialize dotenv once at module load
dotenv.config();

// Zod schema for env validation and defaults
export const envSchema = z.object({
	NODE_ENV: z.enum(['dev', 'stage', 'prod', 'test', 'local', 'development', 'production'] as const).default('dev'),
});

// Input shape for process.env before parsing
export type EnvInput = z.input<typeof envSchema>;

// Cache parsed config for reuse in a single runtime
let cachedConfig: AppConfig | null = null;

// Build and validate config from process.env
export const getConfig = async (): Promise<AppConfig> => {
	if (cachedConfig) return cachedConfig;

	const env = envSchema.parse(process.env);

	cachedConfig = {
		nodeEnv: env.NODE_ENV as NodeEnv,
	};

	return cachedConfig;
};

export default getConfig;
