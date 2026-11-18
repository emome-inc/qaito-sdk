import { type ReactNode } from "react";

export type StepDef = { label: ReactNode };

export function Steps({
  steps,
  current,
  selected,
  onStepSelect,
  compact,
}: {
  steps: StepDef[];
  current: number;
  /** 表示中ステップ（0-based）。onStepSelect とセットで使う */
  selected?: number;
  /** ステップクリック時のコールバック。渡すと各ステップが button になる */
  onStepSelect?: (index: number) => void;
  /** 表のセルなど狭い所用の小さい表示。onStepSelect とは併用しない */
  compact?: boolean;
}) {
  return (
    <ol className="bf-steps" data-compact={compact || undefined}>
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        const last = i === steps.length - 1;
        const inner = (
          <>
            <span className="bf-step__num" aria-hidden="true">
              {i < current ? (
                <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className="bf-step__label">{s.label}</span>
          </>
        );
        return (
          <li
            className="bf-step"
            key={i}
            data-state={state}
            aria-current={i === current ? "step" : undefined}
          >
            {onStepSelect ? (
              <button
                type="button"
                className="bf-step__button"
                data-selected={i === selected || undefined}
                aria-pressed={i === selected}
                onClick={() => onStepSelect(i)}
              >
                {inner}
              </button>
            ) : (
              inner
            )}
            {!last && <span className="bf-step__line" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
