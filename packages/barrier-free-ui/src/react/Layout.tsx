import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bf-section-card">
      <div className="bf-section-card__head">
        <div className="bf-section-card__heading">
          <h3 className="bf-section-card__title">{title}</h3>
          {description && <p className="bf-section-card__desc">{description}</p>}
        </div>
        {actions && <div className="bf-section-card__actions">{actions}</div>}
      </div>
      <div className="bf-section-card__body">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  mobileCompact = false,
  mobileActions,
  titleAside,
}: {
  title: ReactNode;
  /**
   * 見出しのすぐ横に置くもの（名前の横の通知のベル等）。見出し（h1）の外に置くので、
   * 中のボタン・メニューの文字が見出しの読み上げに混ざらない
   */
  titleAside?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Keep the title and actions together; disclose the description on small screens. */
  mobileCompact?: boolean;
  /** Icon actions with accessible names, replacing actions only on small screens. */
  mobileActions?: ReactNode;
}) {
  return (
    <div className="bf-page-header" data-mobile-compact={mobileCompact || undefined}>
      <div className="bf-page-header__heading">
        {titleAside ? (
          <div className="bf-page-header__title-row">
            <h1 className="bf-page-header__title">{title}</h1>
            {titleAside}
          </div>
        ) : (
          <h1 className="bf-page-header__title">{title}</h1>
        )}
        {description && <p className="bf-page-header__desc">{description}</p>}
        {mobileCompact && description && (
          <details className="bf-page-header__info">
            <summary aria-label="ページの説明"><span aria-hidden="true">ⓘ</span></summary>
            <div>{description}</div>
          </details>
        )}
      </div>
      {actions && <div className="bf-page-header__actions" data-desktop-only={mobileCompact && mobileActions !== undefined || undefined}>{actions}</div>}
      {mobileCompact && mobileActions !== undefined && <div className="bf-page-header__mobile-actions">{mobileActions}</div>}
    </div>
  );
}

export function Divider() {
  return <hr className="bf-divider" />;
}

export function InfoList({ children }: { children: ReactNode }) {
  return <dl className="bf-infolist">{children}</dl>;
}

export function InfoItem({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="bf-infoitem">
      <dt className="bf-infoitem__label">{label}</dt>
      <dd className="bf-infoitem__value">
        <span>{value}</span>
        {hint && <span className="bf-infoitem__hint">{hint}</span>}
      </dd>
    </div>
  );
}

export function SettingRow({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** 右側の操作（Button / ToggleSwitch / Badge）。本文のすぐ隣に置かれる */
  action?: ReactNode;
  /** 行の下に続く補足（Feedback 等） */
  children?: ReactNode;
}) {
  return (
    <div className="bf-settingrow-block">
      <div className="bf-settingrow">
        {icon && <span className="bf-settingrow__icon" aria-hidden="true">{icon}</span>}
        <div className="bf-settingrow__text">
          <p className="bf-settingrow__title">{title}</p>
          {description && <p className="bf-settingrow__desc">{description}</p>}
        </div>
        {action && <div className="bf-settingrow__action">{action}</div>}
      </div>
      {children}
    </div>
  );
}
