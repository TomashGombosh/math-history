import { jsonBody } from '@tests/helpers/http.js';
import * as adminDirectory from '@services/admin-directory';
import * as emailService from '@services/email-service';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('POST /api/reviews', () => {
		const validBody = {
			email: 'visitor@example.com',
			comment: 'Прізвище викладача написане з помилкою.',
			component: {
				type: 'teacher',
				id: 'ivanov-ivan',
				label: 'Картка викладача: Іванов Іван',
				url: 'https://math-history.afj-solution.com/teacher/ivanov-ivan',
			},
		};

		let getAdminRecipientsSpy: jest.SpiedFunction<typeof adminDirectory.getAdminRecipients>;
		let sendReviewNotificationSpy: jest.SpiedFunction<typeof emailService.sendReviewNotification>;

		beforeEach(() => {
			adminDirectory.clearAdminRecipientsCache();
			getAdminRecipientsSpy = jest
				.spyOn(adminDirectory, 'getAdminRecipients')
				.mockResolvedValue([{ email: 'admin@example.com' }]);
			sendReviewNotificationSpy = jest.spyOn(emailService, 'sendReviewNotification').mockResolvedValue(undefined);
		});

		afterEach(() => {
			getAdminRecipientsSpy.mockRestore();
			sendReviewNotificationSpy.mockRestore();
			adminDirectory.clearAdminRecipientsCache();
		});

		it('returns 201 and persists a valid review without auth', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/reviews',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(validBody),
			});
			expect(res.statusCode).toBe(201);
			const body = jsonBody(res, expect) as { ok: boolean; id: string };
			expect(body.ok).toBe(true);
			expect(typeof body.id).toBe('string');
			expect(getAdminRecipientsSpy).toHaveBeenCalled();
			expect(sendReviewNotificationSpy).toHaveBeenCalledTimes(1);
		});

		it('returns 400 for invalid email', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/reviews',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...validBody, email: 'not-an-email' }),
			});
			expect(res.statusCode).toBe(400);
		});

		it('returns 400 for comment that is too short', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/reviews',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...validBody, comment: 'ab' }),
			});
			expect(res.statusCode).toBe(400);
		});

		it('returns 400 when component is missing', async () => {
			const { component: _c, ...rest } = validBody;
			const res = await wrapped.run({
				requestContext,
				path: '/api/reviews',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(rest),
			});
			expect(res.statusCode).toBe(400);
		});

		it('returns 201 when no admin recipients exist (email skipped)', async () => {
			getAdminRecipientsSpy.mockResolvedValue([]);
			const res = await wrapped.run({
				requestContext,
				path: '/api/reviews',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(validBody),
			});
			expect(res.statusCode).toBe(201);
			expect(sendReviewNotificationSpy).not.toHaveBeenCalled();
		});
	});
