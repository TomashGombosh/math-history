import type { Engine } from '@interfaces/types';
import { getJwtSubjectFromEvent, type ApiGatewayEventLike } from '@lib/admin-auth';
import { logException, logInfo } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { acquireGlobalLock, cleanupJob, createJob } from '@services/bulk-import-service';
import { bulkImportSourceKey, createPresignedBulkDocxUpload } from '@services/bulk-upload-service';

export const handler = async (ctx: Engine) => {
	const createdBy = getJwtSubjectFromEvent(ctx.lambdaEvent as ApiGatewayEventLike) ?? 'admin';
	let jobId: string | undefined;

	try {
		const job = await createJob({ createdBy });
		jobId = job.jobId;

		await acquireGlobalLock({ jobId: job.jobId, createdBy });

		const presign = await createPresignedBulkDocxUpload(job.jobId);

		logInfo('bulk-import:create', {
			...ctx.correlationIds,
			jobId: job.jobId,
			createdBy,
			sourceKey: bulkImportSourceKey(job.jobId),
			service: 'math-history-server',
		});

		return ResponseWriter.Success({
			jobId: job.jobId,
			uploadUrl: presign.uploadUrl,
			headers: presign.headers,
		});
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'JOB_ACTIVE') {
			if (jobId) {
				try {
					await cleanupJob(jobId);
				} catch (cleanupErr) {
					logException('bulk-import:cleanup_orphan_failed', cleanupErr, {
						...ctx.correlationIds,
						jobId,
					});
				}
			}
			return ResponseWriter.Conflict({ message: 'Активний імпорт уже триває' });
		}
		logException('bulk-import:create_failed', e, ctx.correlationIds);
		return ResponseWriter.InternalServerError({ message: 'Could not start bulk import' });
	}
};
