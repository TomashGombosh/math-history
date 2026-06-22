import { useMemo, useState } from "react";
import type { BulkImportItem } from "../../../lib/apiTypes";
import { AdminPagination } from "../AdminPagination";

const PAGE_SIZE = 20;

type Props = {
  candidates: BulkImportItem[];
};

function paginate<T>(items: T[], page: number): { pageItems: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return { pageItems: items.slice(start, start + PAGE_SIZE), totalPages };
}

function EntityTable({
  title,
  rows,
  renderCells,
}: {
  title: string;
  rows: BulkImportItem[];
  renderCells: (item: BulkImportItem) => React.ReactNode;
}) {
  const [page, setPage] = useState(1);
  const { pageItems, totalPages } = useMemo(() => paginate(rows, page), [rows, page]);

  if (rows.length === 0) return null;

  return (
    <section className="admin-table">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Назва</th>
            <th>Рік</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((item) => (
            <tr key={item.id}>{renderCells(item)}</tr>
          ))}
        </tbody>
      </table>
      <AdminPagination currentPage={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}

export function BulkImportReviewTables({ candidates }: Props) {
  const teachers = candidates.filter((c) => c.entity === "teacher");
  const graduates = candidates.filter((c) => c.entity === "graduate");
  const years = candidates.filter((c) => c.entity === "year");

  return (
    <div className="admin-import-review">
      <EntityTable
        title="Викладачі"
        rows={teachers}
        renderCells={(item) => (
          <>
            <td>{item.name ?? "—"}</td>
            <td>—</td>
          </>
        )}
      />
      <EntityTable
        title="Випускники"
        rows={graduates}
        renderCells={(item) => (
          <>
            <td>{item.name ?? "—"}</td>
            <td>{item.year ?? "—"}</td>
          </>
        )}
      />
      <EntityTable
        title="Роки"
        rows={years}
        renderCells={(item) => (
          <>
            <td>—</td>
            <td>{item.year ?? "—"}</td>
          </>
        )}
      />
    </div>
  );
}
