import { useParams } from "react-router-dom";
import type { BulkImportCounts } from "../../../lib/apiTypes";
import "../AdminPages.css";
import { BulkImportEditableTables } from "./BulkImportEditableTables";
import { useBulkImportStatus } from "./useBulkImportStatus";

function CountsSummary({ counts }: { counts: BulkImportCounts | null }) {
  if (!counts) return null;
  return (
    <p>
      Викладачі: {counts.teachers}, Випускники: {counts.graduates}, Роки: {counts.years}
    </p>
  );
}

function AdminImportJobContent({ jobId }: { jobId: string }) {
  const { status, counts, candidates, error, loading, refetch } = useBulkImportStatus(jobId);
  const showProgress = loading || status === "in_progress";

  return (
    <>
      <p>Завдання: {jobId}</p>

      {showProgress ? (
        <>
          <p role="status">{loading && status === null ? "Завантаження статусу…" : "Обробка файлу…"}</p>
          <CountsSummary counts={counts} />
        </>
      ) : null}

      {status === "success" ? (
        <>
          <p className="admin-success">Обробку завершено — перегляньте записи перед застосуванням</p>
          <CountsSummary counts={counts} />
          <BulkImportEditableTables jobId={jobId} candidates={candidates} onChanged={refetch} />
        </>
      ) : null}

      {status === "failed" ? (
        <p role="alert" className="admin-error">
          {error ?? "Помилка обробки імпорту"}
        </p>
      ) : null}

      {status === "cancelled" ? <p role="status">Імпорт скасовано</p> : null}

      {!showProgress && status === null && error ? (
        <p role="alert" className="admin-error">
          {error}
        </p>
      ) : null}
    </>
  );
}

export default function AdminImportJobPage() {
  const { jobId } = useParams<{ jobId: string }>();

  return (
    <div className="admin-home">
      <h1>Імпорт з DOCX</h1>
      {jobId ? (
        <AdminImportJobContent jobId={jobId} />
      ) : (
        <p role="alert" className="admin-error">
          Невідоме завдання імпорту
        </p>
      )}
    </div>
  );
}
