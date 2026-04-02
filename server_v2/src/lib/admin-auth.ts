import jwt from 'jsonwebtoken';
import type { AppConfig } from '@config/types';
import type { IRequest } from '@interfaces/types';

export function getBearerToken(headers: Record<string, string | undefined>): string | null {
	const raw = headers.Authorization ?? headers.authorization;
	if (!raw?.startsWith('Bearer ')) {
		return null;
	}
	return raw.slice(7);
}

export function isApiGatewayAdminAuthorizer(event: {
	requestContext?: { authorizer?: Record<string, unknown> };
}): boolean {
	if (process.env.TRUST_API_GATEWAY_AUTH !== 'true') {
		return false;
	}
	const a = event.requestContext?.authorizer;
	if (!a) {
		return false;
	}
	const jwtClaims = (a as { jwt?: { claims?: Record<string, string> } }).jwt?.claims;
	if (jwtClaims?.role === 'admin') {
		return true;
	}
	const groups = jwtClaims?.['cognito:groups'];
	if (typeof groups === 'string' && groups.includes('admin')) {
		return true;
	}
	const lam = (a as { lambda?: { role?: string } }).lambda;
	if (lam?.role === 'admin') {
		return true;
	}
	return false;
}

export function verifyAdminJwt(token: string, secret: string): { username: string } {
	const payload = jwt.verify(token, secret) as { username?: string; role?: string };
	if (payload.role !== 'admin') {
		throw new Error('FORBIDDEN');
	}
	return { username: payload.username ?? 'admin' };
}

export function assertAuthenticatedRequest(
	req: IRequest,
	event: { requestContext?: { authorizer?: Record<string, unknown> } },
	config: AppConfig,
): void {
	if (isApiGatewayAdminAuthorizer(event)) {
		return;
	}

	const token = getBearerToken(req.headers) ?? req.cookies?.token;
	if (!token) {
		throw new Error('UNAUTHORIZED');
	}

	verifyAdminJwt(token, config.jwtSecret);
}

export function signAdminToken(username: string, config: AppConfig): string {
	const opts = { expiresIn: config.jwtExpiresIn } as jwt.SignOptions;
	return jwt.sign({ username, role: 'admin' }, config.jwtSecret, opts);
}

export function validateAdminCredentials(username: unknown, password: unknown, config: AppConfig): void {
	if (!username || !password) {
		throw new Error('CREDENTIALS_REQUIRED');
	}
	if (String(username) !== config.adminUsername || String(password) !== config.adminPassword) {
		throw new Error('BAD_CREDENTIALS');
	}
}
