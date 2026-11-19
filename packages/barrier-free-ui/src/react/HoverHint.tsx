"use client";

import { useId, type ReactNode } from "react";
import { useBubbleDismiss } from "./useBubbleDismiss";

export function HoverHint({
  hint,
  children,
  block = false,
  id,
}: {
  /** 吹き出しに出す説明。空 / undefined なら何もしない（children をそのまま描画） */
  hint?: ReactNode;
  children: ReactNode;
  /** 対象がブロック要素（カード・行全体）のとき true（既定は inline-flex） */
  block?: boolean;
  /**
   * 安定 id。**subdomain rewrite で配信される面（console / portal / モジュール画面）では必須**
   * （useId は rewrite 面で SSR/CSR がズレて hydration mismatch を起こす）。
   * chat 等の直接配信面では省略可（useId フォールバック）。
   */
  id?: string;
}) {
  const autoId = useId();
  const hintId = id ?? autoId;
  const dismiss = useBubbleDismiss();
  if (hint === undefined || hint === null || hint === "") return <>{children}</>;
  return (
    <span className="bf-hoverhint" data-block={block ? "" : undefined} {...dismiss}>
      <span className="bf-hoverhint__target" aria-describedby={hintId}>
        {children}
      </span>
      <span className="bf-hoverhint__bubble" role="tooltip" id={hintId}>
        {hint}
      </span>
    </span>
  );
}
