import type { Engine } from '@interfaces/types';
import { logException } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { saveLayoutConfig } from '@services/layout-service';

export const handler = async (ctx: Engine) => {
	const body = ctx.req.body;
	if (!body || !Array.isArray(body.headerFields) || !Array.isArray(body.sections)) {
		return ResponseWriter.BadRequest({ message: 'Invalid config format' });
	}
	try {
		await saveLayoutConfig(body);
		return ResponseWriter.Success({ ok: true });
	} catch (e: unknown) {
		logException('layout:put_failed', e, ctx.correlationIds);
		return ResponseWriter.InternalServerError({ message: 'Cannot save layout config' });
	}
};
