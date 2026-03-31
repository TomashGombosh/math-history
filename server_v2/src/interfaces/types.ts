import type { AppConfig } from '../config/types';
import type * as consts from '../config/consts';


export interface StringDict {
	[key: string]: string;
}

export interface NumberDict {
	[key: string]: number;
}

export interface AnyDict {
	[key: string]: any;
}

export interface Response {
	statusCode: number;
	headers?: AnyDict;
	body?: string;
	isBase64Encoded?: boolean;
}

export type Args = any[];

export interface IRequest {
	ip: string;
	method: 'DELETE' | 'GET' | 'POST' | 'PUT';
	headers: StringDict;
	params: AnyDict;
	body: any;
	cookies: StringDict;
}

export interface Account {
	accountId: string;
}

export interface Engine {
	req: IRequest;
	consts: typeof consts;
	config: AppConfig;
	user: User;
}

export interface User {
	accountId: string;
	name: string;
	image?: string;
}
