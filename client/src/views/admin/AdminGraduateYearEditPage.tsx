import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGetAuthed } from "../../services/api";
import type { GraduateCohortRow } from "../../admin/graduateMerge";
import { mergeCohortsForYear } from "../../admin/graduateMerge";
import { AdminGraduateEditor } from "./graduate/AdminGraduateEditor";
import "./AdminPages.css";

export default function AdminGraduateYearEditPage() {
  const { year: yearParam } = useParams<{ year: string }>();
  const yearNum = yearParam ? Number(yearParam) : NaN;

  const [rows, setRows] = useState<GraduateCohortRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(yearNum)) {
      setLoading(false);
      setError("Некоректний рік");
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetAuthed<GraduateCohortRow[]>("api/graduates", { year: yearNum });
        if (cancelled) return;
        setRows(Array.isArray(res) ? res : []);
      } catch {
        if (!cancelled) {
          setRows(null);
          setError("Помилка завантаження випуску");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [yearNum]);

  if (loading) {
    return <p role="status">Завантаження…</p>;
  }

  if (error || !rows) {
    return (
      <p role="alert" className="admin-error">
        {error ?? "Помилка"}
      </p>
    );
  }

  const merged = mergeCohortsForYear(rows);
  if (!merged) {
    return <p>Випуск не знайдено.</p>;
  }

  return <AdminGraduateEditor mode="edit" graduate={merged} />;
}
