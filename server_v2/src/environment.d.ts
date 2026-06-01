import type { Env } from '@config/env';

type EnvKeys = keyof Env;

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Partial<Record<EnvKeys, string | undefined>> {}
	}
}

// Ensure this file is a module
export {};
