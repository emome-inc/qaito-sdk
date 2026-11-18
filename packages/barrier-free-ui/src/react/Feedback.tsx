import type { ReactNode } from "react";

export type FeedbackTone = "success" | "error" | "warning" | "info";

/** 塗りつぶしの形（トーン色）+ 中の記号（地の色）。24×24 の座標で描く */
const ICONS: Record<FeedbackTone, ReactNode> = {
  success: (
    <>
      <circle className="bf-feedback__shape" cx="12" cy="12" r="10" />
      <path className="bf-feedback__glyph" d="M7.5 12.5l3 3 6-6.5" />
    </>
  ),
  error: (
    <>
      <circle className="bf-feedback__shape" cx="12" cy="12" r="10" />
      <path className="bf-feedback__glyph" d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
    </>
  ),
  warning: (
    <>
      <path
        className="bf-feedback__shape"
        d="M10.3 3.4a2 2 0 0 1 3.4 0l8.3 14.2a2 2 0 0 1-1.7 3H3.7a2 2 0 0 1-1.7-3z"
      />
      <path className="bf-feedback__glyph" d="M12 9v4.5" />
      <circle className="bf-feedback__dot" cx="12" cy="17" r="1.25" />
    </>
  ),
  info: (
    <>
      <circle className="bf-feedback__shape" cx="12" cy="12" r="10" />
      <path className="bf-feedback__glyph" d="M12 11v5.5" />
      <circle className="bf-feedback__dot" cx="12" cy="7.75" r="1.25" />
    </>
  ),
};

/** Feedback と同じ塗りつぶしのアイコン（色はトーンの変数を受ける側が決める）。NoticeBar も使う */
export function FeedbackIcon({ tone }: { tone: FeedbackTone }) {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      {ICONS[tone]}
    </svg>
  );
}

export function Feedback({
  tone = "info",
  title,
  children,
}: {
  tone?: FeedbackTone;
  /** 太字の見出し 1 行（任意）。本文の上に出す */
  title?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="bf-feedback" data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      <span className="bf-feedback__icon" aria-hidden="true">
        <FeedbackIcon tone={tone} />
      </span>
      <div className="bf-feedback__body">
        {title && <div className="bf-feedback__title">{title}</div>}
        {children}
      </div>
    </div>
  );
}
