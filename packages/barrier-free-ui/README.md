# @qaito/barrier-free-ui

Qaito バリアフリー UI。誰でも読みやすく、押しやすい画面を作るための CSS のトークンと React の部品です。

- 文字の大きさ（小・中・大）に合わせて、余白やボタンの大きさも一緒に変わります
- 明るい画面と暗い画面（夜勤のとき目にやさしい）
- 押せる場所は 44px 以上。キーボードで操作でき、フォーカスがはっきり見えます
- テーマの色を切り替えられます

## インストール

```sh
npm install @qaito/barrier-free-ui
# または
pnpm add @qaito/barrier-free-ui
```

React 19 以上が要ります（`react` / `react-dom` は peer dependency）。

## 入口

| import | 中身 |
|---|---|
| `@qaito/barrier-free-ui/css` | CSS 全部（トークン → 基盤 → テーマ → 部品）。ふつうはこれ 1 本 |
| `@qaito/barrier-free-ui/css/*` | CSS を 1 ファイルずつ（例 `@qaito/barrier-free-ui/css/tokens/scale.css`） |
| `@qaito/barrier-free-ui/react` | React の部品 |
| `@qaito/barrier-free-ui/icons` | アプリ・モジュールのアイコン（`ModuleIcon` / `AppIcon` など） |
| `@qaito/barrier-free-ui/kana` | かなの行（あ行・か行…）で絞り込む道具 |
| `@qaito/barrier-free-ui/chart-types` | グラフの型 |

## Next.js で使う

### 1. transpilePackages に入れる

TypeScript のソースのまま配っています。Next.js では `transpilePackages` に入れてください。

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@qaito/barrier-free-ui"],
};

export default nextConfig;
```

### 2. CSS を読み込み、文字の大きさと明るさを cookie から決める

ルートの layout で CSS を読み込みます。文字の大きさと明るさは cookie に置き、
**最初の HTML から** `<html>` に class を付けます（読み込んだあとに描き直さないため）。

```tsx
// src/app/layout.tsx
import { cookies } from "next/headers";
import {
  BF_MODE_COOKIE,
  BF_SIZE_COOKIE,
  ColorModeCookieProvider,
  SizeCookieProvider,
  parseBfColorMode,
  parseBfSize,
} from "@qaito/barrier-free-ui/react";
import "@qaito/barrier-free-ui/css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const size = parseBfSize(jar.get(BF_SIZE_COOKIE)?.value); // "sm" | "md" | "lg" | null
  const mode = parseBfColorMode(jar.get(BF_MODE_COOKIE)?.value); // "light" | "dark" | null
  const htmlClass = [size ? `bf-size-${size}` : null, mode === "dark" ? "dark" : null].filter(Boolean).join(" ");

  return (
    <html lang="ja" className={htmlClass || undefined} suppressHydrationWarning>
      <body>
        <SizeCookieProvider size={size}>
          <ColorModeCookieProvider mode={mode}>{children}</ColorModeCookieProvider>
        </SizeCookieProvider>
      </body>
    </html>
  );
}
```

| `<html>` の class | 意味 |
|---|---|
| `bf-size-sm` / `bf-size-md` / `bf-size-lg` | 文字の大きさ 小 / 中 / 大 |
| `dark` | 暗い画面 |

- `SizeCookieProvider` / `ColorModeCookieProvider` は、切り替えたときに cookie を書き、`<html>` の class を付け替えます
- `cookieDomain`（例 `.example.com`）を渡すと、サブドメインどうしで同じ設定を共有できます
- cookie を使わないときは `SizeProvider` / `ColorModeProvider` を使えます
- 切り替えのボタンは `SizeToggle`（小・中・大）と `ColorModeToggle`（明るい・暗い）です。今の値は `useBfSize()` / `useBfColorMode()` で読めます

### 3. 部品の外側に `bf-root` を付ける

部品のまわりの基本の見た目（文字・色・フォームの初期値）は `.bf-root` の中で効きます。
画面の一番外の要素に付けてください。テーマの色は `bf-theme-preset-*` で変えられます。

```tsx
<div className="bf-root bf-theme-preset-teal">{children}</div>
```

テーマの色: `purple` / `blue` / `green` / `orange` / `red` / `pink` / `teal` / `indigo` / `lime` / `gray`

## 画面の骨組み（AppShell）

左のナビ・上のバー・本文の骨組みです。狭い画面では、ナビが引き出しになります。

```tsx
"use client";
import Link from "next/link";
import { AppShell, PageHeader, SectionCard, Button, SizeToggle, ColorModeToggle } from "@qaito/barrier-free-ui/react";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bf-root bf-theme-preset-blue">
      <AppShell
        brand="わたしのアプリ"
        brandHref="/"
        breadcrumb={[{ label: "ホーム", href: "/" }, { label: "一覧" }]}
        nav={[
          {
            label: "メニュー",
            items: [
              { id: "home", label: "ホーム", href: "/", active: true },
              { id: "list", label: "一覧", href: "/list" },
            ],
          },
        ]}
        topbarActions={
          <>
            <SizeToggle />
            <ColorModeToggle />
          </>
        }
        renderLink={({ href, className, children, title, ...aria }) => (
          <Link href={href} className={className} title={title} {...aria}>
            {children}
          </Link>
        )}
      >
        {children}
      </AppShell>
    </div>
  );
}

export function Page() {
  return (
    <>
      <PageHeader title="一覧" actions={<Button>新しく作る</Button>} />
      <SectionCard title="今日の予定">…</SectionCard>
    </>
  );
}
```

## フォームの例

`Field` はラベル・ヒント・エラーの枠です。中の入力部品へ `id` と読み上げ用の属性をつなぎます。

```tsx
import { Field, Input, Button } from "@qaito/barrier-free-ui/react";

<Field label="氏名" hint="姓と名の間は空けなくてよいです" error={error} required>
  {({ id, describedBy, invalid }) => (
    <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} name="name" />
  )}
</Field>
<Button type="submit" variant="primary" loading={saving}>保存する</Button>
```

`Button` の `variant` は `primary` / `secondary` / `danger` / `ghost`、`size` は `sm` / `md` / `lg` です。

## 主な部品

すべて `@qaito/barrier-free-ui/react` から import します。

| 区分 | 部品 |
|---|---|
| 文字の大きさ・明るさ | `SizeProvider` `SizeCookieProvider` `SizeToggle` `useBfSize` / `ColorModeProvider` `ColorModeCookieProvider` `ColorModeToggle` `useBfColorMode` |
| 基本 | `Button` `IconButton` `Field` `Input` `Textarea` `SearchInput` `TextareaAutosize` `CharCount` `Composer` `MarkdownEditor` `Badge` `Feedback` `NoticeBar` |
| 選ぶ・入れる | `ChoiceButtons` `ToggleSwitch` `Stepper` `BigSelect` `MultiSelect` `Checkbox` `CheckboxGroup` `Slider` `TagInput` `PasswordInput` `OtpInput` |
| 日付・時刻 | `DatePicker` `DateField` `DateRangeButton` `TimeField` `TimePicker` `YearMonthSelect` `YearMonthNav` `ResponsiveCalendar` |
| 写真・動画・音声・ファイル | `PhotoCapture` `VideoCapture` `AudioCapture` `PhotoGrid` `MediaThumb` `MediaFigure` `MediaViewer` `MediaCard` `MediaGrid` `FileUpload` `FileCard` |
| データの表示 | `DataTable` `RecordCard` `RecordList` `Avatar` `RowActions` `StatGrid` `Stat` `InfoList` `InfoItem` `CopyField` `ChangeRow` `EmptyState` `SummaryStrip` `IconStack` |
| 一覧の絞り込み | `useListState` `ListToolbar` `FilterPanel` `FilterField` `FilterChips` `ListCountRow` `Pagination` `KanaRowFilter` `PickList` |
| グラフ | `LineChart` `BarChart` `StackedBar` `Sparkline`（どれも表で読める形も一緒に出します） |
| 骨組み・ナビ | `AppShell` `AppTopbar` `Breadcrumb` `Sidebar` `SidebarUser` `AvatarMenu` `AppLauncherMenu` `PageHeader` `SectionCard` `Divider` `SettingRow` `Tabs` `Steps` `Accordion` `FlowTree` `ModuleHome` |
| 操作 | `MenuButton` `ActionMenu` `StickyActionBar` |
| 知らせる・重ねる | `Dialog` `FullscreenDialog` `StatusBanner` `Progress` `Spinner` `Skeleton` `PageSkeleton` `Tooltip` `HoverHint` `InfoHint` |

## トークン（`--bf-*`）

色・大きさ・余白は CSS の変数（トークン）で持っています。自分で書く CSS もトークンを使うと、
文字の大きさ・暗い画面・テーマの色に自動で合います。

```css
.my-card {
  background: var(--bf-surface);
  color: var(--bf-fg);
  border: var(--bf-border-w) solid var(--bf-border);
  border-radius: var(--bf-radius);
  padding: var(--bf-pad-card);
  font-size: var(--bf-font-base);
}
.my-card__note {
  color: var(--bf-muted-fg);
  font-size: var(--bf-font-sm);
}
```

| 種類 | 主なトークン |
|---|---|
| 色 | `--bf-bg` `--bf-surface` `--bf-surface-2` `--bf-fg` `--bf-muted-fg` `--bf-border` `--bf-primary` `--bf-primary-fg` `--bf-ring` `--bf-success` `--bf-warning` `--bf-danger` `--bf-info`（`-bg` / `-fg` の組もあります） |
| 文字 | `--bf-font-family` `--bf-font-xs` `--bf-font-sm` `--bf-font-base` `--bf-font-lg` `--bf-font-xl` `--bf-font-title` `--bf-leading-normal` |
| 大きさ | `--bf-scale` `--bf-control-h` `--bf-control-h-sm` `--bf-control-h-lg` `--bf-row-h` `--bf-header-h` `--bf-icon` |
| 余白 | `--bf-space-1` … `--bf-pad-card` `--bf-pad-content` `--bf-section-gap` `--bf-field-gap` |
| 角・線 | `--bf-radius` `--bf-radius-sm` `--bf-radius-md` `--bf-radius-pill` `--bf-border-w` |

色は `<html class="dark">` で暗い画面の値に、大きさは `bf-size-*` で小・中・大の値に替わります。

## ライセンス

MIT
