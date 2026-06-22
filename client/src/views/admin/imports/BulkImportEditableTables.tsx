import { useMemo, useState } from "react";
import type { BulkImportItem } from "../../../lib/apiTypes";
import { apiDeleteAuthed, apiPutAuthed } from "../../../services/api";
import { AdminPagination } from "../AdminPagination";

const PAGE_SIZE = 20;

type Props = {
  jobId: string;
  candidates: BulkImportItem[];
  onChanged: () => void;
};

function paginate<T>(items: T[], page: number): { pageItems: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return { pageItems: items.slice(start, start + PAGE_SIZE), totalPages };
}

function EditableEntityTable({
  title,
  rows,
  jobId,
  onChanged,
}: {
  title: string;
  rows: BulkImportItem[];
  jobId: string;
  onChanged: () => void;
}) {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [pending, setPending] = useState(false);
  const { pageItems, totalPages } = useMemo(() => paginate(rows, page), [rows, page]);

  if (rows.length === 0) return null;

  async function saveName(itemId: string) {
    const name = draftName.trim();
    if (!name) return;
    setPending(true);
    try {
      await apiPutAuthed(`api/admin/bulk-imports/${jobId}/items/${encodeURIComponent(itemId)}`, { name });
      setEditingId(null);
      onChanged();
    } catch {
      window.alert("Помилка збереження");
    } finally {
      setPending(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!window.confirm("Видалити цей запис? Цю дію не можна скасувати.")) return;
    setPending(true);
    try {
      await apiDeleteAuthed(`api/admin/bulk-imports/${jobId}/items/${encodeURIComponent(itemId)}`);
      onChanged();
    } catch {
      window.alert("Помилка видалення");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="admin-table">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Назва</th>
            <th>Рік</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((item) => (
            <tr key={item.id}>
              <td>
                {editingId === item.id ? (
                  <input
                    value={draftName}
                    disabled={pending}
                    onChange={(e) => setDraftName(e.target.value)}
                    aria-label="Нова назва"
                  />
                ) : (
                  (item.name ?? "—")
                )}
              </td>
              <td>{item.year ?? "—"}</td>
              <td>
                {editingId === item.id ? (
                  <>
                    <button type="button" disabled={pending} onClick={() => void saveName(item.id)}>
                      Зберегти
                    </button>{" "}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setEditingId(null);
                        setDraftName("");
                      }}
                    >
                      Скасувати
                    </button>
                  </>
                ) : (
                  <>
                    {item.entity !== "year" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setEditingId(item.id);
                          setDraftName(item.name ?? "");
                        }}
                      >
                        Редагувати
                      </button>
                    ) : null}{" "}
                    <button type="button" disabled={pending} onClick={() => void removeItem(item.id)}>
                      Видалити
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AdminPagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}

export function BulkImportEditableTables({ jobId, candidates, onChanged }: Props) {
  const teachers = candidates.filter((c) => c.entity === "teacher");
  const graduates = candidates.filter((c) => c.entity === "graduate");
  const years = candidates.filter((c) => c.entity === "year");

  return (
    <div className="admin-import-review">
      <EditableEntityTable title="Викладачі" rows={teachers} jobId={jobId} onChanged={onChanged} />
      <EditableEntityTable title="Випускники" rows={graduates} jobId={jobId} onChanged={onChanged} />
      <EditableEntityTable title="Роки" rows={years} jobId={jobId} onChanged={onChanged} />
    </div>
  );
}
