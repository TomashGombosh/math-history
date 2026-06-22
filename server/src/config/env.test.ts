import { envSchema } from './env';

const prodLikeBase = {
	NODE_ENV: 'production' as const,
	DYNAMODB_TABLE_NAME: 'main-table',
	S3_DATA_BUCKET: 'data-bucket',
};

describe('envSchema bulk import vars', () => {
	it('fails in prod-like env when BULK_DDB_TABLE or BULK_QUEUE_URL is missing', () => {
		expect(() => envSchema.parse({ ...prodLikeBase })).toThrow(/BULK_DDB_TABLE/);
		expect(() => envSchema.parse({ ...prodLikeBase, BULK_DDB_TABLE: 'bulk-table' })).toThrow(/BULK_QUEUE_URL/);
	});

	it('succeeds in prod-like env when bulk vars are present', () => {
		const env = envSchema.parse({
			...prodLikeBase,
			BULK_DDB_TABLE: 'bulk-table',
			BULK_QUEUE_URL: 'https://sqs.eu-north-1.amazonaws.com/123/bulk-queue',
		});
		expect(env.BULK_DDB_TABLE).toBe('bulk-table');
		expect(env.BULK_QUEUE_URL).toBe('https://sqs.eu-north-1.amazonaws.com/123/bulk-queue');
	});

	it('succeeds in test/local env without bulk vars', () => {
		expect(() => envSchema.parse({ NODE_ENV: 'test' })).not.toThrow();
		expect(() => envSchema.parse({ NODE_ENV: 'local' })).not.toThrow();
		expect(() => envSchema.parse({ NODE_ENV: 'dev' })).not.toThrow();
		expect(() => envSchema.parse({ NODE_ENV: 'development' })).not.toThrow();
	});

	it('allows optional Bedrock vars in prod-like env', () => {
		const env = envSchema.parse({
			...prodLikeBase,
			BULK_DDB_TABLE: 'bulk-table',
			BULK_QUEUE_URL: 'https://sqs.eu-north-1.amazonaws.com/123/bulk-queue',
			BULK_BEDROCK_ENABLED: 'true',
			BULK_BEDROCK_MODEL_ID: 'amazon.nova-micro-v1:0',
		});
		expect(env.BULK_BEDROCK_ENABLED).toBe('true');
		expect(env.BULK_BEDROCK_MODEL_ID).toBe('amazon.nova-micro-v1:0');
	});
});
