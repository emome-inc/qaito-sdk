"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { UserPhoto } from "./UserPhoto";

export type SidebarUserAction = {
  label: ReactNode;
  icon?: ReactNode;
  /** リンクとして開く場合。onClick と併用しない */
  href?: string;
  onClick?: () => void;
  /** サインアウト等、取り消しにくい操作を色で区別する */
  danger?: boolean;
};

export type SidebarUserProps = {
  /** 1 行目（氏名）。空なら「ユーザー」 */
  name: string;
  /** 2 行目（事業所名など現在の文脈）。未指定なら 1 行で描く */
  sub?: ReactNode;
  /** 本人の顔写真の URL。無ければ既定の画像を出す（頭文字の丸は出さない） */
  avatarUrl?: string | null;
  /** メニュー項目。空配列ならメニューを開かない（表示のみのブロックになる） */
  items?: SidebarUserAction[];
  /**
   * メニューの開閉を親が制御する場合（未指定なら自分で持つ）。
   * QaitoChat はサイドバーを畳んだ状態のレールから「展開して即メニューを開く」導線を
   * 持つため、外から開けられる必要がある。
   */
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
  /** リンク項目のレンダラ差し替え（Next.js <Link> 等）。既定は <a> */
  renderLink?: (props: { href: string; className: string; role: "menuitem"; children: ReactNode }) => ReactNode;
  menuAriaLabel?: string;
};

export function SidebarUser({
  name,
  sub,
  avatarUrl,
  items = [],
  open: openProp,
  onOpenChange,
  renderLink,
  menuAriaLabel = "アカウントメニュー",
}: SidebarUserProps) {
  const [selfOpen, setSelfOpen] = useState(false);
  const open = openProp ?? selfOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else setSelfOpen(next);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const displayName = name.trim() ? name.trim() : "ユーザー";
  const hasMenu = items.length > 0;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const text = (
    <>
      {}
      <UserPhoto src={avatarUrl} className="bf-sidebar-user__avatar" />
      <span className="bf-sidebar-user__text">
        <span className="bf-sidebar-user__name">{displayName}</span>
        {sub != null && sub !== "" && <span className="bf-sidebar-user__sub">{sub}</span>}
      </span>
    </>
  );

  if (!hasMenu) {
    return (
      <div className="bf-sidebar-user" ref={rootRef}>
        <div className="bf-sidebar-user__button bf-sidebar-user__button--static">{text}</div>
      </div>
    );
  }

  return (
    <div className="bf-sidebar-user" ref={rootRef}>
      {open && (
        <div className="bf-sidebar-user__menu" role="menu" aria-label={menuAriaLabel}>
          {items.map((it, i) => {
            const cls = `bf-menuitem${it.danger ? " bf-menuitem--danger" : ""}`;
            const inner = (
              <>
                {it.icon && <span className="bf-menuitem__icon" aria-hidden="true">{it.icon}</span>}
                <span className="bf-menuitem__label">{it.label}</span>
              </>
            );
            if (it.href) {
              if (renderLink) {
                return (
                  <span key={i} onClick={() => setOpen(false)}>
                    {renderLink({ href: it.href, className: cls, role: "menuitem", children: inner })}
                  </span>
                );
              }
              return (
                <a key={i} href={it.href} className={cls} role="menuitem" onClick={() => setOpen(false)}>
                  {inner}
                </a>
              );
            }
            return (
              <button
                key={i}
                type="button"
                className={cls}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="bf-sidebar-user__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${menuAriaLabel}: ${displayName}`}
        title={displayName}
        onClick={() => setOpen(!open)}
      >
        {text}
        {}
        <svg
          className="bf-sidebar-user__chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      </button>
    </div>
  );
}
