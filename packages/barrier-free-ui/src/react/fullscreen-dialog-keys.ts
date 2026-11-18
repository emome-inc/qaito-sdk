
/** フォーカスを当てられるもの（HTMLElement の一部） */
export type FocusTarget = { focus(): void };

/** 枠の中でフォーカスを当てられるもの（見えていて、押せるもの） */
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * キーを 1 つ受けて、Esc なら閉じる・Tab なら枠の端で反対の端へ回す。
 * - `focusables` は枠の中のフォーカスを当てられるものを並び順で（空なら Tab は枠に留めるだけ）
 * - `active` は今フォーカスのあるもの（枠の外・題などの `tabindex="-1"` のときは端から入れ直す）
 */
export function handleFullscreenDialogKey(
  e: { key: string; shiftKey: boolean; defaultPrevented?: boolean; preventDefault(): void },
  ctx: { focusables: readonly FocusTarget[]; active: unknown; onClose: () => void },
): void {
  if (e.defaultPrevented) return;
  if (e.key === "Escape") {
    ctx.onClose();
    return;
  }
  if (e.key !== "Tab") return;
  const list = ctx.focusables;
  if (list.length === 0) {
    e.preventDefault();
    return;
  }
  const first = list[0];
  const last = list[list.length - 1];
  const at = list.indexOf(ctx.active as FocusTarget);
  if (e.shiftKey && (at <= 0)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (at === -1 || at === list.length - 1)) {
    e.preventDefault();
    first.focus();
  }
}

/** 閉じたら、開く前にフォーカスのあったもの（開いたボタン）へ戻す。画面から消えていれば戻さない */
export function restoreFocus(opener: (FocusTarget & { isConnected: boolean }) | null): void {
  if (opener?.isConnected) opener.focus();
}

/** 戻し先として探すもの（画面にまだ居るかを見る） */
export type ReturnTarget = FocusTarget & { isConnected: boolean };

/**
 * 閉じたあとの戻し先を呼ぶ側が決めるとき（`returnFocusTo`）。戻し先は閉じた直後にはまだ無いことがある
 * （保存して画面を読み直すと、格子の予定の帯が作り直される）ので、見つかるまで `schedule` で少し待って探し直す。
 * 最後の 1 回は `lastTry = true` で呼ぶ（呼ぶ側はここで代わりの戻し先を返せる）。それでも無ければ開いたボタンへ戻す
 */
export function returnFocus(
  find: ((lastTry: boolean) => ReturnTarget | null) | undefined,
  opener: ReturnTarget | null,
  schedule: (fn: () => void) => void,
  tries = 20,
): void {
  if (!find) {
    restoreFocus(opener);
    return;
  }
  let n = 0;
  const attempt = () => {
    const lastTry = n >= tries - 1;
    const el = find(lastTry);
    if (el?.isConnected) {
      el.focus();
      return;
    }
    if (lastTry) {
      restoreFocus(opener);
      return;
    }
    n += 1;
    schedule(attempt);
  };
  attempt();
}
