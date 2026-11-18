"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";

export type ActionItem = {
  label: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
};

export function ActionMenu({
  trigger,
  triggerVariant = "secondary",
  items,
  ariaLabel = "操作メニュー",
}: {
  trigger: ReactNode;
  triggerVariant?: ButtonVariant;
  items: ActionItem[];
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="bf-actionmenu" ref={rootRef}>
      <Button
        variant={triggerVariant}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </Button>
      {open && (
        <div className="bf-actionmenu__panel" role="menu" aria-label={ariaLabel}>
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className="bf-actionmenu__item"
              data-danger={it.danger ? "true" : undefined}
              onClick={() => {
                setOpen(false);
                it.onClick?.();
              }}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
