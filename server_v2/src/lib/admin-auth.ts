import type { IRequest } from '@interfaces/types';

type ApiGatewayEventLike = {
	requestContext?: {
		authorizer?: Record<string, unknown>;
		http?: { authorizer?: { jwt?: { claims?: Record<string, unknown> } } };
	};
};

function claimsFromAuthorizer(authorizer: Record<string, unknown> | undefined): Record<string, unknown> | null {
	const jwt = (authorizer as { jwt?: { claims?: Record<string, unknown> } } | undefined)?.jwt?.claims;
	return jwt && typeof jwt === 'object' ? jwt : null;
}

function jwtClaimsFromEvent(event: ApiGatewayEventLike): Record<string, unknown> | null {
	const rc = event.requestContext;
	if (!rc) {
		return null;
	}
	// HTTP API JWT authorizer: claims are usually under requestContext.authorizer.jwt.claims
	const fromRoot = claimsFromAuthorizer(rc.authorizer as Record<string, unknown> | undefined);
	if (fromRoot) {
		return fromRoot;
	}
	// Some routes (e.g. viewer → CloudFront → API) expose the same shape under requestContext.http
	const fromHttp = rc.http?.authorizer?.jwt?.claims;
	return fromHttp && typeof fromHttp === 'object' ? fromHttp : null;
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
