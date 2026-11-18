"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "./Badge";
import { BigSelect } from "./BigSelect";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { SearchInput } from "./Input";

/** 適用中の条件 1 つ（チップに出す形）。`key` は外すときの目印 */
export type ActiveFilter = { key: string; label: string; value: string };

/** 「詳細条件」の開閉ボタン。条件が 1 つでも効いていれば「適用中」を付ける。 */
export function FilterToggle({
  open,
  onToggle,
  active,
}: {
  open: boolean;
  onToggle: () => void;
  /** 詳細条件のどれかが効いているか */
  active: boolean;
}) {
  return (
    <Button type="button" variant="secondary" onClick={onToggle} aria-expanded={open}>
      {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      詳細条件
      {active && (
        <span className="bf-filter-toggle__flag">
          <Badge tone="primary">適用中</Badge>
        </span>
      )}
    </Button>
  );
}

/** 詳細条件の枠。中の条件（`FilterField`）は幅をそろえて折り返して並ぶ。 */
export function FilterPanel({ children }: { children: ReactNode }) {
  return <div className="bf-filter-panel">{children}</div>;
}

/** 条件 1 つ（小さな見出し + 選ぶ部品）。`wide` は 2 枠ぶん使う（曜日のボタン列など）。 */
export function FilterField({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`bf-filter-field${wide ? " bf-filter-field--wide" : ""}`}>
      <span className="bf-filter-field__label">{label}</span>
      {children}
    </div>
  );
}

/** 適用中の条件のチップ（× で 1 つずつ外す）。表の左上、件数の反対側に置く。 */
export function FilterChips({
  filters,
  onRemove,
}: {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
}) {
  if (filters.length === 0) return null;
  return (
    <div className="bf-filter-chips">
      <span className="bf-filter-chips__count" aria-live="polite">
        {filters.length}件の条件で絞り込み中
      </span>
      {filters.map((f) => (
        <span key={f.key} className="bf-filter-chip">
          {f.label}: {f.value}
          <button
            type="button"
            className="bf-filter-chip__remove"
            onClick={() => onRemove(f.key)}
            aria-label={`${f.label}の条件を外す`}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}

/** 件数（絞り込み後 / 母数）。母数の前に付ける語は `scopeLabel`（既定は「全」）。 */
function ListTotal({ shown, total, scopeLabel }: { shown: number; total: number; scopeLabel?: string }) {
  return (
    <p className="bf-list-total" aria-live="polite">
      <span className="bf-list-total__shown">{shown}件</span> / {scopeLabel ?? "全"}
      {total}件
    </p>
  );
}

/** 表の上の行: 左に適用中の条件、右に件数（絞り込み後 / 母数）。 */
export function ListCountRow({
  filters,
  onRemove,
  shown,
  total,
  scopeLabel,
}: {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  shown: number;
  total: number;
  /** 母数の前に付ける語（例「さくら事業所の」）。未指定は「全」 */
  scopeLabel?: string;
}) {
  return (
    <div className="bf-list-count-row">
      <FilterChips filters={filters} onRemove={onRemove} />
      <ListTotal shown={shown} total={total} scopeLabel={scopeLabel} />
    </div>
  );
}

/**
 * 一覧の 1 行目: 左に検索、右に「詳細条件」「条件をクリア」。
 *
 * 検索語以外の条件は全部「詳細条件」の中（`FilterPanel`）に置く形の一覧が使う。
 */
export function ListToolbar({
  query,
  onQueryChange,
  placeholder,
  ariaLabel,
  advancedOpen,
  onAdvancedToggle,
  advancedActive,
  canClear,
  onClear,
  mobileCompact = false,
  activeFilterCount = 0,
  filters,
}: {
  /** Supply filters here to share the desktop panel and mobile sheet. */
  filters?: ReactNode;
  mobileCompact?: boolean;
  activeFilterCount?: number;
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  advancedOpen: boolean;
  onAdvancedToggle: () => void;
  /** 詳細条件のどれかが効いているか（ボタンに「適用中」を付ける） */
  advancedActive: boolean;
  /** 検索語か条件のどれかが入っているか（「条件をクリア」を押せるか） */
  canClear: boolean;
  onClear: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
    <div className="bf-list-toolbar" data-mobile-compact={mobileCompact || undefined}>
      <div className="bf-list-toolbar__search">
        <SearchInput
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      </div>
      {mobileCompact && <Button variant="secondary" className="bf-list-toolbar__mobile-toggle" aria-label={`絞り込み${activeFilterCount ? `（${activeFilterCount}件適用中）` : ""}`} aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
        <SlidersHorizontal size={18} aria-hidden="true" />
        {activeFilterCount > 0 && <Badge tone="primary">{activeFilterCount}</Badge>}
      </Button>}
      <div className="bf-list-toolbar__tools">
        <FilterToggle open={advancedOpen} onToggle={onAdvancedToggle} active={advancedActive} />
        <Button type="button" variant="secondary" disabled={!canClear} onClick={onClear}>
          <X size={16} aria-hidden="true" />
          条件をクリア
        </Button>
      </div>
    </div>
    {filters && advancedOpen && !(mobileCompact && mobileOpen) && <div className={mobileCompact ? "bf-list-toolbar__desktop-panel" : undefined}><FilterPanel>{filters}</FilterPanel></div>}
    {mobileCompact && <Dialog open={mobileOpen} placement="bottom" title="絞り込み" onClose={() => setMobileOpen(false)} body={<FilterPanel>{filters}</FilterPanel>}>
      <Button variant="secondary" disabled={!canClear} onClick={onClear}>条件をクリア</Button>
      <Button onClick={() => setMobileOpen(false)}>閉じる</Button>
    </Dialog>}
    </>
  );
}

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 件" },
  { value: "20", label: "20 件" },
  { value: "50", label: "50 件" },
];

/**
 * 表のすぐ上の行: 左に一括操作など（任意）、右に件数（絞り込み後 / 全件）と表示件数。
 * ページ送りをしない一覧は `pageSize` を渡さなければ件数だけを出す。
 */
export function ListResultRow({
  children,
  shown,
  total,
  pageSize,
  onPageSizeChange,
}: {
  /** 左に置くもの（一括操作のボタン・結果の Feedback など） */
  children?: ReactNode;
  shown: number;
  total: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}) {
  return (
    <div className="bf-list-result-row">
      {children}
      <div className="bf-list-result-row__tools">
        <ListTotal shown={shown} total={total} />
        {pageSize !== undefined && onPageSizeChange && (
          <BigSelect
            value={String(pageSize)}
            onChange={(v) => onPageSizeChange(Number(v))}
            ariaLabel="表示件数"
            options={PAGE_SIZE_OPTIONS}
          />
        )}
      </div>
    </div>
  );
}

/** Shared compact filter sheet for list shells with a custom search control. */
export function MobileFilters({ children, activeFilterCount = 0, onClear, canClear = true }: {
  children: ReactNode;
  activeFilterCount?: number;
  onClear?: () => void;
  canClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="secondary" aria-label={`絞り込み${activeFilterCount ? `（${activeFilterCount}件適用中）` : ""}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <SlidersHorizontal size={18} aria-hidden="true" />
      {activeFilterCount > 0 && <Badge tone="primary">{activeFilterCount}</Badge>}
    </Button>
    <Dialog open={open} placement="bottom" title="絞り込み" onClose={() => setOpen(false)} body={<FilterPanel>{children}</FilterPanel>}>
      {onClear && <Button variant="secondary" disabled={!canClear} onClick={onClear}>条件をクリア</Button>}
      <Button onClick={() => setOpen(false)}>閉じる</Button>
    </Dialog>
  </>;
}
