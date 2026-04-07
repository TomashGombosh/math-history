import path from 'path';
import * as app from '../index.js';
import * as cron from '../cron/index.js';
import * as queues from '../queues/index.js';
import { getConfig } from '../config/env.js';
import { getCache } from '../lib/cache.js';
import { TEST_IP } from './consts.js';
import type { wrap as lambdaWrapFn } from 'lambda-wrapper';

// serverless-jest-plugin attaches the whole `lambda-wrapper` module (object with `.wrap`)
// @typescript-eslint/no-require-imports
const { lambdaWrapper } = require('serverless-jest-plugin') as {
	lambdaWrapper: { wrap: typeof lambdaWrapFn };
};

const wrapped = lambdaWrapper.wrap(app, { handler: 'handler' });
const wrappedCron = lambdaWrapper.wrap(cron, { handler: 'handler' });
const wrappedQueues = lambdaWrapper.wrap(queues, { handler: 'consumer' });

let cache: ReturnType<typeof getCache>;

const moduleFolderPath = path.join(__dirname, '..', 'modules');

const requestContext = {
	http: {
		sourceIp: TEST_IP,
	},
};

process.env.LANG = 'en';

describe('api', () => {
	beforeAll(async () => {
		const config = await getConfig();
		cache = getCache(config);
	});

	const tests =
		process.env.TESTS?.split(',').map((v) => v.trim()) ||
		([
			'sitemap.xml/get',
			'api/layout/get',
			'api/layout/put',
			'api/teachers/filters/get',
			'api/teachers/get',
			'api/teachers/meta/get',
			'api/teachers/post',
			'api/teachers/by-slug/_slug/get',
			'api/teachers/_id/get',
			'api/teachers/_id/put',
			'api/teachers/_id/delete',
			'api/graduates/get',
			'api/gratitudes/get',
			'api/graduates/years/get',
			'api/graduates/specialties/get',
			'api/graduates/_year/get',
			'api/graduates/post',
			'api/graduates/_year/put',
			'api/graduates/_year/delete',
			'api/upload/presign/post',
		] as const);

	for (const module of tests) {
		// @typescript-eslint/no-require-imports
		require(`${moduleFolderPath}/${module}/test.js`)(
			module.includes('/cron/') ? wrappedCron : module.includes('/queues/') ? wrappedQueues : wrapped,
			expect,
			requestContext,
		);
	}

	afterAll((done) => {
		cache.disconnect();
		const ret = Number(done()) || 0;
		setTimeout(() => process.exit(ret), 1000);
	});
});
