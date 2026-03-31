"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awsSdkLogger = exports.createAwsSdkLogger = void 0;
const LOG_LEVEL_ORDER = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
const parseLogLevel = (value) => {
    switch ((value || '').toLowerCase()) {
        case 'debug':
        case 'info':
        case 'warn':
        case 'error':
        case 'none':
            return value.toLowerCase();
        default:
            return process.env.NODE_ENV === 'production' ? 'error' : 'warn';
    }
};
const shouldLog = (configuredLevel, targetLevel) => {
    if (configuredLevel === 'none')
        return false;
    return LOG_LEVEL_ORDER[targetLevel] >= LOG_LEVEL_ORDER[configuredLevel];
};
const createAwsSdkLogger = (namespace = 'aws-sdk') => {
    const configuredLevel = parseLogLevel(process.env.AWS_SDK_LOG_LEVEL);
    return {
        debug: (...content) => {
            if (shouldLog(configuredLevel, 'debug'))
                console.debug(`[${namespace}]`, ...content);
        },
        info: (...content) => {
            if (shouldLog(configuredLevel, 'info'))
                console.info(`[${namespace}]`, ...content);
        },
        warn: (...content) => {
            if (shouldLog(configuredLevel, 'warn'))
                console.warn(`[${namespace}]`, ...content);
        },
        error: (...content) => {
            if (shouldLog(configuredLevel, 'error'))
                console.error(`[${namespace}]`, ...content);
        },
    };
};
exports.createAwsSdkLogger = createAwsSdkLogger;
exports.awsSdkLogger = (0, exports.createAwsSdkLogger)();
