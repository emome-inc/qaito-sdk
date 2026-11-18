
import type {
  ListPhoneCallsParams,
  PhoneRecordingContents,
  PhoneRecordingPurgeResult,
  PhoneRecordingUrl,
  PhoneRecordingUrlParams,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createPhoneRecordingNamespace(tx: SdkTransport) {
  return {
    /** 中身（文字起こし・要約・録音の有無） */
    contents: {
      /** 中身 GET /phone-recording/calls/:id/contents */
      get: (callId: string) =>
        tx.request<PhoneRecordingContents>("GET", `/phone-recording/calls/${pathParam(callId, "callId")}/contents`),
      /** 中身を今すぐ消す（受電の行は残る・取り消せない）DELETE /phone-recording/calls/:id/contents */
      delete: (callId: string) =>
        tx.request<PhoneRecordingPurgeResult>("DELETE", `/phone-recording/calls/${pathParam(callId, "callId")}/contents`),
    },
    /** 録音の短期（300 秒）の署名付き URL（disposition=attachment でダウンロード）GET /phone-recording/calls/:id/recording-url */
    recordingUrl: (callId: string, params?: PhoneRecordingUrlParams) =>
      tx.request<PhoneRecordingUrl>("GET", `/phone-recording/calls/${pathParam(callId, "callId")}/recording-url${buildQueryString(params)}`),
    /** 受電の CSV（文字起こし・要約つき・text/csv）GET /phone-recording/calls/export */
    exportCsv: (params?: ListPhoneCallsParams): Promise<Blob> =>
      tx.requestBlob("GET", `/phone-recording/calls/export${buildQueryString(params)}`),
  };
}
