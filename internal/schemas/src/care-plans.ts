

export const carePlanStatuses = [
  "draft",
  "review",
  "approved",
  "active",
  "expired",
  "revised",
] as const;

export type CarePlanStatus = (typeof carePlanStatuses)[number];

export const statusLabels: Record<CarePlanStatus, string> = {
  draft: "下書き",
  review: "確認中",
  approved: "承認済",
  active: "実施中",
  expired: "期限切れ",
  revised: "改定済",
};

/** DB の CHECK が許す古い値（0076 の前からの行）。選択肢には出さず、表示だけ名前を引く */
const LEGACY_STATUS_LABELS: Readonly<Record<string, string>> = {
  in_review: "確認中",
  withdrawn: "取り下げ",
};

/** 状態の表示名。知らない値は内部の値を出さず「—」にする */
export function carePlanStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return statusLabels[status as CarePlanStatus] ?? LEGACY_STATUS_LABELS[status] ?? "—";
}

export const statusOptions = carePlanStatuses.map((s) => ({
  value: s,
  label: statusLabels[s],
}));

export const carePlanSources = ["internal", "external"] as const;

export type CarePlanSource = (typeof carePlanSources)[number];

export const sourceLabels: Record<CarePlanSource, string> = {
  internal: "自社作成",
  external: "外部取込",
};

export const sourceOptions = carePlanSources.map((s) => ({
  value: s,
  label: sourceLabels[s],
}));

export const daysOfWeek = [
  { value: "mon", label: "月" },
  { value: "tue", label: "火" },
  { value: "wed", label: "水" },
  { value: "thu", label: "木" },
  { value: "fri", label: "金" },
  { value: "sat", label: "土" },
  { value: "sun", label: "日" },
] as const;
