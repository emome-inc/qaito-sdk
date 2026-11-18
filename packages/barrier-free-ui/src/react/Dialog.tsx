"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** ダイアログ幅。sm=24rem / md=32rem（既定）/ lg=48rem（入力フォーム）/ xl=64rem */
export type DialogSize = "sm" | "md" | "lg" | "xl";

export function Dialog({
  open,
  title,
  titleAction,
  description,
  body,
  children,
  onClose,
  size = "md",
  scroll = "body",
  height,
  placement = "center",
}: {
  open: boolean;
  title: ReactNode;
  /**
   * タイトル行の右端に置く部品（例: バイタル入力のマイク）。本文に置くと入力欄と混ざるので、
   * 「このダイアログ全体に効く操作」はここに置く。
   */
  titleAction?: ReactNode;
  description?: ReactNode;
  /**
   * 本文スロット（入力フォーム等）。title/description の下・フッターの上に全幅で並ぶ。
   * 確認ダイアログでは不要。入力を伴うダイアログはフォーム要素をここに渡す
   * （`children`＝フッターは右寄せ横並びなので、フォームを入れると崩れる）。
   */
  body?: ReactNode;
  /** フッターのアクション（確定・キャンセル等）。右寄せ横並びで配置される */
  children?: ReactNode;
  onClose: () => void;
  /** 幅。既定 "md"。入力フォームを載せるなら "lg" / "xl" */
  size?: DialogSize;
  /**
   * 縦に溢れたときにどこをスクロールさせるか。
   * - `"body"`（既定）: タイトルごと本文全体がスクロールする（フッターは固定）。
   * - `"content"`: タイトル行と本文の外枠は動かさず、**本文の中の 1 か所だけ**をスクロールさせる。
   *   本文（`body`）は高さいっぱいの縦の flex になるので、渡す側は固定したい部分をそのまま並べ、
   *   スクロールさせたい部分に `className="bf-dialog__scroll"` を付ける（申し送りの履歴など、
   *   入力欄と送信は常に見せて一覧だけを流す画面用）。
   */
  scroll?: "body" | "content";
  /**
   * 高さを**固定**する（CSS の長さ。例 `"min(32rem, 70dvh)"`）。中身の量に関係なく同じ高さで、
   * 余りは空いたまま・溢れた分は `scroll` の指定どおりにスクロールする（申し送りのように
   * 件数で大きさが変わると落ち着かない画面用）。画面の高さ − 余白 は超えない。省くと中身なりの高さ。
   */
  height?: string;
  /** Narrow screens can present this dialog as a bottom sheet. */
  placement?: "center" | "bottom";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !e.defaultPrevented) onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="bf-dialog__backdrop"
      data-placement={placement}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="bf-dialog"
        data-size={size}
        data-scroll={scroll === "content" ? "content" : undefined}
        data-fixed-height={height ? "" : undefined}
        role="alertdialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        onKeyDown={placement === "bottom" ? (event) => {
          if (event.key !== "Tab") return;
          const controls = [...(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? [])].filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls.at(-1);
          if (!first) { event.preventDefault(); return; }
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
            event.preventDefault(); last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        } : undefined}
        style={height ? ({ "--bf-dialog-h": height } as CSSProperties) : undefined}
      >
        <div className="bf-dialog__body">
          {titleAction ? (
            <div className="bf-dialog__head">
              <h2 className="bf-dialog__title">{title}</h2>
              {titleAction}
            </div>
          ) : (
            <h2 className="bf-dialog__title">{title}</h2>
          )}
          {description && <p className="bf-dialog__desc">{description}</p>}
          {body && <div className="bf-dialog__content">{body}</div>}
        </div>
        {children && <div className="bf-dialog__actions">{children}</div>}
      </div>
    </div>
  );
}
