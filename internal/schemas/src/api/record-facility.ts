import { z } from "zod";

/**
 * 業務の記録を作るときの事業所（任意）。省けば作業中の事業所、それも無ければ利用者の今の事業所で作る
 * （決め方は `@qaito/db/record-facility`）。作ったあとに変える口は持たない（更新の入力には入れない）。
 */
export const recordFacilityIdField = z.string().guid().optional();
