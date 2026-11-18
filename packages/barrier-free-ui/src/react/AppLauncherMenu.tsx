"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LayoutGrid } from "lucide-react";
import { AppTile } from "../icons";

export type AppLauncherTile = {
  key: string;
  name: string;
  href: string;
  iconName: string | null;
  logoUrl?: string | null;
  themeToken?: string | null;
  /** 別タブで開く */
  external?: boolean;
  /** `data-app-slug`（最近使ったアプリの履歴が拾う印） */
  appSlug?: string;
};

export type AppLauncherSection = { key: string; label: string; tiles: AppLauncherTile[] };

export type AppLauncherMenuProps = {
  sections: AppLauncherSection[];
  /** 頭の帯（ポータル・管理コンソール）。空なら出さない */
  pillars?: AppLauncherTile[];
  /** 今いる面のマスの key（aria-current を付ける） */
  currentKey?: string;
  /** 初めて開いたときに呼ぶ */
  onFirstOpen?: () => void;
  /** 素材を取っている間 true（「読み込み中…」を出す） */
  loading?: boolean;
  label?: string;
  loadingLabel?: string;
  pillarsLabel?: string;
};

export function AppLauncherMenu({
  sections,
  pillars = [],
  currentKey,
  onFirstOpen,
  loading = false,
  label = "アプリ一覧",
  loadingLabel = "読み込み中…",
  pillarsLabel = "ポータル・管理コンソール",
}: AppLauncherMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const opened = useRef(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !opened.current) {
      opened.current = true;
      onFirstOpen?.();
    }
  }

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

  const tile = (t: AppLauncherTile, className: string): ReactNode => (
    <AppTile
      key={t.key}
      size="sm"
      solid
      className={className}
      href={t.href}
      role="menuitem"
      {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...(t.appSlug ? { "data-app-slug": t.appSlug } : {})}
      aria-current={t.key === currentKey ? "page" : undefined}
      onClick={() => setOpen(false)}
      name={t.name}
      iconName={t.iconName}
      logoUrl={t.logoUrl}
      color={t.themeToken}
    />
  );

  return (
    <div className="bf-launcher" ref={rootRef}>
      <button
        type="button"
        className="bf-launcher__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={toggle}
      >
        <LayoutGrid size={20} aria-hidden="true" />
      </button>

      {open && (
        <div className="bf-launcher__panel" role="menu" aria-label={label}>
          {pillars.length > 0 && (
            <div role="group" aria-label={pillarsLabel} className="bf-launcher__pillars">
              {pillars.map((t) => tile(t, "bf-launcher__item bf-launcher__pillar"))}
            </div>
          )}
          {sections.map((s) => (
            <div key={s.key} role="group" aria-label={s.label} style={{ display: "contents" }}>
              <p aria-hidden="true" className="bf-launcher__title">{s.label}</p>
              {s.tiles.map((t) => tile(t, "bf-launcher__item"))}
            </div>
          ))}
          {loading && (
            <p role="status" className="bf-launcher__title">{loadingLabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
