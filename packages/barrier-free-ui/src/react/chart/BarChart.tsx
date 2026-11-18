"use client";

import { useMemo, useState } from "react";
import type { ChartFrameProps, ChartReferenceLine, ChartRefTone } from "./chart-types";
import {
  approxTextWidth,
  defaultFormatValue,
  makeYScale,
  niceTicks,
  refToneColor,
  slotColor,
} from "./chart-utils";
import { ChartEmpty, ChartShell, useMeasuredBox, type ChartTableModel } from "./ChartFrame";

export type BarDatum = {
  label: string;
  value: number;
  /** 状態を表すバー（良い/警告/重大）。**状態を意味するときだけ**使う。系列識別には使わない */
  tone?: ChartRefTone;
};

export type BarChartProps = ChartFrameProps & {
  data: BarDatum[];
  orientation?: "horizontal" | "vertical";
  /** 順序のあるカテゴリ（段階・区分）。単一色相の濃淡で順序を色にも出す */
  ordinal?: boolean;
  referenceLines?: ChartReferenceLine[];
  formatValue?: (v: number) => string;
  /** 値の直接ラベル（既定 true。コントラスト救済チャネルでもある） */
  showValueLabels?: boolean;
  valueAxisLabel?: string;
};

const SEQ_VARS = [
  "--bf-chart-seq-2",
  "--bf-chart-seq-3",
  "--bf-chart-seq-4",
  "--bf-chart-seq-5",
  "--bf-chart-seq-6",
  "--bf-chart-seq-7",
];

export function BarChart({
  data,
  orientation = "horizontal",
  ordinal = false,
  referenceLines = [],
  formatValue = defaultFormatValue,
  showValueLabels = true,
  valueAxisLabel,
  title,
  unit,
  description,
  heightRem = 14,
  emptyMessage = "対象のデータがありません",
  showTable = true,
  loading,
  ariaSummary,
  size,
}: BarChartProps) {
  const { ref, box: measured } = useMeasuredBox<HTMLDivElement>();
  const box = size ? { w: size.width, h: size.height } : measured;
  const [active, setActive] = useState<number | null>(null);

  const table: ChartTableModel = useMemo(
    () => ({
      head: "項目",
      columns: [valueAxisLabel ?? (unit ? `値（${unit}）` : "値")],
      rows: data.map((d) => ({ key: d.label, head: d.label, cells: [formatValue(d.value)] })),
    }),
    [data, formatValue, unit, valueAxisLabel],
  );

  const barColor = (i: number, d: BarDatum): string => {
    if (d.tone) return refToneColor(d.tone);
    if (ordinal) {
      const step = data.length <= 1 ? 0 : Math.round((i / (data.length - 1)) * (SEQ_VARS.length - 1));
      return `var(${SEQ_VARS[step]})`;
    }
    return slotColor(1);
  };

  const rendered = (() => {
    if (data.length === 0) return <ChartEmpty message={emptyMessage} />;
    if (box.w <= 0 || box.h <= 0) return null;

    const values = data.map((d) => d.value);
    const includeRefs = referenceLines.map((r) => r.value);
    const scale = heightRem > 0 ? box.h / (heightRem * 16) : 1;
    const fontPx = 12 * scale;
    const padTop = 8 * scale;
    const gap = Math.max(2, 2 * scale);
    const maxBar = 24 * scale;

    if (orientation === "horizontal") {
      const labelW = Math.min(
        box.w * 0.42,
        data.reduce((m, d) => Math.max(m, approxTextWidth(d.label, fontPx)), 0) + 8 * scale,
      );
      const valueLabelW = showValueLabels
        ? Math.max(...data.map((d) => approxTextWidth(formatValue(d.value), fontPx))) + 10 * scale
        : 6 * scale;
      const plotLeft = labelW;
      const plotRight = Math.max(plotLeft + 1, box.w - valueLabelW);
      const plotTop = padTop;
      const plotBottom = box.h - padTop;
      const band = (plotBottom - plotTop) / data.length;
      const thickness = Math.min(maxBar, Math.max(4, band - gap * 2));
      const x = makeYScale(values, plotRight, plotLeft, {
        zeroBased: true,
        include: includeRefs,
      });

      return (
        <svg
          className="bf-chart__svg"
          viewBox={`0 0 ${box.w} ${box.h}`}
          width={box.w}
          height={box.h}
          role="img"
          aria-label={
            ariaSummary ??
            `${title ?? ""}の横棒グラフ。${data.map((d) => `${d.label} ${formatValue(d.value)}`).join("、")}。詳細な数値は下の表で読めます。`
          }
        >
          {}
          {referenceLines.map((r, i) => {
            const rx = x.to(r.value);
            return (
              <g key={`rl-${i}`}>
                <line
                  x1={rx}
                  y1={plotTop}
                  x2={rx}
                  y2={plotBottom}
                  stroke={refToneColor(r.tone)}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
                <text
                  className="bf-chart__reflabel"
                  x={rx}
                  y={plotTop + fontPx}
                  textAnchor="middle"
                  fill={refToneColor(r.tone)}
                >
                  {r.label}
                </text>
              </g>
            );
          })}

          {}
          <line
            x1={x.to(0)}
            y1={plotTop}
            x2={x.to(0)}
            y2={plotBottom}
            stroke="var(--bf-chart-axis)"
            strokeWidth={1}
          />

          {data.map((d, i) => {
            const cy = plotTop + band * i + band / 2;
            const x0 = x.to(0);
            const x1 = x.to(d.value);
            const left = Math.min(x0, x1);
            const w = Math.max(1, Math.abs(x1 - x0));
            return (
              <g
                key={d.label}
                className="bf-chart__mark"
                tabIndex={0}
                role="listitem"
                aria-label={`${d.label} ${formatValue(d.value)}${unit ?? ""}`}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                opacity={active == null || active === i ? 1 : 0.55}
              >
                <text
                  className="bf-chart__tick"
                  x={plotLeft - 6 * scale}
                  y={cy + fontPx * 0.35}
                  textAnchor="end"
                >
                  {d.label}
                </text>
                <rect
                  x={left}
                  y={cy - thickness / 2}
                  width={w}
                  height={thickness}
                  fill={barColor(i, d)}
                />
                {showValueLabels && (
                  <text
                    className="bf-chart__label"
                    x={Math.max(x0, x1) + 5 * scale}
                    y={cy + fontPx * 0.35}
                  >
                    {formatValue(d.value)}
                  </text>
                )}
                {}
                <rect
                  className="bf-chart__hit"
                  x={0}
                  y={plotTop + band * i}
                  width={box.w}
                  height={band}
                />
              </g>
            );
          })}
        </svg>
      );
    }

    const tickProbe = makeYScale(values, 0, 100, { zeroBased: true, include: includeRefs });
    const ticks = niceTicks(tickProbe.min, tickProbe.max, 5);
    const yLabelW =
      ticks.reduce((m, t) => Math.max(m, approxTextWidth(formatValue(t), fontPx)), 0) + 10 * scale;
    const plotLeft = yLabelW;
    const plotRight = box.w - 6 * scale;
    const axisBandH = 20 * scale;
    const plotTop = padTop + (showValueLabels ? fontPx : 0);
    const plotBottom = box.h - axisBandH;
    const y = makeYScale(values, plotTop, plotBottom, { zeroBased: true, include: includeRefs });
    const band = (plotRight - plotLeft) / data.length;
    const thickness = Math.min(maxBar, Math.max(4, band - gap * 2));

    return (
      <svg
        className="bf-chart__svg"
        viewBox={`0 0 ${box.w} ${box.h}`}
        width={box.w}
        height={box.h}
        role="img"
        aria-label={
          ariaSummary ??
          `${title ?? ""}の棒グラフ。${data.map((d) => `${d.label} ${formatValue(d.value)}`).join("、")}。詳細な数値は下の表で読めます。`
        }
      >
        {ticks.map((t) => {
          const ty = y.to(t);
          if (ty < plotTop - 1 || ty > plotBottom + 1) return null;
          return (
            <g key={`t-${t}`}>
              <line
                x1={plotLeft}
                y1={ty}
                x2={plotRight}
                y2={ty}
                stroke="var(--bf-chart-grid)"
                strokeWidth={1}
              />
              <text
                className="bf-chart__tick"
                x={plotLeft - 6 * scale}
                y={ty + fontPx * 0.35}
                textAnchor="end"
              >
                {formatValue(t)}
              </text>
            </g>
          );
        })}
        {referenceLines.map((r, i) => {
          const ry = y.to(r.value);
          return (
            <g key={`rl-${i}`}>
              <line
                x1={plotLeft}
                y1={ry}
                x2={plotRight}
                y2={ry}
                stroke={refToneColor(r.tone)}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
              <text
                className="bf-chart__reflabel"
                x={plotRight}
                y={ry - 3 * scale}
                textAnchor="end"
                fill={refToneColor(r.tone)}
              >
                {r.label}
              </text>
            </g>
          );
        })}
        <line
          x1={plotLeft}
          y1={y.to(0)}
          x2={plotRight}
          y2={y.to(0)}
          stroke="var(--bf-chart-axis)"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const cx = plotLeft + band * i + band / 2;
          const y0 = y.to(0);
          const y1 = y.to(d.value);
          return (
            <g
              key={d.label}
              className="bf-chart__mark"
              tabIndex={0}
              aria-label={`${d.label} ${formatValue(d.value)}${unit ?? ""}`}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              opacity={active == null || active === i ? 1 : 0.55}
            >
              <rect
                x={cx - thickness / 2}
                y={Math.min(y0, y1)}
                width={thickness}
                height={Math.max(1, Math.abs(y1 - y0))}
                fill={barColor(i, d)}
              />
              {showValueLabels && (
                <text
                  className="bf-chart__label"
                  x={cx}
                  y={Math.min(y0, y1) - 4 * scale}
                  textAnchor="middle"
                >
                  {formatValue(d.value)}
                </text>
              )}
              <text
                className="bf-chart__tick"
                x={cx}
                y={plotBottom + fontPx + 4 * scale}
                textAnchor="middle"
              >
                {d.label}
              </text>
              <rect
                className="bf-chart__hit"
                x={plotLeft + band * i}
                y={plotTop}
                width={band}
                height={plotBottom - plotTop}
              />
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
