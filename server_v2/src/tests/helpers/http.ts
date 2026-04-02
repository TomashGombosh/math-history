export function jsonBody(res: { body?: string }, expect: any): unknown {
	expect(res.body).toBeDefined();
	return JSON.parse(String(res.body));
}

export async function adminToken(wrapped: any, requestContext: unknown, expect: any): Promise<string> {
	const username = process.env.ADMIN_USERNAME || 'admin';
	const password = process.env.ADMIN_PASSWORD || 'admin';
	const res = await wrapped.run({
		requestContext,
		path: '/api/auth/login',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password }),
	});
	expect(res.statusCode).toBe(200);
	const body = jsonBody(res, expect) as { token?: string };
	expect(body.token).toEqual(expect.any(String));
	return body.token as string;
}

export function bearerJsonHeaders(token: string): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	};
}
