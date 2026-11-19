import type { ReactNode } from "react";

export function Progress({
  value,
  max = 100,
  label,
  animated = false,
}: {
  value: number;
  max?: number;
  label?: ReactNode;
  animated?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bf-progress">
      <div
        className="bf-progress__bar"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className={animated ? "bf-progress__fill bf-progress__fill--animated" : "bf-progress__fill"} style={{ width: `${pct}%` }} />
      </div>
      <span className="bf-progress__label">{label ?? `${Math.round(pct)}%`}</span>
    </div>
  );
}

export function Spinner({ label = "読み込み中…" }: { label?: ReactNode }) {
  return (
    <span className="bf-spinner" role="status">
      <span className="bf-spinner__ring" aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * 読み込み中の骨組みの 1 片。出来上がりの部品の箱の中に並べて、出来上がりと同じ形の骨組みを組む
 * （読み上げは並べた側の `role="status"` が告げる）。
 *
 * - `shape="line"`（既定）: 文字 1 行の帯。高さの既定は本文の文字の大きさ
 * - `shape="circle"`: 丸いアイコン。幅と高さは `height`（既定 2rem）の正円
 * - `shape="block"`: 角丸の四角の塊（写真のサムネイル・カード・カレンダーのマス）
 *
 * すぐ読み終わる面でちらつかないよう、150ms 経っても読み込み中のときだけ現れる（progress.css）。
 */
export function Skeleton({
  width,
  height,
  shape = "line",
  className,
}: {
  width?: string;
  height?: string;
  shape?: "line" | "circle" | "block";
  className?: string;
}) {
  const size = shape === "circle" ? (height ?? width ?? "2rem") : undefined;
  return (
    <span
      className={`bf-skeleton bf-skeleton--${shape}${className ? ` ${className}` : ""}`}
      style={{ display: "block", flexShrink: 0, width: size ?? width, height: size ?? height }}
      aria-hidden="true"
    />
  );
}

const SKELETON_CELL_WIDTHS = [
  ["70%", "55%", "80%", "40%"],
  ["55%", "75%", "60%", "30%"],
  ["80%", "45%", "70%", "45%"],
  ["60%", "65%", "50%", "35%"],
] as const;

export function PageSkeleton({
  rows = 6,
  label = "読み込み中…",
}: {
  /** 表の行数（見出し行を除く） */
  rows?: number;
  label?: ReactNode;
}) {
  return (
    <div className="bf-page-skeleton" role="status" aria-busy="true">
      <span className="bf-sr-only">{label}</span>
      <div className="bf-page-skeleton__head" aria-hidden="true">
        <span className="bf-skeleton bf-page-skeleton__title" />
        <span className="bf-skeleton bf-page-skeleton__desc" />
      </div>
      <div className="bf-page-skeleton__table" aria-hidden="true">
        <div className="bf-page-skeleton__row bf-page-skeleton__row--head">
          {[0, 1, 2, 3].map((c) => (
            <span key={c} className="bf-skeleton bf-page-skeleton__cell" style={{ width: "50%" }} />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="bf-page-skeleton__row">
            {SKELETON_CELL_WIDTHS[r % SKELETON_CELL_WIDTHS.length].map((w, c) => (
              <span key={c} className="bf-skeleton bf-page-skeleton__cell" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
