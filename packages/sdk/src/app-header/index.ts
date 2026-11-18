/**
 * @qaito/sdk/app-header — Qaito のアプリ（拡張アプリ・連携アプリ）のヘッダーに、ポータルと同じアプリ一覧（ランチャー）と
 * アカウントの箱を出すための材料を、ログインした人の権限で取ってきて組み立てる。
 *
 * 出すかどうかの判定は Qaito のサーバーが持つ（`GET /apps`・`GET /integration/launcher` が、その人が入れるものだけを返す）。
 * 組み立て方は Qaito Piazza・E-CALL・QaitoChat と同じ 1 か所（`buildAppHeaderMaterials`）。
 * 返した値を `@qaito/barrier-free-ui/react` の `AppHeaderMenus` にそのまま渡す。
 *
 *   const header = await loadAppHeader(client, { appDomain, orgSlug, avatarVersion: me.avatar_version });
 *   <AppHeaderMenus sections={header.sections} pillars={header.pillars} accountEntries={header.accountEntries} ... />
 */
import { webHostOrigin } from "@qaito/schemas/app-domain";
import { builtinExternalAppLaunchUrl, isBuiltinExternalAppKey } from "@qaito/schemas/external-apps";
import { buildAppHeaderMaterials, type AppHeaderMaterials } from "@qaito/vocabulary/app-header";
import type { QaitoClient } from "../client.js";

export type { AppHeaderMaterials, AppHeaderAccountEntry } from "@qaito/vocabulary/app-header";

export type LoadAppHeaderOptions = {
  /** Qaito のドメイン（例 `app.qaito.ai`）。ポータル・アプリの行き先の組み立てに使う */
  appDomain: string;
  /** ログインした組織 ID。無ければポータルの行き先を出さない */
  orgSlug: string | null;
  /** `GET /auth/userinfo` の `avatar_version`（顔写真） */
  avatarVersion?: string | null;
  /** 今いるアプリが組み込みアプリなら、そのキー（一覧のそのマスに印を付ける） */
  currentBuiltinKey?: string;
};

/** ヘッダーの材料。取れなかった口の分は空にしてヘッダーは出す（失敗しても画面を止めない） */
export async function loadAppHeader(client: QaitoClient, opts: LoadAppHeaderOptions): Promise<AppHeaderMaterials> {
  const [apps, launcher] = await Promise.all([
    client.apps.list().catch(() => []),
    client.integration.launcher().catch(() => ({ console_access: false, calendar_access: false, library_access: false, external_apps: [] })),
  ]);
  return buildAppHeaderMaterials(
    {
      orgSlug: opts.orgSlug,
      avatarVersion: opts.avatarVersion ?? null,
      apps,
      launcher,
      currentBuiltinKey: opts.currentBuiltinKey,
    },
    {
      hostOrigin: (sub) => webHostOrigin(sub, opts.appDomain),
      builtinLaunchUrl: (key, org) => (isBuiltinExternalAppKey(key) ? builtinExternalAppLaunchUrl(key, opts.appDomain, org) : null),
    },
  );
}
