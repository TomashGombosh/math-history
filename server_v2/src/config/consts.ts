export const isProduction = process.env.NODE_ENV === 'production';

export const isStage = process.env.NODE_ENV === 'stage';

export const isLocal = process.env.NODE_ENV === 'local';

export const isLambda = isProduction || isStage;

export const isTest = process.env.NODE_ENV === 'test';

export const DEFAULT_REGION = 'eu-north-1';

export const FRONT = isLocal
	? 'https://localhost:5173'
	: `https://math-history-${isProduction ? '' : '-stage'}.afj-solution.com`;
