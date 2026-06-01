"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.docClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const aws_sdk_logger_1 = require("./aws-sdk-logger");
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-north-1';
const localEndpoint = (_a = process.env.DYNAMODB_ENDPOINT) === null || _a === void 0 ? void 0 : _a.trim();
const lowLevel = new client_dynamodb_1.DynamoDBClient(Object.assign({ region, logger: aws_sdk_logger_1.awsSdkLogger }, (localEndpoint
    ? {
        endpoint: localEndpoint,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
        },
    }
    : {})));
exports.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(lowLevel, {
    marshallOptions: { removeUndefinedValues: true },
    unmarshallOptions: { wrapNumbers: false },
});
