"use client";

/**
 * MenuButton — 押すと項目が出る小さなメニュー（「新規」等）。
 *
 * 【なぜ部品にするか】面ごとにポップアップを書くと、外側クリックで閉じる・Escape で閉じる・
 * `aria-haspopup` / `role="menu"` の付け方が面の数だけ割れる。丸メニュー（`AvatarMenu`）と
 * サイドバーの足元（`SidebarUser`）は既にこの形を持っているので、**押す相手がボタンの版**を
 * 同じ作法で用意する（`qaito-ui-patterns.md`「共通コンポーネント再実装禁止」）。
 *
 * 見た目は `bf-menuitem`（丸メニューと同じ項目）とパネルの意匠を共有する。
 * 項目は**押すもの**だけ（リンクが要るなら `AvatarMenu` と同じく href を足せるが、
 * いまの用途＝ダイアログを開く、では要らないので持たせない ── 使うときに足す）。
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

export type MenuButtonItem = {
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  /** 上に区切り線を引く */
  separatorBefore?: boolean;
  disabled?: boolean;
  /** 消す等の取り返しのつかない操作（赤字。区切り線の下に置く） */
  danger?: boolean;
};

export function MenuButton({
  label,
  icon,
  items,
  variant = "primary",
  size,
  menuAriaLabel,
  block = false,
  iconOnly = false,
  ariaLabel,
  align = "start",
  triggerClassName,
  count,
}: {
  label: ReactNode;
  icon?: ReactNode;
  items: MenuButtonItem[];
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** メニューの読み上げ名（既定はボタンの文字） */
  menuAriaLabel?: string;
  /** 親の幅いっぱいに広げる（柱の中に置くとき） */
  block?: boolean;
  /**
   * 文字を出さず `label` をアイコンとして描く（表やカードの「その他の操作」＝縦の 3 点）。
   * このときは `ariaLabel` が読み上げ名になる（アイコンだけでは名前が無い）。
   */
  iconOnly?: boolean;
  /** 押す相手の読み上げ名（`iconOnly` のとき必須） */
  ariaLabel?: string;
  /** パネルをボタンのどちら端に合わせるか。行の右端に置くときは `end`（右に溢れない） */
  align?: "start" | "end";
  /** `iconOnly` の押す面に足すクラス（写真の右上に重ねる台 `bf-mediacard__corner-btn` 等） */
  triggerClassName?: string;
  /**
   * 押す相手の右上に重ねる件数（通知のベル = 対応待ちの件数）。0・未指定は出さない。
   * 数字は飾りなので読み上げない ── 件数は `ariaLabel` に入れる（例「対応待ち 3件」）
   */
  count?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const countMark = count && count > 0
    ? <span className="bf-menubutton__count" aria-hidden="true">{count > 99 ? "99+" : count}</span>
    : null;

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setPos(null);
    setOpen(true);
  }

  useLayoutEffect(() => {
    if (!open) return;
    const rect = rootRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!rect || !panel) return;
    const margin = 8;
    const gap = 4;
    const { width, height } = panel.getBoundingClientRect();
    const below = window.innerHeight - margin - rect.bottom - gap;
    const above = rect.top - gap - margin;
    const preferredTop = height > below && above > below
      ? rect.top - gap - height
      : rect.bottom + gap;
    const preferredLeft = align === "end" ? rect.right - width : rect.left;
    setPos({
      top: Math.max(margin, Math.min(preferredTop, window.innerHeight - margin - height)),
      left: Math.max(margin, Math.min(preferredLeft, window.innerWidth - margin - width)),
    });
  }, [open, align, items]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onMove(e: Event) {
      if (e.target instanceof Node && panelRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  return (
    <div
      className="bf-avatarmenu"
      ref={rootRef}
      style={block ? { display: "block", position: "relative" } : undefined}
    >
      {iconOnly ? (
        <button
          type="button"
          className={["bf-iconbutton", countMark ? "bf-menubutton--counted" : "", triggerClassName ?? ""].filter(Boolean).join(" ")}
          aria-label={ariaLabel}
          title={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
        >
          {label}
          {countMark}
        </button>
      ) : (
        <Button
          type="button"
          variant={variant}
          size={size}
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
          className={countMark ? "bf-menubutton--counted" : undefined}
          style={block ? { width: "100%" } : undefined}
        >
          {icon && <span style={{ display: "inline-flex", marginInlineEnd: "var(--bf-space-2)" }} aria-hidden="true">{icon}</span>}
          {label}
          {countMark}
        </Button>
      )}

      {open && (
        <div
          ref={panelRef}
          className="bf-avatarmenu__panel"
          role="menu"
          aria-label={menuAriaLabel ?? ariaLabel ?? (typeof label === "string" ? label : undefined)}
          style={{
            position: "fixed",
            top: pos?.top,
            left: pos?.left ?? "auto",
            right: "auto",
            insetInlineStart: pos?.left ?? "auto",
            insetInlineEnd: "auto",
            minWidth: "min(12rem, calc(100vw - 16px))",
            width: "max-content",
            maxWidth: "min(22rem, calc(100vw - 16px))",
            maxHeight: "calc(100dvh - 16px)",
            boxSizing: "border-box",
            overflowY: "auto",
            overscrollBehavior: "contain",
            visibility: pos ? "visible" : "hidden",
          }}
        >
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              className={["bf-menuitem", it.separatorBefore ? "bf-menuitem--sep" : "", it.danger ? "bf-menuitem--danger" : ""].filter(Boolean).join(" ")}
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              {it.icon && (
                <span className="bf-menuitem__icon" aria-hidden="true">
                  {it.icon}
                </span>
              )}
              <span className="bf-menuitem__label">{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
