import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../router/paths";
import { apiDeleteAuthed, apiPostAuthed } from "../../../services/api";

type Props = {
  jobId: string;
  disabled?: boolean;
};

export function BulkImportJobActions({ jobId, disabled = false }: Props) {
  const navigate = useNavigate();
  const [pending, setPending] = useState<"commit" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCommit() {
    setPending("commit");
    setError(null);
    try {
      await apiPostAuthed(`api/admin/bulk-imports/${jobId}/commit`, {});
      navigate(ROUTES.admin);
    } catch {
      setError("Помилка застосування імпорту");
    } finally {
      setPending(null);
    }
  }

  async function onCancel() {
    if (!window.confirm("Скасувати імпорт і видалити всі чернетки?")) return;
    setPending("cancel");
    setError(null);
    try {
      await apiDeleteAuthed(`api/admin/bulk-imports/${jobId}`);
      navigate(ROUTES.adminImports);
    } catch {
      setError("Помилка скасування імпорту");
    } finally {
      setPending(null);
    }
  }

  const isBusy = pending !== null || disabled;

  return (
    <div className="admin-import-actions">
      {error ? (
        <p role="alert" className="admin-error">
          {error}
        </p>
      ) : null}
      <button type="button" disabled={isBusy} onClick={() => void onCommit()}>
        {pending === "commit" ? "Застосовуємо…" : "Застосувати імпорт"}
      </button>{" "}
      <button type="button" disabled={isBusy} onClick={() => void onCancel()}>
        {pending === "cancel" ? "Скасовуємо…" : "Скасувати імпорт"}
      </button>
    </div>
  );
}
