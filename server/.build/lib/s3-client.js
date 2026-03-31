"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3Client = getS3Client;
exports.getS3BucketName = getS3BucketName;
const client_s3_1 = require("@aws-sdk/client-s3");
const aws_sdk_logger_1 = require("./aws-sdk-logger");
let client = null;
function getS3Client() {
    var _a, _b, _c;
    if (!client) {
        const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-north-1';
        const endpoint = (_a = process.env.S3_ENDPOINT) === null || _a === void 0 ? void 0 : _a.trim();
        const accessKeyId = (_b = process.env.AWS_ACCESS_KEY_ID) === null || _b === void 0 ? void 0 : _b.trim();
        const secretAccessKey = (_c = process.env.AWS_SECRET_ACCESS_KEY) === null || _c === void 0 ? void 0 : _c.trim();
        const localCreds = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;
        client = new client_s3_1.S3Client(Object.assign({ region, logger: aws_sdk_logger_1.awsSdkLogger }, (endpoint
            ? Object.assign({ endpoint, forcePathStyle: true }, (localCreds ? { credentials: localCreds } : {})) : {})));
    }
    return client;
}
function getS3BucketName() {
    const b = process.env.S3_DATA_BUCKET;
    if (!b) {
        throw new Error('S3_DATA_BUCKET is not set');
    }
    return b;
}
