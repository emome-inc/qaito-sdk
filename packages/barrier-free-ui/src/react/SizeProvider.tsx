"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useBubblePlacement } from "./bubble-placement";
import { BF_SIZE_COOKIE, buildSizeInitScript, parseBfSize, type BfSize } from "./size-cookie";

export type { BfSize } from "./size-cookie";

const SIZE_CLASSES: Record<BfSize, string> = {
  sm: "bf-size-sm",
  md: "bf-size-md",
  lg: "bf-size-lg",
};

/** Cookie の有効期間（1 年）。端末を替えない限り選び直さなくてよい */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type SizeContextValue = {
  size: BfSize;
  setSize: (size: BfSize) => void;
};

const SizeContext = createContext<SizeContextValue | null>(null);

/** サーバーが Cookie から読んだ値と、書き込み先のドメイン */
type InitialSize = { size: BfSize | null; cookieDomain?: string };
const InitialSizeContext = createContext<InitialSize>({ size: null });

/**
 * ルートのレイアウト（Server Component）が Cookie から読んだサイズを配下へ渡す。
 * `cookieDomain` は書き込み先（例 `.app.qaito.ai`。サブドメイン間で共有する）。未指定はホストのみ。
 */
export function SizeCookieProvider({
  size,
  cookieDomain,
  children,
}: {
  size: BfSize | null;
  cookieDomain?: string;
  children: ReactNode;
}) {
  return <InitialSizeContext.Provider value={{ size, cookieDomain }}>{children}</InitialSizeContext.Provider>;
}

function applySizeClass(target: HTMLElement, size: BfSize) {
  for (const cls of Object.values(SIZE_CLASSES)) target.classList.remove(cls);
  target.classList.add(SIZE_CLASSES[size]);
}

function writeSizeCookie(size: BfSize, domain?: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const dom = domain ? `; domain=${domain}` : "";
  document.cookie = `${BF_SIZE_COOKIE}=${size}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${dom}${secure}`;
}

export function SizeProvider({
  children,
  defaultSize = "md",
  /** クラスを付与する要素。既定は <html>（ページ全体に連動）。 */
  target = "html",
}: {
  children: ReactNode;
  defaultSize?: BfSize;
  target?: "html" | "body";
}) {
  const initial = useContext(InitialSizeContext);
  const [size, setSizeState] = useState<BfSize>(initial.size ?? defaultSize);
  const userChanged = useRef(false);

  useBubblePlacement();

  useEffect(() => {
    if (initial.size) return;
    let stored: BfSize | null = null;
    try {
      stored = parseBfSize(window.localStorage.getItem(BF_SIZE_COOKIE));
      if (stored) {
        writeSizeCookie(stored, initial.cookieDomain);
        window.localStorage.removeItem(BF_SIZE_COOKIE);
      }
    } catch {
    }
    if (stored && stored !== size) setSizeState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userChanged.current) return;
    const el = target === "body" ? document.body : document.documentElement;
    applySizeClass(el, size);
    writeSizeCookie(size, initial.cookieDomain);
  }, [size, target, initial.cookieDomain]);

  const setSize = useCallback((next: BfSize) => {
    userChanged.current = true;
    setSizeState(next);
  }, []);

  return (
    <SizeContext.Provider value={{ size, setSize }}>
      <script dangerouslySetInnerHTML={{ __html: buildSizeInitScript(target, initial.size ?? defaultSize) }} />
      {children}
    </SizeContext.Provider>
  );
}

export function useBfSize(): SizeContextValue {
  const ctx = useContext(SizeContext);
  if (!ctx) {
    throw new Error("useBfSize must be used within <SizeProvider>");
  }
  return ctx;
}
