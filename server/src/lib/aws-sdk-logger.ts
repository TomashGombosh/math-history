import type { Logger } from '@aws-sdk/types';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LOG_LEVEL_ORDER: Record<Exclude<LogLevel, 'none'>, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

const parseLogLevel = (value: string | undefined): LogLevel => {
	switch ((value || '').toLowerCase()) {
		case 'debug':
		case 'info':
		case 'warn':
		case 'error':
		case 'none':
			return value!.toLowerCase() as LogLevel;
		default:
			return process.env.NODE_ENV === 'production' ? 'error' : 'warn';
	}
};

const shouldLog = (configuredLevel: LogLevel, targetLevel: Exclude<LogLevel, 'none'>): boolean => {
	if (configuredLevel === 'none') return false;
	return LOG_LEVEL_ORDER[targetLevel] >= LOG_LEVEL_ORDER[configuredLevel];
};

export const createAwsSdkLogger = (namespace = 'aws-sdk'): Logger => {
	const configuredLevel = parseLogLevel(process.env.AWS_SDK_LOG_LEVEL);

	return {
		debug: (...content: unknown[]) => {
			if (shouldLog(configuredLevel, 'debug')) console.debug(`[${namespace}]`, ...content);
		},
		info: (...content: unknown[]) => {
			if (shouldLog(configuredLevel, 'info')) console.info(`[${namespace}]`, ...content);
		},
		warn: (...content: unknown[]) => {
			if (shouldLog(configuredLevel, 'warn')) console.warn(`[${namespace}]`, ...content);
		},
		error: (...content: unknown[]) => {
			if (shouldLog(configuredLevel, 'error')) console.error(`[${namespace}]`, ...content);
		},
	};
};

export const awsSdkLogger = createAwsSdkLogger();
