"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { FOCUSABLE_SELECTOR, handleFullscreenDialogKey, returnFocus } from "./fullscreen-dialog-keys";

/** 中身の最大幅。md=32rem / lg=48rem（既定）/ xl=64rem / wide=72rem / full=画面いっぱい。上の帯の線・地は常に画面いっぱい */
export type FullscreenDialogWidth = "md" | "lg" | "xl" | "wide" | "full";

export function FullscreenDialog({
  open,
  title,
  onClose,
  actions,
  description,
  children,
  width = "lg",
  closeLabel = "閉じる",
  id,
  returnFocusTo,
  titleSlot,
  barAlign = "full",
}: {
  open: boolean;
  /** 上の帯の題（h2）。長いときは「…」で切る */
  title: ReactNode;
  /** 左上の ✕・Esc で呼ぶ */
  onClose: () => void;
  /** 上の帯の右に置く操作（保存・削除など）。Button の size="sm" を想定 */
  actions?: ReactNode;
  /** 題の下の 1 行（中身と一緒に流れる） */
  description?: ReactNode;
  /** 中身。枠の中でスクロールする */
  children: ReactNode;
  width?: FullscreenDialogWidth;
  /** ✕ の読み上げ名 */
  closeLabel?: string;
  /** 題の id の元。subdomain rewrite で配信する面では安定 id を渡す（useId が SSR と CSR でずれる） */
  id?: string;
  /**
   * 閉じたあとのフォーカスの戻し先（既定は開いたボタン）。開いたボタンが閉じるときにはもう無い面（小さい箱の「詳細」から
   * 開いた予定など）で渡す。閉じた直後に無ければ少し待って探し直し、最後の 1 回は `lastTry = true` で呼ぶ
   * （代わりの戻し先を返せる）。それでも無ければ開いたボタンへ戻す
   */
  returnFocusTo?: (lastTry: boolean) => HTMLElement | null;
  /**
   * 帯の真ん中に、題の代わりに見せる部品（予定の題の入力欄など）。渡すと `title` は読み上げ用に残し、見た目からは隠す
   * （題の欄を中身の一番上でなく帯に置く面。Google カレンダーの予定の詳細と同じ形）
   */
  titleSlot?: ReactNode;
  /**
   * 上の帯の中身（✕・題・操作）の並べ方。`"full"`（既定）= 画面の端から端。`"content"` = 中身と同じ最大幅（width）の中に
   * そろえる（保存を題の欄のすぐ右に置く。Google カレンダーの予定の詳細と同じ形）。帯の線と地は常に画面いっぱい
   */
  barAlign?: "full" | "content";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const autoId = useId();
  const titleId = `${id ?? autoId}-title`;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const returnFocusToRef = useRef(returnFocusTo);
  returnFocusToRef.current = returnFocusTo;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const panel = panelRef.current;
      if (!panel) return;
      const active = document.activeElement;
      const owner = active instanceof Element ? active.closest('[aria-modal="true"]') : null;
      if (owner && owner !== panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => el.checkVisibility());
      handleFullscreenDialogKey(e, { focusables, active, onClose: () => onCloseRef.current() });
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    titleRef.current?.focus();
    return () => {
      root.style.overflow = prevOverflow;
      returnFocus(returnFocusToRef.current, opener, (fn) => window.setTimeout(fn, 100));
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="bf-fsdialog"
      data-width={width}
      data-bar-align={barAlign === "content" ? "content" : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="bf-fsdialog__bar">
        <button type="button" className="bf-fsdialog__close" aria-label={closeLabel} onClick={onClose}>
          <X aria-hidden="true" />
        </button>
        <h2 ref={titleRef} id={titleId} className={titleSlot ? "bf-sr-only" : "bf-fsdialog__title"} tabIndex={-1}>
          {title}
        </h2>
        {titleSlot && <div className="bf-fsdialog__slot">{titleSlot}</div>}
        {actions && <div className="bf-fsdialog__actions">{actions}</div>}
      </div>
      <div className="bf-fsdialog__scroll">
        <div className="bf-fsdialog__content">
          {description && <p className="bf-fsdialog__desc">{description}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
