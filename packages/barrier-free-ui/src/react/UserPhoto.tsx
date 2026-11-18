
export type UserPhotoProps = {
  /** 顔写真の URL。無ければ既定の画像 */
  src?: string | null;
  /** 直径（CSS の長さ）。既定はアイコンの 1.25 倍 */
  size?: string;
  /** 読み上げ名。隣に名前がある飾りなら空文字（既定） */
  alt?: string;
  className?: string;
};

export function UserPhoto({ src, size = "calc(var(--bf-icon) * 1.25)", alt = "", className }: UserPhotoProps) {
  const cls = `bf-user-photo${className ? ` ${className}` : ""}`;
  const style = { width: size, height: size, borderRadius: "9999px", objectFit: "cover" as const, flexShrink: 0 };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={cls} src={src} alt={alt} aria-hidden={alt ? undefined : true} style={style} />;
  }
  return (
    <span className={`${cls} bf-user-photo--default`} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} style={style}>
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle cx="20" cy="15" r="7" fill="currentColor" />
        <path d="M6 36c1.6-7.4 7.4-11.5 14-11.5S32.4 28.6 34 36" fill="currentColor" />
      </svg>
    </span>
  );
}
