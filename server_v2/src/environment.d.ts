// Pull env input shape from Zod schema
import type { EnvInput } from './config/env';

// Keys from the schema become allowed process.env keys
type EnvKeys = keyof EnvInput;

// Extend NodeJS.ProcessEnv with Zod-based keys
declare global {
	namespace NodeJS {
		interface ProcessEnv extends Record<EnvKeys, string> {}
	}
}

// Ensure this file is a module
export {};
