import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGetAuthed } from "../../services/api";
import type { TeacherDto } from "../../lib/apiTypes";
import { AdminTeacherEditor } from "./teacher/AdminTeacherEditor";
import "./AdminPages.css";

export default function AdminTeacherEditPage() {
  const { id } = useParams<{ id: string }>();
  const teacherId = id ? Number(id) : NaN;

  const [teacher, setTeacher] = useState<TeacherDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(teacherId)) {
      setLoading(false);
      setError("Некоректний ідентифікатор");
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const t = await apiGetAuthed<TeacherDto>(`api/teachers/${teacherId}`);
        if (!cancelled) setTeacher(t);
      } catch {
        if (!cancelled) {
          setTeacher(null);
          setError("Не вдалося завантажити викладача");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  if (loading) {
    return <p role="status">Завантаження…</p>;
  }
  if (error || !teacher) {
    return (
      <p role="alert" className="admin-error">
        {error ?? "Викладача не знайдено"}
      </p>
    );
  }

  return <AdminTeacherEditor mode="edit" teacherId={teacherId} initialTeacher={teacher} />;
}
