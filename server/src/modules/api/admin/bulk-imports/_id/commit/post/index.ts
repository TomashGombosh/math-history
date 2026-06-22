import type { Engine } from '@interfaces/types';
import { logException, logInfo } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { commitBulkImportJob } from '@services/bulk-commit-service';

export const handler = async (ctx: Engine) => {
	const jobId = String(ctx.req.params.id);

	try {
		await commitBulkImportJob(jobId);

		logInfo('bulk-import:commit', { ...ctx.correlationIds, jobId });
		return ResponseWriter.Success({ ok: true });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'JOB_NOT_READY') {
			return ResponseWriter.Conflict({ message: 'Імпорт ще не готовий до застосування' });
		}
		logException('bulk-import:commit_failed', e, { ...ctx.correlationIds, jobId });
		return ResponseWriter.InternalServerError({ message: 'Could not commit bulk import' });
	}
};
