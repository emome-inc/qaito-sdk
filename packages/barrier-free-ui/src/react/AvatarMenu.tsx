"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { UserPhoto } from "./UserPhoto";

export type AvatarMenuItem = {
  label: ReactNode;
  icon?: ReactNode;
  /** リンクとして開く場合。onClick と併用しない */
  href?: string;
  onClick?: () => void;
  /** サインアウト等、取り消しにくい操作を色で区別する */
  danger?: boolean;
  /** 直前に区切り線を引く（グループの境目） */
  separatorBefore?: boolean;
};

export type AvatarMenuProps = {
  /** 表示名。メニュー見出しと、丸の読み上げ名に使う */
  name: string;
  /** 本人のアイコン（顔写真）の URL。無ければ既定の画像 */
  avatarUrl?: string | null;
  /** 名前の下に出す文脈（事業所名・組織名など） */
  sub?: ReactNode;
  items: AvatarMenuItem[];
  /** 名前の下・項目の上に置く表示の設定の行（`AvatarMenuSetting` を並べる。押してもメニューは閉じない） */
  settings?: ReactNode;
  /** リンク項目のレンダラ差し替え（Next.js <Link> 等）。既定は <a> */
  renderLink?: (props: { href: string; className: string; role: "menuitem"; children: ReactNode }) => ReactNode;
  menuAriaLabel?: string;
};

export function AvatarMenu({
  name,
  avatarUrl,
  sub,
  items,
  settings,
  renderLink,
  menuAriaLabel = "アカウントメニュー",
}: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayName = name.trim() ? name.trim() : "ユーザー";

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

  return (
    <div className="bf-avatarmenu" ref={rootRef}>
      <button
        type="button"
        className="bf-avatarmenu__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${menuAriaLabel}: ${displayName}`}
        title={displayName}
        onClick={() => setOpen((v) => !v)}
      >
        {}
        <UserPhoto src={avatarUrl} size="100%" className="bf-avatarmenu__photo" />
      </button>

      {open && (
        <div className="bf-avatarmenu__panel" role="menu" aria-label={menuAriaLabel}>
          {}
          <div className="bf-avatarmenu__head">
            <span className="bf-avatarmenu__name">{displayName}</span>
            {sub != null && sub !== "" && <span className="bf-avatarmenu__sub">{sub}</span>}
          </div>

          {settings != null && <div className="bf-avatarmenu__settings">{settings}</div>}

          {items.map((it, i) => {
            const cls = [
              "bf-menuitem",
              it.danger ? "bf-menuitem--danger" : "",
              it.separatorBefore ? "bf-menuitem--sep" : "",
            ]
              .filter(Boolean)
              .join(" ");
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
    </div>
  );
}

/** アカウントメニューの表示の設定の 1 行（見出し + 切替。例: 画面の明るさ + `ColorModeToggle`） */
export function AvatarMenuSetting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bf-avatarmenu__setting">
      <span className="bf-avatarmenu__setting-label">{label}</span>
      {children}
    </div>
  );
}
