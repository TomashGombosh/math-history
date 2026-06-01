/** Opaque base64url token for DynamoDB ExclusiveStartKey (client round-trips as `exclusiveStartKey`). */

export function encodeExclusiveStartKey(key: Record<string, unknown> | undefined): string | undefined {
	if (!key || Object.keys(key).length === 0) return undefined;
	const json = JSON.stringify(key);
	return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeExclusiveStartKey(token: string | undefined): Record<string, unknown> | undefined {
	if (!token || !String(token).trim()) return undefined;
	try {
		const json = Buffer.from(String(token), 'base64url').toString('utf8');
		const parsed = JSON.parse(json) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
		return parsed as Record<string, unknown>;
	} catch {
		return undefined;
	}
}
