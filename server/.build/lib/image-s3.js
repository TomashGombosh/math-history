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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFiles = deleteImageFiles;
const client_s3_1 = require("@aws-sdk/client-s3");
const lambda_log_1 = require("./lambda-log");
const s3_client_1 = require("./s3-client");
function basenameFromUrl(imageUrl) {
    try {
        const u = imageUrl.startsWith('http') ? new URL(imageUrl) : null;
        const pathname = u ? u.pathname : imageUrl;
        const parts = pathname.split('/').filter(Boolean);
        return parts[parts.length - 1] || '';
    }
    catch (_a) {
        return '';
    }
}
function deleteImageFiles(imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!imageUrl)
            return;
        const fileName = basenameFromUrl(imageUrl);
        if (!fileName)
            return;
        const webpName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');
        const prefixes = [
            ['images', fileName],
            ['images-webp', webpName],
            ['images-thumbs-webp', webpName],
            ['teachers_img', 'images', fileName],
            ['teachers_img', 'images-webp', webpName],
            ['teachers_img', 'images-thumbs-webp', webpName],
            ['graduates_img', 'images', fileName],
            ['graduates_img', 'images-webp', webpName],
            ['graduates_img', 'images-thumbs-webp', webpName],
        ];
        const keys = prefixes.map((segs) => segs.join('/'));
        const s3 = (0, s3_client_1.getS3Client)();
        const bucket = (0, s3_client_1.getS3BucketName)();
        yield Promise.all(keys.map((Key) => s3
            .send(new client_s3_1.DeleteObjectCommand({
            Bucket: bucket,
            Key,
        }))
            .catch((e) => {
            if ((e === null || e === void 0 ? void 0 : e.name) !== 'NotFound' && (e === null || e === void 0 ? void 0 : e.name) !== 'NoSuchKey') {
                (0, lambda_log_1.logException)('s3:deleteObject_failed', e, { s3Key: Key });
            }
        })));
    });
}
