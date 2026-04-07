export function jsonBody(res: { body?: string }, expect: any): unknown {
	expect(res.body).toBeDefined();
	return JSON.parse(String(res.body));
}

const adminJwtClaims: { 'cognito:groups': string[] } = { 'cognito:groups': ['admin'] };

/** Mimics API Gateway HTTP API JWT authorizer context (Cognito admin group) for integration tests. */
export function withCognitoAdminAuthorizer<T extends Record<string, unknown>>(
	base: T,
): T & { authorizer: { jwt: { claims: { 'cognito:groups': string[] } } } } {
	return {
		...base,
		authorizer: {
			jwt: {
				claims: {
					...adminJwtClaims,
				},
			},
		},
	};
}

/** Same as {@link withCognitoAdminAuthorizer} but claims only under `requestContext.http.authorizer` (some proxy/API shapes). */
export function withCognitoAdminAuthorizerUnderHttp<T extends Record<string, unknown>>(
	base: T,
): T & { http: { authorizer: { jwt: { claims: { 'cognito:groups': string[] } } } } } {
	const http = (base as { http?: Record<string, unknown> }).http ?? {};
	return {
		...base,
		http: {
			...http,
			authorizer: {
				jwt: {
					claims: {
						...adminJwtClaims,
					},
				},
			},
		},
	};
}
