import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "error"
  | "info";

export type BadgeSize = "sm" | "md";

export function Badge({
  tone = "neutral",
  size = "md",
  children,
}: {
  tone?: BadgeTone;
  size?: BadgeSize;
  children: ReactNode;
}) {
  return (
    <span className="bf-badge" data-tone={tone} data-size={size === "sm" ? "sm" : undefined}>
      {children}
    </span>
  );
}
