import { createElement, forwardRef, type ReactNode } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

function qaitoGlyph(displayName: string, children: (strokeWidth: number) => ReactNode[]): LucideIcon {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function QaitoGlyph(
    { size = 24, color = "currentColor", strokeWidth = 2, absoluteStrokeWidth, className, children: extra, ...rest },
    ref,
  ) {
    const sw = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth;
    return createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: sw,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: ["lucide", className].filter(Boolean).join(" "),
        ...rest,
      },
      ...children(Number(sw)),
      extra,
    );
  });
  Icon.displayName = displayName;
  return Icon as unknown as LucideIcon;
}

/** QaitoChat: 吹き出しの中に AI のきらめき（4 つの角の星） */
export const QaitoChat = qaitoGlyph("QaitoChat", () => [
  createElement("path", {
    key: "bubble",
    d: "M6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-8A2.5 2.5 0 0 1 6.5 3z",
  }),
  createElement("path", { key: "spark", d: "M12 6.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" }),
]);

/** Qaito Piazza（社内メッセージ）: 重なった 2 つの吹き出しと、手前の吹き出しの 3 つの点（みんなの会話） */
export const QaitoPiazza = qaitoGlyph("QaitoPiazza", () => [
  createElement("path", {
    key: "back",
    d: "M8 9V6.5A2.5 2.5 0 0 1 10.5 4h8A2.5 2.5 0 0 1 21 6.5v5a2.5 2.5 0 0 1-2.5 2.5H16",
  }),
  createElement("path", {
    key: "front",
    d: "M5.5 9h8A2.5 2.5 0 0 1 16 11.5v5a2.5 2.5 0 0 1-2.5 2.5H8.5L5.5 22v-3A2.5 2.5 0 0 1 3 16.5v-5A2.5 2.5 0 0 1 5.5 9z",
  }),
  createElement("path", { key: "dots", d: "M6.5 14h.01M9.5 14h.01M12.5 14h.01" }),
]);

/** E-CALL: 受話器と、右上の小さな吹き出し（受けた用件を残す） */
const HANDSET_SCALE = 0.72;

export const QaitoEecall = qaitoGlyph("QaitoEecall", (sw) => [
  createElement(
    "g",
    { key: "handset", transform: `translate(1 6) scale(${HANDSET_SCALE})`, strokeWidth: sw / HANDSET_SCALE },
    createElement("path", {
      d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
    }),
  ),
  createElement("path", {
    key: "note",
    d: "M15 2.5h5.5A1.5 1.5 0 0 1 22 4v3.5A1.5 1.5 0 0 1 20.5 9H18l-2 1.8V9h-1a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 15 2.5z",
  }),
  createElement("path", { key: "line", d: "M16 5.75h4" }),
]);

/**
 * 映像分析（Qaito Vision）: ファインダーの四隅の中に目（カメラの映像を見て文にする）。
 */
export const QaitoVision = qaitoGlyph("QaitoVision", () => [
  createElement("path", { key: "tl", d: "M3 8V5a2 2 0 0 1 2-2h3" }),
  createElement("path", { key: "tr", d: "M16 3h3a2 2 0 0 1 2 2v3" }),
  createElement("path", { key: "br", d: "M21 16v3a2 2 0 0 1-2 2h-3" }),
  createElement("path", { key: "bl", d: "M8 21H5a2 2 0 0 1-2-2v-3" }),
  createElement("path", { key: "eye", d: "M6.5 12s2-4 5.5-4 5.5 4 5.5 4-2 4-5.5 4-5.5-4-5.5-4z" }),
  createElement("circle", { key: "pupil", cx: 12, cy: 12, r: 1.5 }),
]);
