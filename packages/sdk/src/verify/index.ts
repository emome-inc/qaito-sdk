
export type QaitoAppManifest = {
  sdk: "@qaito/sdk";
  name: string;
  /** アプリが Qaito ログインに使う OAuth クライアント ID（公開識別子）。検証 V4 で照合される */
  client_id: string;
  /** リクエストの ?challenge= をそのまま返す（Qaito 側が一致を確認する） */
  challenge: string | null;
};

/** Web 標準 Request → Response のハンドラを返す（Next.js Route Handler にそのまま渡せる） */
export function qaitoAppManifest(opts: { name: string; clientId: string }): (req: Request) => Response {
  return (req: Request) => {
    const challenge = new URL(req.url).searchParams.get("challenge");
    const body: QaitoAppManifest = {
      sdk: "@qaito/sdk",
      name: opts.name,
      client_id: opts.clientId,
      challenge,
    };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  };
}
