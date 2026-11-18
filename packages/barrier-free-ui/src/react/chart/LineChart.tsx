"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import {
  type ChartBand,
  type ChartFrameProps,
  type ChartGranularity,
  type ChartMarker,
  type ChartReferenceBand,
  type ChartReferenceLine,
  type ChartSeries,
} from "./chart-types";
import {
  alignToDomain,
  approxTextWidth,
  autoAriaSummary,
  computeLayout,
  countPoints,
  defaultFormatValue,
  defaultFormatX,
  formatXLong,
  makeYScale,
  niceTicks,
  refToneColor,
  resolveSlots,
  seriesColor,
  shapePath,
  slotShape,
  splitSegments,
  thinLabels,
  unionXDomain,
} from "./chart-utils";
import {
  ChartEmpty,
  ChartShell,
  legendFromSeries,
  useMeasuredBox,
  type ChartTableModel,
} from "./ChartFrame";

export type LineChartProps = ChartFrameProps & {
  series: ChartSeries[];
  /** X ドメイン（時系列の日付列）。省略時は series の x の和集合を昇順に使う */
  xDomain?: string[];
  granularity?: ChartGranularity;
  referenceLines?: ChartReferenceLine[];
  referenceBands?: ChartReferenceBand[];
  /** 制度上の節目（縦線） */
  markers?: ChartMarker[];
  /** 期間帯（プロット下のタイムラインレールに描く） */
  bands?: ChartBand[];
  /** Y 軸の固定ドメイン（null は自動） */
  yDomain?: [number | null, number | null];
  formatValue?: (v: number) => string;
  formatX?: (x: string) => string;
  /** 値に注目する理由。指定した点だけ印と数値を重ねる（既定は強調なし）。 */
  highlightPoint?: (seriesId: string, value: number) => string | null;
};

export function LineChart({
  series,
  xDomain,
  granularity = "day",
  referenceLines = [],
  referenceBands = [],
  markers = [],
  bands = [],
  yDomain,
  formatValue = defaultFormatValue,
  formatX,
  highlightPoint,
  title,
  unit,
  description,
  heightRem = 14,
  emptyMessage = "この期間の記録がありません",
  showTable = true,
  loading,
  ariaSummary,
  size,
}: LineChartProps) {
  const { ref, box: measured } = useMeasuredBox<HTMLDivElement>();
  const box = size ? { w: size.width, h: size.height } : measured;
  const [active, setActive] = useState<number | null>(null);

  const domain = useMemo(() => xDomain ?? unionXDomain(series), [xDomain, series]);
  const slots = useMemo(() => resolveSlots(series), [series]);
  const aligned = useMemo(
    () => series.map((s) => alignToDomain(s, domain)),
    [series, domain],
  );

  const fmtX = formatX ?? ((x: string) => defaultFormatX(x, granularity));
  const hasData = countPoints(series) > 0 && domain.length > 0;

  const table: ChartTableModel = useMemo(
    () => ({
      head: granularity === "category" ? "項目" : "日付",
      columns: series.map((s) => `${s.label}${s.unit ?? unit ? `（${s.unit ?? unit}）` : ""}`),
      rows: domain.map((x, i) => ({
        key: x,
        head: granularity === "category" ? x : formatXLong(x),
        cells: aligned.map((vals) => (vals[i] == null ? "—" : formatValue(vals[i] as number))),
      })),
    }),
    [domain, series, aligned, formatValue, unit, granularity],
  );

  const legend = useMemo(() => legendFromSeries(series, slots), [series, slots]);

  const rendered = (() => {
    if (!hasData) return <ChartEmpty message={emptyMessage} />;
    if (box.w <= 0 || box.h <= 0) return null;

    const allValues = aligned.flat().filter((v): v is number => v != null);
    const includeRefs = [
      ...referenceLines.map((r) => r.value),
      ...referenceBands.flatMap((b) => [b.from, b.to]),
    ];

    const probe = makeYScale(allValues, 0, 100, { domain: yDomain, include: includeRefs });
    const ticks = niceTicks(probe.min, probe.max, 5);
    const tickLabels = ticks.map(formatValue);

    const directLabelSeries = series
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => !s.ghost && !s.smoothed);
    const wantDirectLabels = directLabelSeries.length > 0 && directLabelSeries.length <= 4;
    const rightLabelPx = wantDirectLabels
      ? Math.max(
          ...directLabelSeries.map(({ s }) => approxTextWidth(s.label, 12) + 14),
          24,
        )
      : 8;

    const railRows = (bands.length > 0 ? 1 : 0) + (markers.length > 0 ? 1 : 0);
    const L = computeLayout({
      w: box.w,
      h: box.h,
      heightRem,
      yTickLabels: tickLabels,
      railRows,
      rightLabelPx,
    });

    const y = makeYScale(allValues, L.plotTop, L.plotBottom, {
      domain: yDomain,
      include: includeRefs,
    });
    const plotW = L.plotRight - L.plotLeft;
    const n = domain.length;
    const xAt = (i: number) => (n <= 1 ? L.plotLeft + plotW / 2 : L.plotLeft + (i / (n - 1)) * plotW);

    const labelW =
      Math.max(0, ...domain.map((d) => approxTextWidth(fmtX(d), L.fontPx))) + 10 * L.scale;
    const maxLabels = Math.max(2, Math.floor(plotW / Math.max(1, labelW)));
    const xLabelIdx = thinLabels(n, maxLabels).filter(
      (i, k, all) =>
        all.length <= 2 ||
        !(
          (k === 1 && all[0] === 0 && xAt(i) - xAt(0) < labelW * 1.5) ||
          (k === all.length - 2 && all[all.length - 1] === n - 1 && xAt(n - 1) - xAt(i) < labelW * 1.5)
        ),
    );

    const markerX = (x: string) => {
      const i = domain.indexOf(x);
      return i >= 0 ? xAt(i) : null;
    };
    /** ドメイン外の日付も含めて位置を求める（帯の端が期間外にはみ出す場合に使う） */
    const clampedX = (x: string) => {
      const i = domain.findIndex((d) => d >= x);
      if (i < 0) return L.plotRight;
      if (i === 0) return L.plotLeft;
      return xAt(i);
    };

    const rMarker = Math.max(4, 4 * L.scale);
    const activeIdx = active != null && active >= 0 && active < n ? active : null;

    const tooltipRows =
      activeIdx == null
        ? []
        : series
            .map((s, si) => ({ s, si, v: aligned[si][activeIdx] }))
            .filter((r) => r.v != null);

    const tooltipLeft = activeIdx == null ? 0 : xAt(activeIdx);
    const tooltipOnRight = tooltipLeft < box.w / 2;

    return (
      <>
        <svg
          className="bf-chart__svg"
          viewBox={`0 0 ${box.w} ${box.h}`}
          width={box.w}
          height={box.h}
          role="img"
          aria-label={ariaSummary ?? autoAriaSummary(title, series, domain)}
          tabIndex={0}
          onKeyDown={(e: KeyboardEvent<SVGSVGElement>) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              setActive((prev) => {
                const base = prev == null ? (e.key === "ArrowRight" ? -1 : n) : prev;
                const next = base + (e.key === "ArrowRight" ? 1 : -1);
                return Math.min(n - 1, Math.max(0, next));
              });
            } else if (e.key === "Home") {
              e.preventDefault();
              setActive(0);
            } else if (e.key === "End") {
              e.preventDefault();
              setActive(n - 1);
            } else if (e.key === "Escape") {
              setActive(null);
            }
          }}
          onBlur={() => setActive(null)}
        >
          {}
          {referenceBands.map((b, i) => {
            const top = y.to(Math.max(b.from, b.to));
            const bottom = y.to(Math.min(b.from, b.to));
            return (
              <g key={`refband-${i}`}>
                <rect
                  x={L.plotLeft}
                  y={Math.min(top, bottom)}
                  width={plotW}
                  height={Math.abs(bottom - top)}
                  fill={refToneColor(b.tone)}
                  opacity={0.08}
                />
                <text
                  className="bf-chart__reflabel"
                  x={L.plotLeft + 4 * L.scale}
                  y={Math.min(top, bottom) + L.fontPx + 2}
                >
                  {b.label}
                </text>
              </g>
            );
          })}

          {}
          {ticks.map((t) => {
            const ty = y.to(t);
            if (ty < L.plotTop - 1 || ty > L.plotBottom + 1) return null;
            return (
              <g key={`tick-${t}`}>
                <line
                  x1={L.plotLeft}
                  y1={ty}
                  x2={L.plotRight}
                  y2={ty}
                  stroke="var(--bf-chart-grid)"
                  strokeWidth={1}
                />
                <text
                  className="bf-chart__tick"
                  x={L.plotLeft - 6 * L.scale}
                  y={ty + L.fontPx * 0.35}
                  textAnchor="end"
                >
                  {formatValue(t)}
                </text>
              </g>
            );
          })}

          {}
          {referenceLines.map((r, i) => {
            const ry = y.to(r.value);
            if (ry < L.plotTop - 1 || ry > L.plotBottom + 1) return null;
            const color = refToneColor(r.tone);
            return (
              <g key={`refline-${i}`}>
                <line
                  x1={L.plotLeft}
                  y1={ry}
                  x2={L.plotRight}
                  y2={ry}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                />
                <text
                  className="bf-chart__reflabel"
                  x={L.plotRight}
                  y={ry - 4 * L.scale}
                  textAnchor="end"
                  fill={color}
                >
                  {r.label}
                </text>
              </g>
            );
          })}

          {}
          {markers.map((m, i) => {
            const mx = markerX(m.x);
            if (mx == null) return null;
            return (
              <line
                key={`marker-${i}`}
                x1={mx}
                y1={L.plotTop}
                x2={mx}
                y2={L.plotBottom}
                stroke="var(--bf-chart-marker)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            );
          })}

          {}
          <line
            x1={L.plotLeft}
            y1={L.plotBottom}
            x2={L.plotRight}
            y2={L.plotBottom}
            stroke="var(--bf-chart-axis)"
            strokeWidth={1}
          />

          {}
          {[...series.map((s, i) => ({ s, i })).filter((e) => e.s.ghost),
            ...series.map((s, i) => ({ s, i })).filter((e) => !e.s.ghost)].map(({ s, i }) => {
            const color = seriesColor(s, slots[i]);
            const segments = splitSegments(aligned[i]);
            const shape = slotShape(slots[i]);
            const showMarks = !s.ghost && !s.smoothed && n <= 60;
            return (
              <g key={s.id} className="bf-chart__mark" opacity={s.ghost ? 0.75 : 1}>
                {}
                {segments
                  .filter((seg) => seg.length >= 2)
                  .map((seg, si) => (
                    <polyline
                      key={`${s.id}-seg-${si}`}
                      points={seg
                        .map((p) => `${xAt(p.i).toFixed(2)},${y.to(p.v).toFixed(2)}`)
                        .join(" ")}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={s.smoothed ? "6 4" : s.ghost ? "2 3" : undefined}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ))}
                {}
                {segments
                  .flatMap((seg) => (showMarks || seg.length === 1 ? seg : []))
                  .map((p) => (
                    <path
                      key={`${s.id}-pt-${p.i}`}
                      d={shapePath(shape, xAt(p.i), y.to(p.v), rMarker)}
                      fill={color}
                      stroke="var(--bf-chart-surface)"
                      strokeWidth={2}
                    />
                  ))}
              </g>
            );
          })}

          {highlightPoint && series.flatMap((s, si) => aligned[si].flatMap((v, i) => {
            if (v == null) return [];
            const label = highlightPoint(s.id, v);
            if (!label) return [];
            return [<g key={`highlight-${s.id}-${i}`} className="bf-chart__highlight" aria-label={`${s.label} ${domain[i]} ${formatValue(v)} ${label}`}>
              <circle cx={xAt(i)} cy={y.to(v)} r={rMarker + 1} fill="var(--bf-danger)" stroke="var(--bf-chart-surface)" strokeWidth={2} />
              <text x={xAt(i)} y={y.to(v) - rMarker - 5} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fill="var(--bf-danger)" fontSize={L.fontPx}>{formatValue(v)}</text>
            </g>];
          }))}

          {}
          {wantDirectLabels &&
            (() => {
              const ends = directLabelSeries
                .map(({ s, i }) => {
                  const vals = aligned[i];
                  for (let k = vals.length - 1; k >= 0; k--) {
                    if (vals[k] != null) return { s, i, k, v: vals[k] as number };
                  }
                  return null;
                })
                .filter((e): e is { s: ChartSeries; i: number; k: number; v: number } => e != null);
              const ys = ends.map((e) => y.to(e.v)).sort((a, b) => a - b);
              const collides = ys.some((v, idx) => idx > 0 && v - ys[idx - 1] < L.fontPx * 1.2);
              if (collides) return null;
              return ends.map((e) => (
                <text
                  key={`dl-${e.s.id}`}
                  className="bf-chart__label"
                  x={xAt(e.k) + rMarker + 4 * L.scale}
                  y={y.to(e.v) + L.fontPx * 0.35}
                >
                  {formatValue(e.v)}
                </text>
              ));
            })()}

          {}
          {xLabelIdx.map((i) => (
            <text
              key={`xl-${domain[i]}`}
              className="bf-chart__tick"
              x={xAt(i)}
              y={L.plotBottom + L.fontPx + 4 * L.scale}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            >
              {fmtX(domain[i])}
            </text>
          ))}

          {}
          {bands.length > 0 && (
            <g>
              {bands.map((b, i) => {
                const x1 = clampedX(b.from);
                const x2 = clampedX(b.to);
                return (
                  <g key={`band-${i}`}>
                    <rect
                      x={Math.min(x1, x2)}
                      y={L.railTop + 2 * L.scale}
                      width={Math.max(2, Math.abs(x2 - x1))}
                      height={L.railRowH - 6 * L.scale}
                      fill="var(--bf-chart-band)"
                    />
                    <text
                      className="bf-chart__markerlabel"
                      x={Math.min(x1, x2) + 4 * L.scale}
                      y={L.railTop + L.railRowH * 0.5 + L.fontPx * 0.32}
                    >
                      {b.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
          {markers.length > 0 && (
            <g>
              {markers.map((m, i) => {
                const mx = markerX(m.x);
                if (mx == null) return null;
                const rowY = L.railTop + (bands.length > 0 ? L.railRowH : 0);
                return (
                  <g key={`mk-${i}`}>
                    <path
                      d={`M${mx},${rowY + 2 * L.scale}l${3 * L.scale},${5 * L.scale}l${-6 * L.scale},0Z`}
                      fill="var(--bf-chart-marker)"
                    />
                    <text
                      className="bf-chart__markerlabel"
                      x={mx + 5 * L.scale}
                      y={rowY + L.fontPx + 2 * L.scale}
                    >
                      {m.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {}
          {activeIdx != null && (
            <g pointerEvents="none">
              <line
                x1={xAt(activeIdx)}
                y1={L.plotTop}
                x2={xAt(activeIdx)}
                y2={L.plotBottom}
                stroke="var(--bf-chart-ink)"
                strokeWidth={1}
                opacity={0.4}
              />
              {series.map((s, si) => {
                const v = aligned[si][activeIdx];
                if (v == null) return null;
                return (
                  <path
                    key={`ac-${s.id}`}
                    d={shapePath(slotShape(slots[si]), xAt(activeIdx), y.to(v), rMarker + 1.5)}
                    fill={seriesColor(s, slots[si])}
                    stroke="var(--bf-chart-surface)"
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          )}

          {}
          <rect
            className="bf-chart__hit"
            x={L.plotLeft}
            y={L.plotTop}
            width={plotW}
            height={L.plotBottom - L.plotTop}
            onPointerMove={(e) => {
              const rect = (e.currentTarget.ownerSVGElement ?? e.currentTarget).getBoundingClientRect();
              const px = e.clientX - rect.left;
              const i =
                n <= 1 ? 0 : Math.round(((px - L.plotLeft) / Math.max(1, plotW)) * (n - 1));
              setActive(Math.min(n - 1, Math.max(0, i)));
            }}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {activeIdx != null && tooltipRows.length > 0 && (
          <div
            className="bf-chart__tooltip"
            style={{
              left: tooltipOnRight ? tooltipLeft + 12 : undefined,
              right: tooltipOnRight ? undefined : box.w - tooltipLeft + 12,
              top: 4,
            }}
            role="status"
          >
            <span className="bf-chart__tooltip-x">
              {granularity === "category" ? domain[activeIdx] : formatXLong(domain[activeIdx])}
            </span>
            {tooltipRows.map(({ s, si, v }) => (
              <span key={s.id} className="bf-chart__tooltip-row">
                <span
                  className="bf-chart__tooltip-key"
                  style={{ background: seriesColor(s, slots[si]) }}
                  aria-hidden="true"
                />
                <span className="bf-chart__tooltip-value">
                  {formatValue(v as number)}
                  {s.unit ?? unit ?? ""}
                </span>
                <span className="bf-chart__tooltip-name">{s.label}</span>
              </span>
            ))}
          </div>
        )}
      </>
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
