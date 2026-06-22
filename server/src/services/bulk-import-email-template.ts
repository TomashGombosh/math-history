import type { BulkJobCounts } from '@services/bulk-import-service';

export interface BulkImportCompleteEmailInput {
	jobId: string;
	counts: BulkJobCounts;
	reviewUrl: string;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function buildBulkImportCompleteEmail(input: BulkImportCompleteEmailInput): {
	subject: string;
	html: string;
	text: string;
} {
	const { jobId, counts, reviewUrl } = input;
	const subject = 'Імпорт DOCX готовий до перегляду';
	const summary = `Викладачі: ${counts.teachers}, випускники: ${counts.graduates}, роки: ${counts.years}`;
	const text = [
		'Обробку файлу імпорту завершено.',
		`Завдання: ${jobId}`,
		summary,
		`Переглянути: ${reviewUrl}`,
	].join('\n');

	const html = [
		'<p>Обробку файлу імпорту завершено.</p>',
		`<p><strong>Завдання:</strong> ${escapeHtml(jobId)}</p>`,
		`<p><strong>${escapeHtml(summary)}</strong></p>`,
		`<p><a href="${escapeHtml(reviewUrl)}">Відкрити перегляд імпорту</a></p>`,
	].join('');

	return { subject, html, text };
}
