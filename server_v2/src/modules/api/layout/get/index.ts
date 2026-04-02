import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { getLayoutConfig } from '@services/layout-service';

export const publicResource = true;

export const handler = async (_ctx: Engine) => {
	try {
		const cfg = await getLayoutConfig();
		return ResponseWriter.Success(cfg);
	} catch (e) {
		console.error('Read layout config error:', e);
		return ResponseWriter.InternalServerError({ message: 'Cannot read layout config' });
	}
};
