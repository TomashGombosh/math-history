export const isProduction = process.env.NODE_ENV === 'production';

export const isStage = process.env.NODE_ENV === 'stage';

export const isLocal = process.env.NODE_ENV === 'local';

export const isLambda = isProduction || isStage;

export const isTest = process.env.NODE_ENV === 'test';

export const DEFAULT_REGION = 'eu-north-1';

/** Local Vite is http://localhost:5173; override with CORS_ORIGIN if needed (e.g. https). */
export const FRONT = isLocal
	? (process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173')
	: `https://math-history-${isProduction ? '' : '-stage'}.afj-solution.com`;
