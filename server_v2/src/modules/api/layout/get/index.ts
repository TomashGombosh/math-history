import type { Engine } from '@interfaces/types';
import { logException } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { getLayoutConfig } from '@services/layout-service';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	try {
		const cfg = await getLayoutConfig();
		return ResponseWriter.Success(cfg);
	} catch (e: unknown) {
		logException('layout:get_failed', e, ctx.correlationIds);
		return ResponseWriter.InternalServerError({ message: 'Cannot read layout config' });
	}
};
