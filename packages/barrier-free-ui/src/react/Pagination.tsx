"use client";

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="bf-pagination" aria-label="ページ送り">
      <span className="bf-pagination__summary">
        {from}–{to} 件 / 全 {total} 件
      </span>
      <div className="bf-pagination__nav">
        <button
          type="button"
          className="bf-pagination__btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ‹ 前へ
        </button>
        <span className="bf-pagination__current" aria-current="page">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="bf-pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          次へ ›
        </button>
      </div>
    </nav>
  );
}
