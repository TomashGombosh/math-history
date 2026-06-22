import type { Engine } from '@interfaces/types';
import { logException } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { submitReview } from '@services/review-service';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	try {
		const res = await submitReview(ctx.req.body, {
			ip: ctx.req.ip,
			correlation: ctx.correlationIds,
		});
		return ResponseWriter.Created(res);
	} catch (e: unknown) {
		logException('review:submit_failed', e, ctx.correlationIds);
		return ResponseWriter.InternalServerError({ message: 'Could not submit review' });
	}
};
