import {
	CognitoIdentityProviderClient,
	ListUsersInGroupCommand,
	type UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { awsSdkLogger } from '@lib/aws-sdk-logger';

export interface AdminRecipient {
	email: string;
	name?: string;
}

const ADMIN_GROUP = 'admin';
const CACHE_TTL_MS = 5 * 60 * 1000;

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-north-1';

const cognitoClient = new CognitoIdentityProviderClient({
	region,
	logger: awsSdkLogger,
});

let cachedRecipients: AdminRecipient[] | null = null;
let cacheExpiresAt = 0;

function parseFallbackRecipients(): AdminRecipient[] {
	const raw = process.env.REVIEW_NOTIFY_FALLBACK?.trim();
	if (!raw) return [];
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((email) => ({ email }));
}

function userToRecipient(user: UserType): AdminRecipient | null {
	const email = user.Attributes?.find((a) => a.Name === 'email')?.Value?.trim();
	if (!email) return null;
	const verified = user.Attributes?.find((a) => a.Name === 'email_verified')?.Value;
	if (verified !== 'true') return null;
	const name = user.Attributes?.find((a) => a.Name === 'name')?.Value?.trim();
	return name ? { email, name } : { email };
}

async function listAdminGroupRecipients(poolId: string): Promise<AdminRecipient[]> {
	const out: AdminRecipient[] = [];
	let nextToken: string | undefined;
	do {
		const res = await cognitoClient.send(
			new ListUsersInGroupCommand({
				UserPoolId: poolId,
				GroupName: ADMIN_GROUP,
				Limit: 60,
				NextToken: nextToken,
			}),
		);
		for (const user of res.Users ?? []) {
			const recipient = userToRecipient(user);
			if (recipient) out.push(recipient);
		}
		nextToken = res.NextToken;
	} while (nextToken);
	return out;
}

/** Clears in-process cache (for tests). */
export function clearAdminRecipientsCache(): void {
	cachedRecipients = null;
	cacheExpiresAt = 0;
}

export async function getAdminRecipients(): Promise<AdminRecipient[]> {
	const now = Date.now();
	if (cachedRecipients && now < cacheExpiresAt) {
		return cachedRecipients;
	}

	const poolId = process.env.COGNITO_USER_POOL_ID?.trim();
	let recipients: AdminRecipient[] = [];

	if (poolId) {
		try {
			recipients = await listAdminGroupRecipients(poolId);
		} catch {
			recipients = [];
		}
	}

	if (!recipients.length) {
		recipients = parseFallbackRecipients();
	}

	cachedRecipients = recipients;
	cacheExpiresAt = now + CACHE_TTL_MS;
	return recipients;
}
