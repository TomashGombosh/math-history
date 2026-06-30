import { PK, reviewSortKey } from '@lib/dynamo-keys';
import { putItem } from '@lib/dynamo-operations';
import { logInfo, logWarn, type CorrelationIds } from '@lib/lambda-log';
import type { ReviewCreateBody } from '@models/review';
import { getAdminRecipients } from '@services/admin-directory';
import { sendReviewNotification } from '@services/email-service';

export interface ReviewItem extends Record<string, unknown> {
	pk: typeof PK.REVIEW;
	sk: string;
	entityType: 'Review';
	id: string;
	email: string;
	comment: string;
	componentType: string;
	componentId?: string;
	componentLabel: string;
	componentUrl?: string;
	ip?: string;
	status: 'new';
	createdAt: string;
}

export async function submitReview(
	body: ReviewCreateBody,
	opts: { ip?: string; correlation?: CorrelationIds },
): Promise<{ ok: true; id: string }> {
	const t0 = Date.now();
	const id = crypto.randomUUID();
	const createdAt = new Date().toISOString();
	const sk = reviewSortKey(createdAt, id);

	const item: ReviewItem = {
		pk: PK.REVIEW,
		sk,
		entityType: 'Review',
		id,
		email: body.email,
		comment: body.comment,
		componentType: body.component.type,
		componentId: body.component.id,
		componentLabel: body.component.label,
		componentUrl: body.component.url,
		ip: opts.ip || undefined,
		status: 'new',
		createdAt,
	};

	await putItem({ Item: item });

	const recipients = await getAdminRecipients();
	const base = {
		...(opts.correlation ?? {}),
		service: 'math-history-server' as const,
		id,
		componentType: item.componentType,
		componentId: item.componentId ?? null,
		recipientCount: recipients.length,
	};

	if (recipients.length) {
		try {
			await sendReviewNotification(item, recipients);
		} catch (e) {
			logWarn('review:email_failed', {
				...base,
				durationMs: Date.now() - t0,
				err: e instanceof Error ? { name: e.name, message: e.message } : String(e),
			});
		}
	} else {
		logWarn('review:no_admin_recipients', {
			...base,
			durationMs: Date.now() - t0,
		});
	}

	logInfo('review:created', {
		...base,
		durationMs: Date.now() - t0,
	});

	return { ok: true, id };
}
