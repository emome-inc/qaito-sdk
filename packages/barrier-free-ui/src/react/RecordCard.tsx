import type { ReactNode } from "react";

export function Avatar({
  src,
  initials,
  alt = "",
}: {
  src?: string;
  initials?: string;
  alt?: string;
}) {
  return (
    <span className="bf-avatar" aria-hidden={!alt}>
      {src ? <img src={src} alt={alt} /> : <span>{initials ?? "?"}</span>}
    </span>
  );
}

export function RecordCard({
  avatar,
  title,
  subtitle,
  trailing,
  href,
  onClick,
}: {
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {avatar}
      <span className="bf-record__main">
        <span className="bf-record__title" style={{ display: "block" }}>
          {title}
        </span>
        {subtitle && <span className="bf-record__sub" style={{ display: "block" }}>{subtitle}</span>}
      </span>
      <span className="bf-record__trailing">
        {trailing}
        <span className="bf-record__chevron" aria-hidden="true">›</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a className="bf-record" href={href}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className="bf-record" onClick={onClick}>
      {inner}
    </button>
  );
}

export function RecordList({ children }: { children: ReactNode }) {
  return <div className="bf-recordlist">{children}</div>;
}
