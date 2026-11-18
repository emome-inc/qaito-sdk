/**
 * @qaito/sdk/app-auth/session-guard — ログインセッション切れの扱い（ブラウザ側）。
 *
 * 組み込みの外部アプリ（QaitoChat・ピアッザ）の画面が使う。サーバ側の `createAppAuth().session`
 * （確認 + 必要なら延長）を呼び、次を 1 か所で持つ:
 *   - 延長（トークンのローテーション）を**同じタブ内・タブ間で重ねない**。旧 refresh token は先に失効するので、
 *     同じ refresh token で並行に延長すると後発は INVALID_GRANT になり、延長できるのにログインへ落とす
 *   - 401 を受けたら延長を試し、延長できたら 1 回だけ再送、できなければ入力を退避してログイン画面へ
 *   - 確かめられない（通信断）ときはログインへ落とさない
 *
 * キー・エンドポイント・戻す先は引数で受ける（アプリごとに別にする）。React に依存しない。
 */

/** ロックの寿命（取ったタブが落ちても、これを過ぎれば他のタブが進める） */
export const REFRESH_LOCK_TTL_MS = 10_000;
/** 送信前の確認を省略してよい間隔（直近に確認済みなら往復しない） */
export const PRE_SEND_CHECK_INTERVAL_MS = 60_000;

/** `ok` = 使える / `expired` = 延長できない / `unknown` = 確かめられなかった（通信断など） */
export type SessionStatus = "ok" | "expired" | "unknown";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type SessionGuardDeps = {
  /** 確認 + 延長のエンドポイント（`createAppAuth` の `session` を置いたパス。例 `/api/auth/session`） */
  endpoint: string;
  /** タブ間ロックの localStorage キー（アプリごとに別にする） */
  lockKey: string;
  /** ログイン画面へ戻す直前の入力を退避する sessionStorage のキー */
  draftKey: string;
  /** 延長できないときに戻す先（例 `/?reason=session_expired`） */
  expiredPath: string;
  fetch: typeof fetch;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  /** タブ間ロック用（localStorage）。使えない環境では null（タブ内の抑止だけになる） */
  lockStorage: StorageLike | null;
  /** 入力の退避用（sessionStorage） */
  draftStorage: StorageLike | null;
  navigate: (url: string) => void;
  /** このタブの識別子（ロックの持ち主） */
  tabId: string;
};

type LockValue = { owner: string; until: number };

function readLock(storage: StorageLike, lockKey: string): LockValue | null {
  try {
    const raw = storage.getItem(lockKey);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<LockValue>;
    if (typeof v.owner !== "string" || typeof v.until !== "number") return null;
    return { owner: v.owner, until: v.until };
  } catch {
    return null;
  }
}

export function createSessionGuard(deps: SessionGuardDeps) {
  let inFlight: Promise<SessionStatus> | null = null;
  let lastOkAt = 0;
  let redirecting = false;
  let draftSource: (() => string) | null = null;

  async function callEndpoint(): Promise<SessionStatus> {
    try {
      const res = await deps.fetch(deps.endpoint, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.ok) return "ok";
      if (res.status === 401) return "expired";
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * 他のタブが延長中なら終わるまで待ってから実行する。
   * localStorage に原子的な取得は無いので、書いた直後に読み直して持ち主を確かめる
   * （完全ではないが、重なる窓は数 ms まで縮む。重なった場合も後発の失敗は
   *  サーバ側で「延長済みの cookie を確かめ直す」ことで救われる — 下の再確認を参照）。
   */
  async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
    const storage = deps.lockStorage;
    if (!storage) return fn();
    const deadline = deps.now() + REFRESH_LOCK_TTL_MS;
    for (;;) {
      const held = readLock(storage, deps.lockKey);
      if (!held || held.owner === deps.tabId || held.until <= deps.now() || deps.now() >= deadline) break;
      await deps.sleep(150);
    }
    let owned = false;
    try {
      storage.setItem(
        deps.lockKey,
        JSON.stringify({ owner: deps.tabId, until: deps.now() + REFRESH_LOCK_TTL_MS } satisfies LockValue),
      );
      owned = readLock(storage, deps.lockKey)?.owner === deps.tabId;
    } catch {
    }
    try {
      return await fn();
    } finally {
      if (owned) {
        try {
          if (readLock(storage, deps.lockKey)?.owner === deps.tabId) storage.removeItem(deps.lockKey);
        } catch {
        }
      }
    }
  }

  /**
   * セッションを確かめる（必要ならサーバが延長する）。
   * @param maxAgeMs この時間内に `ok` を確認済みなら往復せずに `ok` を返す
   */
  function ensureSession(opts?: { maxAgeMs?: number }): Promise<SessionStatus> {
    if (redirecting) return Promise.resolve("expired");
    if (opts?.maxAgeMs !== undefined && lastOkAt > 0 && deps.now() - lastOkAt < opts.maxAgeMs) {
      return Promise.resolve("ok");
    }
    if (inFlight) return inFlight;
    const task = (async () => {
      let status = await withCrossTabLock(callEndpoint);
      if (status === "expired") status = await callEndpoint();
      if (status === "ok") lastOkAt = deps.now();
      return status;
    })();
    inFlight = task;
    void task.finally(() => {
      if (inFlight === task) inFlight = null;
    });
    return task;
  }

  /** ログイン画面へ戻す。入力中の文章は退避して、戻ってきたら入力欄に戻す（自動送信はしない） */
  function goToLoginExpired(draftOverride?: string): void {
    if (redirecting) return;
    redirecting = true;
    const draft = draftOverride ?? draftSource?.() ?? "";
    if (draft.trim() && deps.draftStorage) {
      try {
        deps.draftStorage.setItem(deps.draftKey, draft);
      } catch {
      }
    }
    deps.navigate(deps.expiredPath);
  }

  /**
   * 401 を受けたときに呼ぶ。延長できたら true（呼び出し側は 1 回だけ再送してよい）。
   * 延長できなければログインへ戻して false。確かめられないとき（通信断）は戻さずに false。
   */
  async function handleUnauthorized(): Promise<boolean> {
    if (redirecting) return false;
    lastOkAt = 0;
    const status = await ensureSession();
    if (status === "ok") return true;
    if (status === "expired") goToLoginExpired();
    return false;
  }

  /**
   * 送信前の確認。送ってよければ true。
   * 延長できないときはログインへ戻して false（入力は消さずに退避する）。
   * 確かめられないとき（通信断）は送信を止めない — 送信自体のエラー表示に任せる。
   */
  async function checkBeforeSend(): Promise<boolean> {
    const status = await ensureSession({ maxAgeMs: PRE_SEND_CHECK_INTERVAL_MS });
    if (status === "expired") {
      goToLoginExpired();
      return false;
    }
    return !redirecting;
  }

  /**
   * fetch の包み。401 なら延長を試し、延長できたら 1 回だけ再送する。
   * 延長できなければログインへ戻し、401 の応答をそのまま返す（呼び出し側は通常のエラーとして扱う）。
   *
   * ⚠️ 再送するので body は使い回せる形（文字列・FormData・Blob）に限る。ストリームは不可。
   */
  async function fetchWithSession(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const res = await deps.fetch(input, init);
    if (res.status !== 401) return res;
    if (!(await handleUnauthorized())) return res;
    return deps.fetch(input, init);
  }

  return {
    ensureSession,
    handleUnauthorized,
    checkBeforeSend,
    fetchWithSession,
    goToLoginExpired,
    /** ログイン画面へ戻すときに退避する「今の入力」を返す関数を登録する */
    setDraftSource(fn: (() => string) | null) {
      draftSource = fn;
    },
    /** 戻す処理を始めたか（二重に戻さない・戻す途中で別の表示を出さないため） */
    isRedirecting: () => redirecting,
  };
}

export type SessionGuard = ReturnType<typeof createSessionGuard>;

/** ログイン画面から戻ったあと、退避した入力を 1 回だけ取り出す（取り出したら消す） */
export function takeSavedDraft(storage: StorageLike | null, draftKey: string): string | null {
  if (!storage) return null;
  try {
    const v = storage.getItem(draftKey);
    if (v !== null) storage.removeItem(draftKey);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}
