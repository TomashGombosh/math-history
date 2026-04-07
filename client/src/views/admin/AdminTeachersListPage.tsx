import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDeleteAuthed, apiGetAuthed } from "../../services/api";
import type { TeachersListResponse } from "../../lib/apiTypes";
import { ROUTES } from "../../router/paths";
import { AdminPagination } from "./AdminPagination";
import "./AdminPages.css";

const PAGE_SIZE = 20;

function teacherImageSrc(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

function teacherWebpSrc(url: string): string | null {
  if (!url) return null;
  let withWebp = url;
  if (url.includes("/teachers/")) {
    withWebp = url.replace(/\/teachers\/([^/]+)\.(jpg|jpeg|png)$/i, "/teachers/$1.webp");
  } else {
    withWebp = url.replace("/images/", "/images-webp/").replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  return withWebp !== url ? withWebp : null;
}

export default function AdminTeachersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teachers, setTeachers] = useState<TeachersListResponse["teachers"]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetAuthed<TeachersListResponse>("api/teachers", {
        page: p,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      const list = [...res.teachers].sort((a, b) => a.id - b.id);
      setTeachers(list);
      setTotalPages(res.totalPages ?? 1);
      setPage(p);
    } catch {
      setError("Помилка завантаження викладачів");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void load(1);
  }, [load]);

  async function onDelete(id: number) {
    if (!window.confirm("Точно видалити викладача?")) return;
    try {
      await apiDeleteAuthed(`api/teachers/${id}`);
      if (teachers.length === 1 && page > 1) {
        await load(page - 1);
      } else {
        await load(page);
      }
    } catch {
      window.alert("Помилка при видаленні викладача");
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-table">
        <h1>Адміністрування викладачів</h1>

        <div className="admin-top-row">
          <Link to={ROUTES.adminTeachersCreate} className="admin-btn-add">
            + Додати викладача
          </Link>
          <input
            className="admin-search-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук викладача за ім'ям…"
            aria-label="Пошук викладача за ім'ям"
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Фото</th>
              <th>Ім&apos;я</th>
              <th className="admin-hide-narrow">Факультет</th>
              <th className="admin-hide-narrow">Посада</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t, index) => (
              <tr key={t.id}>
                <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                <td className="admin-photo-cell">
                  {t.imageUrl ? (
                    <picture>
                      {teacherWebpSrc(t.imageUrl) ? (
                        <source srcSet={teacherWebpSrc(t.imageUrl) ?? undefined} type="image/webp" />
                      ) : null}
                      <img src={teacherImageSrc(t.imageUrl)} alt={t.name} loading="lazy" width={60} height={80} />
                    </picture>
                  ) : null}
                </td>
                <td>{t.name}</td>
                <td className="admin-hide-narrow">{t.faculty ?? ""}</td>
                <td className="admin-hide-narrow">{t.position ?? ""}</td>
                <td className="admin-actions-cell">
                  <Link to={ROUTES.adminTeacherEdit(t.id)}>Редагувати</Link>
                  <Link to={ROUTES.teacherSlug(t.slug)}>Переглянути</Link>
                  <button type="button" className="admin-delete-link" onClick={() => void onDelete(t.id)}>
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading ? <p role="status">Завантаження…</p> : null}
        {error ? (
          <p role="alert" className="admin-error">
            {error}
          </p>
        ) : null}

        <AdminPagination currentPage={page} totalPages={totalPages} onChange={(n) => void load(n)} />
      </div>
    </div>
  );
}
