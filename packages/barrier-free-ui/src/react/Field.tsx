import {
  useId,
  type ReactNode,
} from "react";

export type FieldRenderProps = {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
};

export function Field({
  label,
  hint,
  error,
  required = false,
  id: idProp,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /**
   * フィールド id を明示指定する。省略時は useId() で自動採番。
   * SSR フォーム（auth 等）で server/client の useId tree-context がズレて
   * hydration mismatch を起こす場合、安定 id を渡して回避する。
   */
  id?: string;
  children: (props: FieldRenderProps) => ReactNode;
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="bf-field">
      <label className="bf-field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="bf-field__required" aria-hidden="true">
            必須
          </span>
        )}
      </label>
      {hint && (
        <p className="bf-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error && (
        <p className="bf-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
