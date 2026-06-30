#!/usr/bin/env node
/**
 * Load server/.env into process.env, then run a child command (cross-platform).
 * Used so Serverless resolves ${env:…} in serverless.yml on Windows/macOS/Linux.
 *
 * Usage: node scripts/run-with-env.cjs <command> [args…]
 * Example: node scripts/run-with-env.cjs npx sls offline start --host 0.0.0.0
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');
const envPath = path.join(serverRoot, '.env');

if (fs.existsSync(envPath)) {
	require('dotenv').config({ path: envPath });
} else {
	console.warn(`[run-with-env] No .env at ${envPath} (continuing with shell env only).`);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
	console.error('Usage: node scripts/run-with-env.cjs <command> [args…]');
	process.exit(1);
}

const isWin = process.platform === 'win32';
const result = spawnSync(command, args, {
	cwd: serverRoot,
	env: process.env,
	stdio: 'inherit',
	shell: isWin,
});

process.exit(result.status ?? 1);
