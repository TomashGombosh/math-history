import type { Engine } from '@interfaces/types';
import { logException, logInfo } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { cleanupJob, getJob } from '@services/bulk-import-service';

export const handler = async (ctx: Engine) => {
	const jobId = String(ctx.req.params.id);

	try {
		const job = await getJob(jobId);
		if (!job) {
			return ResponseWriter.NotFound({ message: 'Bulk import job not found' });
		}
		if (job.status === 'committed') {
			return ResponseWriter.Conflict({ message: 'Імпорт уже застосовано' });
		}

		await cleanupJob(jobId);

		logInfo('bulk-import:cancel', { ...ctx.correlationIds, jobId });
		return ResponseWriter.Success({ ok: true });
	} catch (e: unknown) {
		logException('bulk-import:cancel_failed', e, { ...ctx.correlationIds, jobId });
		return ResponseWriter.InternalServerError({ message: 'Could not cancel bulk import' });
	}
};
