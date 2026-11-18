import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { TextareaAutosize } from "./TextareaAutosize";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={`bf-input${className ? ` ${className}` : ""}`} {...rest} />
  );
}

export function Textarea({
  className,
  rows = 4,
  autosize = false,
  minRows,
  maxRows,
  maxChars,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /**
   * 入力量に応じて高さを伸ばす（既定 false = 従来どおり固定 rows + 手動リサイズ）。
   * 自由記述（記録の特記事項・申し送り等）は true にする。
   */
  autosize?: boolean;
  /** autosize 時の最低行数。既定は rows */
  minRows?: number;
  /** autosize 時の最大行数（超えたらスクロール）。既定 12 */
  maxRows?: number;
  /** autosize 時の文字数の上限（欄の下に字数を出す。`TextareaAutosize` の maxChars） */
  maxChars?: number;
}) {
  if (autosize) {
    return (
      <TextareaAutosize
        className={className}
        minRows={minRows ?? rows}
        maxRows={maxRows}
        maxChars={maxChars}
        {...rest}
      />
    );
  }
  return (
    <textarea
      rows={rows}
      className={`bf-textarea${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}

export function SearchInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="bf-search">
      <svg
        className="bf-search__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <Input type="search" className={className} {...rest} />
    </div>
  );
}
