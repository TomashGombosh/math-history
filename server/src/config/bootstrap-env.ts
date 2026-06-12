import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/** Load server/.env once (cwd may be repo root or server/; compiled code lives under .build/). */
function loadServerDotenv(): void {
	const candidates = [
		path.resolve(process.cwd(), '.env'),
		path.resolve(process.cwd(), 'server', '.env'),
		path.resolve(__dirname, '..', '..', '.env'),
	];
	for (const envPath of candidates) {
		if (!fs.existsSync(envPath)) continue;
		dotenv.config({ path: envPath });
		return;
	}
}

loadServerDotenv();
