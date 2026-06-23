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

function deleteItem(wrapped: any, requestContext: any, jobId: string, itemId: string) {
	return wrapped.run({
		requestContext,
		path: `/api/admin/bulk-imports/${jobId}/items/${encodeURIComponent(itemId)}`,
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
	});
}

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('DELETE /api/admin/bulk-imports/:id/items/:itemId', () => {
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

		it('deletes a candidate irreversibly', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import DELETE item: ${bulkHttpSkipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			const candidate = await upsertCandidate({
				entity: 'teacher',
				jobId: job.jobId,
				name: 'To Delete',
			});
			await markJobReady(job.jobId);

			const res = await deleteItem(wrapped, adminRC, job.jobId, candidate.id);
			expect(res.statusCode).toBe(200);

			const page = await listCandidates({ jobId: job.jobId });
			expect(page.candidates).toHaveLength(0);
		});

		it('deletes a candidate when path contains decoded hash characters (API Gateway rawPath)', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import DELETE item hash path: ${bulkHttpSkipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			const candidate = await upsertCandidate({
				entity: 'graduate',
				jobId: job.jobId,
				name: 'Hash Path Grad',
				year: 2012,
			});
			await markJobReady(job.jobId);

			expect(candidate.id).toContain('#');

			// API Gateway passes URL-decoded rawPath; do not rely on %23 in the path segment.
			const res = await wrapped.run({
				requestContext: adminRC,
				path: `/api/admin/bulk-imports/${job.jobId}/items/${candidate.id}`,
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);

			const page = await listCandidates({ jobId: job.jobId });
			expect(page.candidates).toHaveLength(0);
		});
	});
