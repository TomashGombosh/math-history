import type { Response } from '@interfaces/types';
import { FRONT, isTest } from '../config/consts';

const defaultHeaders = {
	'Access-Control-Allow-Credentials': 'true',
	'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
	'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
	'Access-Control-Allow-Origin': FRONT,
	'Access-Control-Max-Age': '3600',
	'Content-Type': 'application/json',
	Vary: 'Origin',
};

export const cancelCORS = {
	'Access-Control-Allow-Origin': undefined,
	Vary: undefined,
};

const status = (statusCode: number, headers: object | undefined = undefined) => {
	return (body: object | string | undefined = undefined, headersOverride: object | undefined = undefined): Response => {
		console[((statusCode < 300 || isTest) && 'log') || (statusCode < 400 && 'warn') || 'error'](
			`[${statusCode}]`,
			'headers:',
			headers,
			'headersOverride:',
			headersOverride,
			'body:',
			body,
		);

		return {
			statusCode,
			headers: {
				...headers,
				...(headersOverride || {}),
			},
			body: ((typeof body === 'object' && JSON.stringify(body)) || body) as string | undefined,
		};
	};
};

export const ResponseWriter = {
	Success: status(200, defaultHeaders),
	Created: status(201, defaultHeaders),
	Accepted: status(202, defaultHeaders),
	NonAuthoritativeInformation: status(203, defaultHeaders),
	NoContent: status(204, defaultHeaders),
	ResetContent: status(205, defaultHeaders),
	PartialContent: status(206, defaultHeaders),
	MultiStatus: status(207, defaultHeaders),
	AlreadyReported: status(208, defaultHeaders),
	IMUsed: status(226, defaultHeaders),
	Redirect: status(302),
	PermanentRedirect: status(301),
	TemporaryRedirect: status(302),
	BadRequest: status(400, defaultHeaders),
	Unauthorized: status(401, defaultHeaders),
	PaymentRequired: status(402, defaultHeaders),
	Forbidden: status(403, defaultHeaders),
	NotFound: status(404, defaultHeaders),
	MethodNotAllowed: status(405, defaultHeaders),
	NotAcceptable: status(406, defaultHeaders),
	ProxyAuthenticationRequired: status(407, defaultHeaders),
	RequestTimeout: status(408, defaultHeaders),
	Conflict: status(409, defaultHeaders),
	Gone: status(410, defaultHeaders),
	LengthRequired: status(411, defaultHeaders),
	PreconditionFailed: status(412, defaultHeaders),
	PayloadTooLarge: status(413, defaultHeaders),
	URITooLong: status(414, defaultHeaders),
	UnsupportedMediaType: status(415, defaultHeaders),
	RangeNotSatisfiable: status(416, defaultHeaders),
	ExpectationFailed: status(417, defaultHeaders),
	Teapot: status(418, defaultHeaders),
	MisdirectedRequest: status(421, defaultHeaders),
	UnprocessableEntity: status(422, defaultHeaders),
	Locked: status(423, defaultHeaders),
	FailedDependency: status(424, defaultHeaders),
	TooEarly: status(425, defaultHeaders),
	UpgradeRequired: status(426, defaultHeaders),
	PreconditionRequired: status(428, defaultHeaders),
	TooManyRequests: status(429, defaultHeaders),
	InternalServerError: status(500),
};
