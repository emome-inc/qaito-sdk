"use client";
import { useId, type ReactNode } from "react";
import { useBubbleDismiss } from "./useBubbleDismiss";

export function Tooltip({
  id: idProp,
  label,
  children,
}: {
  id?: string;
  label: ReactNode;
  children: ReactNode;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const dismiss = useBubbleDismiss();
  return (
    <span className="bf-tooltip" {...dismiss}>
      <span aria-describedby={id}>{children}</span>
      <span className="bf-tooltip__bubble" role="tooltip" id={id}>
        {label}
      </span>
    </span>
  );
}
