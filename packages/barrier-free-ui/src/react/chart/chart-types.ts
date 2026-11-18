
/** 系列の 1 点。`y: null` は「欠測」であり 0 ではない。 */
export type ChartDatum = {
  /** カテゴリ（時系列なら `YYYY-MM-DD` / `YYYY-MM` などの日付文字列） */
  x: string;
  y: number | null;
};

/** カテゴリカル系列。slot は色スロット（1..8）で、順序固定・巡回させない。 */
export type ChartSeries = {
  id: string;
  label: string;
  data: ChartDatum[];
  /** 1..8。省略時は宣言順に 1 から割り当てる。**実体に紐づける**（並び替えで色が変わらないように） */
  slot?: number;
  /** 前期・前年同期などの比較系列。薄いグレーで背面に描き、凡例に「(比較)」を添える */
  ghost?: boolean;
  /** 平滑化（移動平均）系列。破線 + マーカーなしで描く */
  smoothed?: boolean;
  unit?: string;
};

/** 制度上の節目・イベントの種別（色ではなくラベルで区別する） */
export type ChartMarkerKind =
  | "plan"
  | "certification"
  | "monitoring"
  | "evaluation"
  | "life"
  | "billing"
  | "changepoint"
  | "note";

/** 縦線マーカー（「いつ何があったか」を時間軸に重ねる） */
export type ChartMarker = {
  x: string;
  label: string;
  kind?: ChartMarkerKind;
};

/** 期間帯（計画期間・認定有効期間など）。プロット下のタイムラインレールに描く */
export type ChartBand = {
  from: string;
  to: string;
  label: string;
  kind?: ChartMarkerKind;
};

/** 公的閾値のトーン。必ずラベルを併記し、色だけで意味を運ばせない */
export type ChartRefTone = "neutral" | "good" | "warning" | "critical";

/** 基準線（例: BMI 18.5、SpO2 93%） */
export type ChartReferenceLine = {
  value: number;
  label: string;
  tone?: ChartRefTone;
};

/** 基準帯（例: 正常範囲 BMI 21.5〜24.9） */
export type ChartReferenceBand = {
  from: number;
  to: number;
  label: string;
  tone?: ChartRefTone;
};

/** X 軸の粒度。ラベル書式と間引きに使う */
export type ChartGranularity = "day" | "week" | "month" | "category";

/** 全グラフ共通の骨格 props */
export type ChartFrameProps = {
  title?: string;
  /** 単位（タイトル脇に小さく出す） */
  unit?: string;
  /** 補足説明 */
  description?: string;
  /** 描画領域の高さ（rem）。--bf-scale に連動して実寸が決まる */
  heightRem?: number;
  /** 0 件時の文言 */
  emptyMessage?: string;
  /** 表ビュー（コントラスト救済・AT 経路・JS 無効時フォールバック）。既定 true。外さない */
  showTable?: boolean;
  /** 再読み込み中。前の描画を薄く保持しレイアウトを動かさない */
  loading?: boolean;
  /** SVG の aria-label に使う要約。省略時は自動生成 */
  ariaSummary?: string;
  /**
   * 描画サイズを実 px で固定する（省略時は ResizeObserver で実測）。
   * レイアウトエンジンが無い環境（SSR / PDF 出力 / スナップショットテスト）で
   * グラフを描くために使う。指定すると幅の追従はしなくなる。
   */
  size?: { width: number; height: number };
};

/** 系列スロット → CSS 変数 */
export const CHART_SLOT_VARS = [
  "--bf-chart-1",
  "--bf-chart-2",
  "--bf-chart-3",
  "--bf-chart-4",
  "--bf-chart-5",
  "--bf-chart-6",
  "--bf-chart-7",
  "--bf-chart-8",
] as const;

/**
 * 系列スロット → マーカー形状。
 * 色覚に依存しないための第 2 チャネル（hue × shape の複合エンコード）。
 * 凡例・ツールチップ・直接ラベルでも同じ形を使う。
 */
export const CHART_SLOT_SHAPES = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "cross",
  "triangle-down",
  "hexagon",
  "star",
] as const;

export type ChartShape = (typeof CHART_SLOT_SHAPES)[number];
