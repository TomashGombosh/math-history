import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiDeleteAuthed, apiGet } from "../../services/api";
import type { GraduateYearSummary } from "../../lib/apiTypes";
import { ROUTES } from "../../router/paths";
import { AdminPagination } from "./AdminPagination";
import "./AdminPages.css";

const PAGE_SIZE = 20;

export default function AdminGraduatesListPage() {
  const [yearsAll, setYearsAll] = useState<GraduateYearSummary[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => (yearsAll.length ? Math.ceil(yearsAll.length / PAGE_SIZE) : 1),
    [yearsAll.length]
  );

  const pagedYears = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return yearsAll.slice(start, start + PAGE_SIZE);
  }, [yearsAll, page]);

  const loadYears = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<GraduateYearSummary[]>("api/graduates/years");
      const rows = Array.isArray(data)
        ? data
            .map((row) => ({
              year: Number(row.year),
              totalStudents: Number(row.totalStudents) || 0,
              totalWithHonours: Number(row.totalWithHonours) || 0,
              cohortsCount: Number(row.cohortsCount) || 0,
            }))
            .sort((a, b) => a.year - b.year)
        : [];
      setYearsAll(rows);
    } catch {
      setError("Помилка завантаження списку випусків");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadYears();
  }, [loadYears]);

  useEffect(() => {
    const tp = yearsAll.length ? Math.ceil(yearsAll.length / PAGE_SIZE) : 1;
    if (page > tp) setPage(tp);
  }, [yearsAll, page]);

  async function onDelete(year: number) {
    if (!window.confirm(`Точно видалити випуск за ${year} рік?`)) return;
    try {
      await apiDeleteAuthed(`api/graduates/${year}`);
      await loadYears();
    } catch {
      window.alert("Помилка при видаленні випуску");
    }
  }

  function changePage(n: number) {
    if (n < 1 || n > totalPages) return;
    setPage(n);
  }

  return (
    <div className="admin-content">
      <div className="admin-table">
        <h1>Адміністрування випусків</h1>

        <div className="admin-top-row admin-top-row--start">
          <Link to={ROUTES.adminGraduatesCreate} className="admin-btn-add">
            + Додати випуск
          </Link>
        </div>

        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Рік випуску</th>
              <th>К-ть випускників</th>
              <th>З відзнакою</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pagedYears.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 12 }}>
                  Немає жодного випуску
                </td>
              </tr>
            ) : null}
            {pagedYears.map((item, index) => (
              <tr key={item.year}>
                <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                <td>{item.year}</td>
                <td>{item.totalStudents}</td>
                <td>{item.totalWithHonours}</td>
                <td className="admin-actions-cell">
                  <Link to={ROUTES.adminGraduateYearEdit(item.year)}>Редагувати</Link>
                  <Link to={ROUTES.graduatesYear(item.year)}> Переглянути </Link>
                  <button type="button" className="admin-delete-link" onClick={() => void onDelete(item.year)}>
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

        <AdminPagination currentPage={page} totalPages={totalPages} onChange={changePage} />
      </div>
    </div>
  );
}
