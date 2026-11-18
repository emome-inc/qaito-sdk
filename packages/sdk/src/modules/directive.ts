
import type {
  Directive,
  DirectiveAudienceOptions,
  DirectiveStatus,
  ListMyDirectivesQuery,
  ListSentDirectivesQuery,
  MyDirective,
  ReplyToDirectiveInput,
  SendDirectiveInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { toApiCamel } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createDirectiveNamespace(tx: SdkTransport) {
  return {
    /** 送る側（送った一覧・確認状況・送る・取り消す） */
    directives: {
      /** 送った一覧（新しい順）GET /directive/directives */
      list: (params?: ListSentDirectivesQuery) => {
        const qs = new URLSearchParams();
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<Directive[]>("GET", `/directive/directives${q ? `?${q}` : ""}`);
      },
      /** 確認状況（宛先ごとの既読・確認）GET /directive/directives/:id */
      get: (id: string) => tx.request<DirectiveStatus>("GET", `/directive/directives/${pathParam(id, "id")}`),
      /** 送る（送った時点の所属で 1 人ずつに届く）POST /directive/directives */
      send: (input: SendDirectiveInput) =>
        tx.request<Directive>("POST", "/directive/directives", toApiCamel(input as Record<string, unknown>)),
      /** 取り消す（`directive:delete`）PATCH /directive/directives/:id/revoke */
      revoke: (id: string) =>
        tx.request<{ id: string }>("PATCH", `/directive/directives/${pathParam(id, "id")}/revoke`),
      /** 送る画面の宛先の候補（送り手が選べるものだけ）GET /directive/audience-options */
      audienceOptions: () => tx.request<DirectiveAudienceOptions>("GET", "/directive/audience-options"),
    },
    /** 受け取る側（自分宛の一覧・既読・「確認しました」） */
    inbox: {
      /** 自分宛の一覧（既定はまだ済んでいないもの）GET /directive/inbox */
      list: (params?: ListMyDirectivesQuery) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        const q = qs.toString();
        return tx.request<MyDirective[]>("GET", `/directive/inbox${q ? `?${q}` : ""}`);
      },
      /** GET /directive/inbox/:id */
      get: (id: string) => tx.request<MyDirective>("GET", `/directive/inbox/${pathParam(id, "id")}`),
      /** 既読にする（冪等）POST /directive/inbox/:id/read */
      markRead: (id: string) =>
        tx.request<MyDirective>("POST", `/directive/inbox/${pathParam(id, "id")}/read`),
      /** 「確認しました」を返す（冪等）POST /directive/inbox/:id/ack */
      acknowledge: (id: string) =>
        tx.request<MyDirective>("POST", `/directive/inbox/${pathParam(id, "id")}/ack`),
      /** 文字で返信する（1 回だけ・既読と確認済みも付く）POST /directive/inbox/:id/reply */
      reply: (id: string, input: ReplyToDirectiveInput) =>
        tx.request<MyDirective>("POST", `/directive/inbox/${pathParam(id, "id")}/reply`, toApiCamel(input as Record<string, unknown>)),
    },
  };
}
