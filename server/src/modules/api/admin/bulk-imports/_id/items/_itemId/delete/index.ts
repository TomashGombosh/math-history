import type { Engine } from '@interfaces/types';
import { logException, logInfo } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { deleteCandidate, getJob } from '@services/bulk-import-service';

export const handler = async (ctx: Engine) => {
	const jobId = String(ctx.req.params.id);
	const itemId = String(ctx.req.params.itemId);

	try {
		const job = await getJob(jobId);
		if (!job) {
			return ResponseWriter.NotFound({ message: 'Bulk import job not found' });
		}
		if (job.status !== 'ready') {
			return ResponseWriter.Conflict({ message: 'Видалення доступне лише після завершення обробки' });
		}

		await deleteCandidate(jobId, itemId);

		logInfo('bulk-import:item_delete', { ...ctx.correlationIds, jobId, itemId });
		return ResponseWriter.Success({ ok: true });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'NOT_FOUND') {
			return ResponseWriter.NotFound({ message: 'Candidate not found' });
		}
		logException('bulk-import:item_delete_failed', e, { ...ctx.correlationIds, jobId, itemId });
		return ResponseWriter.InternalServerError({ message: 'Could not delete import item' });
	}
};
