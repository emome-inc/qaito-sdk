"use client";

import { useEffect, useState, type ReactNode } from "react";

export type Crumb = { label: ReactNode; href?: string };

/**
 * トップバー/サイドバー左のブランド表示（ロゴ＋アプリ名）。
 *
 * ロゴ画像はパッケージにバンドルしない（呼び出し側＝アプリが `logo` に渡す）。
 * `AppTopbar` / `AppShell` / `Sidebar` の `brand` に、この部品を渡す:
 *   <TopbarBrand logo={<img src="/logo-ful.png" alt="Qaito" />} appName="通所介護" />
 *
 * ロゴの高さ・アプリ名の字送りは bf-* トークンでスケール連動する（app-topbar.css .bf-brand*）。
 * クリックでの遷移先は brand を包む側（brandHref）が持つ。
 */
export function TopbarBrand({ logo, appName }: { logo: ReactNode; appName?: ReactNode }) {
  return (
    <span className="bf-brand">
      <span className="bf-brand__logo">{logo}</span>
      {appName ? <span className="bf-brand__app">{appName}</span> : null}
    </span>
  );
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const lastIdx = items.length - 1;
  const sep = (
    <span className="bf-breadcrumb__sep" aria-hidden="true">›</span>
  );
  return (
    <nav className="bf-breadcrumb" aria-label="現在地">
      {items.map((c, i) => {
        const last = i === lastIdx;
        const title = typeof c.label === "string" ? c.label : undefined;
        return (
          <span
            key={i}
            className={`bf-breadcrumb__crumb${last ? " bf-breadcrumb__crumb--current" : ""}`}
          >
            {c.href && !last ? (
              <a className="bf-breadcrumb__item" href={c.href} title={title}>
                {c.label}
              </a>
            ) : (
              <span
                className="bf-breadcrumb__item"
                aria-current={last ? "page" : undefined}
                title={title}
              >
                {c.label}
              </span>
            )}
            {!last && sep}
          </span>
        );
      })}
    </nav>
  );
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span className="bf-clock" aria-hidden="true" />;
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return (
    <span className="bf-clock">
      <span className="bf-clock__time">{hh}:{mm}</span>
      <span className="bf-clock__date">
        {now.getMonth() + 1}月{now.getDate()}日({WEEKDAYS[now.getDay()]})
      </span>
    </span>
  );
}

export function AppTopbar({
  brand,
  brandHref = "#",
  breadcrumb,
  children,
}: {
  brand: ReactNode;
  brandHref?: string;
  breadcrumb?: Crumb[];
  /** 右側のアクション（SizeToggle / サインアウト等） */
  children?: ReactNode;
}) {
  return (
    <header className="bf-topbar">
      <a className="bf-topbar__brand" href={brandHref}>{brand}</a>
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
      <div className="bf-topbar__right">{children}</div>
    </header>
  );
}
