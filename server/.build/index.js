"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const fs = __importStar(require("fs"));
const env_1 = __importDefault(require("./config/env"));
const consts = __importStar(require("./config/consts"));
const admin_auth_1 = require("./lib/admin-auth");
const lambda_log_1 = require("./lib/lambda-log");
const response_writer_1 = require("./lib/response-writer");
const route_resolve_1 = require("./lib/route-resolve");
const modules = {};
const schemas = {};
const cleanDirname = __dirname.replace('.build', 'src');
function getHeader(headers, name) {
    if (!headers)
        return undefined;
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === lower) {
            return v;
        }
    }
    return undefined;
}
let appConfig = null;
let firstInvocationInContainer = true;
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const t0 = Date.now();
    const correlationIds = (0, lambda_log_1.correlationFromLambda)(event, context);
    const coldStart = firstInvocationInContainer;
    firstInvocationInContainer = false;
    const trace = (msg, extra) => {
        (0, lambda_log_1.logInfo)(msg, Object.assign(Object.assign(Object.assign({}, correlationIds), { route: extra === null || extra === void 0 ? void 0 : extra.route, durationMs: Date.now() - t0, coldStart, service: 'math-history-server' }), extra));
    };
    const routeEarly = String((_b = (_a = event.rawPath) !== null && _a !== void 0 ? _a : event.path) !== null && _b !== void 0 ? _b : '').split('?')[0];
    trace('handler:entry', { route: routeEarly });
    const rawMethod = String((_g = (_f = (_e = (_d = (_c = event.requestContext) === null || _c === void 0 ? void 0 : _c.http) === null || _d === void 0 ? void 0 : _d.method) !== null && _e !== void 0 ? _e : event.httpMethod) !== null && _f !== void 0 ? _f : event.method) !== null && _g !== void 0 ? _g : 'GET');
    if (rawMethod === 'OPTIONS') {
        return response_writer_1.ResponseWriter.Success('');
    }
    const method = rawMethod;
    const rawPath = ((_j = (_h = event.rawPath) !== null && _h !== void 0 ? _h : event.path) !== null && _j !== void 0 ? _j : '');
    const pathOnly = rawPath.split('?')[0].split('#')[0];
    const pathSegments = pathOnly.split('/').filter(Boolean);
    const headers = Object.fromEntries(Object.entries(event.headers || {}).filter(([, v]) => v !== undefined));
    const req = {
        method,
        params: (event.queryStringParameters || {}),
        headers,
        ip: (_q = (_m = (_l = (_k = event.requestContext) === null || _k === void 0 ? void 0 : _k.http) === null || _l === void 0 ? void 0 : _l.sourceIp) !== null && _m !== void 0 ? _m : (_p = (_o = event.requestContext) === null || _o === void 0 ? void 0 : _o.identity) === null || _p === void 0 ? void 0 : _p.sourceIp) !== null && _q !== void 0 ? _q : '',
        body: event.body || {},
        cookies: getHeader(headers, 'cookie')
            ? Object.fromEntries(getHeader(headers, 'cookie')
                .split('; ')
                .map((c) => [c.split('=')[0], c.split('=').slice(1).join('=')]))
            : {},
    };
    const contentType = getHeader(headers, 'content-type') || '';
    if (typeof event.body === 'string' && event.body.length) {
        if (event.body.startsWith('{') || event.body.startsWith('[')) {
            try {
                req.body = JSON.parse(event.body);
            }
            catch (_r) {
                req.body = {};
            }
        }
        else if (contentType.includes('application/x-www-form-urlencoded')) {
            req.body = Object.fromEntries(new URLSearchParams(event.body));
        }
    }
    const normalizedSegments = (0, route_resolve_1.normalizeApiSegments)(pathSegments);
    const resolved = (0, route_resolve_1.resolveModulePath)(normalizedSegments, method);
    if (!resolved) {
        trace('handler:invalidPath', { route: pathOnly, segments: normalizedSegments.join('/') });
        return response_writer_1.ResponseWriter.BadRequest({ message: 'Invalid path' });
    }
    const { modulePath, pathParams } = resolved;
    trace('handler:resolved', { route: pathOnly, modulePath });
    req.params = Object.assign(Object.assign({}, req.params), pathParams);
    const queryString = rawPath.includes('?') ? rawPath.split('?')[1] : '';
    if (queryString) {
        req.params = Object.assign(Object.assign({}, req.params), Object.fromEntries(new URLSearchParams(queryString)));
    }
    trace('handler:beforeGetConfig', { route: pathOnly, modulePath });
    appConfig = appConfig || (yield (0, env_1.default)());
    trace('handler:afterGetConfig', { route: pathOnly, modulePath });
    const ctx = {
        req,
        consts,
        config: appConfig,
        user: {},
        lambdaEvent: event,
        correlationIds,
    };
    (0, lambda_log_1.logInfo)('request:summary', Object.assign(Object.assign({}, correlationIds), { route: pathOnly, method,
        modulePath, moduleCached: Boolean(modules[modulePath]), coldStart, hasBody: typeof event.body === 'string' && event.body.length > 0, durationMs: Date.now() - t0, service: 'math-history-server' }));
    if (!modules[modulePath]) {
        const moduleFsPath = `./modules/${modulePath}`;
        if (!fs.existsSync(`${__dirname}/${moduleFsPath}/index.js`)) {
            (0, lambda_log_1.logWarn)('module:not_found', Object.assign(Object.assign({}, correlationIds), { route: pathOnly, moduleFsPath: `${cleanDirname}/${moduleFsPath}/index.ts`, durationMs: Date.now() - t0, service: 'math-history-server' }));
            return response_writer_1.ResponseWriter.NotFound();
        }
        trace('handler:beforeImportSchema', { route: pathOnly, moduleFsPath });
        if (fs.existsSync(`${__dirname}/${moduleFsPath}/schema.js`)) {
            schemas[modulePath] = yield Promise.resolve(`${`${moduleFsPath}/schema.js`}`).then(s => __importStar(require(s)));
        }
        else {
            (0, lambda_log_1.logWarn)('module:schema_missing', Object.assign(Object.assign({}, correlationIds), { route: pathOnly, moduleFsPath: `${cleanDirname}/${moduleFsPath}/schema.ts`, durationMs: Date.now() - t0, service: 'math-history-server' }));
            return response_writer_1.ResponseWriter.NotFound();
        }
        trace('handler:afterImportSchema', { route: pathOnly, moduleFsPath });
        trace('handler:beforeImportModule', { route: pathOnly, moduleFsPath });
        modules[modulePath] = yield Promise.resolve(`${moduleFsPath}`).then(s => __importStar(require(s)));
        trace('handler:afterImportModule', { route: pathOnly, moduleFsPath });
    }
    else {
        trace('handler:moduleCacheHit', { route: pathOnly, modulePath });
    }
    const mod = modules[modulePath];
    if (typeof (mod === null || mod === void 0 ? void 0 : mod.handler) !== 'function') {
        (0, lambda_log_1.logWarn)('module:handler_missing', Object.assign(Object.assign({}, correlationIds), { route: pathOnly, modulePath: `${cleanDirname}/${modulePath}/index.ts`, durationMs: Date.now() - t0, service: 'math-history-server' }));
        return response_writer_1.ResponseWriter.NotFound();
    }
    if (['GET', 'DELETE'].includes(req.method)) {
        const getParseResult = schemas[modulePath].schema.safeParse(req.params);
        if (!getParseResult.success) {
            return response_writer_1.ResponseWriter.BadRequest({ message: 'Invalid input', errors: getParseResult.error.message });
        }
        req.params = getParseResult.data;
    }
    else if (['POST', 'PUT'].includes(req.method)) {
        const postParseResult = schemas[modulePath].schema.safeParse(req.body);
        if (!postParseResult.success) {
            return response_writer_1.ResponseWriter.BadRequest({ message: 'Invalid input', errors: postParseResult.error.message });
        }
        req.body = postParseResult.data;
    }
    if (!mod.publicResource) {
        try {
            (0, admin_auth_1.assertAuthenticatedRequest)(req, event);
        }
        catch (_s) {
            return response_writer_1.ResponseWriter.Unauthorized({ message: 'Unauthorized' });
        }
    }
    trace('handler:beforeModuleHandler', { route: pathOnly, modulePath });
    const out = yield mod.handler(ctx);
    trace('handler:afterModuleHandler', { route: pathOnly, modulePath });
    return out;
});
exports.handler = handler;
