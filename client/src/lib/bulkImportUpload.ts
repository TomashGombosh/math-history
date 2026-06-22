import { apiPostAuthed } from "../services/api";
import type { BulkImportCreateResponse } from "./apiTypes";

/**
 * Create a bulk-import job and PUT the source `.docx` to the presigned URL.
 * @returns job id for navigation to the job status page
 */
export async function createBulkImportAndUpload(file: File): Promise<string> {
  const create = await apiPostAuthed<BulkImportCreateResponse>("api/admin/bulk-imports", {});
  const putRes = await fetch(create.uploadUrl, {
    method: "PUT",
    headers: create.headers,
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Не вдалося завантажити файл у сховище (${putRes.status})`);
  }
  return create.jobId;
}
