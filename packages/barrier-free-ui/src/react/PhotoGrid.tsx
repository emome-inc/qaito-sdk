"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Spinner } from "./Progress";

export type PhotoGridItem = {
  id: string;
  /** サムネの URL */
  src: string;
  /** 代替テキスト（読み上げ・画像が読めないとき） */
  alt: string;
  /** サムネの下端に重ねる短い文字（日付など） */
  caption?: ReactNode;
  /** 選べない写真（理由は `disabledReason` で読み上げ・ツールチップに出す） */
  disabled?: boolean;
  disabledReason?: string;
};

export type PhotoGridSize = "sm" | "md" | "lg";
/** サムネの縦横比。既定は縦長（3:4） */
export type PhotoGridRatio = "portrait" | "square" | "landscape";

function ImageOffMark() {
  return (
    <svg width="1.5em" height="1.5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" />
      <line x1="13.5" y1="13.5" x2="6" y2="21" />
      <line x1="18" y1="12" x2="21" y2="15" />
      <path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" />
      <path d="M21 15V5a2 2 0 0 0-2-2H9" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 12.5 10 17.5 19 7.5" />
    </svg>
  );
}

export function PhotoGrid({
  items,
  selectedIds,
  onToggle,
  multiple = false,
  size = "md",
  ratio = "portrait",
  label,
  itemLabel,
  onReachEnd,
  loading = false,
  footer,
  disabled = false,
  unavailableLabel = "表示できません",
}: {
  items: PhotoGridItem[];
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
  /** 複数選べるか（true なら選んだ順の番号を出す） */
  multiple?: boolean;
  /** サムネの大きさ（スケールに連動したうえでの段階） */
  size?: PhotoGridSize;
  /** サムネの縦横比（既定 portrait = 3:4） */
  ratio?: PhotoGridRatio;
  /** 格子全体の読み上げ名 */
  label: string;
  /** 1 枚ごとの読み上げ名。省略時は `alt` */
  itemLabel?: (item: PhotoGridItem, selected: boolean) => string;
  /** スクロールが端に近づいたら呼ばれる（続きの読み込み） */
  onReachEnd?: () => void;
  /** 続きを読み込み中（端に読み込み表示を出す） */
  loading?: boolean;
  /** 格子の下（スクロール域の中）に置くもの。「もっと見る」ボタン等 */
  footer?: ReactNode;
  disabled?: boolean;
  /** 画像を読めなかったサムネに出す文字 */
  unavailableLabel?: string;
}) {
  const [failedSrcs, setFailedSrcs] = useState<ReadonlySet<string>>(() => new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reachEndRef = useRef(onReachEnd);
  useEffect(() => {
    reachEndRef.current = onReachEnd;
  }, [onReachEnd]);

  const hasReachEnd = onReachEnd !== undefined;
  useEffect(() => {
    if (!hasReachEnd) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) reachEndRef.current?.();
      },
      { root, rootMargin: "0px 0px 240px 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [hasReachEnd]);

  return (
    <div ref={scrollRef} className="bf-photogrid" data-size={size} data-ratio={ratio}>
      <ul className="bf-photogrid__list" aria-label={label}>
        {items.map((item) => {
          const order = selectedIds.indexOf(item.id);
          const selected = order !== -1;
          const failed = failedSrcs.has(item.src);
          const off = disabled || item.disabled || failed;
          const base = itemLabel ? itemLabel(item, selected) : item.alt;
          const reason = failed ? unavailableLabel : item.disabled ? item.disabledReason : undefined;
          const name = reason ? `${base}、${reason}` : base;
          return (
            <li key={item.id} className="bf-photogrid__item">
              <button
                type="button"
                className="bf-photogrid__tile"
                aria-pressed={selected}
                aria-label={name}
                title={reason}
                disabled={off}
                data-unavailable={failed || undefined}
                onClick={() => onToggle(item.id)}
              >
                {failed ? (
                  <span className="bf-photogrid__unavailable">
                    <ImageOffMark />
                    {unavailableLabel}
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- フレームワーク部品（Next.js 非依存）
                  <img
                    key={item.src}
                    src={item.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="bf-photogrid__img"
                    onError={() => setFailedSrcs((cur) => new Set(cur).add(item.src))}
                  />
                )}
                {item.caption != null && <span className="bf-photogrid__caption">{item.caption}</span>}
                {selected && (
                  <span className="bf-photogrid__mark" aria-hidden="true">
                    {multiple ? order + 1 : <CheckMark />}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {hasReachEnd && <div ref={sentinelRef} className="bf-photogrid__sentinel" aria-hidden="true" />}
      {loading && (
        <div className="bf-photogrid__loading">
          <Spinner />
        </div>
      )}
      {footer != null && <div className="bf-photogrid__footer">{footer}</div>}
    </div>
  );
}
