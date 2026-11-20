
import type {
  AddTalkMessageInput,
  CreateDeviceInput,
  CreateTalkSessionInput,
  CreateWearableInput,
  Device,
  DeviceAuthSettings,
  DevicePushToken,
  DeviceWithRawKey,
  RegisterPushTokenInput,
  RegisterPushTokenResult,
  ReportClientErrorsInput,
  ReportClientErrorsResult,
  RevokeOwnPushTokensResult,
  TalkIdentifyInput,
  TalkIdentifyResult,
  TalkMessage,
  TalkSession,
  UpdateDeviceAuthSettingsInput,
  UpdateDeviceInput,
  UpdateTalkSessionInput,
  UpdateVitalGatewayConnectionInput,
  UpdateWearableInput,
  VitalConnectionStatus,
  Wearable,
} from "../types.js";
import { pathParam } from "../path-param.js";
import { buildQueryString } from "../serialize.js";
import type { SdkTransport } from "../transport.js";

export function createTalkNamespace(tx: SdkTransport) {
  return {
    identify: (input: TalkIdentifyInput) =>
      tx.request<TalkIdentifyResult>("POST", "/device/talk/identify", input),
    sessions: {
      list: (params?: { client_id?: string }) => {
        const qs = new URLSearchParams();
        if (params?.client_id) qs.set("client_id", params.client_id);
        const q = qs.toString();
        return tx.request<TalkSession[]>("GET", `/device/talk/sessions${q ? `?${q}` : ""}`);
      },
      get: (id: string) => tx.request<TalkSession>("GET", `/device/talk/sessions/${pathParam(id, "id")}`),
      create: (input: CreateTalkSessionInput) =>
        tx.request<TalkSession>("POST", "/device/talk/sessions", input),
      update: (id: string, input: UpdateTalkSessionInput) =>
        tx.request<TalkSession>("PATCH", `/device/talk/sessions/${pathParam(id, "id")}`, input),
      delete: (id: string) => tx.request<void>("DELETE", `/device/talk/sessions/${pathParam(id, "id")}`),
      messages: (id: string) =>
        tx.request<TalkMessage[]>("GET", `/device/talk/sessions/${pathParam(id, "id")}/messages`),
      addMessage: (id: string, input: AddTalkMessageInput) =>
        tx.request<TalkMessage>("POST", `/device/talk/sessions/${pathParam(id, "id")}/messages`, input),
    },
  };
}

/**
 * デバイス管理（Mobile Push トークン / デバイス台帳）
 *
 * Mobile Push トークン管理
 * - registerPushToken: APNs / FCM トークンを登録 → SNS Platform Endpoint 作成
 * - unregisterPushToken: トークンを失効 → SNS Endpoint 削除
 * - listPushTokens: 自分の有効なトークン一覧
 * - revokeOwnPushTokens: 自分のトークンをすべて失効（全製品・全端末）
 * - reportClientErrors: 端末の JS の例外の記録を送る（保存せず api のログへ・PII なし）
 *
 * デバイス台帳
 * - catalog.list: デバイス台帳一覧
 * - catalog.create: デバイス登録（固有 API Key 自動生成、rawKey は 1 回限り返却）
 * - catalog.getAuthSettings: 認証パラメータ取得
 * - catalog.updateAuthSettings: 認証パラメータ更新
 * - catalog.get: デバイス詳細
 * - catalog.update: デバイス更新（名前・シリアル・メモ・ログポリシー）
 * - catalog.revoke: デバイス失効（devices + api_keys 両方）
 * - catalog.rotateKey: 固有 API Key 再発行
 */
export function createDevicesNamespace(tx: SdkTransport) {
  return {
    registerPushToken: (input: RegisterPushTokenInput) =>
      tx.request<RegisterPushTokenResult>("POST", "/notification/push-tokens", input),
    unregisterPushToken: (id: string) =>
      tx.request<void>("DELETE", `/notification/push-tokens/${pathParam(id, "id")}`),
    listPushTokens: () => tx.request<DevicePushToken[]>("GET", "/notification/push-tokens"),
    revokeOwnPushTokens: () =>
      tx.request<RevokeOwnPushTokensResult>("POST", "/notification/push-tokens/revoke"),
    reportClientErrors: (input: ReportClientErrorsInput) =>
      tx.request<ReportClientErrorsResult>("POST", "/notification/client-errors", input),
    catalog: {
      list: () => tx.request<Device[]>("GET", "/device"),
      create: (input: CreateDeviceInput) => tx.request<DeviceWithRawKey>("POST", "/device", input),
      getAuthSettings: () => tx.request<DeviceAuthSettings>("GET", "/device/auth-settings"),
      updateAuthSettings: (input: UpdateDeviceAuthSettingsInput) =>
        tx.request<DeviceAuthSettings>("PATCH", "/device/auth-settings", input),
      get: (id: string) => tx.request<Device>("GET", `/device/${pathParam(id, "id")}`),
      update: (id: string, input: UpdateDeviceInput) =>
        tx.request<Device>("PATCH", `/device/${pathParam(id, "id")}`, input),
      revoke: (id: string) => tx.request<null>("POST", `/device/${pathParam(id, "id")}/revoke`),
      rotateKey: (id: string) =>
        tx.request<DeviceWithRawKey>("POST", `/device/${pathParam(id, "id")}/rotate-key`),
      updateConnection: (id: string, input: UpdateVitalGatewayConnectionInput) =>
        tx.request<Device>("PATCH", `/device/${pathParam(id, "id")}/connection`, input),
      vitalStatus: (params?: { facility_id?: string }) =>
        tx.request<VitalConnectionStatus>("GET", `/device/vital-status${buildQueryString(params)}`),
    },
    wearables: {
      list: (params?: { facility_id?: string }) =>
        tx.request<Wearable[]>("GET", `/device/wearables${buildQueryString(params)}`),
      create: (input: CreateWearableInput) => tx.request<Wearable>("POST", "/device/wearables", input),
      update: (id: string, input: UpdateWearableInput) =>
        tx.request<Wearable>("PATCH", `/device/wearables/${pathParam(id, "id")}`, input),
      revoke: (id: string) => tx.request<null>("POST", `/device/wearables/${pathParam(id, "id")}/revoke`),
    },
  };
}
