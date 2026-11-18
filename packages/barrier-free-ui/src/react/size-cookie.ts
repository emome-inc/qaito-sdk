
export type BfSize = "sm" | "md" | "lg";

/** 保存に使う名前（Cookie・移行元の localStorage とも同じ） */
export const BF_SIZE_COOKIE = "qaito_bf_size";

/** Cookie の値などを BfSize に絞る。知らない値は null（既定サイズに任せる） */
export function parseBfSize(value: unknown): BfSize | null {
  return value === "sm" || value === "md" || value === "lg" ? value : null;
}

/**
 * 描画前に走る復元スクリプト（ちらつき防止）。SSR の HTML に埋め込まれ、パース時に同期実行される。
 * 同じ名前の Cookie が複数あるときは最後のもの（サーバー側の読み取りと同じ後勝ち）を使う。
 */
export function buildSizeInitScript(target: "html" | "body", defaultSize: BfSize): string {
  const el = target === "body" ? "document.body" : "document.documentElement";
  return (
    "(function(){try{var e=" +
    el +
    ",s=null,m,r=/(?:^|;\\s*)" +
    BF_SIZE_COOKIE +
    "=(sm|md|lg)(?=;|$)/g;while((m=r.exec(document.cookie)))s=m[1];" +
    "if(!s){try{var l=localStorage.getItem('" +
    BF_SIZE_COOKIE +
    "');if(l==='sm'||l==='md'||l==='lg')s=l;}catch(x){}}" +
    "if(!s)s='" +
    defaultSize +
    "';e.classList.remove('bf-size-sm','bf-size-md','bf-size-lg');e.classList.add('bf-size-'+s);}catch(x){}})();"
  );
}
