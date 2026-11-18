/**
 * transport.ts — モジュール別の名前空間が HTTP を呼ぶための唯一の口。
 *
 * 【なぜ要るか】名前空間の実体は `src/{modules,platform}/{slug}.ts` に分かれているが、
 * 通信・認証・401 リトライ・エラー整形は `QaitoClient` が 1 つだけ持つ。
 * 名前空間側が `QaitoClient` を直接 import すると循環参照になるので、
 * **必要な口だけを型で切り出して渡す**。
 *
 * 【なぜ `baseUrl` が値でなく関数か】`QaitoClient` は `baseUrl` を**コンストラクタ本体**で
 * 代入する。一方、名前空間はクラスフィールドの初期化子（`client = createClientNamespace(this.tx)`）
 * で組み立てられ、**クラスフィールドはコンストラクタ本体より先に走る**。
 * 値で持つと `undefined` を焼き込むので、参照を呼び出し時まで遅延させる。
 */

export type ListEnvelope<T> = { data: T; total?: number; has_more?: boolean };

export interface SdkTransport {
  /** ベース URL。パス以外（ダウンロード URL の組み立て等）で要るときだけ使う */
  getBaseUrl(): string;
  request<T>(method: string, path: string, body?: unknown): Promise<T>;
  /** `request` と同じ通信で、一覧の付帯情報（`total` / `has_more`）も返す。今は道具の実行（`tools.execute`）の GET だけが使う */
  requestEnvelope<T>(method: string, path: string, body?: unknown): Promise<ListEnvelope<T>>;
  /**
   * 生のバイト列を body に載せる口（`application/octet-stream`）。
   *
   * JSON にできない body だけが使う（音声入力の PCM）。ファイルの
   * アップロードは `requestMultipart` か presigned URL 側なので、ここには来ない。
   */
  requestBinary<T>(method: string, path: string, body: ArrayBuffer | Uint8Array): Promise<T>;
  requestMultipart<T>(path: string, formData: FormData): Promise<T>;
  requestStream(method: string, path: string, body?: unknown): Promise<ReadableStream>;
  requestBlob(method: string, path: string, body?: unknown): Promise<Blob>;
  /** 認証ヘッダ。`fetch` を自前で組む口（ツール実行の multipart 収集）だけが使う */
  authHeaders(): Record<string, string>;
  /**
   * Bearer に載せるユーザートークン（`userToken` か OAuth のアクセストークン）。
   * `null` を含むのは `QaitoOAuth.getAccessToken()` の戻り型に合わせているため
   * （呼び出し側は truthy 判定するので分割前と同じ挙動）。
   */
  bearerToken(): string | null | undefined;
  /** confidential client の raw API キー */
  getApiKey(): string | undefined;
}
