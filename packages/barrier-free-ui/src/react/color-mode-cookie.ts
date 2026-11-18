
export type BfColorMode = "light" | "dark";

export const BF_MODE_COOKIE = "qaito_bf_mode";

export function parseBfColorMode(value: unknown): BfColorMode | null {
  return value === "light" || value === "dark" ? value : null;
}

/** 描画前に走る復元スクリプト（Cookie が無いときは何もしない＝明るい） */
export function buildColorModeInitScript(): string {
  return (
    "(function(){try{var s=null,m,r=/(?:^|;\\s*)" +
    BF_MODE_COOKIE +
    "=(light|dark)(?=;|$)/g;while((m=r.exec(document.cookie)))s=m[1];" +
    "if(s)document.documentElement.classList.toggle('dark',s==='dark');}catch(x){}})();"
  );
}
