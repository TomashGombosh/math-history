type Props = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function AdminPagination({ currentPage, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Пагінація" className="admin-pagination">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
      >
        Назад
      </button>
      <span>
        Сторінка {currentPage} з {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onChange(currentPage + 1)}
      >
        Далі
      </button>
    </nav>
  );
}
