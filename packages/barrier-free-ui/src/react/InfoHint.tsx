"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { HoverHint } from "./HoverHint";

export function InfoHint({ id, hint, label = "説明を見る" }: { id: string; hint: ReactNode; label?: string }) {
  return (
    <HoverHint id={id} hint={hint}>
      <button type="button" className="bf-info-hint" aria-label={label}>
        <Info size={16} aria-hidden="true" />
      </button>
    </HoverHint>
  );
}
