// Placeholder queue consumer entry; add real handlers and co-located test.ts under src/queues/.
export const consumer = async (): Promise<{ statusCode: number; body: string }> => ({
	statusCode: 200,
	body: '',
});
