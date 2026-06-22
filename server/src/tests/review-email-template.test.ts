import { buildReviewEmail } from '../services/review-email-template.js';

describe('buildReviewEmail', () => {
	const baseItem = {
		id: 'test-uuid',
		email: 'visitor@example.com',
		comment: 'Тестовий коментар.',
		componentType: 'teacher',
		componentId: 'ivanov',
		componentLabel: 'Картка викладача: Іванов',
		componentUrl: 'https://math-history.afj-solution.com/teacher/ivanov',
		createdAt: '2026-06-22T10:00:00.000Z',
	};

	it('includes component label in subject', () => {
		const { subject } = buildReviewEmail(baseItem);
		expect(subject).toContain('Картка викладача: Іванов');
	});

	it('escapes HTML in comment', () => {
		const { html } = buildReviewEmail({
			...baseItem,
			comment: '<script>alert(1)</script>',
		});
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('includes Ukrainian headings in html and text', () => {
		const { html, text } = buildReviewEmail(baseItem);
		expect(html).toContain('Новий відгук на сайті «Математики УжНУ»');
		expect(text).toContain('Новий відгук на сайті «Математики УжНУ»');
		expect(html).toContain('Відповісти');
	});

	it('includes plaintext fallback', () => {
		const { text } = buildReviewEmail(baseItem);
		expect(text).toContain('Коментар:');
		expect(text).toContain(baseItem.comment);
		expect(text).toContain(baseItem.email);
	});
});
