"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, FileText, ImageOff, Music, Video, X } from "lucide-react";

export type MediaKind = "image" | "video" | "audio" | "file";
/** 枠の比率。landscape = 4:3（既定）/ square = 1:1 / portrait = 3:4 / wide = 16:9 */
export type MediaRatio = "landscape" | "square" | "portrait" | "wide";
/**
 * 絵が出せないときの地。muted = 沈んだ面に種類の印（既定）/
 * primary = テーマの主色の塗り（印を出さず、重ねた文字を主役にする）
 */
export type MediaBlankTone = "muted" | "primary";
/** 押したときに開く先。_self = 同じタブ（既定）/ _blank = 別タブ */
export type MediaLinkTarget = "_self" | "_blank";

/** MIME からの種類（consumer が毎回 startsWith を書かないように） */
export function mediaKindOf(contentType: string | null | undefined): MediaKind {
  if (!contentType) return "file";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "file";
}

function KindIcon({ kind, broken }: { kind: MediaKind; broken?: boolean }) {
  if (broken) return <ImageOff aria-hidden="true" />;
  if (kind === "video") return <Video aria-hidden="true" />;
  if (kind === "audio") return <Music aria-hidden="true" />;
  return <FileText aria-hidden="true" />;
}

export function MediaThumb({
  src,
  alt,
  kind = "image",
  ratio = "landscape",
  size = "fill",
  icon,
  objectPosition,
  referrerPolicy,
  blankTone = "muted",
}: {
  /** 絵の URL。無ければ種類の印を出す（動画・音声・ファイルは印が既定） */
  src?: string | null;
  /** 代替テキスト。飾り（名前が隣に書いてある）なら空文字 */
  alt: string;
  kind?: MediaKind;
  ratio?: MediaRatio;
  /**
   * fill = 親の幅いっぱい（カードの頭・詳細）/ sm = 表の名前の横に置く小さな四角 /
   * md = 一覧の行に置く中くらいの四角 / lg = 吹き出しの中の添付など、単独で置く四角
   */
  size?: "fill" | "sm" | "md" | "lg";
  /** 印の差し替え（フォルダ等、種類の外のもの） */
  icon?: ReactNode;
  /**
   * 切り取ったときにどこを見せるか（`object-position`）。1 枚ごとに違う値なので
   * CSS 変数の受け口（`--bf-mediathumb-pos`）に流す。既定は中央
   */
  objectPosition?: string;
  /**
   * 絵の読み込みで参照元をどこまで渡すか。**他所の画像サーバから直に読む絵は
   * `no-referrer`**（自分のオリジンを第三者に渡さない）
   */
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
  /** 絵が出せないときの地（`primary` は印を出さず、重ねた文字を主役にする） */
  blankTone?: MediaBlankTone;
}) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const isBroken = !!src && brokenSrc === src;
  const showImage = kind === "image" && src && !isBroken;

  return (
    <span
      className="bf-mediathumb"
      data-ratio={size === "fill" ? ratio : "square"}
      data-size={size}
      data-broken={isBroken ? "true" : undefined}
      data-blank-tone={!showImage && blankTone !== "muted" ? blankTone : undefined}
      style={objectPosition ? ({ "--bf-mediathumb-pos": objectPosition } as CSSProperties) : undefined}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- 部品はフレームワーク非依存（next/image を使わない）
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy={referrerPolicy}
          onDragStart={(e) => e.preventDefault()}
          onError={() => setBrokenSrc(src)}
          ref={(el) => {
            if (el && el.complete && el.naturalWidth === 0) setBrokenSrc(src);
          }}
        />
      ) : (
        <span className="bf-mediathumb__icon" role={isBroken && alt ? "img" : undefined} aria-label={isBroken && alt ? `${alt}（表示できません）` : undefined}>
          {icon && !isBroken ? icon : <KindIcon kind={kind} broken={isBroken} />}
        </span>
      )}
    </span>
  );
}

export function MediaFigure({
  src,
  alt,
  kind = "image",
  caption,
  onZoom,
  zoomLabel = "大きく表示",
  align = "center",
}: {
  src: string;
  alt: string;
  kind?: MediaKind;
  /**
   * 絵の置き方。`center`（既定）= 枠いっぱいの地の中央に置く。
   * `start` = 枠を絵の大きさに縮めて左に寄せる（横に入力欄などを並べる詳細画面で、
   * 縦長の写真が広い地の真ん中に浮かないように）
   */
  align?: "center" | "start";
  /** 絵の下の説明 */
  caption?: ReactNode;
  /** 押すと画面いっぱいで見る（`MediaViewer` を開く）。画像のときだけ効く */
  onZoom?: () => void;
  zoomLabel?: string;
}) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const broken = brokenSrc === src;
  let body: ReactNode;
  if (kind === "video") {
    body = <video src={src} controls playsInline preload="metadata" aria-label={alt} />;
  } else if (kind === "audio") {
    body = <audio src={src} controls preload="metadata" aria-label={alt} />;
  } else if (kind === "image" && !broken) {
    // eslint-disable-next-line @next/next/no-img-element -- 部品はフレームワーク非依存
    const img = (
      <img
        src={src}
        alt={alt}
        onError={() => setBrokenSrc(src)}
        ref={(el) => {
          if (el && el.complete && el.naturalWidth === 0) setBrokenSrc(src);
        }}
      />
    );
    body = onZoom ? (
      <button type="button" className="bf-mediafigure__zoom" onClick={onZoom} aria-label={`${alt}を${zoomLabel}`}>
        {img}
      </button>
    ) : (
      img
    );
  } else {
    body = (
      <span className="bf-mediafigure__broken" role="img" aria-label={`${alt}（表示できません）`}>
        <KindIcon kind={kind} broken={kind === "image"} />
        <span aria-hidden="true">表示できません</span>
      </span>
    );
  }
  return (
    <figure className="bf-mediafigure" data-kind={kind} data-align={align}>
      <div className="bf-mediafigure__frame">{body}</div>
      {caption && <figcaption className="bf-mediafigure__caption">{caption}</figcaption>}
    </figure>
  );
}

export type MediaViewerItem = {
  id: string;
  src: string;
  alt: string;
  kind?: MediaKind;
  /** 上の帯に出す名前 */
  title?: ReactNode;
  /** 下に出す説明 */
  caption?: ReactNode;
};

export function MediaViewer({
  items,
  index,
  onIndexChange,
  onClose,
  actions,
  label = "写真を大きく表示",
}: {
  items: MediaViewerItem[];
  /** 見ている位置。null で閉じている */
  index: number | null;
  onIndexChange?: (next: number) => void;
  onClose: () => void;
  /** 右上に置く操作（ダウンロード等）。見ているものを受け取る */
  actions?: (item: MediaViewerItem) => ReactNode;
  label?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const open = index !== null && index >= 0 && index < items.length;
  const count = items.length;
  const canMove = count > 1 && onIndexChange !== undefined;

  const move = (delta: number) => {
    if (!canMove || index === null) return;
    onIndexChange?.((index + delta + count) % count);
  };
  const moveRef = useRef(move);
  moveRef.current = move;

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      const back = returnFocusRef.current;
      if (back instanceof HTMLElement) back.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
      else if (e.key === "ArrowLeft") moveRef.current(-1);
      else if (e.key === "ArrowRight") moveRef.current(1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || index === null) return null;
  const item = items[index];
  const kind = item.kind ?? "image";

  return (
    <div
      className="bf-mediaviewer"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bf-mediaviewer__bar">
        <span className="bf-mediaviewer__title">
          {item.title ?? item.alt}
          {count > 1 && (
            <span className="bf-mediaviewer__count">
              {index + 1} / {count}
            </span>
          )}
        </span>
        <span className="bf-mediaviewer__actions">
          {actions?.(item)}
          <button ref={closeRef} type="button" className="bf-mediaviewer__btn" onClick={onClose} aria-label="閉じる" title="閉じる">
            <X aria-hidden="true" />
          </button>
        </span>
      </div>

      <div
        className="bf-mediaviewer__stage"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {canMove && (
          <button type="button" className="bf-mediaviewer__btn bf-mediaviewer__nav" data-dir="prev" onClick={() => move(-1)} aria-label="前へ" title="前へ">
            <ChevronLeft aria-hidden="true" />
          </button>
        )}
        {kind === "video" ? (
          <video key={item.id} src={item.src} controls playsInline autoPlay aria-label={item.alt} />
        ) : kind === "audio" ? (
          <audio key={item.id} src={item.src} controls aria-label={item.alt} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- 部品はフレームワーク非依存
          <img key={item.id} src={item.src} alt={item.alt} />
        )}
        {canMove && (
          <button type="button" className="bf-mediaviewer__btn bf-mediaviewer__nav" data-dir="next" onClick={() => move(1)} aria-label="次へ" title="次へ">
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </div>

      {item.caption && <div className="bf-mediaviewer__caption">{item.caption}</div>}
    </div>
  );
}
