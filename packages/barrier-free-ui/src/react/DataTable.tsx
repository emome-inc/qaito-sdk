"use client";

import {
  isValidElement,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { Checkbox } from "./Checkbox";

export type Column<T> = {
  key: string;
  header: ReactNode;
  /**
   * 列幅。**% 指定を推奨**（テーブルは常に全体 100%・table-fixed）。
   * 未指定の列は残り幅を等分して分け合う。px は最終手段（% と混ぜると崩れやすい）。
   */
  width?: string;
  align?: "start" | "end" | "center";
  /**
   * true で 1 行固定 + はみ出しは省略記号（…）。
   * 既定は折返し許可（overflow-wrap で単語途中の不自然な改行は防ぐ）。
   */
  nowrap?: boolean;
  /**
   * true で列を始端（左）に固定する。横に送る表（`minWidth` つき）で、どの行かを示す先頭の列（日付など）に使う。
   * **先頭の 1 列だけ**に付ける（2 列目以降の固定はしない。並べたい情報は先頭の列にまとめる）。
   */
  sticky?: boolean;
  /**
   * 見出しを 2 行にするときの上の行の名前（まとまり）。続けて同じ `group` を持つ列が 1 つのまとまりになり、
   * 上の行に名前、下の行に各列の `header` を出す。`group` の無い列は 2 行ぶんの高さの見出しになる。
   */
  group?: string;
  /** Opt-in mobile list layout: name, supplementary information, right-hand status, or hidden. */
  mobile?: "primary" | "secondary" | "trailing" | "hidden";
  render?: (row: T) => ReactNode;
};

/** 見出しの文字（ReactNode の中の文字をつなぐ）。HoverHint などで包んだ見出しでも列の名前を読み上げるため */
function headerText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(headerText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return headerText(node.props.children);
  return "";
}

/** 列幅の下限（px）。これ以下には縮められない */
const MIN_COL_W = 48;
/** キーボード（←/→）での 1 ステップ調整量（px） */
const KEY_STEP = 16;
/** 行選択チェックボックス列の key（予約） */
const SELECT_COL_KEY = "__bf_select__";

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  onRowClick,
  rowHref,
  resizable = true,
  resizePersistKey,
  selectable = false,
  selectedKeys,
  onSelectChange,
  selectAllAriaLabel = "すべての行を選択",
  rowSelectAriaLabel,
  isRowSelectable,
  density = "default",
  isRowMuted,
  isRowActive,
  rowProps,
  minWidth,
  mobile = false,
}: {
  /** Narrow screens rearrange cells into compact rows. Disabled for selectable tables. */
  mobile?: boolean;
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  caption?: string;
  /** 行クリック時のハンドラ（router.push 等）。指定すると行全体がクリック可能になる */
  onRowClick?: (row: T) => void;
  /** 行の遷移先 href（onRowClick 未指定時のフォールバック。location.assign で遷移） */
  rowHref?: (row: T) => string | undefined;
  /** 列幅のドラッグ調整（既定 true）。false で無効化 */
  resizable?: boolean;
  /** 調整した列幅を localStorage に保存するキー（画面・テーブルごとに一意にする） */
  resizePersistKey?: string;
  /** 行選択（一括操作用チェック列）を有効化する。selectedKeys / onSelectChange と併用 */
  selectable?: boolean;
  /** 選択済み行の getRowKey 値の集合（制御コンポーネント） */
  selectedKeys?: Set<string>;
  /** 選択変更時のコールバック（次の選択集合を返す） */
  onSelectChange?: (next: Set<string>) => void;
  /** ヘッダ「すべて選択」の aria-label */
  selectAllAriaLabel?: string;
  /** 各行チェックの aria-label を生成（省略時は固定文言） */
  rowSelectAriaLabel?: (row: T) => string;
  /** 選べない行（チェックを押せなくする。見出しの「すべて」も選べる行だけを数える）。省略 = すべて選べる */
  isRowSelectable?: (row: T) => boolean;
  /** 表示密度。"compact" は行高・フォント・padding を詰めた高密度台帳（admin/console 向け） */
  density?: "default" | "compact";
  /** 行を灰色に落とす（準備中・無効など「今は使われていない」行）。操作はそのまま効く */
  isRowMuted?: (row: T) => boolean;
  /**
   * いま開いている行（表で選んで、下や横にその中身を出す画面）。行に印を付けて現在地を示す。
   * 一括操作のチェック（`selectable`）とは別軸 ─ あちらは「これから何かする行」の集合。
   */
  isRowActive?: (row: T) => boolean;
  /**
   * 表の最小の幅（CSS の長さ。例 `"40rem"`）。枠がこれより狭いときは縮めずに横スクロールにする。
   * 列が多い表を狭い枠（右パネル・小窓）に出すとき、見出しが切れないように使う。未指定は従来どおり枠の幅に収める。
   */
  minWidth?: string;
  /**
   * 行（`<tr>`）に広げる追加の属性。ドラッグで運ぶ（`onPointerDown` / `style`）・受け皿にする
   * （`data-*`）など、行そのものに付けたいときに使う。`onClick` / `onKeyDown` は行クリックと
   * 衝突するので渡さない（`onRowClick` を使う）。
   */
  rowProps?: (row: T) => Omit<HTMLAttributes<HTMLTableRowElement>, "onClick" | "onKeyDown"> &
    Record<`data-${string}`, string | undefined>;
}) {
  const clickable = !!(onRowClick || rowHref);
  const tableRef = useRef<HTMLTableElement>(null);

  const rowKeys = rows.map((r, i) => getRowKey(r, i));
  const selected = selectedKeys ?? new Set<string>();
  const selectableActive = selectable && !!onSelectChange;
  const selectableKeys = isRowSelectable ? rowKeys.filter((_, i) => isRowSelectable(rows[i]!)) : rowKeys;
  const selectedCount = selectableKeys.filter((k) => selected.has(k)).length;
  const allSelected = selectableKeys.length > 0 && selectedCount === selectableKeys.length;
  const someSelected = selectedCount > 0 && !allSelected;

  function toggleAll(next: boolean) {
    if (!onSelectChange) return;
    onSelectChange(next ? new Set(selectableKeys) : new Set());
  }
  function toggleOne(key: string, next: boolean) {
    if (!onSelectChange) return;
    const ns = new Set(selected);
    if (next) ns.add(key);
    else ns.delete(key);
    onSelectChange(ns);
  }

  const selectCol: Column<T> = {
    key: SELECT_COL_KEY,
    width: "var(--bf-tap-min)",
    align: "center",
    nowrap: true,
    header: (
      <Checkbox
        ariaLabel={selectAllAriaLabel}
        checked={allSelected}
        indeterminate={someSelected}
        disabled={selectableKeys.length === 0}
        onChange={toggleAll}
      />
    ),
  };
  const cols: Column<T>[] = selectableActive ? [selectCol, ...columns] : columns;

  const [userWidths, setUserWidths] = useState<number[] | null>(() => {
    if (!resizePersistKey || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(`bf-table-w:${resizePersistKey}`);
      if (!raw) return null;
      const arr = JSON.parse(raw) as number[];
      return Array.isArray(arr) && arr.length === cols.length ? arr : null;
    } catch {
      return null;
    }
  });

  function persistWidths(next: number[] | null) {
    if (!resizePersistKey) return;
    try {
      const k = `bf-table-w:${resizePersistKey}`;
      if (next) window.localStorage.setItem(k, JSON.stringify(next));
      else window.localStorage.removeItem(k);
    } catch {
    }
  }

  /** 現在の実測列幅（未調整時は DOM から取得） */
  function currentWidths(): number[] {
    if (userWidths) return userWidths;
    const ths = tableRef.current?.querySelectorAll("thead th");
    return ths ? [...ths].map((t) => (t as HTMLElement).getBoundingClientRect().width) : [];
  }

  function applyWidth(idx: number, w: number, base?: number[]) {
    const cur = base ?? currentWidths();
    if (cur.length !== cols.length) return;
    const next = [...cur];
    next[idx] = Math.max(MIN_COL_W, w);
    setUserWidths(next);
    persistWidths(next);
  }

  function resetWidths() {
    setUserWidths(null);
    persistWidths(null);
  }

  function startResize(e: ReactPointerEvent<HTMLSpanElement>, idx: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const base = currentWidths();
    if (base.length !== cols.length) return;
    const startX = e.clientX;
    const startW = base[idx];
    const handle = e.currentTarget;
    handle.setAttribute("data-resizing", "true");

    const onMove = (ev: PointerEvent) => {
      applyWidth(idx, startW + (ev.clientX - startX), base);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      handle.removeAttribute("data-resizing");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }

  function handleResizeKey(e: KeyboardEvent<HTMLSpanElement>, idx: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    e.stopPropagation();
    const cur = currentWidths();
    if (cur.length !== cols.length) return;
    applyWidth(idx, cur[idx] + (e.key === "ArrowRight" ? KEY_STEP : -KEY_STEP), cur);
  }

  function activate(row: T) {
    if (onRowClick) {
      onRowClick(row);
      return;
    }
    const href = rowHref?.(row);
    if (href) window.location.assign(href);
  }

  function handleRowClick(e: MouseEvent<HTMLTableRowElement>, row: T) {
    if (!clickable) return;
    const target = e.target as HTMLElement;
    if (target.closest("a,button,input,select,textarea,label,[role='switch'],[role='button'],[role='checkbox'],[role='separator']")) {
      return;
    }
    activate(row);
  }

  function handleRowKey(e: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (!clickable) return;
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(row);
    }
  }

  const totalWidth = userWidths ? userWidths.reduce((a, b) => a + b, 0) : null;

  const hasGroups = cols.some((c) => c.group);
  const canResize = resizable && !hasGroups;
  const headerCell = (c: Column<T>, i: number, rowSpan?: number) => (
    <th
      key={c.key}
      scope="col"
      rowSpan={rowSpan}
      data-sticky={c.sticky || undefined}
      data-select={c.key === SELECT_COL_KEY || undefined}
    >
      {c.header}
      {canResize && c.key !== SELECT_COL_KEY && (
        <span
          className="bf-table__resize"
          role="separator"
          aria-orientation="vertical"
          aria-label={`${headerText(c.header) ? `${headerText(c.header)} ` : ""}列の幅を調整（←/→ キー、ダブルクリックで全列リセット）`}
          tabIndex={0}
          onPointerDown={(e) => startResize(e, i)}
          onKeyDown={(e) => handleResizeKey(e, i)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            resetWidths();
          }}
        />
      )}
    </th>
  );

  return (
    <div className="bf-table-wrap" data-mobile={mobile && !selectable ? "list" : undefined}>
      <table
        ref={tableRef}
        className={density === "compact" ? "bf-table bf-table--compact" : "bf-table"}
        style={
          totalWidth || minWidth
            ? { ...(totalWidth ? { width: `${totalWidth}px` } : {}), ...(minWidth ? { minWidth } : {}) }
            : undefined
        }
      >
        {caption && <caption className="bf-sr-only">{caption}</caption>}
        <colgroup>
          {cols.map((c, i) => (
            <col
              key={c.key}
              style={
                userWidths
                  ? { width: `${userWidths[i]}px` }
                  : c.width
                    ? { width: c.width }
                    : undefined
              }
            />
          ))}
        </colgroup>
        <thead>
          {hasGroups && (
            <tr>
              {cols.map((c, i) => {
                if (!c.group) return headerCell(c, i, 2);
                if (i > 0 && cols[i - 1]!.group === c.group) return null;
                let span = 1;
                while (cols[i + span]?.group === c.group) span++;
                return (
                  <th key={`group-${c.key}`} scope="colgroup" colSpan={span} data-group>
                    {c.group}
                  </th>
                );
              })}
            </tr>
          )}
          <tr>
            {}
            {cols.map((c, i) => (hasGroups && !c.group ? null : headerCell(c, i)))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              {...rowProps?.(row)}
              key={rowKeys[i]}
              data-clickable={clickable || undefined}
              data-selected={selectableActive && selected.has(rowKeys[i]) ? true : undefined}
              data-muted={isRowMuted?.(row) || undefined}
              data-active={isRowActive?.(row) || undefined}
              aria-current={isRowActive?.(row) ? "true" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={(e) => handleRowClick(e, row)}
              onKeyDown={(e) => handleRowKey(e, row)}
            >
              {cols.map((c) => (
                <td
                  key={c.key}
                  data-mobile={c.mobile ?? "secondary"}
                  data-align={c.align ?? "start"}
                  data-nowrap={c.nowrap || undefined}
                  data-sticky={c.sticky || undefined}
                  data-select={c.key === SELECT_COL_KEY || undefined}
                >
                  {c.key === SELECT_COL_KEY ? (
                    <Checkbox
                      ariaLabel={rowSelectAriaLabel ? rowSelectAriaLabel(row) : "この行を選択"}
                      checked={selected.has(rowKeys[i])}
                      disabled={isRowSelectable ? !isRowSelectable(row) : false}
                      onChange={(next) => toggleOne(rowKeys[i], next)}
                    />
                  ) : c.render ? (
                    c.render(row)
                  ) : (
                    (row as Record<string, unknown>)[c.key] as ReactNode
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
