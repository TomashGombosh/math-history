import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';

export const publicResource = true;

/** Placeholder list; reserved for future Dynamo-backed content. Cursor shape matches other paginated APIs. */
export const handler = async (_ctx: Engine) => {
	return ResponseWriter.Success({
		gratitudes: [] as unknown[],
		lastEvaluatedKey: null as string | null,
	});
};
