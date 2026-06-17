import './bootstrap-env';
import { z } from 'zod';
import type { AppConfig, NodeEnv } from './types';

/** Empty / whitespace-only env → undefined (unset). */
function optionalTrimmed(message = 'Cannot be empty when set') {
	return z.preprocess((val: unknown) => {
		if (val === undefined || val === null) return undefined;
		const s = String(val).trim();
		return s === '' ? undefined : s;
	}, z.string().min(1, message).optional());
}

const NODE_ENV_VALUES = [
	'local',
	'dev',
	'development',
	'stage',
	'production',
	'prod',
	'test',
] as const satisfies readonly NodeEnv[];

const relaxedAwsResourceEnvs = new Set<string>(['test', 'local', 'dev', 'development']);

export const envSchema = z
	.object({
		NODE_ENV: z.enum(NODE_ENV_VALUES).default('dev'),
		AWS_REGION: optionalTrimmed(),
		AWS_DEFAULT_REGION: optionalTrimmed(),
		AWS_SDK_LOG_LEVEL: optionalTrimmed(),
		AWS_ACCESS_KEY_ID: optionalTrimmed(),
		AWS_SECRET_ACCESS_KEY: optionalTrimmed(),
		DYNAMODB_TABLE_NAME: optionalTrimmed(),
		DYNAMODB_ENDPOINT: optionalTrimmed(),
		S3_DATA_BUCKET: optionalTrimmed(),
		S3_ENDPOINT: optionalTrimmed(),
		CORS_ORIGIN: optionalTrimmed(),
		/** Public canonical site URL for sitemap `<loc>` when `Host` is the API execute-api domain. No trailing slash. */
		SITE_URL: optionalTrimmed(),
		/** Public origin for teacher photos (data bucket / assets CDN). No trailing slash. Used to build full `imageUrl` after presigned upload. */
		TEACHER_IMAGE_CDN_BASE: optionalTrimmed(),
	})
	.superRefine((data, ctx) => {
		const usesLocalDynamo = Boolean(data.DYNAMODB_ENDPOINT);
		const skipAwsDataChecks = relaxedAwsResourceEnvs.has(data.NODE_ENV) || usesLocalDynamo;
		if (skipAwsDataChecks) return;
		if (!data.DYNAMODB_TABLE_NAME) {
			ctx.addIssue({
				code: 'custom',
				message: 'DYNAMODB_TABLE_NAME is required when not using DYNAMODB_ENDPOINT (e.g. Lambda / AWS DynamoDB).',
				path: ['DYNAMODB_TABLE_NAME'],
			});
		}
		if (!data.S3_DATA_BUCKET) {
			ctx.addIssue({
				code: 'custom',
				message: 'S3_DATA_BUCKET is required for presigned uploads and image cleanup in this environment.',
				path: ['S3_DATA_BUCKET'],
			});
		}
	});

export type EnvInput = z.input<typeof envSchema>;
export type Env = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | null = null;

export const getConfig = async (): Promise<AppConfig> => {
	if (cachedConfig) return cachedConfig;

	const env = envSchema.parse(process.env);

	cachedConfig = {
		nodeEnv: env.NODE_ENV,
	};

	return cachedConfig;
};

export default getConfig;
