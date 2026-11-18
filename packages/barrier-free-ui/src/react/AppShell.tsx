"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Breadcrumb, type Crumb } from "./AppTopbar";
import { Sidebar, type SidebarSection } from "./Sidebar";

export type AppShellProps = {
  brand: ReactNode;
  brandHref?: string;
  breadcrumb?: Crumb[];
  /** ナビ項目（単一ソース） */
  nav: SidebarSection[];
  /** Topbar 右側のアクション（SizeToggle / 事業所表示等） */
  topbarActions?: ReactNode;
  /**
   * サイドバー最下部。`SidebarUser`（氏名＋事業所＋メニュー）を置く枠。
   */
  sidebarFooter?: ReactNode;
  /** サイドバー折りたたみ状態の localStorage キー */
  sidebarPersistKey?: string;
  /** リンクのレンダラ差し替え（Next.js <Link> 等）。Sidebar に伝播 */
  renderLink?: Parameters<typeof Sidebar>[0]["renderLink"];
  /**
   * 右に**重ねて**出す常駐パネル（モジュールエージェントのドック等）。
   * 裏の画面のレイアウトは動かさない（overlay）。暗幕は出さず、パネルの外は普通に操作できる。
   * 狭幅（≤ 64rem）では下からのシートになる。開閉は `asideOpen`（呼び出し側が持つ）。
   * 中身はここでは知らない（Next の router・SSE を知る部品は面の骨格側に置く）。
   */
  aside?: ReactNode;
  asideOpen?: boolean;
  /** `aside` の読み上げ名（例「AI アシスタント」） */
  asideLabel?: string;
  children?: ReactNode;
};

export function AppShell({
  brand,
  brandHref = "#",
  breadcrumb,
  nav,
  topbarActions,
  sidebarFooter,
  sidebarPersistKey,
  renderLink,
  aside,
  asideOpen = false,
  asideLabel,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className={`bf-appshell bf-appshell--sidebar${drawerOpen ? " bf-appshell--drawer-open" : ""}`}>
      {}
      <div
        className="bf-appshell__sidebar"
        onClickCapture={(e) => {
          if (!drawerOpen) return;
          const el = e.target as HTMLElement | null;
          if (el?.closest("a,button")) setDrawerOpen(false);
        }}
      >
        <Sidebar
          brand={brand}
          brandHref={brandHref}
          sections={nav}
          footer={sidebarFooter}
          persistKey={sidebarPersistKey}
          renderLink={renderLink}
        />
      </div>

      {}
      <div
        className="bf-appshell__scrim"
        onMouseDown={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="bf-appshell__main">
        <header className="bf-topbar bf-appshell__topbar">
          {}
          <button
            type="button"
            className="bf-appshell__drawer-toggle"
            aria-label={drawerOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
          <div className="bf-topbar__right">{topbarActions}</div>
        </header>
        <main className="bf-appshell__content">{children}</main>
        {aside !== undefined && (
          <aside className="bf-appshell__aside" aria-label={asideLabel} hidden={!asideOpen}>
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
}
