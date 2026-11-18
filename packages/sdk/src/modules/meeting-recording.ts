
import type {
  IssueMeetingRecordingUploadInput,
  MeetingRecordingContents,
  MeetingRecordingPurgeResult,
  MeetingRecordingSettings,
  MeetingRecordingUploadTicket,
  MeetingRecordingUrl,
  MeetingRecordingUrlParams,
  UpdateMeetingRecordingSettingsInput,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createMeetingRecordingNamespace(tx: SdkTransport) {
  return {
    /** 中身（文字起こし・議事録・録音の有無） */
    contents: {
      /** 中身 GET /meeting-recording/meetings/:id/contents */
      get: (meetingId: string) =>
        tx.request<MeetingRecordingContents>("GET", `/meeting-recording/meetings/${pathParam(meetingId, "meetingId")}/contents`),
      /** 中身を今すぐ消す（会議の行は残る・取り消せない）DELETE /meeting-recording/meetings/:id/contents */
      delete: (meetingId: string) =>
        tx.request<MeetingRecordingPurgeResult>("DELETE", `/meeting-recording/meetings/${pathParam(meetingId, "meetingId")}/contents`),
    },
    /** 録音のアップロード（発行 → PUT → 登録） */
    upload: {
      /** 録音のアップロードの発行（presigned PUT）POST /meeting-recording/meetings/:id/upload */
      issue: (meetingId: string, input: IssueMeetingRecordingUploadInput) =>
        tx.request<MeetingRecordingUploadTicket>("POST", `/meeting-recording/meetings/${pathParam(meetingId, "meetingId")}/upload`, input),
      /** 置いた録音の登録（サイズとマジックバイトを確かめる）POST /meeting-recording/meetings/:id/upload/complete */
      complete: (meetingId: string) =>
        tx.request<MeetingRecordingContents>("POST", `/meeting-recording/meetings/${pathParam(meetingId, "meetingId")}/upload/complete`),
    },
    /** 録音の短期（300 秒）の署名付き URL（disposition=attachment でダウンロード）GET /meeting-recording/meetings/:id/recording-url */
    recordingUrl: (meetingId: string, params?: MeetingRecordingUrlParams) =>
      tx.request<MeetingRecordingUrl>("GET", `/meeting-recording/meetings/${pathParam(meetingId, "meetingId")}/recording-url${buildQueryString(params)}`),
    /** 保持期間（組織の設定） */
    settings: {
      /** 保持期間 GET /meeting-recording/settings */
      get: () => tx.request<MeetingRecordingSettings>("GET", "/meeting-recording/settings"),
      /** 保持期間を変える（組織の管理者だけ）。短くして次の掃除で消える録音があると保存せず 409（reason would_purge・purgeCount）。件数を人に確かめてから confirmPurgeCount を付けて送り直す PUT /meeting-recording/settings */
      update: (input: UpdateMeetingRecordingSettingsInput) =>
        tx.request<MeetingRecordingSettings>("PUT", "/meeting-recording/settings", input),
    },
  };
}
