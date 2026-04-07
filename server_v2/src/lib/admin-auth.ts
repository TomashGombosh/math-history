import type { IRequest } from '@interfaces/types';

type ApiGatewayEventLike = {
	requestContext?: {
		authorizer?: Record<string, unknown>;
		http?: {
			authorizer?: { jwt?: { claims?: Record<string, unknown> }; claims?: Record<string, unknown> };
		};
	};
};

function claimsFromAuthorizer(authorizer: Record<string, unknown> | undefined): Record<string, unknown> | null {
	const jwt = (authorizer as { jwt?: { claims?: Record<string, unknown> } } | undefined)?.jwt?.claims;
	return jwt && typeof jwt === 'object' ? jwt : null;
}

/** Payload format 1.0 and some integrations use flat `authorizer.claims` (no `jwt` wrapper). */
function flatClaimsFromAuthorizer(authorizer: Record<string, unknown> | undefined): Record<string, unknown> | null {
	const c = (authorizer as { claims?: unknown } | undefined)?.claims;
	if (c && typeof c === 'object' && !Array.isArray(c)) {
		return c as Record<string, unknown>;
	}
	return null;
}

function jwtClaimsFromAuthorizerBlock(authorizer: Record<string, unknown> | undefined): Record<string, unknown> | null {
	return claimsFromAuthorizer(authorizer) ?? flatClaimsFromAuthorizer(authorizer);
}

function jwtClaimsFromEvent(event: ApiGatewayEventLike): Record<string, unknown> | null {
	const rc = event.requestContext;
	if (!rc) {
		return null;
	}
	// HTTP API JWT authorizer (format 2.0): requestContext.authorizer.jwt.claims (see AWS docs)
	const fromRoot = jwtClaimsFromAuthorizerBlock(rc.authorizer as Record<string, unknown> | undefined);
	if (fromRoot) {
		return fromRoot;
	}
	const httpAuth = rc.http?.authorizer;
	return jwtClaimsFromAuthorizerBlock(httpAuth as Record<string, unknown> | undefined);
}

/**
 * Safe structural summary for logs when admin auth fails (no token values).
 */
export function summarizeAuthorizerForLog(event: ApiGatewayEventLike): Record<string, unknown> {
	const rc = event.requestContext;
	const auth = rc?.authorizer as Record<string, unknown> | undefined;
	const httpAuth = rc?.http?.authorizer;
	const jwtClaims = jwtClaimsFromEvent(event);
	return {
		hasRequestContext: Boolean(rc),
		authorizerTopKeys: auth && typeof auth === 'object' ? Object.keys(auth) : [],
		httpAuthorizerKeys:
			httpAuth && typeof httpAuth === 'object' ? Object.keys(httpAuth as Record<string, unknown>) : [],
		jwtClaimKeys: jwtClaims ? Object.keys(jwtClaims) : [],
		hasCognitoGroupsKey: jwtClaims ? Object.prototype.hasOwnProperty.call(jwtClaims, 'cognito:groups') : false,
	};
}

function groupsIncludeAdmin(groups: unknown): boolean {
	if (Array.isArray(groups)) {
		return groups.some((g) => String(g) === 'admin');
	}
	if (typeof groups === 'string') {
		const s = groups.trim();
		if (s.startsWith('[')) {
			try {
				const parsed = JSON.parse(s) as unknown;
				return Array.isArray(parsed) && parsed.some((g) => String(g) === 'admin');
			} catch {
				/* fall through */
			}
		}
		return s.split(',').map((x) => x.trim()).includes('admin');
	}
	return false;
}

/**
 * True when API Gateway HTTP API JWT authorizer (e.g. Cognito) attached admin identity to the request.
 */
export function isCognitoAdminAuthorizer(event: ApiGatewayEventLike): boolean {
	const claims = jwtClaimsFromEvent(event);
	if (!claims) {
		return false;
	}
	if (claims.role === 'admin') {
		return true;
	}
	return groupsIncludeAdmin(claims['cognito:groups']);
}

export function assertAuthenticatedRequest(_req: IRequest, event: ApiGatewayEventLike): void {
	if (!isCognitoAdminAuthorizer(event)) {
		throw new Error('UNAUTHORIZED');
	}
}
