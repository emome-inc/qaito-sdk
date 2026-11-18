"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CHART_SLOT_SHAPES,
  type ChartSeries,
} from "./chart-types";
import { seriesColor, shapePath, slotShape } from "./chart-utils";

/**
 * 描画領域の実 px を測る。
 * SVG のユーザー単位 = CSS px に固定できるので、2px の線・8px のマーカー・
 * 24px のヒット領域といったマーク仕様を「実寸で」満たせる。
 * 高さは CSS 側で `--bf-chart-h * --bf-scale` なので、
 * 小/中/大の切替でも ResizeObserver が発火して全体が連動する。
 */
export function useMeasuredBox<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      setBox((prev) =>
        Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
          ? prev
          : { w: r.width, h: r.height },
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, box };
}

export type LegendEntry = {
  id: string;
  label: string;
  color: string;
  /** 線キー（折れ線）か塗り（棒・積み上げ）か */
  mark: "line" | "rect";
  shapeSlot?: number;
  ghost?: boolean;
  dashed?: boolean;
};

/**
 * 凡例。2 系列以上では必ず出す（色合わせだけに頼らせない）。
 * 1 系列のときはタイトルが系列名を兼ねるので凡例を出さない。
 */
export function ChartLegend({ entries }: { entries: LegendEntry[] }) {
  if (entries.length < 2) return null;
  return (
    <ul className="bf-chart__legend">
      {entries.map((e) => (
        <li key={e.id} className="bf-chart__legend-item">
          <svg
            className="bf-chart__legend-key"
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
          >
            {e.mark === "rect" ? (
              <rect x={3} y={5} width={14} height={10} fill={e.color} />
            ) : (
              <>
                <line
                  x1={1}
                  y1={10}
                  x2={19}
                  y2={10}
                  stroke={e.color}
                  strokeWidth={2}
                  strokeDasharray={e.dashed ? "4 3" : undefined}
                />
                {e.shapeSlot != null && (
                  <path d={shapePath(slotShape(e.shapeSlot), 10, 10, 4)} fill={e.color} />
                )}
              </>
            )}
          </svg>
          <span>
            {e.label}
            {e.ghost ? "（比較）" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export type ChartTableModel = {
  /** 先頭列の見出し（例: 日付 / 項目） */
  head: string;
  columns: string[];
  rows: { key: string; head: string; cells: string[] }[];
};

export function ChartTable({
  model,
  caption,
}: {
  model: ChartTableModel;
  caption: string;
}) {
  if (model.rows.length === 0) return null;
  return (
    <details className="bf-chart__table-details">
      <summary className="bf-chart__table-summary">数値を表で見る</summary>
      <div className="bf-chart__table-wrap">
        <table className="bf-chart__table">
          <caption className="bf-sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{model.head}</th>
              {model.columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.head}</th>
                {r.cells.map((cell, i) => (
                  <td key={`${r.key}-${model.columns[i] ?? i}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function ChartShell({
  title,
  unit,
  description,
  loading,
  legend,
  table,
  tableCaption,
  showTable = true,
  children,
}: {
  title?: string;
  unit?: string;
  description?: string;
  loading?: boolean;
  legend?: LegendEntry[];
  table?: ChartTableModel;
  tableCaption?: string;
  showTable?: boolean;
  children: ReactNode;
}) {
  return (
    <figure className="bf-chart" data-loading={loading ? "true" : undefined}>
      {(title || unit || description) && (
        <figcaption className="bf-chart__head">
          {title && <h3 className="bf-chart__title">{title}</h3>}
          {unit && <span className="bf-chart__unit">単位: {unit}</span>}
          {description && <p className="bf-chart__desc">{description}</p>}
        </figcaption>
      )}
      {legend && <ChartLegend entries={legend} />}
      {children}
      {showTable && table && (
        <ChartTable model={table} caption={tableCaption ?? title ?? "グラフの数値"} />
      )}
    </figure>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return <div className="bf-chart__empty">{message}</div>;
}

/** 凡例エントリを系列から作る（折れ線用） */
export function legendFromSeries(series: ChartSeries[], slots: number[]): LegendEntry[] {
  return series.map((s, i) => ({
    id: s.id,
    label: s.label,
    color: seriesColor(s, slots[i]),
    mark: "line" as const,
    shapeSlot: s.ghost || s.smoothed ? undefined : slots[i],
    ghost: s.ghost,
    dashed: s.smoothed,
  }));
}

export { CHART_SLOT_SHAPES };
