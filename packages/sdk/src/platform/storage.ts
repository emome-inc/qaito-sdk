
import type {
  StorageCreateFolderInput,
  StorageDownloadUrlResult,
  StorageEmptyTrashResult,
  StorageListFilesParams,
  StorageMarkOpenedResult,
  StorageQuota,
  StorageReadFileResult,
  StorageRestoreFileResult,
  StorageRestoreFolderResult,
  StorageSaveFileInput,
  StorageTrash,
  StorageUpdateFileInput,
  StorageUpdateFolderInput,
  StorageUploadUrlInput,
  StorageUploadUrlResult,
  UserFile,
  UserFolder,
} from "../types.js";
import { pathParam } from "../path-param.js";
import type { SdkTransport } from "../transport.js";

export function createStorageNamespace(tx: SdkTransport) {
  return {
    files: {
      list: (params?: StorageListFilesParams) => {
        const qs = new URLSearchParams();
        if (params?.folder_id) qs.set("folder_id", params.folder_id);
        if (params?.auto) qs.set("auto", "true");
        if (params?.q) qs.set("q", params.q);
        if (params?.kind) qs.set("kind", params.kind);
        if (params?.recent) qs.set("recent", "true");
        const q = qs.toString();
        return tx.request<UserFile[]>("GET", `/storage/files${q ? `?${q}` : ""}`);
      },
      /** サーバ側直接保存（AI ツール用。テキスト系 ≤ 1MB） */
      save: (input: StorageSaveFileInput) => tx.request<UserFile>("POST", "/storage/files", input),
      getUploadUrl: (input: StorageUploadUrlInput) =>
        tx.request<StorageUploadUrlResult>("POST", "/storage/files/upload-url", input),
      commit: (id: string) => tx.request<UserFile>("POST", `/storage/files/${pathParam(id, "id")}/commit`),
      get: (id: string) => tx.request<UserFile>("GET", `/storage/files/${pathParam(id, "id")}`),
      getDownloadUrl: (id: string) =>
        tx.request<StorageDownloadUrlResult>("GET", `/storage/files/${pathParam(id, "id")}/download`),
      /** テキスト系のみ（50KB 切詰）。非テキストは 415 */
      read: (id: string) =>
        tx.request<StorageReadFileResult>("GET", `/storage/files/${pathParam(id, "id")}/read`),
      update: (id: string, input: StorageUpdateFileInput) =>
        tx.request<UserFile>("PATCH", `/storage/files/${pathParam(id, "id")}`, input),
      /** ゴミ箱に入れる（物理削除しない。完全に削除は trash.purgeFile） */
      delete: (id: string) => tx.request<null>("DELETE", `/storage/files/${pathParam(id, "id")}`),
      /** 画面いっぱいで開いた（最近使ったアイテムに載せる）。一覧のサムネ表示では呼ばない */
      markOpened: (id: string) =>
        tx.request<StorageMarkOpenedResult>("POST", `/storage/files/${pathParam(id, "id")}/opened`),
      /** ゴミ箱から元に戻す（置き場がゴミ箱 / 不在ならマイドライブ直下へ） */
      restore: (id: string) =>
        tx.request<StorageRestoreFileResult>("POST", `/storage/files/${pathParam(id, "id")}/restore`),
    },
    folders: {
      list: (params?: { parent_id?: string }) => {
        const qs = new URLSearchParams();
        if (params?.parent_id) qs.set("parent_id", params.parent_id);
        const q = qs.toString();
        return tx.request<UserFolder[]>("GET", `/storage/folders${q ? `?${q}` : ""}`);
      },
      /** 自分の全フォルダ（階層を問わず・名前順・ゴミ箱を除く）。parent_id を辿るとパスが分かる */
      listAll: () => tx.request<UserFolder[]>("GET", "/storage/folders/all"),
      create: (input: StorageCreateFolderInput) => tx.request<UserFolder>("POST", "/storage/folders", input),
      update: (id: string, input: StorageUpdateFolderInput) =>
        tx.request<UserFolder>("PATCH", `/storage/folders/${pathParam(id, "id")}`, input),
      /** ゴミ箱に入れる（配下も一緒に。完全に削除は trash.purgeFolder） */
      delete: (id: string) => tx.request<null>("DELETE", `/storage/folders/${pathParam(id, "id")}`),
      /** ゴミ箱から元に戻す（同じ時に入った中身だけ。同名があれば 409 FOLDER_NAME_CONFLICT） */
      restore: (id: string) =>
        tx.request<StorageRestoreFolderResult>("POST", `/storage/folders/${pathParam(id, "id")}/restore`),
    },
    trash: {
      /** 直接ゴミ箱に入れたフォルダとファイル（入れた日時の新しい順） */
      list: () => tx.request<StorageTrash>("GET", "/storage/trash"),
      /** 完全に削除（取り消せない。日常の記録へ共有中は 409 FILE_SHARED） */
      purgeFile: (id: string) => tx.request<null>("DELETE", `/storage/trash/files/${pathParam(id, "id")}`),
      /** 完全に削除（取り消せない。配下に共有中があれば 409 FILE_SHARED） */
      purgeFolder: (id: string) =>
        tx.request<null>("DELETE", `/storage/trash/folders/${pathParam(id, "id")}`),
      /** ゴミ箱を空にする（共有中のファイルとそれを含むフォルダは残す） */
      empty: () => tx.request<StorageEmptyTrashResult>("POST", "/storage/trash/empty"),
    },
    quota: () => tx.request<StorageQuota>("GET", "/storage/quota"),
  };
}
