import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../lib/apiError";
import { createBulkImportAndUpload } from "../../../lib/bulkImportUpload";
import { ROUTES } from "../../../router/paths";
import "../AdminPages.css";

const ACTIVE_JOB_MESSAGE = "Завершіть або скасуйте попередній імпорт";

export default function AdminImportStartPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const jobId = await createBulkImportAndUpload(file);
      navigate(ROUTES.adminImportJob(jobId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(ACTIVE_JOB_MESSAGE);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Помилка імпорту");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-home">
      <h1>Імпорт з DOCX</h1>
      <form onSubmit={(e) => void onSubmit(e)}>
        <p className="admin-hint">
          Оберіть файл Microsoft Word (.docx) для імпорту викладачів, випускників і років.
        </p>
        <label htmlFor="bulk-import-docx">Файл DOCX</label>
        <input
          id="bulk-import-docx"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onFileChange}
          disabled={submitting}
        />
        <button type="submit" className="admin-btn-primary" disabled={!file || submitting}>
          Почати імпорт
        </button>
        {submitting ? <p role="status">Завантаження…</p> : null}
        {error ? (
          <p role="alert" className="admin-error">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
