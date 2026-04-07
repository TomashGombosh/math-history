# Image uploads: originals, WebP, and thumbs

## Flow

1. **Admin** calls **`POST /api/upload/presign`** (Cognito JWT). Response includes **`uploadUrl`**, **`imageUrl`** (store on teacher/graduate), and predicted paths **`webpUrl`** / **`thumbUrl`**.
2. **Browser** **`PUT`**s the file to **`uploadUrl`** (presigned) with the signed **`Content-Type`**.
3. **S3** emits **`s3:ObjectCreated`** for the original key (e.g. `teachers_img/images/123.jpg`).
4. Lambda **`imageDerivatives`** (`handlers/s3-image-derivatives.ts`) loads the object, runs **sharp**, and **`PutObject`**s:
   - Full **WebP**: max **800×1000** `inside`, no enlargement, quality **80** (same intent as legacy Nuxt `upload-image.post.js`).
   - **Thumb** WebP: **250×250** `cover`, `entropy`, quality **80**.

Derivatives appear **asynchronously** (usually within seconds). The UI should keep **`imageUrl`** as the source of truth; **`graduateImages.ts`** helpers derive CDN paths for WebP/thumbs.

## S3 key layout (must match deletes)

Originals live under **`…/images/<file>`**. Derivatives:

| Derivative | Key segment |
|------------|-------------|
| Full WebP | `…/images-webp/<name>.webp` |
| Thumb WebP | `…/images-thumbs-webp/<name>.webp` |

Scoped uploads use **`teachers_img/`** or **`graduates_img/`** prefixes (see `upload-service.ts`). **`deleteImageFiles`** (`src/lib/image-s3.ts`) removes originals + both derivatives for all prefix variants.

## Serverless

- Function **`imageDerivatives`** in `serverless.yml` subscribes to **`s3:ObjectCreated:*`** with prefixes **`images/`**, **`teachers_img/images/`**, **`graduates_img/images/`**, **`existing: true`** (bucket already created by Terraform / `infra`).
- The function is packaged **individually** with **`sharp`** so the main API bundle stays small.
- **Memory** is **1024 MB** (sharp); **timeout** **60s**.

### First-time deploy

If the bucket had **no** notification to this Lambda yet, **`serverless deploy`** creates the event config. If Terraform also manages S3 notifications, avoid duplicate triggers on the same prefix (either let Serverless own these three prefixes or wire the same Lambda ARN in Terraform—one source of truth).

## Client helpers

- **`imageWebpUrl`** / **`graduateImageWebpUrl`**: map stored **`imageUrl`** to full WebP paths (including **`teachers_img/images/`** → **`teachers_img/images-webp/`**).
- **`imageThumbWebpUrl`**: map to **`images-thumbs-webp`** (e.g. list UIs that prefer square thumbs).

## Local dev

With **MinIO** (`S3_ENDPOINT`) and **`S3_DATA_BUCKET`**, uploading via presign creates objects locally; **S3 event → Lambda** does not run unless you invoke the handler manually or use a local event emulator. For quick checks, you can call **`processUploadedOriginalKey(bucket, key)`** from **`image-derivative-processor.ts`** in a one-off script after PUT.
