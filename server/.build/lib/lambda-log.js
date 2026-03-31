"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationFromLambda = correlationFromLambda;
exports.serializeErr = serializeErr;
exports.logInfo = logInfo;
exports.logWarn = logWarn;
exports.logException = logException;
function correlationFromLambda(event, context) {
    var _a, _b, _c;
    return {
        requestId: (_b = (_a = event.requestContext) === null || _a === void 0 ? void 0 : _a.requestId) !== null && _b !== void 0 ? _b : 'n/a',
        lambdaRequestId: (_c = context === null || context === void 0 ? void 0 : context.awsRequestId) !== null && _c !== void 0 ? _c : 'n/a',
    };
}
function serializeErr(err) {
    if (err instanceof Error) {
        const base = Object.assign({ name: err.name, message: err.message }, (err.stack ? { stack: err.stack } : {}));
        if ('cause' in err && err.cause !== undefined) {
            base.cause = serializeErr(err.cause);
        }
        return base;
    }
    return { name: 'Error', message: String(err) };
}
function write(record) {
    const line = JSON.stringify(record);
    if (record.level === 'error') {
        console.error(line);
    }
    else if (record.level === 'warn') {
        console.warn(line);
    }
    else {
        console.info(line);
    }
}
function logInfo(msg, fields) {
    write(Object.assign({ level: 'info', msg }, fields));
}
function logWarn(msg, fields) {
    write(Object.assign({ level: 'warn', msg }, fields));
}
function logException(msg, err, correlation = {}) {
    write(Object.assign({ level: 'error', msg, err: serializeErr(err) }, correlation));
}
