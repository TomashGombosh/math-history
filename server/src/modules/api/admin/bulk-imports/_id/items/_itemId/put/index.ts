import type { Engine } from '@interfaces/types';
import { logException, logInfo } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { getJob, updateCandidateName } from '@services/bulk-import-service';

export const handler = async (ctx: Engine) => {
	const jobId = String(ctx.req.params.id);
	const itemId = String(ctx.req.params.itemId);

	try {
		const job = await getJob(jobId);
		if (!job) {
			return ResponseWriter.NotFound({ message: 'Bulk import job not found' });
		}
		if (job.status !== 'ready') {
			return ResponseWriter.Conflict({ message: 'Редагування доступне лише після завершення обробки' });
		}

		const name = String(ctx.req.body?.name ?? '').trim();
		if (!name) {
			return ResponseWriter.BadRequest({ message: "Поле name є обов'язковим" });
		}

		const candidate = await updateCandidateName(jobId, itemId, name);

		logInfo('bulk-import:item_update', { ...ctx.correlationIds, jobId, itemId });
		return ResponseWriter.Success(candidate);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'NOT_FOUND') {
			return ResponseWriter.NotFound({ message: 'Candidate not found' });
		}
		if (msg === 'NAME_NOT_EDITABLE') {
			return ResponseWriter.BadRequest({ message: 'Рік не можна перейменувати' });
		}
		logException('bulk-import:item_update_failed', e, { ...ctx.correlationIds, jobId, itemId });
		return ResponseWriter.InternalServerError({ message: 'Could not update import item' });
	}
};
