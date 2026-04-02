import type { IRequest } from '@interfaces/types';

type ApiGatewayEventLike = { requestContext?: { authorizer?: Record<string, unknown> } };

function jwtClaimsFromEvent(event: ApiGatewayEventLike): Record<string, unknown> | null {
	const a = event.requestContext?.authorizer;
	if (!a) {
		return null;
	}
	const jwt = (a as { jwt?: { claims?: Record<string, unknown> } }).jwt?.claims;
	return jwt && typeof jwt === 'object' ? jwt : null;
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
