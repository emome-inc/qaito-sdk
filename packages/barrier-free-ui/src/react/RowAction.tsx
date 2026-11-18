import type { ButtonHTMLAttributes, ElementType, ReactNode } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileOutput,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

export type RowActionKind =
  | "open"
  | "edit"
  | "delete"
  | "cancel"
  | "restore"
  | "add"
  | "approve"
  | "download"
  | "output"
  | "copy";

/** アイコンは**必ず文言の前**（左）。種類で位置を変えない ─ 位置が揃っていないと列が波打って見える
 * （2026-09-11 ユーザー指摘「アイコンが右にあるのか左にあるのかバラバラで気持ち悪い」）。
 * 詳細・開くの矢印も左（「› 詳細」は日本語の画面でよく使われる並び） */
type Preset = { label: string; icon: ReactNode; danger?: boolean };

/** 種類ごとの既定。アイコンは lucide（`icons/index.tsx` と同じ系統）。文言は `label` で差し替え可 */
const PRESETS: Record<RowActionKind, Preset> = {
  open: { label: "開く", icon: <ExternalLink aria-hidden="true" /> },
  edit: { label: "編集", icon: <Pencil aria-hidden="true" /> },
  delete: { label: "削除", icon: <Trash2 aria-hidden="true" />, danger: true },
  cancel: { label: "取消", icon: <X aria-hidden="true" />, danger: true },
  restore: { label: "元に戻す", icon: <RotateCcw aria-hidden="true" /> },
  add: { label: "追加", icon: <Plus aria-hidden="true" /> },
  approve: { label: "承認", icon: <Check aria-hidden="true" /> },
  download: { label: "ダウンロード", icon: <Download aria-hidden="true" /> },
  output: { label: "出力", icon: <FileOutput aria-hidden="true" /> },
  copy: { label: "コピー", icon: <Copy aria-hidden="true" /> },
};

type Common = {
  /** 種類。アイコン・既定の文言・色が決まる */
  kind?: RowActionKind;
  /** 文言の差し替え（「訂正」「解除」など。種類の意味と合うものを選ぶ） */
  label?: ReactNode;
  /** 種類に無い操作のアイコン（lucide を渡す） */
  icon?: ReactNode;
  /** 赤にするか（kind の既定を上書き。取り消せない操作だけ true） */
  danger?: boolean;
  children?: ReactNode;
};

function resolve({ kind, label, icon, danger, children }: Common) {
  const preset = kind ? PRESETS[kind] : undefined;
  return {
    text: children ?? label ?? preset?.label,
    glyph: icon ?? preset?.icon,
    tone: (danger ?? preset?.danger) ? "danger" : "neutral",
  };
}

/** 行の操作ボタン（アイコンのみ）。href を渡すとリンクになる */
export function RowAction(
  props: Common &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
      /** 遷移先。渡すとリンクとして描く */
      href?: string;
      /** リンクに使う部品（Next の `Link` など）。既定は `<a>` */
      linkAs?: ElementType;
      target?: string;
      rel?: string;
    },
) {
  const { kind, label, icon, danger, children, href, linkAs, className, ...rest } = props;
  const { text, glyph, tone } = resolve({ kind, label, icon, danger, children });
  const cls = `bf-rowaction${className ? ` ${className}` : ""}`;
  const ariaLabel =
    (rest as { "aria-label"?: string })["aria-label"] ?? (typeof text === "string" ? text : undefined);
  const iconOnly = glyph !== undefined;
  const inner = iconOnly ? glyph : text;
  if (href !== undefined) {
    const Tag: ElementType = linkAs ?? "a";
    const { type: _type, disabled, ...linkRest } = rest;
    return withTip(
      <Tag
        href={href}
        className={cls}
        data-tone={tone}
        data-icon-only={iconOnly || undefined}
        aria-disabled={disabled || undefined}
        {...(linkRest as Record<string, unknown>)}
        aria-label={ariaLabel}
      >
        {inner}
      </Tag>,
      iconOnly ? text : undefined,
    );
  }
  return withTip(
    <button
      type="button"
      className={cls}
      data-tone={tone}
      data-icon-only={iconOnly || undefined}
      {...rest}
      aria-label={ariaLabel}
    >
      {inner}
    </button>,
    iconOnly ? text : undefined,
  );
}

/**
 * アイコンのみのボタンに文言のツールチップを添える。見た目と画面の端での寄せは
 * Tooltip と共通（tooltip.css / bubble-placement.ts）。読み上げには aria-label が
 * 名前を渡しているので、吹き出しは読み上げない（aria-hidden）─ id を振らずに済むので
 * rewrite 面の useId ずれ（framework doc §7.2）も起きない。
 */
function withTip(control: ReactNode, tip: ReactNode | undefined) {
  if (tip === undefined || tip === null || tip === "") return control;
  return (
    <span className="bf-tooltip">
      {control}
      <span className="bf-tooltip__bubble" aria-hidden="true">
        {tip}
      </span>
    </span>
  );
}

/** 1 つのセルに操作を複数並べるときの入れ物 */
export function RowActions({ children }: { children: ReactNode }) {
  return <span className="bf-rowactions">{children}</span>;
}
