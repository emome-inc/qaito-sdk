
export const prefectureOptions = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

export const careLevelOptions = [
  { value: "support_1", label: "要支援1" },
  { value: "support_2", label: "要支援2" },
  { value: "care_1", label: "要介護1" },
  { value: "care_2", label: "要介護2" },
  { value: "care_3", label: "要介護3" },
  { value: "care_4", label: "要介護4" },
  { value: "care_5", label: "要介護5" },
] as const;

export const serviceCategoryOptions = [
  { value: "kaigo_hoken", label: "介護保険" },
  { value: "shogai_fukushi", label: "障害福祉" },
  { value: "sogo_jigyo", label: "総合事業" },
] as const;

export const serviceCategoryValues = [
  "kaigo_hoken",
  "shogai_fukushi",
  "sogo_jigyo",
] as const;

export const serviceTypeCodeOptions = [
  { value: "11", label: "訪問介護", category: "kaigo_hoken" },
  { value: "13", label: "訪問看護", category: "kaigo_hoken" },
  { value: "14", label: "訪問リハビリテーション", category: "kaigo_hoken" },
  { value: "15", label: "通所介護", category: "kaigo_hoken" },
  { value: "16", label: "短期入所生活介護", category: "kaigo_hoken" },
  { value: "72", label: "認知症対応型通所介護", category: "kaigo_hoken" },
  { value: "78", label: "地域密着型通所介護", category: "kaigo_hoken" },
  { value: "21", label: "居宅介護", category: "shogai_fukushi" },
  { value: "23", label: "行動援護", category: "shogai_fukushi" },
  { value: "A1", label: "訪問型サービスA", category: "sogo_jigyo" },
  { value: "A2", label: "通所型サービスA", category: "sogo_jigyo" },
  { value: "A3", label: "生活支援サービス", category: "sogo_jigyo" },
  { value: "A4", label: "訪問型サービスB", category: "sogo_jigyo" },
  { value: "A5", label: "通所型サービスB", category: "sogo_jigyo" },
  { value: "A6", label: "総合相談支援", category: "sogo_jigyo" },
] as const;

/**
 * 要介護度コード → 和文ラベル（例: care_3 → 要介護3）。
 * 旧データの数値のみ（"3" 等）は care_n として解決する。未知値はそのまま返す。
 * 表示側でローカルに Record を再定義しない（careLevelOptions が SoT）。
 */
export function careLevelLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const hit = careLevelOptions.find((o) => o.value === value);
  if (hit) return hit.label;
  if (/^[1-5]$/.test(value)) {
    return careLevelOptions.find((o) => o.value === `care_${value}`)?.label ?? value;
  }
  return value;
}

/** 訪問看護のサービス種類。医療保険のみの事業所も13で登録する（保険の別は訪問ごとに持つ）。 */
export const NURSING_SERVICE_TYPE_CODES = ["13", "63"] as const;
export function isNursingServiceType(code: string | null | undefined): boolean {
  return NURSING_SERVICE_TYPE_CODES.some((value) => value === code);
}
