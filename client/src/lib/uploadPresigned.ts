import { apiPostAuthed } from "./api";

export interface PresignImageResponse {
  uploadUrl: string;
  expiresIn: number;
  method: "PUT";
  headers: { "Content-Type": string };
  imageUrl: string;
  /** Populated by API; same host/path rules as `imageUrl` — objects appear shortly after PUT (S3 → Lambda). */
  webpUrl: string;
  thumbUrl: string;
}

/**
 * Request presigned PUT from server_v2, then upload the file bytes to S3.
 */
export async function uploadImageWithPresign(
  file: File,
  scope: "teacher" | "graduate" | "graduates" | "common"
): Promise<string> {
  const contentType = file.type || "image/jpeg";
  const body = {
    scope,
    contentType,
    originalFileName: file.name || "upload.jpg",
  };
  const presign = await apiPostAuthed<PresignImageResponse>("api/upload/presign", body);
  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: presign.headers,
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Не вдалося завантажити файл у сховище (${putRes.status})`);
  }
  return presign.imageUrl;
}
