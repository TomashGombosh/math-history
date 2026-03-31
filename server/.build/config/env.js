"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.envSchema = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function optionalTrimmed(message = 'Cannot be empty when set') {
    return zod_1.z.preprocess((val) => {
        if (val === undefined || val === null)
            return undefined;
        const s = String(val).trim();
        return s === '' ? undefined : s;
    }, zod_1.z.string().min(1, message).optional());
}
const NODE_ENV_VALUES = [
    'local',
    'dev',
    'development',
    'stage',
    'production',
    'prod',
    'test',
];
const relaxedAwsResourceEnvs = new Set(['test', 'local', 'dev', 'development']);
exports.envSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(NODE_ENV_VALUES).default('dev'),
    AWS_REGION: optionalTrimmed(),
    AWS_DEFAULT_REGION: optionalTrimmed(),
    AWS_SDK_LOG_LEVEL: optionalTrimmed(),
    AWS_ACCESS_KEY_ID: optionalTrimmed(),
    AWS_SECRET_ACCESS_KEY: optionalTrimmed(),
    DYNAMODB_TABLE_NAME: optionalTrimmed(),
    DYNAMODB_ENDPOINT: optionalTrimmed(),
    S3_DATA_BUCKET: optionalTrimmed(),
    S3_ENDPOINT: optionalTrimmed(),
    CORS_ORIGIN: optionalTrimmed(),
    SITE_URL: optionalTrimmed(),
})
    .superRefine((data, ctx) => {
    const usesLocalDynamo = Boolean(data.DYNAMODB_ENDPOINT);
    const skipAwsDataChecks = relaxedAwsResourceEnvs.has(data.NODE_ENV) || usesLocalDynamo;
    if (skipAwsDataChecks)
        return;
    if (!data.DYNAMODB_TABLE_NAME) {
        ctx.addIssue({
            code: 'custom',
            message: 'DYNAMODB_TABLE_NAME is required when not using DYNAMODB_ENDPOINT (e.g. Lambda / AWS DynamoDB).',
            path: ['DYNAMODB_TABLE_NAME'],
        });
    }
    if (!data.S3_DATA_BUCKET) {
        ctx.addIssue({
            code: 'custom',
            message: 'S3_DATA_BUCKET is required for presigned uploads and image cleanup in this environment.',
            path: ['S3_DATA_BUCKET'],
        });
    }
});
let cachedConfig = null;
const getConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    if (cachedConfig)
        return cachedConfig;
    const env = exports.envSchema.parse(process.env);
    cachedConfig = {
        nodeEnv: env.NODE_ENV,
    };
    return cachedConfig;
});
exports.getConfig = getConfig;
exports.default = exports.getConfig;
