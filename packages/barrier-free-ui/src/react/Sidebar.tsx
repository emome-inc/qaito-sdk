"use client";

import { useEffect, useState, type ReactNode } from "react";

export type SidebarItem = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  href?: string;
  active?: boolean;
  badge?: ReactNode;
  onClick?: () => void;
  children?: SidebarItem[];
  defaultOpen?: boolean;
  collapsible?: boolean;
  hint?: ReactNode;
};

export type SidebarSection = {
  id?: string;
  label?: ReactNode;
  icon?: ReactNode;
  /** 見出し自体の行き先（柱ランディング等）。あると見出しがリンクになる */
  href?: string;
  /** 見出しが現在地か */
  active?: boolean;
  items: SidebarItem[];
};

export type SidebarProps = {
  sections: SidebarSection[];
  brand?: ReactNode;
  brandHref?: string;
  footer?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** 指定すると折りたたみ/展開状態を localStorage に永続化 */
  persistKey?: string;
  ariaLabel?: string;
  variant?: "default" | "drive";
  /** リンクのレンダラ差し替え（Next.js の <Link> 等を使いたい場合）。既定は <a> */
  renderLink?: (props: { href: string; className: string; children: ReactNode; title?: string; "aria-current"?: "page"; "aria-describedby"?: string }) => ReactNode;
};

function titleOf(label: ReactNode): string | undefined {
  return typeof label === "string" ? label : undefined;
}

/** レール幅（アイコンだけの幅）でアイコンを持たない項目に出す 1 文字。空欄の行を作らないため。 */
function initialOf(label: ReactNode): string | undefined {
  const t = titleOf(label);
  return t ? Array.from(t.trim())[0] : undefined;
}

export function Sidebar({
  sections,
  brand,
  brandHref = "#",
  footer,
  collapsible = true,
  defaultCollapsed = false,
  persistKey,
  ariaLabel = "サイドバーナビ",
  variant = "default",
  renderLink,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!persistKey) return;
    try {
      const c = window.localStorage.getItem(`${persistKey}:collapsed`);
      if (c != null) setCollapsed(c === "1");
      const o = window.localStorage.getItem(`${persistKey}:open`);
      if (o) setOpen(JSON.parse(o) as Record<string, boolean>);
    } catch {
    }
  }, [persistKey]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      if (persistKey) {
        try { window.localStorage.setItem(`${persistKey}:collapsed`, next ? "1" : "0"); } catch { }
      }
      return next;
    });
  }

  /** 開く（閉じない）。drive の名前を押してその場所へ行くときに、中も見せる */
  function openItem(id: string) {
    setOpen((prev) => {
      if (prev[id] === true) return prev;
      const next = { ...prev, [id]: true };
      if (persistKey) {
        try { window.localStorage.setItem(`${persistKey}:open`, JSON.stringify(next)); } catch { }
      }
      return next;
    });
  }

  function toggleOpen(id: string, fallback: boolean) {
    setOpen((prev) => {
      const cur = prev[id] ?? fallback;
      const next = { ...prev, [id]: !cur };
      if (persistKey) {
        try { window.localStorage.setItem(`${persistKey}:open`, JSON.stringify(next)); } catch { }
      }
      return next;
    });
  }

  /** hint 吹き出しの安定 id（item.id から決定的に導出 — useId 不要） */
  function hintIdOf(item: SidebarItem): string | undefined {
    return item.hint != null && item.hint !== "" ? `bf-sbhint-${item.id.replace(/[^\w-]+/g, "-")}` : undefined;
  }

  function renderItemLink(item: SidebarItem, className: string, children: ReactNode) {
    const ariaCurrent = item.active ? ("page" as const) : undefined;
    const describedBy = hintIdOf(item);
    if (item.href && renderLink) {
      return renderLink({ href: item.href, className, children, title: collapsed ? titleOf(item.label) : undefined, "aria-current": ariaCurrent, "aria-describedby": describedBy });
    }
    if (item.href) {
      return (
        <a href={item.href} className={className} title={collapsed ? titleOf(item.label) : undefined} aria-current={ariaCurrent} aria-describedby={describedBy}>
          {children}
        </a>
      );
    }
    return (
      <button type="button" className={className} onClick={item.onClick} title={collapsed ? titleOf(item.label) : undefined} aria-current={ariaCurrent} aria-describedby={describedBy}>
        {children}
      </button>
    );
  }

  function itemInner(item: SidebarItem, isChild = false) {
    return (
      <>
        {item.icon && <span className="bf-sidebar__icon" aria-hidden="true">{item.icon}</span>}
        {!item.icon && (
          <span className="bf-sidebar__icon" aria-hidden="true" data-initial={initialOf(item.label)} />
        )}
        <span className="bf-sidebar__label">{item.label}</span>
        {item.badge != null && <span className="bf-sidebar__badge">{item.badge}</span>}
        {item.hint != null && item.hint !== "" && (
          <span className="bf-hoverhint__bubble" role="tooltip" id={hintIdOf(item)}>
            {item.hint}
          </span>
        )}
      </>
    );
  }

  /** 見出し行（アイコン + ラベル）。href があればリンクになる。 */
  function renderSectionHead(section: SidebarSection) {
    const inner = (
      <>
        <span className="bf-sidebar__section-icon" aria-hidden="true">{section.icon}</span>
        <span className="bf-sidebar__label">{section.label}</span>
      </>
    );
    const className = `bf-sidebar__section-label${section.active ? " bf-sidebar__section-label--active" : ""}`;
    if (section.href && renderLink) {
      return renderLink({ href: section.href, className, children: inner, "aria-current": section.active ? "page" : undefined });
    }
    if (section.href) {
      return (
        <a href={section.href} className={className} aria-current={section.active ? "page" : undefined}>
          {inner}
        </a>
      );
    }
    return <div className={className}>{inner}</div>;
  }

  /** 開閉の三角（畳んでいるときは下向き、開いたら上向き） */
  function chevron(isOpen: boolean) {
    return (
      <span className={`bf-sidebar__chevron${isOpen ? " bf-sidebar__chevron--open" : ""}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    );
  }

  /**
   * 1 項目と、その子を描く（子は何段でも）。`depth` は 0 = 項目・1 = 子・2 以上 = 子の子。
   * 0 と 1 の形は入れ子を足す前と同じ（クラス・要素とも）。2 段目より下だけ段ごとの字下げのクラスを足す。
   */
  function renderNode(item: SidebarItem, depth: number): ReactNode {
    const hasChildren = !!item.children?.length;
    const level = depth === 0 ? "bf-sidebar__item" : `bf-sidebar__item bf-sidebar__child${depth > 1 ? ` bf-sidebar__depth-${Math.min(depth, 6)}` : ""}`;
    const className = `${level}${item.active ? " bf-sidebar__item--active" : ""}`;
    const kids = (open: boolean) =>
      hasChildren && open && !collapsed ? (
        <div className="bf-sidebar__children">{item.children!.map((child) => renderNode(child, depth + 1))}</div>
      ) : null;
    if (!hasChildren || item.collapsible === false) {
      return (
        <div key={item.id}>
          {renderItemLink(item, className, itemInner(item, depth > 0))}
          {kids(true)}
        </div>
      );
    }
    const isOpen = open[item.id] ?? item.defaultOpen ?? true;
    if (item.href) {
      const name = titleOf(item.label);
      return (
        <div key={item.id}>
          <div className="bf-sidebar__row">
            {renderItemLink(item, className, itemInner(item, depth > 0))}
            {!collapsed && (
              <button
                type="button"
                className="bf-sidebar__expander"
                onClick={() => toggleOpen(item.id, item.defaultOpen ?? true)}
                aria-expanded={isOpen}
                aria-label={name ? `${name}を${isOpen ? "閉じる" : "開く"}` : isOpen ? "閉じる" : "開く"}
              >
                {chevron(isOpen)}
              </button>
            )}
          </div>
          {kids(isOpen)}
        </div>
      );
    }
    return (
      <div key={item.id}>
        <button
          type="button"
          className={className}
          onClick={() => toggleOpen(item.id, item.defaultOpen ?? true)}
          aria-expanded={isOpen}
          title={collapsed ? titleOf(item.label) : undefined}
        >
          {itemInner(item, depth > 0)}
          {chevron(isOpen)}
        </button>
        {kids(isOpen)}
      </div>
    );
  }

  /**
   * `variant="drive"` の 1 項目と、その子。行（`bf-sidebar__row`）ごとに左の枠（開閉の三角か、頭をそろえる空き）を持ち、
   * 段・選んでいる・ホバーの見た目は行が持つ。名前はリンク（href があれば）・三角は開閉のボタン。
   */
  function renderDriveNode(item: SidebarItem, depth: number): ReactNode {
    const hasChildren = !!item.children?.length;
    const expandable = hasChildren && item.collapsible !== false;
    const isOpen = expandable ? (open[item.id] ?? item.defaultOpen ?? true) : true;
    const name = titleOf(item.label);
    const toggle = () => toggleOpen(item.id, item.defaultOpen ?? true);
    const rowClass = `bf-sidebar__row bf-sidebar__depth-${Math.min(depth, 6)}${item.active ? " bf-sidebar__row--active" : ""}`;
    const itemClass = `bf-sidebar__item${item.active ? " bf-sidebar__item--active" : ""}`;
    return (
      <div key={item.id}>
        <div className={rowClass}>
          {expandable && !item.href ? (
            <button type="button" className={`${itemClass} bf-sidebar__item--toggle`} onClick={toggle} aria-expanded={isOpen}>
              <span className="bf-sidebar__lead" aria-hidden="true">
                {chevron(isOpen)}
              </span>
              {itemInner(item, depth > 0)}
            </button>
          ) : (
            <>
              {expandable ? (
                <button
                  type="button"
                  className="bf-sidebar__expander"
                  onClick={toggle}
                  aria-expanded={isOpen}
                  aria-label={name ? `${name}を${isOpen ? "閉じる" : "開く"}` : isOpen ? "閉じる" : "開く"}
                >
                  {chevron(isOpen)}
                </button>
              ) : (
                <span className="bf-sidebar__lead" aria-hidden="true" />
              )}
              {expandable ? (
                <span className="bf-sidebar__name" onClick={() => openItem(item.id)}>
                  {renderItemLink(item, itemClass, itemInner(item, depth > 0))}
                </span>
              ) : (
                renderItemLink(item, itemClass, itemInner(item, depth > 0))
              )}
            </>
          )}
        </div>
        {hasChildren && isOpen && !collapsed && (
          <div className="bf-sidebar__children">{item.children!.map((child) => renderDriveNode(child, depth + 1))}</div>
        )}
      </div>
    );
  }

  return (
    <nav
      className={`bf-sidebar${variant === "drive" ? " bf-sidebar--drive" : ""}${collapsed ? " bf-sidebar--collapsed" : ""}`}
      aria-label={ariaLabel}
    >
      {(brand || collapsible) && (
        <div className="bf-sidebar__head">
          {brand && (
            <a className="bf-sidebar__brand" href={brandHref} title={collapsed ? titleOf(brand) : undefined}>
              {brand}
            </a>
          )}
          {collapsible && (
            <button
              type="button"
              className="bf-sidebar__toggle"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "サイドバーを開く" : "サイドバーを折りたたむ"}
              aria-pressed={collapsed}
            >
              <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
            </button>
          )}
        </div>
      )}

      <div className="bf-sidebar__nav">
        {sections.map((section, si) => (
          <div
            className={`bf-sidebar__section${section.label ? "" : " bf-sidebar__section--unlabeled"}`}
            key={section.id ?? si}
          >
            {section.label && renderSectionHead(section)}
            {section.items.map((item) => (variant === "drive" ? renderDriveNode(item, 0) : renderNode(item, 0)))}
          </div>
        ))}
      </div>

      {footer && <div className="bf-sidebar__footer">{footer}</div>}
    </nav>
  );
}
