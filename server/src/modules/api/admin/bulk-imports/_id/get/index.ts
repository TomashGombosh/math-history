import type { Engine } from '@interfaces/types';
import { decodeExclusiveStartKey, encodeExclusiveStartKey } from '@lib/pagination-cursor';
import { logException, logInfo } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import {
	getJob,
	listCandidates,
	mapInternalStatusToExternal,
	type BulkCandidate,
	type BulkJobCounts,
	type BulkJobExternalStatus,
} from '@services/bulk-import-service';

export const handler = async (ctx: Engine) => {
	const jobId = String(ctx.req.params.id);

	try {
		const job = await getJob(jobId);
		if (!job) {
			return ResponseWriter.NotFound({ message: 'Bulk import job not found' });
		}

		const status = mapInternalStatusToExternal(job.status);
		const response: {
			status: BulkJobExternalStatus;
			counts: BulkJobCounts;
			candidates: BulkCandidate[];
			error?: string;
			lastEvaluatedKey?: string;
		} = {
			status,
			counts: job.counts,
			candidates: [],
		};

		if (job.error) {
			response.error = job.error;
		}

		if (status === 'success') {
			const limitRaw = ctx.req.params.limit;
			const parsedLimit = limitRaw !== undefined ? parseInt(String(limitRaw), 10) : undefined;
			const limit = parsedLimit && parsedLimit > 0 ? parsedLimit : undefined;
			const exclusiveStartKey = decodeExclusiveStartKey(
				ctx.req.params.exclusiveStartKey ? String(ctx.req.params.exclusiveStartKey) : undefined,
			);
			const page = await listCandidates({ jobId, limit, exclusiveStartKey });
			response.candidates = page.candidates;
			const encoded = encodeExclusiveStartKey(page.lastEvaluatedKey);
			if (encoded) {
				response.lastEvaluatedKey = encoded;
			}
		}

		logInfo('bulk-import:get', {
			...ctx.correlationIds,
			jobId,
			status,
			candidateCount: response.candidates.length,
			service: 'math-history-server',
		});

		return ResponseWriter.Success(response);
	} catch (e: unknown) {
		logException('bulk-import:get_failed', e, { ...ctx.correlationIds, jobId });
		return ResponseWriter.InternalServerError({ message: 'Could not load bulk import job' });
	}
};
