import { z } from "zod";

/** 週の回数の上限（理学療法士等の訪問看護は 1 人につき週 6 回まで・老企36 第2の4(4)②。回数で数えるのは要確認の読み） */
export const NURSING_REHAB_WEEKLY_LIMIT = 6;
/** 同じ日の回数がこれ以上なら、その日の全部の回が「２超」 */
export const NURSING_REHAB_OVER2_UNITS = 3;

export const nursingRehabProposedVisitSchema = z.object({
  date: z.string().date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  /** 担当の職種。リハ職（pt / ot / st）でなければ札は出さない */
  qualification: z.enum(["nurse", "associate_nurse", "pt", "ot", "st"]),
  /** 直している訪問（数えるときに除く） */
  excludeVisitId: z.string().uuid().optional(),
});

export const getNursingRehabChecksQuerySchema = z.object({
  clientId: z.string().uuid(),
  facilityId: z.string().uuid(),
  /** 週の表を出す月（YYYY-MM） */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  proposed: nursingRehabProposedVisitSchema.optional(),
});
export type GetNursingRehabChecksQuery = z.infer<typeof getNursingRehabChecksQuerySchema>;
export type NursingRehabProposedVisit = z.infer<typeof nursingRehabProposedVisitSchema>;
/** REST・SDK のクエリ（`GET /nursing/clients/:clientId/rehab-checks`）。作ろうとしている訪問は平らに渡す（date が無ければ週の表だけ） */
export type NursingRehabChecksParams = {
  facilityId: string;
  month: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  qualification?: NursingRehabProposedVisit["qualification"];
  excludeVisitId?: string;
};

/** 指示書のⅡ-1（理学療法士等が行う訪問看護）。分・回数が書かれていなければ null */
export type NursingRehabInstruction = {
  instructionId: string;
  validFrom: string;
  validUntil: string | null;
  minutesPerDay: number | null;
  timesPerWeek: number | null;
};

export type NursingRehabWeek = {
  /** 月曜 */
  from: string;
  /** 日曜 */
  to: string;
  /** リハ職の訪問（日・開始・分・回数） */
  visits: { date: string; startTime: string | null; minutes: number; units: number }[];
  units: number;
  /** リハ職の訪問がある日の数 */
  visitDays: number;
  /** 週の回数の上限を超える */
  overWeeklyLimit: boolean;
  /** 指示書の分・回数を超える（指示書が無い・分も回数も書かれていなければ null） */
  overInstruction: boolean | null;
};

export type NursingRehabProposedCheck = {
  /** 作ろうとしている訪問の回数（20 分で 1 回） */
  units: number;
  /** 作ろうとしている訪問を入れた週の回数と上限 */
  weekUnits: number;
  weeklyLimit: number;
  /** 作ろうとしている訪問を入れた日の回数（3 回以上なら２超） */
  dayUnits: number;
  over2: boolean;
  /** 指示書と比べて（指示書を見られない・指示書が無い・分も回数も無ければ null） */
  instruction: { exceeds: boolean; minutesPerDay: number | null; timesPerWeek: number | null } | null;
};

export type NursingRehabChecks = {
  month: string;
  /** 指示書を見る権限が無ければ false（指示書の列・札を出さない） */
  instructionVisible: boolean;
  instructions: NursingRehabInstruction[];
  weeks: NursingRehabWeek[];
  /** 月のリハ職の訪問の回数（職種ごと） */
  monthUnits: { pt: number; ot: number; st: number };
  proposed: NursingRehabProposedCheck | null;
};
