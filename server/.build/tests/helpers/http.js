"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonBody = jsonBody;
exports.withCognitoAdminAuthorizer = withCognitoAdminAuthorizer;
function jsonBody(res, expect) {
    expect(res.body).toBeDefined();
    return JSON.parse(String(res.body));
}
function withCognitoAdminAuthorizer(base) {
    return Object.assign(Object.assign({}, base), { authorizer: {
            jwt: {
                claims: {
                    'cognito:groups': ['admin'],
                },
            },
        } });
}
