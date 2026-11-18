"use client";

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type TabDef = { value: string; label: ReactNode; count?: number };

export function Tabs({
  tabs,
  defaultValue,
  value,
  children,
  id,
  onChange,
}: {
  tabs: TabDef[];
  defaultValue?: string;
  /**
   * 制御する場合の現在のタブ。渡すとこちらが正になり、内部の state は使わない。
   * 呼び出し側からタブを切り替える必要があるときだけ使う
   * （例: 入力の不備がある区分へ移ってからブラウザに知らせるフォーム）。
   * 省略時は従来どおり非制御（内部 state が正）。
   */
  value?: string;
  children: (active: string) => ReactNode;
  /** タブ切替時に呼ばれる（URL 同期・永続化用。非制御なら内部 state が正） */
  onChange?: (value: string) => void;
  /**
   * tab/panel の aria id ベース。省略時は useId() で自動採番する。
   * middleware rewrite で配信される面（ポータル / 各モジュールのサブドメイン）では
   * SSR と CSR でツリーパスが食い違い useId() が不一致 → hydration mismatch になるため、
   * そうした面では呼び出し側で安定 id を明示する（Field の id prop と同じ対処）。
   */
  id?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? tabs[0]?.value);
  const active = value ?? uncontrolled;
  const setActive = (v: string) => {
    if (value === undefined) setUncontrolled(v);
    onChange?.(v);
  };
  const autoId = useId();
  const baseId = id ?? autoId;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent, idx: number) {
    const last = tabs.length - 1;
    let t = -1;
    if (e.key === "ArrowRight") t = idx === last ? 0 : idx + 1;
    else if (e.key === "ArrowLeft") t = idx === 0 ? last : idx - 1;
    if (t >= 0) {
      e.preventDefault();
      setActive(tabs[t].value);
      refs.current[t]?.focus();
    }
  }

  return (
    <div className="bf-tabs">
      <div className="bf-tabs__list" role="tablist">
        {tabs.map((t, idx) => {
          const selected = t.value === active;
          return (
            <button
              key={t.value}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.value}`}
              tabIndex={selected ? 0 : -1}
              className="bf-tabs__tab"
              onClick={() => setActive(t.value)}
              onKeyDown={(e) => onKey(e, idx)}
            >
              {t.label}
              {typeof t.count === "number" && (
                <span className="bf-tabs__count">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
      <div
        className="bf-tabs__panel"
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
      >
        {children(active)}
      </div>
    </div>
  );
}
