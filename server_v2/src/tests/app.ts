import * as app from 'index.js';
import path from 'path';
import lambdaWrapper from 'lambda-wrapper';
const wrapped = lambdaWrapper.wrap(app, { handler: 'handler' });

// Define the directory path where your modules are located
const moduleFolderPath = path.join(__dirname, '..', 'modules');

import { TEST_IP } from './consts.js';

const requestContext = {
	http: {
		sourceIp: TEST_IP,
	},
};

process.env.LANG = 'en';

describe('api', () => {
	const tests = process.env.TESTS?.split(',').map((v) => v.trim()) || ['openapi/get'];

	for (const module of tests) {
		require(`${moduleFolderPath}/${module}/test.js`)(wrapped, expect, requestContext);
	}

	afterAll(() => {
		// No manual process exit; Jest will handle shutdown.
	});
});
