"use client";

import { useEffect } from "react";

/** 吹き出しを持つ対象。吹き出しは必ずこの直下の子に置く（部品側の約束） */
const HOST_SELECTOR = ".bf-tooltip, .bf-hoverhint, .bf-tile, .bf-flow-node__main, .bf-flow-child";
const BUBBLE_SELECTOR = ".bf-tooltip__bubble, .bf-hoverhint__bubble, .bf-flow-hint";
/** 画面の端から最低限空ける距離（px） */
export const BUBBLE_EDGE_MARGIN = 8;

export type BubbleSide = "top" | "bottom";

export type BubbleRect = { top: number; bottom: number; left: number; right: number };

/**
 * 吹き出しの出し方を決める（DOM に触れない純粋な計算）。
 *
 * - `bubble` は**補正前**（中央・本来の側）の位置
 * - `bounds` は吹き出しが見える範囲（既定は画面全体）。スクロールする入れ物の中では、その入れ物と
 *   画面の重なり（入れ物の外は切れて見えない）
 * - `side` は本来の側、`shift` は横にずらす量（px・右が正）
 */
export function computeBubblePlacement(input: {
  bubble: BubbleRect;
  host: BubbleRect;
  viewport: { width: number; height: number };
  bounds?: BubbleRect;
  nativeSide: BubbleSide;
  margin?: number;
}): { side: BubbleSide; shift: number } {
  const { bubble, host, viewport, nativeSide } = input;
  const area = input.bounds ?? { top: 0, left: 0, right: viewport.width, bottom: viewport.height };
  const m = input.margin ?? BUBBLE_EDGE_MARGIN;
  const height = bubble.bottom - bubble.top;
  const width = bubble.right - bubble.left;

  let side = nativeSide;
  const gapTop = host.top - bubble.bottom;
  const gapBottom = bubble.top - host.bottom;
  if (nativeSide === "top" && bubble.top < area.top + m) {
    const gap = gapTop > 0 ? gapTop : 0;
    if (host.bottom + gap + height <= area.bottom - m) side = "bottom";
  } else if (nativeSide === "bottom" && bubble.bottom > area.bottom - m) {
    const gap = gapBottom > 0 ? gapBottom : 0;
    if (host.top - gap - height >= area.top + m) side = "top";
  }

  let shift = 0;
  if (width > area.right - area.left - 2 * m) shift = area.left + m - bubble.left;
  else if (bubble.left < area.left + m) shift = area.left + m - bubble.left;
  else if (bubble.right > area.right - m) shift = area.right - m - bubble.right;

  return { side, shift: Math.round(shift) };
}

/** 対象の直下にある吹き出しを探す（入れ子の対象の吹き出しを拾わない） */
function bubbleOf(host: Element): HTMLElement | null {
  for (const child of Array.from(host.children)) {
    if (child instanceof HTMLElement && child.matches(BUBBLE_SELECTOR)) return child;
  }
  return null;
}

function toRect(r: DOMRect): BubbleRect {
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
}

function visibleArea(host: Element, viewport: { width: number; height: number }): BubbleRect {
  const area: BubbleRect = { top: 0, left: 0, right: viewport.width, bottom: viewport.height };
  for (let el = host.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const cs = getComputedStyle(el);
    if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
    const r = el.getBoundingClientRect();
    area.top = Math.max(area.top, r.top);
    area.left = Math.max(area.left, r.left);
    area.right = Math.min(area.right, r.right);
    area.bottom = Math.min(area.bottom, r.bottom);
  }
  return area;
}

/** 1 つの対象について補正を当てる。前回の補正を外してから測る（測り直しで累積させない） */
export function placeBubble(host: Element): void {
  const bubble = bubbleOf(host);
  if (!bubble || host.closest(".bf-sidebar__item")) return;

  bubble.style.removeProperty("--bf-bubble-shift");
  bubble.removeAttribute("data-bf-side");

  const h = host.getBoundingClientRect();
  const fixed = getComputedStyle(bubble).position === "fixed";
  if (fixed) {
    bubble.style.setProperty("--bf-bubble-host-x", `${h.left + h.width / 2}px`);
    bubble.style.setProperty("--bf-bubble-host-top", `${h.top}px`);
    bubble.style.setProperty("--bf-bubble-host-bottom", `${h.bottom}px`);
  }
  const b = bubble.getBoundingClientRect();
  if (b.width === 0 && b.height === 0) return;
  const nativeSide: BubbleSide = b.top < h.top ? "top" : "bottom";
  const viewport = {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };

  const bounds = fixed ? undefined : visibleArea(host, viewport);
  const first = computeBubblePlacement({ bubble: toRect(b), host: toRect(h), viewport, bounds, nativeSide });
  if (first.side !== nativeSide) {
    bubble.setAttribute("data-bf-side", first.side);
  }
  const after = first.side !== nativeSide ? toRect(bubble.getBoundingClientRect()) : toRect(b);
  const { shift } = computeBubblePlacement({ bubble: after, host: toRect(h), viewport, bounds, nativeSide: first.side });
  if (shift !== 0) bubble.style.setProperty("--bf-bubble-shift", `${shift}px`);
}

function onEnter(e: Event): void {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const host = target.closest(HOST_SELECTOR);
  if (host) placeBubble(host);
}

/** 出ている吹き出し（ホバー中・フォーカス中の対象）だけ位置を合わせ直す。スクロール 1 回につき 1 フレーム */
let scrollFrame = 0;
function onScroll(): void {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    for (const host of Array.from(document.querySelectorAll(HOST_SELECTOR))) {
      if (host.matches(":hover, :focus-within")) placeBubble(host);
    }
  });
}

let installed = 0;

/**
 * 吹き出しの位置合わせを document に 1 つだけ入れる。何度呼んでも 1 つ（参照カウント）。
 * SizeProvider が呼ぶので、通常の面では呼ばなくてよい。
 */
export function useBubblePlacement(): void {
  useEffect(() => {
    if (installed++ === 0) {
      document.addEventListener("pointerover", onEnter, { passive: true });
      document.addEventListener("focusin", onEnter);
      document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    }
    return () => {
      if (--installed === 0) {
        document.removeEventListener("pointerover", onEnter);
        document.removeEventListener("focusin", onEnter);
        document.removeEventListener("scroll", onScroll, { capture: true });
      }
    };
  }, []);
}
