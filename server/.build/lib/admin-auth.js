"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCognitoAdminAuthorizer = isCognitoAdminAuthorizer;
exports.assertAuthenticatedRequest = assertAuthenticatedRequest;
function jwtClaimsFromEvent(event) {
    var _a, _b;
    const a = (_a = event.requestContext) === null || _a === void 0 ? void 0 : _a.authorizer;
    if (!a) {
        return null;
    }
    const jwt = (_b = a.jwt) === null || _b === void 0 ? void 0 : _b.claims;
    return jwt && typeof jwt === 'object' ? jwt : null;
}
function groupsIncludeAdmin(groups) {
    if (Array.isArray(groups)) {
        return groups.some((g) => String(g) === 'admin');
    }
    if (typeof groups === 'string') {
        const s = groups.trim();
        if (s.startsWith('[')) {
            try {
                const parsed = JSON.parse(s);
                return Array.isArray(parsed) && parsed.some((g) => String(g) === 'admin');
            }
            catch (_a) {
            }
        }
        return s.split(',').map((x) => x.trim()).includes('admin');
    }
    return false;
}
function isCognitoAdminAuthorizer(event) {
    const claims = jwtClaimsFromEvent(event);
    if (!claims) {
        return false;
    }
    if (claims.role === 'admin') {
        return true;
    }
    return groupsIncludeAdmin(claims['cognito:groups']);
}
function assertAuthenticatedRequest(_req, event) {
    if (!isCognitoAdminAuthorizer(event)) {
        throw new Error('UNAUTHORIZED');
    }
}
