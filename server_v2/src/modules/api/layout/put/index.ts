import type { Engine } from '@interfaces/types';
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
	} catch (e) {
		console.error('Write layout config error:', e);
		return ResponseWriter.InternalServerError({ message: 'Cannot save layout config' });
	}
};
