import type { Engine } from '@interfaces/types';
import { logInfo } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { buildSitemapXml } from '@services/sitemap-service';

export const publicResource = true;

const XML_HEADERS = {
	'Content-Type': 'application/xml; charset=utf-8',
	// Cache at edge; sitemap changes when teachers/graduates change (low traffic).
	'Cache-Control': 'public, max-age=3600, s-maxage=3600',
};

export const handler = async (ctx: Engine) => {
	const t0 = Date.now();
	const xml = await buildSitemapXml(ctx.req.headers);
	logInfo('sitemap:built', {
		...ctx.correlationIds,
		service: 'math-history-server',
		durationMs: Date.now() - t0,
	});
	return ResponseWriter.Success(xml, XML_HEADERS);
};
