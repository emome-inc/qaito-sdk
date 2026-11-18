import { createElement, type FormHTMLAttributes, type ReactNode } from "react";

export type ComposerToolsPlacement = "start" | "top";

export type ComposerProps = Omit<FormHTMLAttributes<HTMLFormElement>, "children"> & {
  /** 外側の要素。送信を受けるなら "form"、外側に form がある面は "div" */
  as?: "form" | "div";
  /** 道具のボタン群（bf-iconbutton / IconButton）。無ければ省略 */
  tools?: ReactNode;
  /** 道具の置き場（既定 "start" = 入力欄の左） */
  toolsPlacement?: ComposerToolsPlacement;
  /** 入力欄（.bf-composer__input）と送信（.bf-composer__send）。この順に書く */
  children: ReactNode;
};

export function Composer({
  as = "form",
  tools,
  toolsPlacement = "start",
  className,
  children,
  ...rest
}: ComposerProps) {
  const classes = ["bf-composer", `bf-composer--tools-${toolsPlacement}`, className].filter(Boolean).join(" ");
  return createElement(
    as,
    { ...rest, className: classes },
    tools != null && tools !== false ? <div className="bf-composer__tools">{tools}</div> : null,
    children,
  );
}
