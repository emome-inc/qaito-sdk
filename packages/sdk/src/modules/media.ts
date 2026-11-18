
import type {
  ListMediaLogsQuery,
  MediaLog,
  MediaLogDailyPick,
  MediaLogMediaUrl,
  RecordClientPhotoInput,
  RecordedClientPhoto,
  SetMediaLogDailyPickInput,
  ShareUserFileInput,
  SharedMediaLog,
  UnsharedMediaLog,
  UpdateMediaLogInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { toApiCamel } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createMediaLogNamespace(tx: SdkTransport) {
  return {
    logs: {
      /**
       * メディア記録一覧（status='ready' のみ）
       * GET /media/logs
       */
      list: (params?: ListMediaLogsQuery) => {
        const qs = new URLSearchParams();
        if (params?.mediaType) qs.set("mediaType", params.mediaType);
        if (params?.clientId) qs.set("clientId", params.clientId);
        if (params?.facilityId) qs.set("facilityId", params.facilityId);
        if (params?.from) qs.set("from", params.from);
        if (params?.to) qs.set("to", params.to);
        if (params?.q) qs.set("q", params.q);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const q = qs.toString();
        return tx.request<MediaLog[]>("GET", `/media/logs${q ? `?${q}` : ""}`);
      },
      /** GET /media/logs/:id */
      get: (id: string) => tx.request<MediaLog>("GET", `/media/logs/${pathParam(id, "id")}`),
      /** PATCH /media/logs/:id */
      update: (id: string, input: UpdateMediaLogInput) =>
        tx.request<MediaLog>("PATCH", `/media/logs/${pathParam(id, "id")}`, toApiCamel(input as Record<string, unknown>)),
      /** DELETE /media/logs/:id（実体ファイルも併せて削除される） */
      delete: (id: string) => tx.request<void>("DELETE", `/media/logs/${pathParam(id, "id")}`),
      /**
       * 写真を利用者のその日の 1 枚（選択済）にする / 外す。
       * 利用者 × 日付でひとつだけ（前の 1 枚は自動で外れる）。顔写真は変わらない。
       * PUT /media/logs/:id/daily-pick
       */
      setDailyPick: (id: string, input: SetMediaLogDailyPickInput) =>
        tx.request<MediaLogDailyPick>("PUT", `/media/logs/${pathParam(id, "id")}/daily-pick`, toApiCamel(input as Record<string, unknown>)),
      /** 実体取得用の一時 URL（1 時間有効）GET /media/logs/:id/media-url */
      mediaUrl: (id: string) =>
        tx.request<MediaLogMediaUrl>("GET", `/media/logs/${pathParam(id, "id")}/media-url`),
    },
    /**
     * Qaito ドライブの写真を日常の記録へ共有する（冪等）。
     * 実体は動かない ── 共有を外しても写真は Qaito ドライブに残る。
     * POST /media/logs/share
     */
    shareFile: (input: ShareUserFileInput) =>
      tx.request<SharedMediaLog>("POST", "/media/logs/share", toApiCamel(input as Record<string, unknown>)),
    /**
     * Qaito ドライブの写真を利用者の日常の記録として共有し、その日の 1 枚（選択済）にする。
     * 業務の中で利用者を撮ったときの手順。顔写真は変わらない。
     * POST /media/logs/client-photo
     */
    recordClientPhoto: (input: RecordClientPhotoInput) =>
      tx.request<RecordedClientPhoto>("POST", "/media/logs/client-photo", toApiCamel(input as Record<string, unknown>)),
    /**
     * 日常の記録から外す。**写真そのものは消さない**（消すなら logs.delete）。
     * DELETE /media/logs/:id/share
     */
    unshareFile: (id: string) =>
      tx.request<UnsharedMediaLog>("DELETE", `/media/logs/${pathParam(id, "id")}/share`),
  };
}
