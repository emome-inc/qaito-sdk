"use client";

import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { ModuleIcon } from "../icons";
import { AvatarMenu, type AvatarMenuItem, type AvatarMenuProps } from "./AvatarMenu";

export type PortalAccountMenuEntry = {
  key: string;
  label: string;
  href: string;
  iconName: string;
  separatorBefore?: boolean;
};

export type PortalAccountMenuProps = {
  name: string;
  avatarUrl?: string | null;
  /** 名前の下（事業所名など） */
  sub?: ReactNode;
  entries: readonly PortalAccountMenuEntry[];
  /** アプリだけの操作（書き出し・設定など）。サインアウトの前に区切って並べる */
  extraItems?: readonly AvatarMenuItem[];
  onSignout: () => void;
  signoutLabel?: string;
  /** 名前の下・行の上の表示の設定（画面の明るさなど） */
  settings?: ReactNode;
  renderLink?: AvatarMenuProps["renderLink"];
};

export function PortalAccountMenu({
  name,
  avatarUrl,
  sub,
  entries,
  extraItems = [],
  onSignout,
  signoutLabel = "サインアウト",
  settings,
  renderLink,
}: PortalAccountMenuProps) {
  const items: AvatarMenuItem[] = [
    ...entries.map((e) => ({
      label: e.label,
      href: e.href,
      icon: <ModuleIcon name={e.iconName} size={16} aria-hidden="true" />,
      separatorBefore: e.separatorBefore,
    })),
    ...extraItems.map((it, i) => (i === 0 && entries.length > 0 ? { ...it, separatorBefore: true } : it)),
    {
      label: signoutLabel,
      icon: <LogOut size={16} aria-hidden="true" />,
      danger: true,
      separatorBefore: true,
      onClick: onSignout,
    },
  ];
  return <AvatarMenu name={name} avatarUrl={avatarUrl} sub={sub} items={items} settings={settings} renderLink={renderLink} />;
}
