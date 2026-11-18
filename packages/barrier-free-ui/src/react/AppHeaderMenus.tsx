"use client";

import type { ReactNode } from "react";
import { AppLauncherMenu, type AppLauncherSection, type AppLauncherTile } from "./AppLauncherMenu";
import { AvatarMenuSetting, type AvatarMenuItem } from "./AvatarMenu";
import { ColorModeToggle } from "./ColorModeToggle";
import { PortalAccountMenu, type PortalAccountMenuEntry } from "./PortalAccountMenu";

export type AppHeaderMenusProps = {
  sections: AppLauncherSection[];
  pillars: AppLauncherTile[];
  /** 今いるアプリのマスの key */
  currentKey?: string;
  name: string;
  avatarUrl: string | null;
  /** 名前の下（事業所名など） */
  sub?: ReactNode;
  accountEntries: readonly PortalAccountMenuEntry[];
  /** アプリだけの操作（サインアウトの前に並ぶ） */
  extraItems?: readonly AvatarMenuItem[];
  onSignout: () => void;
  /** 箱の中に「画面の明るさ」を置く */
  colorMode?: boolean;
  colorModeLabel?: string;
};

export function AppHeaderMenus({
  sections,
  pillars,
  currentKey,
  name,
  avatarUrl,
  sub,
  accountEntries,
  extraItems,
  onSignout,
  colorMode = false,
  colorModeLabel = "画面の明るさ",
}: AppHeaderMenusProps) {
  return (
    <>
      <AppLauncherMenu sections={sections} pillars={pillars} currentKey={currentKey} />
      <PortalAccountMenu
        name={name}
        avatarUrl={avatarUrl}
        sub={sub}
        entries={accountEntries}
        extraItems={extraItems}
        onSignout={onSignout}
        settings={
          colorMode ? (
            <AvatarMenuSetting label={colorModeLabel}>
              <ColorModeToggle />
            </AvatarMenuSetting>
          ) : undefined
        }
      />
    </>
  );
}
