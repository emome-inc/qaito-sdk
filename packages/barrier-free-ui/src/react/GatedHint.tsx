"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { Lock } from "lucide-react";
import { useBubbleDismiss } from "./useBubbleDismiss";

export type GatedHintTone = "perm" | "neutral";

type GatedChildProps = {
  className?: string;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  "aria-disabled"?: boolean | "true" | "false";
  "aria-describedby"?: string;
};

export type GatedHintProps = {
  /** 押せない理由（null / 空なら押せる = 子をそのまま描く） */
  reason: string | null | undefined;
  /** 吹き出しの id（必須・安定した値） */
  id: string;
  /** perm = 権限が無い（濃い灰色 + 鍵）/ neutral = 締め済みなど権限でない理由（薄い灰色・印なし）。既定は perm */
  tone?: GatedHintTone;
  /** true で見た目（灰色・鍵・吹き出しの箱）を外し、働きだけにする。見た目は className / bubbleClassName で差し込む */
  unstyled?: boolean;
  /** 押せないときに子に足す class（盤面などの独自の見た目） */
  className?: string;
  /** 吹き出しに足す class */
  bubbleClassName?: string;
  /** 対象がブロック要素（行・カード・表のマスいっぱい）のとき true */
  block?: boolean;
  /**
   * 押せる要素 1 つ（button / a / role="button" の要素）。props の型は問わない（中で className・aria の欄だけを読む）。
   * Server Component から渡した子（RSC の要素）でもよい
   */
  children: ReactElement;
};

const stop = (e: SyntheticEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * 押せない理由がある間、包みの span の **capture** で押す操作を止める（子を clone できないときも効く）。
 * Enter・Space だけを止め、Tab などの移動は通す。リンクの子は click の既定（遷移）を止める。
 */
const blockKeys = (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") stop(e);
};

export function GatedHint({ reason, id, tone = "perm", unstyled = false, className, bubbleClassName, block = false, children }: GatedHintProps): ReactNode {
  const dismiss = useBubbleDismiss();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!reason) return children;

  let content: ReactNode = children;
  if (mounted && isValidElement(children)) {
    const child = children as ReactElement<GatedChildProps>;
    const childClass = [child.props.className, unstyled ? null : `bf-gated bf-gated--${tone}`, className].filter(Boolean).join(" ");
    content = cloneElement(child, {
      className: childClass || undefined,
      disabled: undefined,
      "aria-disabled": "true",
      "aria-describedby": [...new Set([...(child.props["aria-describedby"] ?? "").split(" "), id].filter(Boolean))].join(" "),
      onClick: stop,
      onKeyDown: blockKeys,
    });
  }

  return (
    <span
      className="bf-hoverhint bf-gated-hint"
      data-block={block ? "" : undefined}
      data-gated={unstyled ? undefined : tone}
      {...dismiss}
      onClickCapture={stop}
      onAuxClickCapture={stop}
      onKeyDownCapture={blockKeys}
    >
      <span className="bf-hoverhint__target">
        {content}
        {!unstyled && tone === "perm" ? <Lock size={10} aria-hidden="true" className="bf-gated__lock" /> : null}
      </span>
      <span className={["bf-hoverhint__bubble", unstyled ? null : "bf-gated__bubble", bubbleClassName].filter(Boolean).join(" ")} role="tooltip" id={id}>
        {reason}
      </span>
    </span>
  );
}
