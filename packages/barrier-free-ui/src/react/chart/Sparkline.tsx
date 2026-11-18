"use client";

import { slotColor } from "./chart-utils";
import type { ChartRefTone } from "./chart-types";
import { refToneColor } from "./chart-utils";

export type SparklineProps = {
  /** 時系列の値。null は欠測 */
  values: (number | null)[];
  /** 直近の点を強調する（既定 true） */
  emphasizeLast?: boolean;
  /** 色スロット（1..8）。省略時は控えめなグレー（Stat の主役は数値なので） */
  slot?: number;
  /** 参照帯（普段の値の範囲など）。min/max を薄く塗る */
  band?: { from: number; to: number; tone?: ChartRefTone };
  /** 高さ（rem・--bf-scale 連動） */
  heightRem?: number;
  /** 読み上げさせたい場合のラベル。指定すると role="img" になる */
  ariaLabel?: string;
};

const VB_W = 120;
const VB_H = 32;

export function Sparkline({
  values,
  emphasizeLast = true,
  slot,
  band,
  heightRem = 2,
  ariaLabel,
}: SparklineProps) {
  const finite = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (finite.length === 0) return null;

  const pool = band ? [...finite, band.from, band.to] : finite;
  let min = Math.min(...pool);
  let max = Math.max(...pool);
  if (max - min < 1e-9) {
    const pad = Math.abs(max) > 1e-9 ? Math.abs(max) * 0.1 : 1;
    min -= pad;
    max += pad;
  }
  const pad = 3;
  const toX = (i: number) =>
    values.length <= 1 ? VB_W / 2 : (i / (values.length - 1)) * (VB_W - pad * 2) + pad;
  const toY = (v: number) => VB_H - pad - ((v - min) / (max - min)) * (VB_H - pad * 2);

  const segments: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  values.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else cur.push({ i, v });
  });
  if (cur.length) segments.push(cur);

  const color = slot != null ? slotColor(slot) : "var(--bf-chart-marker)";
  let lastIdx = -1;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] != null) {
      lastIdx = i;
      break;
    }
  }

  return (
    <svg
      className="bf-sparkline"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      style={{ ["--bf-spark-h" as string]: `${heightRem}rem` }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      focusable="false"
    >
      {band && (
        <rect
          x={0}
          y={Math.min(toY(band.from), toY(band.to))}
          width={VB_W}
          height={Math.abs(toY(band.to) - toY(band.from))}
          fill={refToneColor(band.tone)}
          opacity={0.12}
        />
      )}
      {segments.map((seg, si) => (
        <polyline
          key={si}
          points={seg.map((p) => `${toX(p.i).toFixed(2)},${toY(p.v).toFixed(2)}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {emphasizeLast && lastIdx >= 0 && (
        <circle
          cx={toX(lastIdx)}
          cy={toY(values[lastIdx] as number)}
          r={2.5}
          fill={color}
          stroke="var(--bf-chart-surface)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
