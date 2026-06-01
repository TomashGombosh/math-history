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
exports.createPresignedImageUpload = createPresignedImageUpload;
const node_path_1 = __importDefault(require("node:path"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3_client_1 = require("../lib/s3-client");
const PRESIGN_EXPIRES_SEC = 3600;
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
function subDirsForScope(scope) {
    if (scope === 'teacher') {
        return ['teachers_img'];
    }
    if (scope === 'graduate' || scope === 'graduates') {
        return ['graduates_img'];
    }
    return [];
}
function createPresignedImageUpload(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const contentType = input.contentType.trim();
        if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
            throw new Error('UNSUPPORTED_MEDIA_TYPE');
        }
        const ext = node_path_1.default.extname(input.originalFileName).toLowerCase() || '.jpg';
        const fileName = `${Date.now()}${ext}`;
        const webpName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');
        const scope = (input.scope || 'common').toString();
        const sub = subDirsForScope(scope);
        let key;
        let imageUrl;
        let webpUrl;
        if (sub.length) {
            const imgSegs = [...sub, 'images'];
            const webpSegs = [...sub, 'images-webp'];
            key = `${imgSegs.join('/')}/${fileName}`;
            imageUrl = `/${imgSegs.join('/')}/${fileName}`;
            webpUrl = `/${webpSegs.join('/')}/${webpName}`;
        }
        else {
            key = `images/${fileName}`;
            imageUrl = `/images/${fileName}`;
            webpUrl = `/images-webp/${webpName}`;
        }
        const bucket = (0, s3_client_1.getS3BucketName)();
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = yield (0, s3_request_presigner_1.getSignedUrl)((0, s3_client_1.getS3Client)(), command, { expiresIn: PRESIGN_EXPIRES_SEC });
        return {
            uploadUrl,
            expiresIn: PRESIGN_EXPIRES_SEC,
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            s3: { bucket, key },
            imageUrl,
            webpUrl,
        };
    });
}
