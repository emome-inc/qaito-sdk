
import type {
  FeedbackItem,
  FeedbackStatus,
  ListFeedbackQuery,
  ListMyFeedbackQuery,
  MyFeedback,
  MyMoodToday,
  SubmitFeedbackInput,
  SubmittedFeedback,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { toApiCamel } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createFeedbackNamespace(tx: SdkTransport) {
  return {
    /** 送る側（送る・自分の分）。匿名で送った分は本人も後から見られない */
    submissions: {
      /** 送る（匿名なら送った人を残さない）POST /feedback/submissions */
      submit: (input: SubmitFeedbackInput) =>
        tx.request<SubmittedFeedback>("POST", "/feedback/submissions", toApiCamel(input as Record<string, unknown>)),
      /** 自分の分（名前つきで送ったもの・新しい順）GET /feedback/submissions */
      list: (params?: ListMyFeedbackQuery) => {
        const qs = new URLSearchParams();
        if (params?.limit != null) qs.set("limit", String(params.limit));
        const q = qs.toString();
        return tx.request<MyFeedback[]>("GET", `/feedback/submissions${q ? `?${q}` : ""}`);
      },
    },
    /** 受け取る側（一覧・詳細・状態の変更・返事・削除） */
    items: {
      /** 一覧（種類・状態で絞る・新しい順）GET /feedback/items */
      list: (params?: ListFeedbackQuery) => {
        const qs = new URLSearchParams();
        if (params?.kind) qs.set("kind", params.kind);
        if (params?.status) qs.set("status", params.status);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<FeedbackItem[]>("GET", `/feedback/items${q ? `?${q}` : ""}`);
      },
      /** GET /feedback/items/:id */
      get: (id: string) => tx.request<FeedbackItem>("GET", `/feedback/items/${pathParam(id, "id")}`),
      /** 状態を変える PATCH /feedback/items/:id/status */
      setStatus: (id: string, status: FeedbackStatus) =>
        tx.request<FeedbackItem>("PATCH", `/feedback/items/${pathParam(id, "id")}/status`, { status }),
      /** 返事を書く（書き直しは上書き）PATCH /feedback/items/:id/response */
      respond: (id: string, response: string) =>
        tx.request<FeedbackItem>("PATCH", `/feedback/items/${pathParam(id, "id")}/response`, { response }),
      /** 論理削除（`feedback:delete`）DELETE /feedback/items/:id */
      delete: (id: string) => tx.request<null>("DELETE", `/feedback/items/${pathParam(id, "id")}`),
    },
    /** 今日の気分（本人の行だけ・管理者も個人の値は見ない。日はサーバが JST の今日で決める） */
    mood: {
      /** 自分の今日の気分（付けていなければ mood: null）GET /feedback/mood/today */
      today: () => tx.request<MyMoodToday>("GET", "/feedback/mood/today"),
      /** 今日の気分を付ける（1〜5・1 日 1 回。付けてあれば変えずに今の値を返す）PUT /feedback/mood/today */
      setToday: (mood: number) => tx.request<MyMoodToday>("PUT", "/feedback/mood/today", { mood }),
    },
  };
}
