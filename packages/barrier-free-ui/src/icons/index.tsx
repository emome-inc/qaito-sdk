import { createElement, type AnchorHTMLAttributes, type ReactNode } from "react";
import {
  Link2,
  Video,
  Phone,
  PhoneCall,
  FileAudio,
  Presentation,
  AudioLines,
  Globe,
  AppWindow,
  Accessibility,
  Activity,
  ArrowRightLeft,
  BarChart3,
  Bath,
  Bell,
  BellRing,
  BookA,
  BookMarked,
  BookOpen,
  Boxes,
  Brain,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Camera,
  ChartLine,
  Car,
  CheckSquare,
  Clapperboard,
  Clipboard,
  ClipboardList,
  Contact,
  Database,
  Dumbbell,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FileUp,
  Files,
  Film,
  FolderOpen,
  Footprints,
  HandHeart,
  HardDrive,
  HeartHandshake,
  HeartPulse,
  Home,
  Hospital,
  House,
  IdCard,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Hash,
  MessageSquare,
  MessagesSquare,
  NotebookPen,
  PersonStanding,
  Receipt,
  Megaphone,
  Pill,
  Route,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Soup,
  Stethoscope,
  Sun,
  Syringe,
  TableProperties,
  TrendingUp,
  Upload,
  UserCircle,
  UserRound,
  Users,
  Waypoints,
  Wrench,
  type LucideIcon,
  type LucideProps,
  Mic,
  KeyRound,
  Coins,
} from "lucide-react";
import { QaitoChat, QaitoPiazza, QaitoEecall, QaitoVision, QaitoPark } from "./qaito-app-icons";

/**
 * モジュールアイコンの単一 SoT（名前 → 部品の解決表）。
 *
 * 「モジュールごとに決まったアイコンが全体で共有される」状態を担保するための唯一のマップ。
 * アイコン**名**の SoT は DB `shared.modules.icon_name`（lucide-react のコンポーネント名 = PascalCase）。
 * この表が portal / 各モジュール画面 / 将来のナビなど **web の全面で共有**される解決先になる。
 * 面ごとにローカル ICON_MAP を再定義しない（バラつきの原因になる）。
 *
 * 新モジュールで新しい icon_name を使うときは、まず DB（reference-data migration）に icon_name を入れ、
 * 対応する lucide コンポーネントをここに登録する。未登録は LayoutGrid にフォールバックする。
 */
export const MODULE_ICON_MAP: Record<string, LucideIcon> = {
  QaitoChat,
  QaitoPiazza,
  QaitoEecall,
  QaitoVision,
  QaitoPark,
  AppWindow,
  Globe,
  Phone,
  Video,
  Link2,
  PhoneCall,
  FileAudio,
  Presentation,
  AudioLines,
  Clapperboard,
  Mic,
  KeyRound,
  Coins,
  Accessibility,
  Activity,
  ArrowRightLeft,
  BarChart3,
  Bath,
  Bell,
  BellRing,
  BookA,
  BookMarked,
  BookOpen,
  Boxes,
  Brain,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Camera,
  ChartLine,
  Car,
  CheckSquare,
  Clipboard,
  ClipboardList,
  Contact,
  Database,
  Dumbbell,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FileUp,
  Files,
  Film,
  FolderOpen,
  Footprints,
  HandHeart,
  HardDrive,
  HeartHandshake,
  HeartPulse,
  Home,
  Hospital,
  House,
  IdCard,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Hash,
  MessageSquare,
  MessagesSquare,
  NotebookPen,
  PersonStanding,
  Receipt,
  Megaphone,
  Pill,
  Route,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Soup,
  Stethoscope,
  Sun,
  Syringe,
  TableProperties,
  TrendingUp,
  Upload,
  UserCircle,
  UserRound,
  Users,
  Waypoints,
  Wrench,
};

/** 既定（未登録 icon_name のフォールバック）。 */
export const FALLBACK_MODULE_ICON: LucideIcon = LayoutGrid;

/** DB の icon_name 文字列から lucide コンポーネントを解決する。未登録/未設定は LayoutGrid。 */
export function getModuleIcon(name: string | null | undefined): LucideIcon {
  return (name && MODULE_ICON_MAP[name]) || FALLBACK_MODULE_ICON;
}

/**
 * DB の icon_name からモジュールアイコンを描画する静的コンポーネント。
 * `const Icon = getModuleIcon(...)` をレンダー中に書くと react-hooks/static-components に触れるため、
 * 消費側はこの `<ModuleIcon name=... />` を使う（コンポーネント定義はモジュールトップレベルで静的）。
 */
export function ModuleIcon({
  name,
  ...props
}: { name: string | null | undefined } & Omit<LucideProps, "name">) {
  return createElement(getModuleIcon(name), props);
}

export function AppIcon({
  iconName,
  logoUrl,
  size = "var(--bf-icon-lg)",
  muted = false,
  plate = false,
  solid = false,
  color,
  className,
}: {
  iconName: string | null | undefined;
  logoUrl?: string | null;
  /** アイコン・ロゴの一辺（CSS の長さ）。`plate` のときは丸の直径 */
  size?: string;
  /** 無効なアプリとして色を抜く */
  muted?: boolean;
  /**
   * 丸の台に載せる（ロゴが無いアプリだけ）。台はアプリのテーマ色を薄くした塗りで、線画は文字色のまま。
   * アプリを主役に見せたい面（ポータルのアプリの行・ランチャー）で使う
   */
  plate?: boolean;
  /** テーマ色でベタ塗りした角丸の四角に白い線画を載せる（ロゴのアプリはロゴを角丸で切り抜く）。`plate` より優先 */
  solid?: boolean;
  /** 台の色の元になるアプリのテーマ色（`shared.apps.theme_token`）。無ければ中立の色 */
  color?: string | null;
  className?: string;
}) {
  const onSolid = solid && !logoUrl;
  const onPlate = plate && !solid && !logoUrl;
  const radius = solid ? "var(--bf-radius-sm)" : "50%";
  const classes = ["bf-app-icon"];
  if (logoUrl) classes.push("bf-app-icon--logo");
  if (onPlate) classes.push("bf-app-icon--plate");
  if (onSolid) classes.push("bf-app-icon--solid");
  if (muted) classes.push("bf-app-icon--muted");
  if (className) classes.push(className);
  const box = logoUrl
    ? { width: size, height: size, flexShrink: 0, borderRadius: radius, overflow: "hidden" }
    : onPlate || onSolid
      ? {
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: radius,
          ...(color ? { "--bf-app-color": color } : {}),
        }
      : { width: size, height: size, flexShrink: 0 };
  const glyph = onPlate || onSolid ? "54%" : "100%";
  return createElement(
    "span",
    { className: classes.join(" "), style: box, "aria-hidden": true },
    logoUrl
      ? createElement("img", {
          src: logoUrl,
          alt: "",
          style: { display: "block", width: "100%", height: "100%", objectFit: "cover" },
        })
      : createElement(getModuleIcon(iconName), {
          "aria-hidden": true,
          style: { width: glyph, height: glyph },
        }),
  );
}

/**
 * AppTile — 丸の台に載せたアイコンと、その下の名前（ポータルの「最近使ったアプリ」・ランチャー・
 * コンソールのメンバー詳細の「モジュール権限 / アプリ権限」で共通）。
 *
 * - `href` があればリンク（`<a>`）、無ければ表示だけ（`<span>`）。リンクのときは `target` や
 *   `data-*`・`role`・`onClick` などをそのまま渡せる
 * - 大きさは `size`（`md` = アプリの行 / `sm` = ランチャーや一覧のように並べる数が多い面）
 * - 名前は 1 行で省略する。省略されても読めるよう `title` に全文を入れる
 * - 並べるときは `AppTileGrid`（折り返す格子）を使う。1 行に並べる面は呼び出し側の flex で並べる
 */
export function AppTile({
  name,
  iconName,
  logoUrl,
  color,
  muted = false,
  size = "md",
  solid = false,
  href,
  className,
  ...anchor
}: {
  name: string;
  iconName: string | null | undefined;
  logoUrl?: string | null;
  /** 台の色の元になるテーマ色（`theme_token`） */
  color?: string | null;
  muted?: boolean;
  size?: "sm" | "md";
  /** アイコンをテーマ色のベタ塗りの角丸の四角にする（既定は薄い色の丸の台） */
  solid?: boolean;
  href?: string;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "color" | "children">) {
  const classes = ["bf-app-tile", `bf-app-tile--${size}`];
  if (className) classes.push(className);
  const children = [
    createElement(AppIcon, {
      key: "icon",
      iconName,
      logoUrl,
      plate: true,
      solid,
      color,
      muted,
      size: size === "md" ? "calc(3.25rem * var(--bf-scale))" : "calc(2.75rem * var(--bf-scale))",
    }),
    createElement("span", { key: "label", className: "bf-app-tile__label" }, name),
  ];
  return href
    ? createElement("a", { ...anchor, href, className: classes.join(" "), title: name }, children)
    :
      createElement("span", { className: classes.join(" "), title: name }, children);
}

/** AppTile を折り返しながら並べる格子（表示だけの一覧向け） */
export function AppTileGrid({ children }: { children: ReactNode }) {
  return createElement("div", { className: "bf-app-tile-grid" }, children);
}
