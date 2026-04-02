export function jsonBody(res: { body?: string }, expect: any): unknown {
	expect(res.body).toBeDefined();
	return JSON.parse(String(res.body));
}

/** Mimics API Gateway HTTP API JWT authorizer context (Cognito admin group) for integration tests. */
export function withCognitoAdminAuthorizer<T extends Record<string, unknown>>(
	base: T,
): T & { authorizer: { jwt: { claims: { 'cognito:groups': string[] } } } } {
	return {
		...base,
		authorizer: {
			jwt: {
				claims: {
					'cognito:groups': ['admin'],
				},
			},
		},
	};
}
