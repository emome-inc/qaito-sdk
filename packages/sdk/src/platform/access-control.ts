
import type {
  AccessControlMember,
  AccessControlMemberDetail,
} from "../types.js";
import { pathParam } from "../path-param.js";
import type { SdkTransport } from "../transport.js";

/**
 * 権限管理 — **見る口と、権限を下げる口だけ**（メンバーの一覧・詳細・アーカイブ・グループから外す）。
 * 権限を上げる・付ける口（グループへ入れる・権限セットの割り当て等）と、資格情報・ルートアカウントを
 * 扱う口は REST に無い（管理コンソールの画面からだけ行う）。casing = snake_case。
 */
export function createAccessControlNamespace(tx: SdkTransport) {
  return {
    /** メンバー（ルートアカウントは出ない） */
    members: {
      /** 一覧 GET /access-control/members */
      list: () => tx.request<AccessControlMember[]>("GET", "/access-control/members"),
      /** 1 人 GET /access-control/members/:id */
      get: (id: string) =>
        tx.request<AccessControlMemberDetail>("GET", `/access-control/members/${pathParam(id, "id")}`),
      /** アーカイブ（ログイン無効化・発行済みトークンの失効。自分とルートは 403）POST /access-control/members/:id/archive */
      archive: (id: string) =>
        tx.request<null>("POST", `/access-control/members/${pathParam(id, "id")}/archive`),
      /** グループから外す DELETE /access-control/members/:id/groups/:group_id */
      removeGroup: (id: string, groupId: string) =>
        tx.request<null>("DELETE", `/access-control/members/${pathParam(id, "id")}/groups/${pathParam(groupId, "groupId")}`),
    },
  };
}
