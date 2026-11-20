import { z } from "zod";

export const createSessionApiSchema = z.object({
  title: z.string().max(200).optional(),
  model: z.string().max(100).optional(),
});

export const sessionHistoryStateSchema = z.object({
  summary: z.string().max(60_000).nullable().optional(),
  summarized_through: z.string().max(200).nullable().optional(),
  pruned_through: z.string().max(200).nullable().optional(),
  last_input_tokens: z.number().int().min(0).max(10_000_000).nullable().optional(),
  last_input_through: z.string().max(200).nullable().optional(),
  last_response_at: z.string().datetime({ offset: true }).nullable().optional(),
});

/** モデルが書く入力（chat_update_session のツールの input_schema の元・TOOL_ZOD_MAP）。history は入れない */
export const updateSessionToolSchema = z.object({
  title: z.string().max(200).optional(),
  pinnedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updateSessionApiSchema = updateSessionToolSchema.extend({
  /** 履歴の状態だけを書くときは updated_at を動かさない（会話の一覧の並びを変えない）。BFF / Runner だけが書く */
  history: sessionHistoryStateSchema.optional(),
});

export const createMessageApiSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  parts: z.unknown().optional(),
  client_message_id: z.string().min(1).max(200).optional(),
});

export const batchMessagesApiSchema = z.object({
  messages: z.array(createMessageApiSchema).min(1).max(100),
});

export const createFeedbackApiSchema = z.object({
  sessionId: z.string().guid(),
  messageId: z.string().min(1),
  rating: z.enum(["good", "bad"]),
  comment: z.string().max(2000).optional(),
});

export const createTemplateApiSchema = z.object({
  title: z.string().min(1).max(200),
  prompt: z.string().min(1).max(10000),
  category: z.string().max(100).optional(),
});

export const updateTemplateApiSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  prompt: z.string().min(1).max(10000).optional(),
  category: z.string().max(100).optional(),
});

export const generateTitleApiSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const webSearchApiSchema = z.object({
  query: z.string().min(1).max(500),
  max_results: z.number().int().min(1).max(10).optional(),
});

export const fetchUrlApiSchema = z.object({
  url: z.string().url().refine(
    (u) => u.startsWith("http://") || u.startsWith("https://"),
    "http(s):// URL のみ許可されます",
  ),
  max_bytes: z.number().int().positive().max(5 * 1024 * 1024).optional(),
});

/** POST /chat/usage-guide — Qaito 使い方ガイド検索（query か guide_id のどちらかが必要） */
export const usageGuideApiSchema = z
  .object({
    query: z.string().min(1).max(500).optional(),
    guide_id: z.string().min(1).max(100).optional(),
  })
  .refine((v) => v.query !== undefined || v.guide_id !== undefined, {
    message: "query か guide_id のいずれかを指定してください",
  });

export const MEMORY_EMBEDDING_DIMENSIONS = 1536;

/**
 * 直近のユーザー発話に基づき、プロンプトへ注入する記憶の上位件数（既定）。
 * 検索に使う query が無い場合・検索自体が失敗した場合も、この件数を上限に
 * 「最後に使われた日時」が新しい順のフォールバックへ縮退する（無制限注入にはしない）。
 */
export const MEMORY_SEARCH_TOP_K = 8;

/**
 * ユーザーごとの記憶保持上限。保存のたびにこの件数を超えた分を削除する。
 * 「最後に使われた日時」（未使用なら作成日時）が古い順に削除する — よく使う記憶が
 * 作成日が古いだけで消えないようにするための基準。
 */
export const MEMORY_MAX_COUNT = 200;

export const MEMORY_KINDS = ["preference", "procedure", "fact", "person"] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

/** 置き換える古い記憶（重複をまとめる・矛盾する古いものを消す）の 1 回の上限。 */
export const MEMORY_REPLACES_MAX = 5;

export const createMemoryApiSchema = z.object({
  content: z.string().min(1).max(2000),
  category: z.string().max(100).optional(),
  kind: z.enum(MEMORY_KINDS).optional(),
  /** 会話のあとに抜き出した候補を記憶にするとき、その候補の ID（承認の上で記憶になる） */
  candidate_id: z.string().uuid().optional(),
  /** この記憶で置き換える古い記憶の ID（承認の上で消える。自動では消さない） */
  replaces_ids: z.array(z.string().uuid()).max(MEMORY_REPLACES_MAX).optional(),
});

/** PUT /chat/memories/:id — 記憶の編集（content は必須、埋め込みは呼び出し側で再生成） */
export const updateMemoryApiSchema = z.object({
  content: z.string().min(1).max(2000),
  category: z.string().max(100).optional(),
  kind: z.enum(MEMORY_KINDS).optional(),
});

/** 1 会話から作る候補の上限（その会話で作った候補の数。記憶になった分も数える）。 */
export const MEMORY_EXTRACT_MAX_PER_SESSION = 3;
/** 未決の候補の上限（超えたら古い順に消す）。 */
export const MEMORY_CANDIDATE_MAX_PENDING = 20;
/** 候補を持っておく日数（過ぎたら消す）。 */
export const MEMORY_CANDIDATE_TTL_DAYS = 14;
/** 1 ターンに見せる候補の数。 */
export const MEMORY_CANDIDATE_SHOW_LIMIT = 3;
/** 送るやり取りの数と 1 通の長さの上限（抜き出しの入力を小さく保つ）。 */
export const MEMORY_EXTRACT_MAX_MESSAGES = 6;
export const MEMORY_EXTRACT_MAX_CHARS = 4000;

/** POST /chat/memories/extract — 会話の最後のやり取り（文字だけ。ツールの結果は送らない） */
export const extractMemoriesApiSchema = z.object({
  session_id: z.string().uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(MEMORY_EXTRACT_MAX_CHARS),
      }),
    )
    .min(1)
    .max(MEMORY_EXTRACT_MAX_MESSAGES),
});

/** 抜き出しのモデルが返す 1 件（モデルの出力を信用せずここで形を確かめる）。 */
export const memoryExtractionItemSchema = z.object({
  kind: z.enum(MEMORY_KINDS),
  content: z.string().min(1).max(300),
  replaces: z.array(z.string()).max(MEMORY_REPLACES_MAX).optional(),
});

/** 抜き出しのモデルの出力全体（`{"items": [...]}`）。多すぎる分は呼び出し側が切る。 */
export const memoryExtractionResultSchema = z.object({
  items: z.array(memoryExtractionItemSchema).max(10),
});

/**
 * 候補の本文の埋め込みがこの cosine 距離より近い記憶・候補があれば、同じ内容とみなして候補にしない
 * （置き換えの指定があっても）。
 */
export const MEMORY_DUPLICATE_DISTANCE = 0.1;

/**
 * 保存（chat_save_memory）のとき、本人の同じ種類の記憶（active）とこの cosine 距離より近ければ、新しい行は作らず
 * その記憶の本文を新しい文で置き換える。保存は承認つき（本人が文を見て押している）なので、候補より広く取ってよい。
 */
export const MEMORY_UPDATE_DISTANCE = 0.2;

/**
 * GET /chat/memories?q=...&limit=... — RAG 検索クエリ。
 * `q` 省略時（または検索失敗時）は呼び出し側が「最後に使われた日時」順のフォールバックに縮退する。
 */
export const memorySearchApiSchema = z.object({
  q: z.string().min(1).max(2000).optional(),
  limit: z.coerce.number().int().min(1).max(MEMORY_MAX_COUNT).optional(),
});

export const SUPPORTED_CONTENT_TYPES = [
  "application/pdf",
  "text/markdown",
  "text/csv",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export type SupportedContentType = typeof SUPPORTED_CONTENT_TYPES[number];

/** モデルが書く入力（ツールの input_schema の元・TOOL_ZOD_MAP）。chart_images は入れない */
export const generateFileToolSchema = z.object({
  content_type: z.enum(SUPPORTED_CONTENT_TYPES),
  filename: z.string().min(1).max(255).regex(
    /^[a-zA-Z0-9ぁ-ゟ゠-ヿ一-鿿._\-]+$/,
    "ファイル名に使用できない文字が含まれています",
  ),
  content: z.string().optional(),
  structured_data: z.record(z.string(), z.unknown()).optional(),
});

/** api の口・Runner が受ける入力（モデルが書く入力 + 注入した画像） */
export const generateFileApiSchema = generateFileToolSchema.extend({
  /**
   * PDF の `![説明](chart:N)` に入れるグラフ（`chart:N` → PNG の base64）。**モデルには書かせない**:
   * BFF / Runner がそのターンの履歴から引いて入れる（ツールの input_schema には無い）。
   * 中身（PNG か・大きさ）は生成の口が確かめる。ここは形と上限だけ。
   */
  chart_images: z
    .record(z.string().regex(/^chart:[1-9]\d{0,5}$/), z.string().min(1).max(2_000_000))
    .refine((m) => Object.keys(m).length <= 20)
    .optional(),
});

/** 1 回の書き出しで扱う上限行数（超えたら明示的に切り、切ったことを応答で伝える） */
export const EXPORT_LIST_MAX_ROWS = 5000;

/**
 * 取得元へ 1 回に要求する件数。
 * 一覧 API の limit には上限がある（例: `client_list_clients` は max 200）ので、
 * 大きな値を一発で投げると Zod で 400 になる。ここはその最小公倍数として安全側に置く。
 */
export const EXPORT_LIST_PAGE_SIZE = 100;

/** ページ送りの最大回数（無限ループの保険。PAGE_SIZE × これ ≧ MAX_ROWS） */
export const EXPORT_LIST_PAGE_LIMIT = 50;

export const exportListApiSchema = z.object({
  /** 取得元の read ツール名（例: "client_list_clients"）。GET のツールのみ許可 */
  tool_name: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  /** そのツールに渡すパラメータ（パス param とクエリの両方をここに入れる） */
  params: z.record(z.string(), z.unknown()).optional(),
  filename: z.string().min(1).max(255).regex(
    /^[a-zA-Z0-9ぁ-ゟ゠-ヿ一-鿿._\-]+$/,
    "ファイル名に使用できない文字が含まれています",
  ),
  /** 出力する列（データのキー名）。省略時は先頭行のキーをそのまま使う */
  columns: z.array(z.string().min(1).max(100)).max(60).optional(),
  /** シート名（省略時はファイル名から作る） */
  sheet: z.string().min(1).max(31).optional(),
});

/** POST /chat/generate-image — 画像生成（既定バックエンド: OpenAI gpt-image-2）。size は DALL·E 互換の3択。 */
export const generateImageApiSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).optional(),
});

export {
  TRANSCRIBE_SAMPLE_RATE_HZ,
  TRANSCRIBE_MAX_DURATION_SEC,
  TRANSCRIBE_MAX_BYTES,
  transcribeResponseSchema,
  type TranscribeResponse,
} from "./voice";

/**
 * `POST /api/chat` の body 追加フィールド（**後方互換**）。
 * `sessionId` が無ければ従来どおり動作し、そのターンは再開不可になる（旧クライアント互換）。
 */
export const chatTurnSessionApiSchema = z.object({
  sessionId: z.string().guid().optional(),
});

export type ChatTurnSessionInput = z.infer<typeof chatTurnSessionApiSchema>;

/**
 * `POST /api/chat/{sessionId}/stop` のレスポンス data。
 * `stopped: false` = 進行中ストリームが無かった（エラーではない）。
 */
export const chatStopResultSchema = z.object({
  stopped: z.boolean(),
});

export type ChatStopResult = z.infer<typeof chatStopResultSchema>;
