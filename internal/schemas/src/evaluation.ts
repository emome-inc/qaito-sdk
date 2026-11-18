import { z } from "zod";

export const evaluationTypes = ["interim", "final"] as const;
export type EvaluationType = (typeof evaluationTypes)[number];

export const evaluationTypeLabels: Record<EvaluationType, string> = {
  interim: "中間評価",
  final: "最終評価",
};

export const evaluationTypeOptions = evaluationTypes.map((t) => ({
  value: t,
  label: evaluationTypeLabels[t],
}));

export const goalAchievementLevels = [
  "fully",
  "partially",
  "not_achieved",
  "discontinued",
] as const;
export type GoalAchievementLevel = (typeof goalAchievementLevels)[number];

export const goalAchievementLabels: Record<GoalAchievementLevel, string> = {
  fully: "達成",
  partially: "一部達成",
  not_achieved: "未達成",
  discontinued: "中止",
};

/** フォーム用の選択肢（先頭に「未選択」を含む。未選択時は送信されず NULL 扱い）。 */
export const goalAchievementOptions = [
  { value: "", label: "未選択" },
  ...goalAchievementLevels.map((v) => ({ value: v, label: goalAchievementLabels[v] })),
];

