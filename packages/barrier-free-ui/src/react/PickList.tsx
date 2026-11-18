"use client";

import { Children, isValidElement, useState, type ReactNode } from "react";
import { SearchInput } from "./Input";
import { Tabs } from "./Tabs";

/** タブと検索を出す件数（これ以下なら 1 画面で見渡せるので出さない） */
export const PICK_FILTER_THRESHOLD = 8;

/** 行のリスト。枠は SectionCard が持つので、ここは行の間の罫だけ */
export function PickList({ children, label }: { children: ReactNode; label?: string }) {
  const rows = Children.toArray(children);
  return (
    <div className="bf-picklist" role="group" aria-label={label}>
      {rows.map((row, i) => (
        <div key={isValidElement(row) && row.key != null ? row.key : i} className="bf-picklist__item">
          {row}
        </div>
      ))}
    </div>
  );
}

/** 付け外しの 1 行。行のどこを押しても切り替わる（label で包む） */
export function PickRow({
  type = "checkbox",
  name,
  value,
  checked,
  disabled = false,
  onToggle,
  label,
  leading,
  meta,
  metaTitle,
  hint,
  ariaLabel,
}: {
  /** 複数選べるならチェック、1 つだけならラジオ */
  type?: "checkbox" | "radio";
  /** ラジオのグループ名 */
  name?: string;
  value?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
  leading?: ReactNode;
  /** 右端の補足（件数・種別・メール）。1 つだけ */
  meta?: ReactNode;
  /** 補足の内訳（ホバーで出す） */
  metaTitle?: string;
  /** 行のツールチップ（説明文など、一覧に出さない文章） */
  hint?: string | null;
  ariaLabel?: string;
}) {
  return (
    <label className="bf-pickrow" data-disabled={disabled || undefined} title={hint ?? undefined}>
      <input
        className="bf-pickrow__input"
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        aria-label={ariaLabel}
      />
      {leading != null && (
        <span className="bf-pickrow__leading" aria-hidden="true">
          {leading}
        </span>
      )}
      <span className="bf-pickrow__label">{label}</span>
      {meta != null && meta !== "" && (
        <span className="bf-pickrow__meta" title={metaTitle || undefined}>
          {meta}
        </span>
      )}
    </label>
  );
}

/**
 * 件数が多いときだけ「選択中 / すべて」のタブ + 検索で行を絞る。少なければそのまま並べる。
 * 選択中のタブには、保存済みと編集中の両方を出す（外した行がチェックの外れた状態で見えるように）。
 */
export function FilteredPicks<T extends { id: string }>({
  id,
  items,
  selectedLabel,
  isSelected,
  match,
  searchLabel,
  searchPlaceholder,
  emptySelected,
  render,
}: {
  id: string;
  items: T[];
  selectedLabel: string;
  isSelected: (item: T) => boolean;
  match: (item: T, query: string) => boolean;
  searchLabel: string;
  searchPlaceholder: string;
  emptySelected: string;
  render: (item: T) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  if (items.length <= PICK_FILTER_THRESHOLD) {
    return <PickList>{items.map(render)}</PickList>;
  }
  const selected = items.filter(isSelected);
  const q = query.trim().toLowerCase();
  const filter = (list: T[]) => (q ? list.filter((it) => match(it, q)) : list);

  return (
    <div className="bf-picks">
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchLabel}
      />
      <Tabs
        id={id}
        defaultValue={selected.length > 0 ? "selected" : "all"}
        tabs={[
          { value: "selected", label: selectedLabel, count: selected.length },
          { value: "all", label: "すべて", count: items.length },
        ]}
      >
        {(active) => {
          const base = active === "selected" ? selected : items;
          const list = filter(base);
          if (active === "selected" && base.length === 0) return <p className="bf-picks__note">{emptySelected}</p>;
          if (list.length === 0) return <p className="bf-picks__note">「{query}」に一致するものはありません。</p>;
          return <PickList>{list.map(render)}</PickList>;
        }}
      </Tabs>
    </div>
  );
}
