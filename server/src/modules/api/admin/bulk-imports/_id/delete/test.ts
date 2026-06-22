import { getBulkItem } from '@lib/bulk-dynamo';
import { LOCK_PK, LOCK_SK, jobMetaSk, jobPk } from '@lib/bulk-dynamo-keys';
import { acquireGlobalLock, createJob, getJob, upsertCandidate } from '@services/bulk-import-service';
import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';
import {
	bulkHttpSkipReason,
	ddbAdmin,
	ensureBulkHttpTable,
	resetBulkHttpTable,
	useBulkHttpTableEnv,
} from '@tests/helpers/bulk-import-http.js';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();

let integrationReady = false;

function cancelJob(wrapped: any, requestContext: any, jobId: string) {
	return wrapped.run({
		requestContext,
		path: `/api/admin/bulk-imports/${jobId}`,
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
	});
}

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('DELETE /api/admin/bulk-imports/:id (cancel)', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);

		beforeAll(async () => {
			if (!DYNAMODB_ENDPOINT || !ddbAdmin) return;
			try {
				await ensureBulkHttpTable();
				integrationReady = true;
				useBulkHttpTableEnv();
			} catch {
				integrationReady = false;
			}
		});

		beforeEach(async () => {
			if (!integrationReady) return;
			useBulkHttpTableEnv();
			await resetBulkHttpTable();
		});

		it('purges temp data and releases the global lock', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import cancel: ${bulkHttpSkipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			await acquireGlobalLock({ jobId: job.jobId, createdBy: 'admin' });
			await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Teacher' });

			const res = await cancelJob(wrapped, adminRC, job.jobId);
			expect(res.statusCode).toBe(200);
			jsonBody(res, expect);

			expect(await getJob(job.jobId)).toBeNull();
			const lock = await getBulkItem({ Key: { pk: LOCK_PK, sk: LOCK_SK } });
			expect(lock).toBeNull();
			const meta = await getBulkItem({ Key: { pk: jobPk(job.jobId), sk: jobMetaSk() } });
			expect(meta).toBeNull();
		});
	});
