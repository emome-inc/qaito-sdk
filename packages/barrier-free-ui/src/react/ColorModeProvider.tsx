"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BF_MODE_COOKIE, buildColorModeInitScript, type BfColorMode } from "./color-mode-cookie";

export type { BfColorMode } from "./color-mode-cookie";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type ColorModeContextValue = { mode: BfColorMode; setMode: (mode: BfColorMode) => void };

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

type InitialColorMode = { mode: BfColorMode | null; cookieDomain?: string };
const InitialColorModeContext = createContext<InitialColorMode>({ mode: null });

/** ルートのレイアウトが Cookie から読んだ明るさと、書き込み先のドメイン（未指定はホストのみ）を渡す */
export function ColorModeCookieProvider({
  mode,
  cookieDomain,
  children,
}: {
  mode: BfColorMode | null;
  cookieDomain?: string;
  children: ReactNode;
}) {
  return <InitialColorModeContext.Provider value={{ mode, cookieDomain }}>{children}</InitialColorModeContext.Provider>;
}

function writeModeCookie(mode: BfColorMode, domain?: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const dom = domain ? `; domain=${domain}` : "";
  document.cookie = `${BF_MODE_COOKIE}=${mode}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${dom}${secure}`;
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const initial = useContext(InitialColorModeContext);
  const [mode, setModeState] = useState<BfColorMode>(initial.mode ?? "light");
  const userChanged = useRef(false);

  useEffect(() => {
    if (!userChanged.current) return;
    document.documentElement.classList.toggle("dark", mode === "dark");
    writeModeCookie(mode, initial.cookieDomain);
  }, [mode, initial.cookieDomain]);

  const setMode = useCallback((next: BfColorMode) => {
    userChanged.current = true;
    setModeState(next);
  }, []);

  return (
    <ColorModeContext.Provider value={{ mode, setMode }}>
      {initial.mode === null && <script dangerouslySetInnerHTML={{ __html: buildColorModeInitScript() }} />}
      {children}
    </ColorModeContext.Provider>
  );
}

export function useBfColorMode(): ColorModeContextValue {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error("useBfColorMode must be used within <ColorModeProvider>");
  return ctx;
}
