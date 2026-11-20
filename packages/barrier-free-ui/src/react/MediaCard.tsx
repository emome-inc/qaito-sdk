
import type { ElementType, HTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { MediaThumb, type MediaBlankTone, type MediaKind, type MediaLinkTarget, type MediaRatio } from "./Media";

export type MediaLinkRender = (props: {
  href: string;
  className: string;
  children: ReactNode;
  "aria-label"?: string;
}) => ReactNode;

export function MediaCard({
  src,
  alt,
  kind = "image",
  ratio = "landscape",
  objectPosition,
  referrerPolicy,
  blankTone = "muted",
  thumbIcon,
  title,
  titleLines = 1,
  meta,
  textPlacement = "below",
  badges,
  actions,
  cornerActions,
  overlay,
  href,
  linkAs,
  linkTarget = "_self",
  linkScope = "media",
  renderLink,
  onOpen,
  openLabel,
  selected = false,
  itemProps,
  children,
}: {
  src?: string | null;
  alt: string;
  kind?: MediaKind;
  ratio?: MediaRatio;
  /** 切り取ったときにどこを見せるか（`MediaThumb` へ素通し） */
  objectPosition?: string;
  /** 他所の画像サーバから直に読む絵は `no-referrer`（`MediaThumb` へ素通し） */
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
  /** 絵が出せないときの地（`MediaThumb` へ素通し） */
  blankTone?: MediaBlankTone;
  /**
   * 絵が出せないときの印の差し替え（`MediaThumb` の `icon` へ素通し。絵文字・フォルダ等、種類の外のもの）。
   * `blankTone="primary"` は印を出さない地なので併用しない
   */
  thumbIcon?: ReactNode;
  /** 名前（既定は 1 行で省略）。省略すると文字の段を出さず、写真だけが並ぶ */
  title?: ReactNode;
  /** 名前を何行で折るか（既定 1 = 1 行で省略）。記事の題のように 1 行では読めないものは 2 */
  titleLines?: 1 | 2;
  /** 補足（日付・サイズ等。1 行で省略。`textPlacement="overlay"` のときは折り返す） */
  meta?: ReactNode;
  /**
   * 名前と補足の置き方。`below`（既定）= 絵の下の段。
   * `overlay` = 絵の上に重ねる（下から暗くして白文字。絵そのものが 1 枚のカードになる面）。
   * `overlay` では押す面が絵＝カード全体なので、`actions` は置かない
   */
  textPlacement?: "below" | "overlay";
  /** 絵の左上に重ねる印（`Badge`）。状態だけを置く */
  badges?: ReactNode;
  /** 名前の右に置く操作（`MenuButton iconOnly` 等）。押す面の外に置かれる */
  actions?: ReactNode;
  /**
   * 絵の右上に重ねる操作（共有・星など、写真だけを並べる面の小さなアイコン）。
   * 押す面の外に置かれるので、押しても開かない。台は `.bf-mediacard__corner-btn` を使う
   */
  cornerActions?: ReactNode;
  /** 絵の左下に重ねる短い文字（動画・音声の長さ等） */
  overlay?: ReactNode;
  /** 押したときの行き先（詳細ページ） */
  href?: string;
  /**
   * リンクに使う部品（Next の `Link` など）。既定は素の `<a>`。
   * **Server Component からも渡せる**（`RowAction` / `Stat` と同じ書き方）
   */
  linkAs?: ElementType;
  /** 別タブで開く（外のサイト）。`_blank` のとき `rel="noopener noreferrer"` が付く */
  linkTarget?: MediaLinkTarget;
  /**
   * 押せる範囲。`media`（既定）= 絵だけ / `card` = カード全体（名前・補足まで）。
   * `card` は絵の下端に重ねるもの（`overlay`）とは併用しない（基準が絵でなくカードになる）
   */
  linkScope?: "media" | "card";
  /**
   * リンクの描き方を丸ごと差し替える。**関数なので Server Component からは渡せない** ──
   * ルーターの部品を使うだけなら `linkAs` を渡す
   */
  renderLink?: MediaLinkRender;
  /** 行き先の代わりに押したときの処理（拡大表示を開く等） */
  onOpen?: () => void;
  /** 押す面の読み上げ名（既定は「〈alt〉を開く」） */
  openLabel?: string;
  /** 選ばれている（「この日の 1 枚」等。枠を主色にする） */
  selected?: boolean;
  /**
   * カード（`<li>`）に広げる追加の属性。ドラッグで運ぶ（`onPointerDown` / `style`）・
   * 受け皿にする（`data-*`）など。見た目の上書きには使わない
   */
  itemProps?: HTMLAttributes<HTMLLIElement> & Record<`data-${string}`, string | undefined>;
  /** カードの下に足すもの（「この日の 1 枚にする」ボタン等） */
  children?: ReactNode;
}) {
  const thumb = (
    <MediaThumb
      src={src}
      alt={alt}
      kind={kind}
      ratio={ratio}
      objectPosition={objectPosition}
      referrerPolicy={referrerPolicy}
      blankTone={blankTone}
      icon={thumbIcon}
    />
  );
  const overlaidText = textPlacement === "overlay";
  const plain = overlaidText || (!title && !meta && !actions);
  const label = openLabel ?? (alt ? `「${alt}」を開く` : undefined);
  let preview: ReactNode;
  if (href) {
    const Tag: ElementType = linkAs ?? "a";
    const newTab = linkTarget === "_blank";
    preview = renderLink ? (
      renderLink({ href, className: "bf-mediacard__open", children: thumb, "aria-label": label })
    ) : (
      <Tag
        href={href}
        className="bf-mediacard__open"
        aria-label={label}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        {thumb}
      </Tag>
    );
  } else if (onOpen) {
    preview = (
      <button type="button" className="bf-mediacard__open" onClick={onOpen} aria-label={label}>
        {thumb}
      </button>
    );
  } else {
    preview = <div className="bf-mediacard__open" data-static="true">{thumb}</div>;
  }

  const foot = (title || meta || actions) && (
    <div className="bf-mediacard__foot" data-placement={overlaidText ? "overlay" : undefined}>
      <span className="bf-mediacard__text">
        {title && (
          <span className="bf-mediacard__title" data-lines={titleLines === 1 ? undefined : String(titleLines)}>
            {title}
          </span>
        )}
        {meta && <span className="bf-mediacard__meta">{meta}</span>}
      </span>
      {actions && <span className="bf-mediacard__actions">{actions}</span>}
    </div>
  );

  return (
    <li
      {...itemProps}
      className="bf-mediacard"
      data-selected={selected ? "true" : undefined}
      data-plain={plain ? "true" : undefined}
      data-link-scope={linkScope === "card" ? "card" : undefined}
      data-blank-tone={!(kind === "image" && src) && blankTone !== "muted" ? blankTone : undefined}
    >
      <div className="bf-mediacard__media">
        {preview}
        {badges && <span className="bf-mediacard__badges">{badges}</span>}
        {overlay && <span className="bf-mediacard__overlay">{overlay}</span>}
        {cornerActions && <span className="bf-mediacard__corner">{cornerActions}</span>}
        {overlaidText && foot}
      </div>
      {!overlaidText && foot}
      {children && <div className="bf-mediacard__extra">{children}</div>}
    </li>
  );
}

export function MediaGrid({
  children,
  size = "md",
  stackOnNarrow = false,
  singleColumn = false,
  label,
}: {
  children: ReactNode;
  /** 1 枚の最小幅（文字サイズに連動したうえでの段階） */
  size?: "sm" | "md" | "lg";
  /**
   * 狭い画面（40rem 以下）では 1 列にする。**絵に文字を重ねるカード**のように、
   * 小さくすると中身が読めなくなる面で使う（写真だけを並べる面は並んだままでよい）
   */
  stackOnNarrow?: boolean;
  /**
   * 画面の幅によらず 1 列に並べる（横に並べず、1 枚ずつ縦に読ませる一覧。ポータルのホームの連携サイト・記事）
   */
  singleColumn?: boolean;
  /** 格子の読み上げ名 */
  label?: string;
}) {
  return (
    <ul
      className="bf-mediagrid"
      data-size={size}
      data-stack={singleColumn ? "always" : stackOnNarrow ? "narrow" : undefined}
      aria-label={label}
    >
      {children}
    </ul>
  );
}
