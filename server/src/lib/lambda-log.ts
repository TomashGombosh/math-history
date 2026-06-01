import type { Context } from 'aws-lambda';

/** API Gateway HTTP API + Lambda correlation (see lambda-logging-traceability.mdc). */
export type CorrelationIds = {
	requestId: string;
	lambdaRequestId: string;
};

export function correlationFromLambda(
	event: { requestContext?: { requestId?: string } },
	context?: Pick<Context, 'awsRequestId'>,
): CorrelationIds {
	return {
		requestId: event.requestContext?.requestId ?? 'n/a',
		lambdaRequestId: context?.awsRequestId ?? 'n/a',
	};
}

export function serializeErr(err: unknown): { name: string; message: string; stack?: string; cause?: unknown } {
	if (err instanceof Error) {
		const base: { name: string; message: string; stack?: string; cause?: unknown } = {
			name: err.name,
			message: err.message,
			...(err.stack ? { stack: err.stack } : {}),
		};
		if ('cause' in err && (err as Error & { cause?: unknown }).cause !== undefined) {
			base.cause = serializeErr((err as Error & { cause?: unknown }).cause);
		}
		return base;
	}
	return { name: 'Error', message: String(err) };
}

type LogRecord = {
	level: 'info' | 'warn' | 'error' | 'debug';
	msg: string;
} & Record<string, unknown>;

function write(record: LogRecord): void {
	const line = JSON.stringify(record);
	if (record.level === 'error') {
		console.error(line);
	} else if (record.level === 'warn') {
		console.warn(line);
	} else {
		console.info(line);
	}
}

/** Single-line JSON to stdout; include correlation fields when available. */
export function logInfo(msg: string, fields: Partial<CorrelationIds> & Record<string, unknown>): void {
	write({ level: 'info', msg, ...fields });
}

export function logWarn(msg: string, fields: Partial<CorrelationIds> & Record<string, unknown>): void {
	write({ level: 'warn', msg, ...fields });
}

export function logException(
	msg: string,
	err: unknown,
	correlation: Partial<CorrelationIds> & Record<string, unknown> = {},
): void {
	write({ level: 'error', msg, err: serializeErr(err), ...correlation });
}
