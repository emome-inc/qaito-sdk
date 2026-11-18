"use client";

import { toHiragana } from "./kana";
import { useMemo, useState, useCallback } from "react";

type Options<T> = {
  items: T[];
  searchFields: (keyof T)[];
  /** カタカナ→ひらがな正規化をかけて検索するフィールド（氏名かな等）。 */
  kanaFields?: (keyof T)[];
  initialPageSize?: number;
};

export function useListState<T>({
  items,
  searchFields,
  kanaFields = [],
  initialPageSize = 20,
}: Options<T>) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleSetQuery = useCallback((q: string) => {
    setQuery(q);
    setPage(1);
  }, []);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const resetAll = useCallback(() => {
    setQuery("");
    setFilters({});
    setPage(1);
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (query.trim()) {
      const normalizedQuery = toHiragana(query.trim().toLowerCase());
      result = result.filter((item) => {
        const matchNormal = searchFields.some((field) => {
          const val = item[field];
          if (val == null) return false;
          return String(val).toLowerCase().includes(normalizedQuery);
        });
        if (matchNormal) return true;

        return kanaFields.some((field) => {
          const val = item[field];
          if (val == null) return false;
          return toHiragana(String(val).toLowerCase()).includes(normalizedQuery);
        });
      });
    }

    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      result = result.filter((item) => {
        const fieldValue = item[key as keyof T];
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        return String(fieldValue ?? "") === value;
      });
    }

    return result;
  }, [items, query, filters, searchFields, kanaFields]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  return {
    query,
    setQuery: handleSetQuery,
    filters,
    setFilter,
    page: safePage,
    setPage,
    pageSize,
    setPageSize: handleSetPageSize,
    totalItems,
    totalPages,
    pagedItems,
    resetAll,
  };
}
