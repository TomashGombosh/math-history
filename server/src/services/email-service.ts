import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { awsSdkLogger } from '@lib/aws-sdk-logger';
import { buildReviewEmail, type ReviewEmailItem } from '@services/review-email-template';
import type { AdminRecipient } from '@services/admin-directory';

const region = process.env.SES_REGION?.trim() || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-north-1';

const sesClient = new SESv2Client({
	region,
	logger: awsSdkLogger,
});

export async function sendReviewNotification(item: ReviewEmailItem, recipients: AdminRecipient[]): Promise<void> {
	const sender = process.env.SES_SENDER?.trim();
	if (!sender) {
		throw new Error('SES_SENDER_NOT_CONFIGURED');
	}
	if (!recipients.length) {
		throw new Error('NO_RECIPIENTS');
	}

	const { subject, html, text } = buildReviewEmail(item);
	const bcc = [...new Set(recipients.map((r) => r.email))];

	await sesClient.send(
		new SendEmailCommand({
			FromEmailAddress: sender,
			Destination: {
				ToAddresses: [sender],
				BccAddresses: bcc,
			},
			ReplyToAddresses: [item.email],
			Content: {
				Simple: {
					Subject: { Data: subject, Charset: 'UTF-8' },
					Body: {
						Html: { Data: html, Charset: 'UTF-8' },
						Text: { Data: text, Charset: 'UTF-8' },
					},
				},
			},
		}),
	);
}
