import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className={`bf-button${className ? ` ${className}` : ""}`}
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="bf-button__busy" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function buttonLinkProps(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): { className: string; "data-variant": ButtonVariant; "data-size": ButtonSize } {
  return {
    className: `bf-button${className ? ` ${className}` : ""}`,
    "data-variant": variant,
    "data-size": size,
  };
}

/** `loading` のときはアイコンの代わりに小さい輪を出し、押せなくして `aria-busy` を付ける（大きさは変わらない） */
export function IconButton({
  label,
  loading = false,
  children,
  className,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`bf-iconbutton${className ? ` ${className}` : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="bf-button__busy bf-button__busy--icon" aria-hidden="true" /> : children}
    </button>
  );
}
