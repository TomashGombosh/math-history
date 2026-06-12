import '@config/bootstrap-env';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { awsSdkLogger } from '@lib/aws-sdk-logger';

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-north-1';

const localEndpoint = process.env.DYNAMODB_ENDPOINT?.trim();
const lowLevel = new DynamoDBClient({
	region,
	logger: awsSdkLogger,
	...(localEndpoint
		? {
				endpoint: localEndpoint,
				credentials: {
					accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
					secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
				},
			}
		: {}),
});

export const docClient = DynamoDBDocumentClient.from(lowLevel, {
	marshallOptions: { removeUndefinedValues: true },
	unmarshallOptions: { wrapNumbers: false },
});
