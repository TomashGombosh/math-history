export interface ReviewEmailItem {
	id: string;
	email: string;
	comment: string;
	componentType: string;
	componentId?: string;
	componentLabel: string;
	componentUrl?: string;
	createdAt: string;
}

const COMPONENT_TYPE_LABELS: Record<string, string> = {
	teacher: 'викладач',
	graduate: 'випуск',
	page: 'сторінка',
	other: 'інше',
};

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function formatKyivDate(iso: string): string {
	const date = new Date(iso);
	return new Intl.DateTimeFormat('uk-UA', {
		timeZone: 'Europe/Kyiv',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

function componentTypeLabel(type: string): string {
	return COMPONENT_TYPE_LABELS[type] ?? type;
}

export function buildReviewEmail(item: ReviewEmailItem): { subject: string; html: string; text: string } {
	const safeLabel = escapeHtml(item.componentLabel);
	const safeComment = escapeHtml(item.comment);
	const safeEmail = escapeHtml(item.email);
	const safeUrl = item.componentUrl ? escapeHtml(item.componentUrl) : '';
	const typeLabel = componentTypeLabel(item.componentType);
	const formattedDate = formatKyivDate(item.createdAt);

	const subject = `Новий відгук про сайт: ${item.componentLabel}`;

	const urlBlock = safeUrl
		? `<p style="margin:0 0 12px;"><a href="${safeUrl}" style="color:#1565c0;">${safeUrl}</a></p>`
		: '';

	const html = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.5;margin:0;padding:24px;background:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e0e0e0;">
    <h1 style="font-size:20px;margin:0 0 16px;">Новий відгук на сайті «Математики УжНУ»</h1>
    <p style="margin:0 0 8px;"><strong>Компонент:</strong> ${safeLabel} (${escapeHtml(typeLabel)})</p>
    ${urlBlock}
    <p style="margin:0 0 8px;"><strong>Коментар:</strong></p>
    <p style="margin:0 0 16px;white-space:pre-wrap;background:#fafafa;padding:12px;border-radius:4px;">${safeComment}</p>
    <p style="margin:0 0 8px;"><strong>Контакт автора:</strong> <a href="mailto:${safeEmail}" style="color:#1565c0;">${safeEmail}</a></p>
    <p style="margin:0 0 16px;"><a href="mailto:${safeEmail}?subject=${encodeURIComponent('Re: відгук про сайт Математики УжНУ')}" style="display:inline-block;background:#1565c0;color:#fff;text-decoration:none;padding:10px 16px;border-radius:4px;">Відповісти</a></p>
    <p style="margin:0 0 8px;color:#666;font-size:14px;"><strong>Дата:</strong> ${escapeHtml(formattedDate)}</p>
    <p style="margin:16px 0 0;color:#888;font-size:12px;">Це автоматичне повідомлення системи модерації контенту.</p>
  </div>
</body>
</html>`;

	const urlLine = item.componentUrl ? `Посилання: ${item.componentUrl}\n` : '';
	const text = `Новий відгук на сайті «Математики УжНУ»

Компонент: ${item.componentLabel} (${typeLabel})
${urlLine}
Коментар:
${item.comment}

Контакт автора: ${item.email}

Дата: ${formattedDate}

Це автоматичне повідомлення системи модерації контенту.`;

	return { subject, html, text };
}
