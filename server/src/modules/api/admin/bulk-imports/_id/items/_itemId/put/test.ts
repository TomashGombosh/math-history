import { createJob, listCandidates, upsertCandidate } from '@services/bulk-import-service';
import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';
import {
	bulkHttpSkipReason,
	ddbAdmin,
	ensureBulkHttpTable,
	markJobReady,
	resetBulkHttpTable,
	useBulkHttpTableEnv,
} from '@tests/helpers/bulk-import-http.js';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();

let integrationReady = false;

function putItem(
	wrapped: any,
	requestContext: any,
	jobId: string,
	itemId: string,
	body: { name: string },
) {
	return wrapped.run({
		requestContext,
		path: `/api/admin/bulk-imports/${jobId}/items/${encodeURIComponent(itemId)}`,
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('PUT /api/admin/bulk-imports/:id/items/:itemId', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);

		beforeAll(async () => {
			if (!DYNAMODB_ENDPOINT || !ddbAdmin) return;
			try {
				await ensureBulkHttpTable();
				integrationReady = true;
				useBulkHttpTableEnv();
			} catch (err) {
				integrationReady = false;
			}
		});

		beforeEach(async () => {
			if (!integrationReady) return;
			useBulkHttpTableEnv();
			await resetBulkHttpTable();
		});

		it('persists edited candidate name', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import PUT item: ${bulkHttpSkipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			const candidate = await upsertCandidate({
				entity: 'teacher',
				jobId: job.jobId,
				name: 'Old Name',
			});
			await markJobReady(job.jobId);

			const res = await putItem(wrapped, adminRC, job.jobId, candidate.id, { name: 'New Name' });
			expect(res.statusCode).toBe(200);

			const body = jsonBody(res, expect) as { name: string };
			expect(body.name).toBe('New Name');

			const page = await listCandidates({ jobId: job.jobId });
			expect(page.candidates[0]?.name).toBe('New Name');
		});

		it('returns 409 when job is not ready', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import PUT item: ${bulkHttpSkipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			const candidate = await upsertCandidate({
				entity: 'teacher',
				jobId: job.jobId,
				name: 'Teacher',
			});

			const res = await putItem(wrapped, adminRC, job.jobId, candidate.id, { name: 'Other' });
			expect(res.statusCode).toBe(409);
		});
	});
