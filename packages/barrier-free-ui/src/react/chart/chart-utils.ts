
import {
  CHART_SLOT_SHAPES,
  CHART_SLOT_VARS,
  type ChartDatum,
  type ChartGranularity,
  type ChartRefTone,
  type ChartSeries,
  type ChartShape,
} from "./chart-types";

/** スロット番号（1 始まり）→ 系列色。9 以上は作らない（8 で頭打ち＝畳むべきサイン） */
export function slotColor(slot: number): string {
  const idx = Math.min(Math.max(Math.trunc(slot), 1), CHART_SLOT_VARS.length) - 1;
  return `var(${CHART_SLOT_VARS[idx]})`;
}

/** スロット番号 → マーカー形状（色に依存しない識別チャネル） */
export function slotShape(slot: number): ChartShape {
  const idx = Math.min(Math.max(Math.trunc(slot), 1), CHART_SLOT_SHAPES.length) - 1;
  return CHART_SLOT_SHAPES[idx];
}

/** 基準線・基準帯のトーン → 色（必ずラベル併記が前提） */
export function refToneColor(tone: ChartRefTone | undefined): string {
  switch (tone) {
    case "good":
      return "var(--bf-success)";
    case "warning":
      return "var(--bf-warning)";
    case "critical":
      return "var(--bf-danger)";
    default:
      return "var(--bf-chart-ref)";
  }
}

/** 系列の実効スロット（宣言順に 1 から。ghost は色を持たない） */
export function resolveSlots(series: ChartSeries[]): number[] {
  let next = 1;
  return series.map((s) => {
    if (s.slot != null) return s.slot;
    if (s.ghost) return 0;
    return next++;
  });
}

/** 系列 → 実際に描く色 */
export function seriesColor(s: ChartSeries, slot: number): string {
  if (s.ghost) return "var(--bf-chart-ghost)";
  return slotColor(slot);
}

export type LinearScale = {
  min: number;
  max: number;
  /** 値 → ピクセル座標 */
  to: (v: number) => number;
};

/**
 * Y 軸のスケールを作る。
 * - 全値が同一（range 0）でも破綻しないように最小レンジを与える
 * - `include` に基準線の値を渡すと、その線が必ず画面に入るように domain を広げる
 */
export function makeYScale(
  values: number[],
  pxTop: number,
  pxBottom: number,
  opts: {
    domain?: [number | null | undefined, number | null | undefined];
    include?: number[];
    /** 0 を必ず含める（棒グラフは真） */
    zeroBased?: boolean;
  } = {},
): LinearScale {
  const pool = [...values, ...(opts.include ?? [])].filter((v) => Number.isFinite(v));
  if (opts.zeroBased) pool.push(0);

  let min = pool.length > 0 ? Math.min(...pool) : 0;
  let max = pool.length > 0 ? Math.max(...pool) : 1;

  if (opts.domain?.[0] != null) min = opts.domain[0];
  if (opts.domain?.[1] != null) max = opts.domain[1];

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  }
  if (max - min < 1e-9) {
    const pad = Math.abs(max) > 1e-9 ? Math.abs(max) * 0.1 : 1;
    min -= pad;
    max += pad;
  } else if (opts.domain?.[0] == null && opts.domain?.[1] == null) {
    const pad = (max - min) * 0.08;
    if (!opts.zeroBased) min -= pad;
    max += pad;
    if (opts.zeroBased && min > 0) min = 0;
  }

  const span = max - min;
  const height = pxBottom - pxTop;
  return {
    min,
    max,
    to: (v: number) => pxBottom - ((v - min) / span) * height,
  };
}

/** 目盛の値を「切りの良い数」で生成する（既定 5 本） */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [min];
  const rawStep = (max - min) / Math.max(1, count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 1e-6; v += step) {
    out.push(Number(v.toFixed(10)));
  }
  return out.length > 0 ? out : [min, max];
}

/** 既定の数値書式（tabular-nums 前提。小数は最大 1 桁） */
export function defaultFormatValue(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 10000) return v.toLocaleString("ja-JP");
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(abs < 10 ? 1 : 1);
}

/**
 * X 軸ラベルの既定書式。粒度に応じて表記を変える。
 * 期間が 1 週間でも 1 年でも同じロジックで破綻しないように、
 * 「粒度で書式を決め、本数は間引きで調整する」責務分離にしている。
 */
export function defaultFormatX(x: string, granularity: ChartGranularity): string {
  if (granularity === "category") return x;
  if (granularity === "month") {
    const m = /^(\d{4})-(\d{2})$/.exec(x);
    return m ? `${Number(m[2])}月` : x;
  }
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(x);
  if (!d) return x;
  return `${Number(d[2])}/${Number(d[3])}`;
}

/**
 * X 軸ラベルの間引き。
 * 収まる本数（maxLabels）に応じて等間隔で抜く。**必ず最初と最後は残す**
 * （期間の両端が分からないグラフは読めないため）。
 */
export function thinLabels(count: number, maxLabels: number): number[] {
  if (count <= 0) return [];
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i);
  const step = Math.ceil(count / Math.max(2, maxLabels));
  const idx: number[] = [];
  for (let i = 0; i < count; i += step) idx.push(i);
  const last = count - 1;
  if (idx[idx.length - 1] !== last) {
    if (last - idx[idx.length - 1] < step / 2) idx[idx.length - 1] = last;
    else idx.push(last);
  }
  return idx;
}

/** 概算の文字幅（日本語は全角なので 1em、英数は約 0.6em） */
export function approxTextWidth(text: string, fontPx: number): number {
  let w = 0;
  for (const ch of text) w += /[ -~]/.test(ch) ? 0.6 : 1;
  return w * fontPx;
}

/** 全系列の x を昇順（文字列比較 = 日付文字列なら時系列順）で統合した X ドメイン */
export function unionXDomain(series: ChartSeries[]): string[] {
  const set = new Set<string>();
  for (const s of series) for (const d of s.data) set.add(d.x);
  return [...set].sort();
}

export function alignToDomain(series: ChartSeries, domain: string[]): (number | null)[] {
  const map = new Map<string, number | null>();
  for (const d of series.data) map.set(d.x, d.y);
  return domain.map((x) => {
    const v = map.get(x);
    return v == null || !Number.isFinite(v) ? null : v;
  });
}

/**
 * 欠測で切れた「連続区間」に分割する。
 * 折れ線は区間ごとに描画し、欠測をまたいで線を繋がない。
 */
export function splitSegments(values: (number | null)[]): { i: number; v: number }[][] {
  const segments: { i: number; v: number }[][] = [];
  let current: { i: number; v: number }[] = [];
  values.forEach((v, i) => {
    if (v == null) {
      if (current.length > 0) segments.push(current);
      current = [];
    } else {
      current.push({ i, v });
    }
  });
  if (current.length > 0) segments.push(current);
  return segments;
}

/** SVG マーカー形状のパス（中心 cx,cy・半径 r） */
export function shapePath(shape: ChartShape, cx: number, cy: number, r: number): string {
  switch (shape) {
    case "square":
      return `M${cx - r},${cy - r}H${cx + r}V${cy + r}H${cx - r}Z`;
    case "triangle":
      return `M${cx},${cy - r * 1.15}L${cx + r},${cy + r * 0.75}L${cx - r},${cy + r * 0.75}Z`;
    case "triangle-down":
      return `M${cx},${cy + r * 1.15}L${cx + r},${cy - r * 0.75}L${cx - r},${cy - r * 0.75}Z`;
    case "diamond":
      return `M${cx},${cy - r * 1.25}L${cx + r * 1.25},${cy}L${cx},${cy + r * 1.25}L${cx - r * 1.25},${cy}Z`;
    case "cross": {
      const t = r * 0.42;
      return `M${cx - t},${cy - r}H${cx + t}V${cy - t}H${cx + r}V${cy + t}H${cx + t}V${cy + r}H${cx - t}V${cy + t}H${cx - r}V${cy - t}H${cx - t}Z`;
    }
    case "hexagon": {
      const pts: string[] = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k - Math.PI / 2;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
      }
      return `M${pts.join("L")}Z`;
    }
    case "star": {
      const pts: string[] = [];
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 === 0 ? r * 1.25 : r * 0.55;
        const a = (Math.PI / 5) * k - Math.PI / 2;
        pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
      }
      return `M${pts.join("L")}Z`;
    }
    case "circle":
    default: {
      return `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
    }
  }
}

/** データ点数から自動生成する aria-label 用の要約 */
export function autoAriaSummary(
  title: string | undefined,
  series: ChartSeries[],
  domain: string[],
): string {
  const head = title ? `${title}の` : "";
  const names = series.map((s) => s.label).join("・");
  const range = domain.length > 0 ? `${domain[0]} から ${domain[domain.length - 1]} まで` : "";
  const counts = series
    .map((s) => `${s.label} ${s.data.filter((d) => d.y != null).length}件`)
    .join("、");
  return `${head}折れ線グラフ。系列: ${names}。期間: ${range}。データ: ${counts}。詳細な数値は下の表で読めます。`;
}

/** データ点の総数（0 なら空状態を出す） */
export function countPoints(series: ChartSeries[]): number {
  return series.reduce((n, s) => n + s.data.filter((d) => d.y != null).length, 0);
}

/** チャート内部レイアウト（実 px）。軸ラベル帯・レールを必ず高さに含める */
export type ChartLayout = {
  w: number;
  h: number;
  scale: number;
  fontPx: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  plotTop: number;
  plotBottom: number;
  plotLeft: number;
  plotRight: number;
  axisBandH: number;
  railTop: number;
  railRowH: number;
};

export function computeLayout(args: {
  w: number;
  h: number;
  heightRem: number;
  yTickLabels: string[];
  railRows: number;
  /** 右端に直接ラベルを置く余地 */
  rightLabelPx: number;
}): ChartLayout {
  const { w, h, heightRem, yTickLabels, railRows, rightLabelPx } = args;
  const scale = heightRem > 0 ? h / (heightRem * 16) : 1;
  const fontPx = 12 * scale;
  const axisBandH = 20 * scale;
  const railRowH = 16 * scale;
  const railH = railRows > 0 ? railRows * railRowH + 4 * scale : 0;

  const yLabelW = yTickLabels.reduce((m, t) => Math.max(m, approxTextWidth(t, fontPx)), 0);
  const padLeft = Math.min(w * 0.35, yLabelW + 10 * scale);
  const padRight = Math.max(8 * scale, Math.min(w * 0.3, rightLabelPx));
  const padTop = 10 * scale;

  return {
    w,
    h,
    scale,
    fontPx,
    padLeft,
    padRight,
    padTop,
    plotTop: padTop,
    plotBottom: Math.max(padTop + 1, h - axisBandH - railH),
    plotLeft: padLeft,
    plotRight: Math.max(padLeft + 1, w - padRight),
    axisBandH,
    railTop: h - railH,
    railRowH,
  };
}

/** 時系列の x（`YYYY-MM-DD` / `YYYY-MM`）を「読める」形にする（ツールチップ・表用） */
export function formatXLong(x: string): string {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(x);
  if (d) return `${d[1]}年${Number(d[2])}月${Number(d[3])}日`;
  const m = /^(\d{4})-(\d{2})$/.exec(x);
  if (m) return `${m[1]}年${Number(m[2])}月`;
  return x;
}

export type { ChartDatum };
