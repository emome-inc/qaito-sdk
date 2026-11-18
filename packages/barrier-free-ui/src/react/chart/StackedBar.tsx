"use client";

import { useMemo, useState } from "react";
import type { ChartFrameProps } from "./chart-types";
import { approxTextWidth, slotColor } from "./chart-utils";
import {
  ChartEmpty,
  ChartShell,
  useMeasuredBox,
  type ChartTableModel,
  type LegendEntry,
} from "./ChartFrame";

export type StackSeriesDef = {
  id: string;
  label: string;
  /** 1..8。省略時は宣言順 */
  slot?: number;
};

export type StackCategory = {
  label: string;
  /** 系列 id → 値。欠けている系列は 0 ではなく「その内訳が無い」として単に描かれない */
  values: Record<string, number>;
};

export type StackedBarProps = ChartFrameProps & {
  series: StackSeriesDef[];
  categories: StackCategory[];
  /** 合計を 100% として正規化して描く（構成比モード） */
  normalize?: boolean;
  formatValue?: (v: number) => string;
};

export function StackedBar({
  series,
  categories,
  normalize = false,
  formatValue = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1)),
  title,
  unit,
  description,
  heightRem = 10,
  emptyMessage = "対象のデータがありません",
  showTable = true,
  loading,
  ariaSummary,
  size,
}: StackedBarProps) {
  const { ref, box: measured } = useMeasuredBox<HTMLDivElement>();
  const box = size ? { w: size.width, h: size.height } : measured;
  const [active, setActive] = useState<{ c: number; s: number } | null>(null);

  const slots = useMemo(
    () => series.map((s, i) => s.slot ?? i + 1),
    [series],
  );

  const totals = useMemo(
    () => categories.map((c) => series.reduce((sum, s) => sum + (c.values[s.id] ?? 0), 0)),
    [categories, series],
  );

  const table: ChartTableModel = useMemo(
    () => ({
      head: "項目",
      columns: [...series.map((s) => s.label), "合計"],
      rows: categories.map((c, ci) => ({
        key: c.label,
        head: c.label,
        cells: [
          ...series.map((s) => {
            const v = c.values[s.id];
            if (v == null) return "—";
            return normalize && totals[ci] > 0
              ? `${((v / totals[ci]) * 100).toFixed(1)}%`
              : formatValue(v);
          }),
          formatValue(totals[ci]),
        ],
      })),
    }),
    [categories, series, totals, normalize, formatValue],
  );

  const legend: LegendEntry[] = useMemo(
    () =>
      series.map((s, i) => ({
        id: s.id,
        label: s.label,
        color: slotColor(slots[i]),
        mark: "rect" as const,
      })),
    [series, slots],
  );

  const rendered = (() => {
    if (categories.length === 0 || series.length === 0)
      return <ChartEmpty message={emptyMessage} />;
    if (box.w <= 0 || box.h <= 0) return null;

    const scale = heightRem > 0 ? box.h / (heightRem * 16) : 1;
    const fontPx = 12 * scale;
    const gap = Math.max(2, 2 * scale);
    const padY = 6 * scale;
    const labelW = Math.min(
      box.w * 0.4,
      categories.reduce((m, c) => Math.max(m, approxTextWidth(c.label, fontPx)), 0) + 8 * scale,
    );
    const totalLabelW = normalize
      ? 6 * scale
      : Math.max(...totals.map((t) => approxTextWidth(formatValue(t), fontPx))) + 10 * scale;
    const plotLeft = labelW;
    const plotRight = Math.max(plotLeft + 1, box.w - totalLabelW);
    const plotW = plotRight - plotLeft;
    const band = (box.h - padY * 2) / categories.length;
    const thickness = Math.min(28 * scale, Math.max(6, band - gap * 3));
    const maxTotal = normalize ? 1 : Math.max(...totals, 1);

    return (
      <svg
        className="bf-chart__svg"
        viewBox={`0 0 ${box.w} ${box.h}`}
        width={box.w}
        height={box.h}
        role="img"
        aria-label={
          ariaSummary ??
          `${title ?? ""}の積み上げ棒グラフ。内訳: ${series.map((s) => s.label).join("・")}。詳細な数値は下の表で読めます。`
        }
      >
        {categories.map((c, ci) => {
          const total = totals[ci];
          const cy = padY + band * ci + band / 2;
          const scaleTotal = normalize ? (total > 0 ? total : 1) : maxTotal;
          let cursor = plotLeft;
          return (
            <g key={c.label}>
              <text
                className="bf-chart__tick"
                x={plotLeft - 6 * scale}
                y={cy + fontPx * 0.35}
                textAnchor="end"
              >
                {c.label}
              </text>
              {series.map((s, si) => {
                const v = c.values[s.id];
                if (v == null || v <= 0) return null;
                const w = (v / scaleTotal) * plotW;
                const x0 = cursor;
                cursor += w;
                const drawW = Math.max(1, w - gap);
                const pct = total > 0 ? (v / total) * 100 : 0;
                const labelText = normalize ? `${Math.round(pct)}%` : formatValue(v);
                const fits = approxTextWidth(labelText, fontPx) + 8 * scale < drawW;
                const isActive = active?.c === ci && active?.s === si;
                return (
                  <g
                    key={s.id}
                    className="bf-chart__mark"
                    tabIndex={0}
                    aria-label={`${c.label} ${s.label} ${formatValue(v)}${unit ?? ""}（${pct.toFixed(1)}%）`}
                    onFocus={() => setActive({ c: ci, s: si })}
                    onBlur={() => setActive(null)}
                    onPointerEnter={() => setActive({ c: ci, s: si })}
                    onPointerLeave={() => setActive(null)}
                    opacity={active == null || isActive ? 1 : 0.6}
                  >
                    <rect
                      x={x0}
                      y={cy - thickness / 2}
                      width={drawW}
                      height={thickness}
                      fill={slotColor(slots[si])}
                    />
                    {fits && (
                      <text
                        x={x0 + drawW / 2}
                        y={cy + fontPx * 0.35}
                        textAnchor="middle"
                        fontSize={fontPx}
                        fill="#ffffff"
                        fontWeight={600}
                      >
                        {labelText}
                      </text>
                    )}
                  </g>
                );
              })}
              {!normalize && (
                <text
                  className="bf-chart__label"
                  x={plotLeft + (total / maxTotal) * plotW + 5 * scale}
                  y={cy + fontPx * 0.35}
                >
                  {formatValue(total)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  })();

  return (
    <ChartShell
      title={title}
      unit={unit}
      description={description}
      loading={loading}
      legend={legend}
      table={table}
      showTable={showTable}
    >
      <div
        className="bf-chart__plot"
        ref={ref}
        style={{ ["--bf-chart-h" as string]: `${heightRem}rem` }}
      >
        {rendered}
      </div>
    </ChartShell>
  );
}
