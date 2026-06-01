// Placeholder scheduled-job entry; add real handlers and co-located test.ts under src/cron/.
export const handler = async (): Promise<{ statusCode: number; body: string }> => ({
	statusCode: 200,
	body: '',
});
