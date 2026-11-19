export type ApiResponse<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code?: string;
      request_id?: string;
      /** 細かい権限（scope の下）で断られた理由のコード（例: `NOT_MODERATOR`）。画面が固定の文言に引き直す */
      reason?: string;
      /** サーバが公開を許可した再試行用の情報。内部例外や入力内容は含めない。 */
      details?: Record<string, unknown>;
    };

export type Module = {
  slug: string;
  name: string;
  description: string;
  examples: string[];
  /** lucide-react のアイコン名（例: "Contact"）。null の場合はデフォルト LayoutGrid を使う想定。 */
  icon_name: string | null;
  /** UI テーマトークン（例: "oklch(0.545 0.110 160)"）。 */
  theme_token: string | null;
  /** scope → 日本語ラベル（例: { "client:read": "利用者情報 読取" }）。 */
  scope_labels: Record<string, string>;
  /** ポータル等で領域に振り分けるためのドメインキー（"user" | "employee" | "facility"）。 */
  domain: string;
  scopes: string[];
  type: string;
  category: string | null;
  prerequisites: string[];
};

export type App = {
  slug: string;
  name: string;
  description: string;
  /** lucide-react のアイコン名（例: "Users"）。 */
  icon_name: string;
  /** UI テーマトークン（例: "oklch(0.55 0.18 264)"）。組織がテーマ色を選んでいればその色。 */
  theme_token: string;
  /** アプリ内の入口パス（既定 "/"）。 */
  path: string;
  /**
   * 組織が設定したロゴ画像の URL。null = アイコンで表示。
   * 本番は同一オリジンの相対パス（`/user-profiles/...`。アプリのサブドメインで配信される）。
   */
  logo_url: string | null;
  /** 組織が選んだテーマ色の候補 id（例: "teal"）。null = アプリ既定のテーマ。 */
  theme_preset: string | null;
};

export type Client = {
  id: string;
  organization_id: string;
  /** 利用者番号（Qaito が採番。新しい形は K15-00123・契約の無い人は --00123） */
  client_number: string;
  legacy_client_number: string | null;
  status: import("@qaito/schemas/clients").ClientStatus;
  family_name: string;
  given_name: string | null;
  family_name_kana: string | null;
  given_name_kana: string | null;
  insured_number: string | null;
  name: string;
  name_kana: string | null;
  birth_date: string | null;
  gender: "male" | "female" | "other" | null;
  birth_date_v2: string | null;
  /** 中山間地域等に居住しているか（中山間地域等居住者提供加算の判定入力） */
  remote_area_resident: boolean;
  /** 死亡日（YYYY-MM-DD） */
  deceased_at: string | null;
  /** 死亡場所 */
  deceased_place: "home" | "hospital" | "facility" | "other" | null;
  insurer_number: string | null;
  insurer_name: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  /** 住所から選んだ位置（地図・任意。未設定は null） */
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  mobile: string | null;
  care_manager_id: string | null;
  care_manager_assigned_from: string | null;
  /** 契約の形 = 居宅サービス計画作成区分（1 居宅介護支援事業所作成 / 2 自己作成 / 3 介護予防支援の受託） */
  plan_creation_kind: "1" | "2" | "3" | null;
  /** 地域包括支援センター（委託元。`CareOffice` の officeKind = houkatsu） */
  houkatsu_office_id: string | null;
  facility_id: string | null;
  kyotaku_facility_id: string | null;
  height_cm: number | null;
  medication_management: "self" | "facility" | "family" | null;
  bath_care_note: string | null;
  nursing_care_note: string | null;
  living_with_family: boolean | null;
  hobbies: string | null;
  current_services: string | null;
  life_history: string | null;
  consultation_notes: string | null;
  memo: string | null;
  face_photo_path: string | null;
  sns_consent: boolean | null;
  /**
   * 介護認定の履歴（有効開始日の新しい順）。一覧（`GET /client/clients`）で
   * `?include=certifications` を付けたときだけ付く。要介護度はここから読む。
   */
  certifications?: CareCertification[];
  created_at: string;
  updated_at: string;
};

export type RecentClient = {
  id: string;
  client_number: string | null;
  status: string;
  /** 表示氏名（姓 名）。両方空なら null */
  name: string | null;
  /** ふりがな（全角カタカナ）。両方空なら null */
  name_kana: string | null;
  family_name: string | null;
  given_name: string | null;
  family_name_kana: string | null;
  given_name_kana: string | null;
  /** 所属事業所（client_profiles.facility_id） */
  facility_id: string | null;
  /** 登録日時（ISO 8601） */
  created_at: string;
};

export type UnassignedFacilityClient = {
  id: string;
  client_number: string | null;
  status: string;
  /** 表示氏名（姓 名）。両方空なら null */
  name: string | null;
  /** ふりがな（全角カタカナ）。両方空なら null */
  name_kana: string | null;
  /** 登録日時（ISO 8601） */
  created_at: string;
};

/** 事業所が未設定の利用者のクエリ。`limit` は既定 200・上限 500 */
export type ListUnassignedFacilityClientsQuery = {
  limit?: number;
  offset?: number;
};

export type AssignClientsFacilityInput = {
  /** 付ける事業所 */
  facility_id: string;
  /** 対象の利用者（1〜500 件）。既に事業所がある人は変えない */
  client_ids: string[];
};

/** 一括で事業所を付けた結果 */
export type AssignClientsFacilityResult = {
  assigned_client_ids: string[];
  assigned_count: number;
  /** 付けなかった件数（見つからない・既に事業所がある・事業所の制限の外） */
  skipped_count: number;
};

/** 新着のクエリ。`since`（ISO・時差つき）が `days`（既定 7）より優先。`limit` は既定 50・上限 200 */
export type ListRecentClientsQuery = {
  since?: string;
  days?: number;
  limit?: number;
};

export type CreateClientInput = {
  legacy_client_number?: string | null;
  status?: import("@qaito/schemas/clients").ClientStatus;
  family_name: string;
  given_name?: string;
  family_name_kana?: string;
  given_name_kana?: string;
  birth_date_v2?: string;
  prefecture?: string;
  city?: string;
  address_line?: string;
  mobile?: string;
  care_manager_id?: string | null;
  /** 担当になった日（YYYY-MM-DD）。null で消す */
  care_manager_assigned_from?: string | null;
  /** 契約の形（居宅サービス計画作成区分）。null で消す */
  plan_creation_kind?: "1" | "2" | "3" | null;
  /** 地域包括支援センター（officeKind = houkatsu の事業所）。null で外す */
  houkatsu_office_id?: string | null;
  height_cm?: number | null;
  medication_management?: "self" | "facility" | "family" | null;
  bath_care_note?: string;
  nursing_care_note?: string;
  insured_number?: string;
  gender?: "male" | "female" | "other";
  insurer_number?: string;
  postal_code?: string;
  /** 住所から選んだ位置（地図・任意。未設定は null） */
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  facility_id?: string;
  kyotaku_facility_id?: string | null;
  living_with_family?: boolean;
  hobbies?: string;
  current_services?: string;
  life_history?: string;
  consultation_notes?: string;
  memo?: string;
  face_photo_path?: string;
  sns_consent?: boolean;
};

export type UpdateClientInput = Partial<CreateClientInput>;

/** 保険証の読み取りの反映（`POST /client/clients/:id/insurance-card`）。保険証から読める項目だけ。ほかの項目は受けない */
export type ApplyInsuranceCardInput = Partial<
  Pick<
    CreateClientInput,
    | "insured_number"
    | "insurer_number"
    | "family_name"
    | "given_name"
    | "family_name_kana"
    | "given_name_kana"
    | "birth_date_v2"
    | "gender"
    | "postal_code"
    | "prefecture"
    | "city"
    | "address_line"
  >
>;

export type ClientSensitive = {
  id: string;
  organization_id: string;
  client_id: string;
  has_disability_certificate: boolean;
  disability_type: "physical" | "intellectual" | "mental" | null;
  disability_details: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertClientSensitiveInput = {
  has_disability_certificate?: boolean;
  disability_type?: "physical" | "intellectual" | "mental" | null;
  disability_details?: string | null;
};

export type ClientMedicationSchedule = {
  id: string;
  organization_id: string;
  client_id: string;
  /** 薬マスタの行。取込（xlsx・OCR）で入った行は null */
  medication_id: string | null;
  /** 薬の名前（論理削除した薬も名前を返す） */
  medication_name: string | null;
  /** 指している薬が薬マスタで削除済みか */
  medication_deleted: boolean;
  /** 時間範囲（JST・HH:mm）。取込の行は null（時間範囲が未設定） */
  window_start: string | null;
  window_end: string | null;
  /** 取込が書く旧来の区分（服薬入力・ボードは見ない） */
  timing: "morning" | "noon" | "before_leaving" | "before_meal" | "after_meal" | "before_sleep" | "as_needed" | "other" | null;
  method: "oral" | "with_water" | "injection" | "topical" | "other";
  frequency_note: string | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CreateClientMedicationScheduleInput = {
  /** 薬マスタの行（自 org の削除されていない薬） */
  medication_id: string;
  /** 開始（HH:mm）。開始 < 終了・日をまたがない */
  window_start: string;
  /** 終了（HH:mm） */
  window_end: string;
  method?: "oral" | "with_water" | "injection" | "topical" | "other";
  note?: string;
  sort_order?: number;
};

export type UpdateClientMedicationScheduleInput = Partial<CreateClientMedicationScheduleInput>;

export type ClientDietary = {
  id: string;
  organization_id: string;
  client_id: string;
  staple_amount: string | null;
  side_amount: string | null;
  fluid_ml: number | null;
  snack_note: string | null;
  needs_breakfast_support: boolean;
  needs_dinner_support: boolean;
  meal_tag_staple_type: "regular" | "soft" | "minced" | "blended" | "porridge" | "other" | null;
  meal_tag_staple_amount: string | null;
  meal_tag_side_amount: string | null;
  meal_tag_side_size: string | null;
  meal_tag_note: string | null;
  food_restrictions: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertClientDietaryInput = {
  staple_amount?: string | null;
  side_amount?: string | null;
  fluid_ml?: number | null;
  snack_note?: string | null;
  needs_breakfast_support?: boolean;
  needs_dinner_support?: boolean;
  meal_tag_staple_type?: "regular" | "soft" | "minced" | "blended" | "porridge" | "other" | null;
  meal_tag_staple_amount?: string | null;
  meal_tag_side_amount?: string | null;
  meal_tag_side_size?: string | null;
  meal_tag_note?: string | null;
  food_restrictions?: string[] | null;
  notes?: string | null;
};

export type ClientServicePlan = {
  id: string;
  organization_id: string;
  client_id: string;
  contract_date: string | null;
  valid_from: string;
  valid_until: string | null;
  service_category: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  service_type_code: string | null;
  service_days: number[] | null;
  unit_price: number | null;
  has_takeout_bento: boolean;
  uses_mobile_supermarket: boolean;
  mobile_supermarket_note: string | null;
  nutrition_assessment: boolean;
  oral_care_link: boolean;
  life_function_link: boolean;
  /** 同一建物に居住しているか（同一建物減算の入力） */
  same_building_residence: boolean;
  /** 訪問看護の同一建物減算の区分（"none" = 減算なし / "rate10" = -10% / "rate15" = -15% / null = 未設定。居住が true のとき請求で必須） */
  same_building_class: "none" | "rate10" | "rate15" | null;
  /** 中山間地域等に住み、通常の事業の実施地域を越えて提供する（中山間地域等に居住する者へのサービス提供加算の入力） */
  chusankan_outside_area: boolean;
  /** 訪問看護: この利用者に緊急時訪問看護加算を算定するか（利用者・家族の同意あり） */
  kango_emergency_consent: boolean;
  /** 訪問看護: 特別管理加算の区分（"1" = Ⅰ / "2" = Ⅱ / null = 算定しない） */
  kango_special_management: "1" | "2" | null;
  /** 訪問看護: この利用者に専門管理加算を算定するか */
  kango_specialist_management: boolean;
  dayservice_plan_date: string | null;
  rehab_plan_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateClientServicePlanInput = {
  contract_date?: string;
  valid_from: string;
  valid_until?: string | null;
  service_category?: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  service_type_code?: string | null;
  service_days?: number[];
  unit_price?: number;
  has_takeout_bento?: boolean;
  uses_mobile_supermarket?: boolean;
  mobile_supermarket_note?: string | null;
  nutrition_assessment?: boolean;
  oral_care_link?: boolean;
  life_function_link?: boolean;
  same_building_residence?: boolean;
  same_building_class?: "none" | "rate10" | "rate15" | null;
  /** 中山間地域等に住み、通常の事業の実施地域を越えて提供する（中山間地域等に居住する者へのサービス提供加算の入力） */
  chusankan_outside_area?: boolean;
  kango_emergency_consent?: boolean;
  kango_special_management?: "1" | "2" | null;
  kango_specialist_management?: boolean;
  dayservice_plan_date?: string | null;
  rehab_plan_date?: string | null;
  notes?: string | null;
};

export type UpdateClientServicePlanInput = Partial<CreateClientServicePlanInput>;

export type ClientTransportSettings = {
  id: string;
  organization_id: string;
  client_id: string;
  has_wheelchair: boolean;
  seat_assignment: string | null;
  pre_arrival_notice: string | null;
  transport_assistance_note: string | null;
  notes: string | null;
  /**
   * 自宅前の停車位置（地図で選ぶ。numeric なので文字で返る）。
   * 未設定なら利用者台帳の住所の位置（`client_profiles.latitude` / `longitude`）で代える
   */
  pickup_latitude: string | null;
  pickup_longitude: string | null;
  /** 普段この利用者を送迎する運転者（職員 ID） */
  preferred_driver_staff_id: string | null;
  /** 普段の迎えの希望時刻（`HH:MM:SS`） */
  preferred_pickup_time: string | null;
  /** 普段の送りの希望時刻（`HH:MM:SS`） */
  preferred_dropoff_time: string | null;
  transport_directions: "both" | "pickup" | "dropoff";
  created_at: string;
  updated_at: string;
};

export type UpsertClientTransportSettingsInput = {
  /** 車いす。**送らなければ今の値を残す**（新しく作るときは false） */
  has_wheelchair?: boolean;
  seat_assignment?: string | null;
  pre_arrival_notice?: string | null;
  transport_assistance_note?: string | null;
  notes?: string | null;
  /** 自宅前の停車位置。**緯度と経度は両方**送る（片方だけは弾かれる） */
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  /**
   * 普段の取り決め（送迎表の自動生成が優先する目安）と停車位置。これらは**送らなければ今の値を残す**
   * （他の項目は送った内容で全体を置き換える）。`null` / `""` を送ると未設定に戻す。
   */
  preferred_driver_staff_id?: string | null;
  /** `HH:MM`（`HH:MM:SS` も可） */
  preferred_pickup_time?: string | null;
  /** `HH:MM`（`HH:MM:SS` も可） */
  preferred_dropoff_time?: string | null;
  /** 送迎の向き（both = 往復 / pickup = 迎えのみ / dropoff = 送りのみ）。**送らなければ今の値を残す**（新しく作るときは both） */
  transport_directions?: "both" | "pickup" | "dropoff";
};

export type SetClientTransportDirectionsInput = { directions: "both" | "pickup" | "dropoff" };

export type ClientTransportRestriction = {
  id: string;
  organization_id: string;
  client_id: string;
  staff_id: string;
  reason: string | null;
  created_at: string;
};

export type CreateClientTransportRestrictionInput = {
  staff_id: string;
  reason?: string | null;
};

/** 相性一覧の 1 件（起点の利用者から見た相手）。応答は camelCase。 */
export type ClientTransportCompatibility = {
  id: string;
  otherClientId: string;
  /** 相手の氏名。`client:read` を持たない呼び出し元には「非公開」 */
  otherClientName: string;
  /** `avoid` = 同乗させない / `prefer` = 同乗させたい */
  relation: "avoid" | "prefer";
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 登録・更新した相性の行（小さい方の利用者 ID が `clientAId`）。応答は camelCase。 */
export type ClientTransportCompatibilityRecord = {
  id: string;
  organizationId: string;
  clientAId: string;
  clientBId: string;
  relation: "avoid" | "prefer";
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertClientTransportCompatibilityInput = {
  /** 相手の利用者 ID（起点の利用者はパス）。同じ 2 人の組は 1 行なので、どちらから登録しても同じ行を上書きする */
  other_client_id: string;
  relation: "avoid" | "prefer";
  reason?: string | null;
};

export type ClientBilling = {
  id: string;
  organization_id: string;
  client_id: string;
  billing_method: "bank_transfer" | "cash" | "wire_transfer" | "family_payment" | null;
  bank_code: string | null;
  branch_code: string | null;
  account_type: "ordinary" | "checking" | null;
  account_number: string | null;
  account_holder_kana: string | null;
  invoice_recipient_type: "self" | "family" | "other";
  invoice_family_id: string | null;
  invoice_address_prefecture: string | null;
  invoice_address_city: string | null;
  invoice_address_line: string | null;
  invoice_contact: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertClientBillingInput = {
  billing_method?: "bank_transfer" | "cash" | "wire_transfer" | "family_payment" | null;
  bank_code?: string | null;
  branch_code?: string | null;
  account_type?: "ordinary" | "checking" | null;
  account_number?: string | null;
  account_holder_kana?: string | null;
  invoice_recipient_type?: "self" | "family" | "other";
  invoice_family_id?: string | null;
  invoice_address_prefecture?: string | null;
  invoice_address_city?: string | null;
  invoice_address_line?: string | null;
  invoice_contact?: string | null;
};

export type ClientBankAccount = {
  id: string;
  client_id: string;
  bank_code: string;
  branch_code: string;
  account_type: string;
  account_number_last4: string;
  account_number_masked: string;
  holder_name_kana: string;
  is_yucho: boolean;
  direct_debit_customer_no: string | null;
  mandate_status: string;
  mandate_channel: string | null;
  mandate_obtained_at: string | null;
  mandate_submitted_at: string | null;
  mandate_registered_at: string | null;
  account_changed_at: string | null;
  last_debited_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RevealBankAccountResult = {
  account_number: string;
  yucho_symbol: string | null;
  yucho_number: string | null;
};

export type Company = {
  id: string;
  organization_id: string;
  name: string;
  name_kana: string | null;
  corporate_number: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  /** address_line: facility.companies の正しいカラム名（旧 address は削除済み）*/
  address_line: string | null;
  phone: string | null;
  fax: string | null;
  representative_name: string | null;
  established_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateCompanyInput = {
  name: string;
  name_kana?: string;
  corporate_number?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  /** address_line: facility.companies の正しいカラム名（旧 address は使用禁止）*/
  address_line?: string;
  phone?: string;
  fax?: string;
  representative_name?: string;
  established_at?: string;
  memo?: string;
};

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export type Facility = {
  id: string;
  organization_id: string;
  company_id: string | null;
  /** office_number: 介護保険事業所番号（旧 facility_number は削除済み）*/
  office_number: string | null;
  /** 事業所番号を 10 桁に正規化する前の生の値。復旧用で、アプリからは書き換えない */
  office_number_legacy_raw: string | null;
  name: string;
  name_kana: string | null;
  /** service_type_code: 介護保険サービス種別コード varchar(2)（旧 service_types 配列は削除済み）*/
  service_type_code: string | null;
  service_category: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  /** address_line: 住所（旧 address は削除済み）*/
  address_line: string | null;
  /** 位置（numeric(9,6) なので文字列で返る。緯度・経度の 2 つで 1 組） */
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  fax: string | null;
  memo: string | null;
  is_active: boolean;
  /** 利用定員（国保連請求の規模区分・定員超過の判定に使う）。未入力は null */
  capacity: number | null;
  /** EEFUL DB 全国事業所マスタ（tool.eeful_facilities）へのリンク ID（取込済みの事業所のみ） */
  eeful_facility_id: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateFacilityInput = {
  /** office_number: 介護保険事業所番号（旧 facility_number は使用禁止）*/
  office_number?: string;
  company_id?: string | null;
  name: string;
  /** ふりがな（カタカナにそろえて保存・一覧の並びに使う）。空文字か null で消す */
  name_kana?: string | null;
  /** service_type_code: 介護保険サービス種別コード varchar(2)（旧 service_types 配列は使用禁止）*/
  service_type_code?: string;
  service_category?: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  postal_code?: string;
  prefecture?: string;
  city?: string;
  /** address_line: 住所（旧 address は使用禁止）*/
  address_line?: string;
  /** 位置（緯度・経度）。**2 つで 1 組**で送る（片方だけは 400）。消すなら両方 null */
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  fax?: string;
  memo?: string;
};

export type UpdateFacilityInput = Partial<CreateFacilityInput>;

export type FacilityVehicle = {
  id: string;
  organizationId: string;
  facilityId: string;
  name: string;
  /** 乗れる人数（乗車定員） */
  capacity: number | null;
  wheelchairCapable: boolean;
  /** 車いすのまま乗れる台数（車いす対応でない車は null） */
  wheelchairCapacity: number | null;
  /** 車いす 1 台でふさがる席の数（null は 1 とみなす） */
  seatsPerWheelchair: number | null;
  plateNumber: string | null;
  /** 普段の担当運転者（null = 指定なし） */
  defaultDriverStaffId: string | null;
  memo: string | null;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FacilityVehicleDriver = { staffId: string; name: string | null };

/** GET / PUT /facility/vehicles/:id/drivers の戻り */
export type FacilityVehicleDrivers = {
  vehicleId: string;
  drivers: FacilityVehicleDriver[];
  /** 普段の担当運転者（運転する職員の中から。null = 指定なし） */
  defaultDriverStaffId: string | null;
  /** 設定で外した人が担当運転者だったので担当を空にしたか */
  defaultDriverCleared: boolean;
};

/** PUT /facility/vehicles/:id/drivers の body（この一覧に置き換える。空で全員外す） */
export type SetFacilityVehicleDriversInput = { staffIds: string[] };

/** 一覧の行（担当運転者の氏名つき。職員の閲覧権限が無ければ null。登録した運転者 drivers つき） */
export type FacilityVehicleListItem = FacilityVehicle & {
  defaultDriverName: string | null;
  drivers: FacilityVehicleDriver[];
};

/**
 * PUT /facility/vehicles/:id の body（**全項目を書き換える**。省略した項目は空になる）。
 * `defaultDriverStaffId` だけは省略 = 変えない / null = 指定なし。
 */
export type FacilityVehicleInput = {
  name: string;
  capacity?: number | null;
  wheelchairCapable?: boolean;
  wheelchairCapacity?: number | null;
  /** 車いす 1 台でふさがる席の数（1 以上。null は 1 とみなす） */
  seatsPerWheelchair?: number | null;
  plateNumber?: string | null;
  /** 普段の担当運転者（driverStaffIds〔省略なら今の登録〕に含まれる人だけ） */
  defaultDriverStaffId?: string | null;
  /** この車を運転する職員（この一覧に置き換える。省略 = 変えない） */
  driverStaffIds?: string[];
  memo?: string | null;
  sortOrder?: number;
};

/** POST /facility/vehicles の body */
export type CreateFacilityVehicleInput = FacilityVehicleInput & { facilityId: string };

/** POST /facility/facilities/:id/link-master の body */
export type LinkFacilityToMasterInput = { eefulFacilityId: number };

export type EefulFacilityMaster = {
  /** EEFUL DB 側の事業所 ID。取込（import）で指定する安定キー */
  id: number;
  /** 事業所番号（10 桁。サービス種別ごとに行が分かれるため一意ではない） */
  facility_code: string | null;
  facility_name: string | null;
  facility_kana: string | null;
  /** 厚労省公表のサービス種別名（表記ゆれあり） */
  service_type: string | null;
  prefecture_name: string | null;
  city_name: string | null;
  /** 都道府県・市区町村を含む住所 */
  address: string | null;
  address_detail: string | null;
  latitude: number | null;
  longitude: number | null;
  phone_number: string | null;
  fax_number: string | null;
  operator_number: string | null;
  operator_name: string | null;
  available_days: string | null;
  available_days_detail: string | null;
  /** 定員（「10人」等の表記ゆれがあるため文字列） */
  max_capacity: string | null;
  url: string | null;
  kourou_url: string | null;
  has_overlay: boolean;
  /** 補正で上書きされている項目名の一覧（DB 列名）。未補正なら空配列 */
  overridden_fields: string[];
};

/** マスタ検索の絞り込み。**1 つ以上必須**（全件返却は API が 400 で拒否する） */
export type EefulMasterSearchParams = {
  /** 名称・カナの部分一致 */
  q?: string;
  /** 都道府県名の完全一致（例: 東京都） */
  prefecture?: string;
  /** サービス種別の部分一致（例: 通所介護） */
  service_type?: string;
  /** 事業所番号の完全一致 */
  facility_code?: string;
  /** 返却件数上限（1〜50、既定 50） */
  limit?: number;
};

/** 補正（overlay）で上書きできる項目（DB 列名）。 */
export type EefulOverlayField =
  | "facility_name"
  | "facility_kana"
  | "service_type"
  | "prefecture_name"
  | "city_name"
  | "address"
  | "address_detail"
  | "phone_number"
  | "fax_number"
  | "operator_name"
  | "available_days"
  | "available_days_detail"
  | "max_capacity"
  | "url"
  | "latitude"
  | "longitude";

/** 補正対象の項目の値の組（未設定は null）。 */
export type EefulOverlayValues = Record<EefulOverlayField, string | number | null>;

/**
 * 全国事業所データ 1 件の補正の見え方（GET /reference/eeful-facilities/:eeful_facility_id/overlay）。
 * API は camelCase で返す（core の戻り値そのまま）。
 */
export type EefulOverlayView = {
  eefulFacilityId: number;
  /** 全国データ（厚労省の公表データ）の元値 */
  source: EefulOverlayValues;
  /** Qaito で入れた補正値（未設定は null） */
  overlay: EefulOverlayValues;
  /** 実際に見えている値（Qaito 優先の合成後） */
  effective: EefulOverlayValues;
  overriddenFields: EefulOverlayField[];
  note: string | null;
  updatedAt: string | null;
  facilityCode: string | null;
  operatorNumber: string | null;
  kourouUrl: string | null;
  /** 公表データ側で廃止された事業所 */
  deactivated: boolean;
  /** 自組織がこの事業所を登録済みなら、その自社事業所。**null なら補正を編集できない** */
  linkedFacility: { id: string; name: string } | null;
};

/**
 * 補正の保存入力（PUT /reference/eeful-facilities/:eeful_facility_id/overlay）。
 * **空文字は「上書き解除」**（全国データの値に戻る）。未指定の項目も上書きしない。
 * 緯度・経度も文字列で渡す（空文字で解除できるように）。
 */
export type SaveEefulOverlayInput = Partial<Record<EefulOverlayField, string>> & {
  /** 修正理由（任意） */
  note?: string;
};

/** 補正の保存・解除の結果。 */
export type SavedEefulOverlay = {
  /** 紐付いている自組織事業所の id */
  facilityId: string;
  /** 実際に上書きが効いている項目。空なら補正なし */
  overriddenFields: EefulOverlayField[];
};

/** マスタ行から自 org の事業所を作成する入力（API が受ける casing = camelCase） */
export type ImportFacilityFromMasterInput = {
  eefulFacilityId: number;
};

export type ClientFamily = {
  id: string;
  organization_id: string;
  client_id: string;
  name: string;
  relationship: string | null;
  birth_date: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  mobile: string | null;
  living_together: boolean | null;
  is_emergency_contact: boolean;
  is_key_person: boolean;
  is_guarantor: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateClientFamilyInput = {
  name: string;
  relationship?: string;
  birth_date?: string;
  postal_code?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  living_together?: boolean;
  is_emergency_contact?: boolean;
  is_key_person?: boolean;
  is_guarantor?: boolean;
  memo?: string;
};

export type UpdateClientFamilyInput = Partial<CreateClientFamilyInput>;

export type CareCertification = {
  id: string;
  organization_id: string;
  client_id: string;
  care_level: "support_1" | "support_2" | "care_1" | "care_2" | "care_3" | "care_4" | "care_5";
  service_category: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  service_type_code: string | null;
  certified_date: string | null;
  valid_from: string | null;
  valid_until: string | null;
  certification_status: "certified" | "applying" | "renewal_applying" | "change_applying";
  support_limit_amount: number | null;
  /** 認知症高齢者の日常生活自立度（コード 01〜08: 01 自立 / 02 I / 03 IIa / 04 IIb / 05 IIIa / 06 IIIb / 07 IV / 08 M） */
  dementia_daily_living_level: string | null;
  /** 障害高齢者の日常生活自立度・寝たきり度（コード 01〜09: 01 自立 / 02 J1 / 03 J2 / 04 A1 / 05 A2 / 06 B1 / 07 B2 / 08 C1 / 09 C2） */
  physical_disability_level: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateCareCertificationInput = {
  care_level: "support_1" | "support_2" | "care_1" | "care_2" | "care_3" | "care_4" | "care_5";
  service_category?: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  service_type_code?: string | null;
  certified_date?: string;
  valid_from?: string;
  valid_until?: string;
  /** 認定区分（省くと認定済） */
  certification_status?: "certified" | "applying" | "renewal_applying" | "change_applying";
  support_limit_amount?: number;
  memo?: string;
};

export type UpdateCareCertificationInput = Partial<CreateCareCertificationInput>;

export type MedicalInstitution = {
  id: string;
  organization_id: string | null;
  name: string;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  source: "government" | "custom";
  government_code: string | null;
  prefecture: string | null;
  city: string | null;
  medical_department: string[] | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type NationalInstitution = {
  id: string;
  name: string;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  phone: string | null;
  fax: string | null;
  /** 厚労省の医療機関コード */
  institutionCode: string | null;
  medicalDepartment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListNationalInstitutionsParams = {
  /** 名称・住所・医療機関コードの部分一致 */
  q?: string;
  prefecture?: string;
  /** 1〜100（既定 50） */
  limit?: number;
  /** ページ送り（既定 0） */
  offset?: number;
};

export type NationalMedication = {
  /** 医薬品コード（レセプト電算処理システム用・9 桁） */
  code: string;
  name: string;
  /** フリガナ（全角カタカナ） */
  nameKana: string | null;
  unit: string | null;
  /** 剤形 */
  dosageForm: "internal" | "injection" | "external" | "dental" | "other";
  /** 薬価基準収載医薬品コード（12 桁） */
  yakkaCode: string | null;
  /** 一般名処方の標準的な記載 */
  genericName: string | null;
  /** 後発医薬品か */
  isGeneric: boolean;
  /** 経過措置の期限（YYYY-MM-DD）。過ぎると保険で使えない */
  transitionalUntil: string | null;
};

export type ListNationalMedicationsParams = {
  /** 名称・フリガナ・一般名の部分一致（必須。ひらがなでも引ける） */
  q: string;
  /** 1〜50（既定 20） */
  limit?: number;
  /** ページ送り（既定 0） */
  offset?: number;
};

/** 全国の傷病名マスター 1 件（支払基金「レセプト電算処理システム」の傷病名マスター） */
export type NationalDisease = {
  /** 傷病名コード（7 桁） */
  code: string;
  /** 傷病名基本名称（全角のまま） */
  name: string;
  /** カナ名称（全角カタカナ・英数は半角） */
  nameKana: string | null;
  /** ICD-10（2013）の基礎疾患の分類番号（ドットなし・例 E103） */
  icd10Primary: string | null;
  /** ICD-10（2013）の症状発現の分類番号 */
  icd10Secondary: string | null;
  /** 廃止に伴う移行先の傷病名コード */
  successorCode: string | null;
  /** 使用できる最終日（YYYY-MM-DD）。廃止されていなければ null */
  abolishedOn: string | null;
};

export type ListNationalDiseasesParams = {
  /** 名称・カナ・傷病名コード・ICD-10 での検索（必須。ひらがな・半角英数でも引ける） */
  q: string;
  /** 1〜50（既定 20） */
  limit?: number;
  /** ページ送り（既定 0） */
  offset?: number;
};

/** 全国の修飾語マスター 1 件（疑い・末期・右など傷病名に付ける語） */
export type NationalDiseaseModifier = {
  /** 修飾語コード（4 桁） */
  code: string;
  name: string;
  nameKana: string | null;
  /** 傷病名の前に付くか（prefix）後ろに付くか（suffix）。コード 0001〜7999 = prefix / 8000〜8999 = suffix */
  position: "prefix" | "suffix" | "other";
};

export type ListNationalDiseaseModifiersParams = {
  /** 名称・カナの部分一致（省略可。省略するとコード順） */
  q?: string;
  /** 前に付く・後ろに付く・その他で絞る */
  position?: "prefix" | "suffix" | "other";
  /** 1〜100（既定 50） */
  limit?: number;
  /** ページ送り（既定 0） */
  offset?: number;
};

export type Medication = {
  id: string;
  organizationId: string;
  name: string;
  nameKana: string | null;
  memo: string | null;
  /** 全国の医薬品マスターから選んだ薬の医薬品コード（9 桁）。手で足した薬は null */
  nationalCode: string | null;
  /** 論理削除した時刻（単票の口だけが削除済みも返す） */
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListMedicationsParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

export type CreateMedicationInput = {
  name: string;
  /** ふりがな（全角カタカナにそろえて保存する） */
  name_kana?: string;
  memo?: string;
  /** 全国の医薬品マスターから選んだときの医薬品コード（9 桁）。有効な版に無いコードは 400 */
  national_code?: string;
};

/** 医薬品コードは後から付け替えない */
export type UpdateMedicationInput = Partial<Omit<CreateMedicationInput, "national_code">>;

export type EnsureMedicationFromNationalInput = {
  /** 医薬品コード（9 桁・`reference.nationalMedications.list` の code） */
  code: string;
};

/** 全国の医薬品マスターから探すか作った結果 */
export type EnsuredMedication = {
  medication: Medication;
  /** 新しく作ったとき true（あった行を返したときは false） */
  created: boolean;
};

export type ClientMedical = {
  id: string;
  organization_id: string;
  client_id: string;
  medical_institution_id: string | null;
  /** 医療機関。GET の一覧だけが同梱する（POST / PATCH の応答には無い）。 */
  medical_institution?: MedicalInstitution | null;
  /** かかっている診療科（医療機関が複数の科を持つとき、そのうちの 1 つ）。未選択は null */
  department: string | null;
  doctor_name: string | null;
  notes: string | null;
  is_primary: boolean;
  /** 救急搬送の対象か */
  is_emergency_transport_target: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateClientMedicalInput = {
  medical_institution_id: string;
  /** かかっている診療科（医療機関が複数の科を持つとき。null で外す） */
  department?: string | null;
  doctor_name?: string;
  notes?: string;
  is_primary?: boolean;
  memo?: string;
};

export type UpdateClientMedicalInput = Partial<CreateClientMedicalInput>;

export type ClientDocument = {
  id: string;
  organization_id: string;
  client_id: string;
  document_type: "insurance_card" | "face_sheet" | "other";
  file_path: string;
  file_name: string;
  mime_type: string | null;
  /** OCR の解析結果（`PUT …/documents/:id/ocr-result` で保存したもの。中身のキーは変換しない） */
  ocr_result: Record<string, unknown> | null;
  /** OCR の解析結果を保存した日時 */
  ocr_analyzed_at: string | null;
  uploaded_at: string;
  memo: string | null;
  created_at: string;
};

export type OcrType = "insurance_card" | "face_sheet";

export type InsuranceCardOcrResult = {
  type: "insurance_card";
  confidence: number;
  extracted: {
    insured_number: string | null;
    name: string | null;
    name_kana: string | null;
    birth_date: string | null;
    gender: "male" | "female" | null;
    insurer_number: string | null;
    insurer_name: string | null;
    care_level: string | null;
    certified_date: string | null;
    valid_from: string | null;
    valid_until: string | null;
    copay_ratio: number | null;
    address: string | null;
    postal_code: string | null;
  };
  warnings: string[];
};

export type FaceSheetOcrResult = {
  type: "face_sheet";
  confidence: number;
  extracted: {
    client: {
      name: string | null;
      name_kana: string | null;
      birth_date: string | null;
      gender: "male" | "female" | null;
      insured_number: string | null;
      insurer_number: string | null;
      insurer_name: string | null;
      postal_code: string | null;
      address: string | null;
      phone: string | null;
      living_with_family: boolean | null;
      hobbies: string | null;
      life_history: string | null;
      consultation_notes: string | null;
    };
    certification: {
      care_level: string | null;
      certified_date: string | null;
      valid_from: string | null;
      valid_until: string | null;
      support_limit_amount: number | null;
      copay_ratio: number | null;
    };
    family: Array<{
      name: string;
      relationship: string | null;
      phone: string | null;
      is_emergency_contact: boolean;
      is_key_person: boolean;
      living_together: boolean;
    }>;
    medical: Array<{
      hospital_name: string;
      doctor_name: string | null;
      hospital_phone: string | null;
      diagnoses: string[];
      is_primary: boolean;
    }>;
  };
  warnings: string[];
};

export type OcrResult = InsuranceCardOcrResult | FaceSheetOcrResult;

export type UploadUrlResult = {
  upload_url: string;
  token: string;
  file_path: string;
};

export type CreateClientDocumentInput = {
  document_type: "insurance_card" | "face_sheet" | "other";
  file_path: string;
  file_name: string;
  mime_type?: string;
  memo?: string;
};

export type ClientPersonality = {
  client_id: string;
  organization_id: string;
  likes: string[];
  dislikes: string[];
  personality_traits: string[];
  interests: string[];
  habits: string[];
  triggers: string | null;
  calming_methods: string | null;
  communication_notes: string | null;
  daily_routine_notes: string | null;
  care_notes: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type UpdatePersonalityInput = {
  likes?: string[];
  dislikes?: string[];
  personality_traits?: string[];
  interests?: string[];
  habits?: string[];
  triggers?: string | null;
  calming_methods?: string | null;
  communication_notes?: string | null;
  daily_routine_notes?: string | null;
  care_notes?: string | null;
};

export type ClientRelationship = {
  id: string;
  organization_id: string;
  client_id: string;
  related_client_id: string;
  /**
   * 相手の利用者の氏名。GET の一覧だけが付ける（POST / PATCH の応答には無い）。
   * 相手が事業所の境界の外なら null。
   */
  related_client_name?: string | null;
  compatibility: "good" | "neutral" | "caution" | "bad";
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateRelationshipInput = {
  related_client_id: string;
  compatibility: "good" | "neutral" | "caution" | "bad";
  note?: string | null;
};

export type ChatSession = {
  id: string;
  /** 組織ID */
  organization_id: string;
  /** ユーザーID */
  user_id: string;
  /** タイトル */
  title: string;
  /** モデル */
  model: string | null;
  /** 作成日 */
  created_at: string;
  /** 更新日 */
  updated_at: string;
  /** メッセージ数 */
  message_count?: number;
  /** 履歴の状態（QaitoChat が読む） */
  history?: ChatSessionHistoryState;
};

/** 履歴の状態（境目は `{先頭からの位置}:{指紋}`） */
export type ChatSessionHistoryState = {
  summary: string | null;
  summarized_through: string | null;
  pruned_through: string | null;
  last_input_tokens: number | null;
  last_input_through: string | null;
  last_response_at: string | null;
};

export type CreateChatSessionInput = {
  title?: string;
  model?: string;
};

export type UpdateChatSessionInput = {
  title?: string;
  /** 履歴の状態だけを書くときは updated_at を動かさない */
  history?: Partial<ChatSessionHistoryState>;
};

export type ChatAttachment = {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  /** 自動保存の失効時刻（ISO 8601）。null = フォルダへ昇格済み（恒久保存） */
  expires_at: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  parts: unknown | null;
  attachments?: ChatAttachment[];
  created_at: string;
};

export type CreateChatMessageInput = {
  role: "user" | "assistant";
  content: string;
  parts?: unknown;
  client_message_id?: string;
};

/**
 * 利用ログ 1 件（`GET /chat/llm/usage`）。**呼び出した本人の分だけ**が新しい順に返る
 * （他の職員を指定する口は無い。組織全体の利用状況は管理コンソール）。
 * 応答は camelCase（同じ `/chat/llm` のモデル設定と同じ）。
 */
export type UsageLog = {
  id: string;
  sessionId: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  /** ISO 8601 */
  createdAt: string;
};

export type UsageListParams = {
  /** 件数（1〜200・既定 50） */
  limit?: number;
};

export type ModelConfig = {
  id: string;
  organizationId: string;
  model: string;
  displayName: string;
  isDefault: boolean;
  maxTokens: number | null;
  temperature: number | null;
  enabled: boolean;
  /** ISO 文字列（`created_at` 列。型付き select の Date が JSON で ISO になる） */
  createdAt: string;
};

export type CreateModelConfigInput = {
  model: string;
  display_name: string;
  is_default?: boolean;
  /** `null` は未設定（モデルの既定に任せる） */
  max_tokens?: number | null;
  /** `null` は未設定（モデルの既定に任せる） */
  temperature?: number | null;
  enabled?: boolean;
};

export type UpdateModelConfigInput = Partial<CreateModelConfigInput>;

export type Recording = {
  id: string;
  organization_id: string;
  client_id: string;
  /** 記録の事業所（作ったあとは変えられない） */
  facility_id: string | null;
  assessment_id: string | null;
  recorded_by: string | null;
  storage_path: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  mime_type: string;
  transcript: string | null;
  transcript_status: 'pending' | 'processing' | 'done' | 'error';
  summary: string | null;
  summary_status: 'pending' | 'processing' | 'done' | 'error';
  created_at: string;
  updated_at: string;
  /** 利用者名。組織全体の一覧（`GET /assessment/recordings`・`recordings.listAll`）でだけ返す */
  client_name?: string;
};

export type CreateRecordingInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facility_id?: string;
  storage_path: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  mime_type?: string;
  assessment_id?: string;
};

export type UploadUrlResponse = {
  upload_url: string;
  token: string;
  file_path: string;
};

/** GET /assessment/clients の 1 行（利用者 + 最新のアセスメント実施日） */
export type AssessmentClient = {
  id: string;
  /** 被保険者番号（現在の証から引く） */
  insured_number: string | null;
  client_number: string | null;
  status: string;
  name: string;
  name_kana: string | null;
  family_name: string;
  given_name: string;
  family_name_kana: string | null;
  given_name_kana: string | null;
  birth_date: string | null;
  gender: string | null;
  display_name: string;
  display_name_kana: string;
  /** 最新のアセスメント実施日（未実施は null） */
  latest_assessed_at: string | null;
};

export type Assessment = {
  id: string;
  organization_id: string;
  client_id: string;
  /** 記録の事業所（作ったあとは変えられない） */
  facility_id: string | null;
  assessor_id: string | null;
  assessed_at: string;
  reason: "initial" | "renewal" | "discharge" | "level_change" | "other" | null;
  reason_other: string | null;
  independence_mobility: string | null;
  independence_dementia: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentAdl = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** アセスメントID */
  assessmentId: string;
  /** 寝返り */
  turningOver: string | null;
  /** 起き上がり */
  sittingUp: string | null;
  /** 移乗 */
  transfer: string | null;
  /** 立位 */
  standing: string | null;
  /** 歩行 */
  walking: string | null;
  /** 更衣 */
  dressing: string | null;
  /** 食事 */
  eating: string | null;
  /** 入浴 */
  bathing: string | null;
  /** 排泄 */
  toileting: string | null;
  /** 整容 */
  grooming: string | null;
  /** 移動手段 */
  mobilityMethod: string | null;
  /** Barthel 食事 */
  barthelFeeding: number | null;
  /** Barthel 移乗 */
  barthelTransfer: number | null;
  /** Barthel 整容 */
  barthelGrooming: number | null;
  /** Barthel トイレ動作 */
  barthelToiletUse: number | null;
  /** Barthel 入浴 */
  barthelBathing: number | null;
  /** Barthel 歩行 */
  barthelWalking: number | null;
  /** Barthel 階段昇降 */
  barthelStairClimbing: number | null;
  /** Barthel 更衣 */
  barthelDressing: number | null;
  /** Barthel 排便コントロール */
  barthelBowelControl: number | null;
  /** Barthel 排尿コントロール */
  barthelBladderControl: number | null;
  /** Barthel 合計点 */
  barthelTotal: number | null;
  /** メモ */
  notes: string | null;
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type AssessmentIadl = {
  cooking: string | null;
  cleaning: string | null;
  laundry: string | null;
  shopping: string | null;
  money_management: string | null;
  medication_management: string | null;
  phone_use: string | null;
  transportation: string | null;
  hobby_activities: string | null;
  notes: string | null;
};

export type AssessmentBodyMap = {
  skin_issues: Array<{ area: string; type: string; detail?: string }>;
  pain_areas: Array<{ area: string; severity: string; detail?: string }>;
  has_pressure_ulcer: boolean;
  pressure_ulcer_details: string | null;
  has_paralysis: boolean;
  /** 麻痺部位の一覧（pain_areas / skin_issues と同型）。`paralysis_details` は自由記述で別 */
  paralysis_areas: string[];
  paralysis_details: string | null;
  has_muscle_weakness: boolean;
  muscle_weakness_details: string | null;
  has_contracture: boolean;
  contracture_details: string | null;
  notes: string | null;
};

export type AssessmentNutrition = {
  height: number | null;
  weight: number | null;
  bmi: number | null;
  weight_loss_1m: boolean;
  weight_loss_3m: boolean;
  weight_loss_6m: boolean;
  nutrition_risk_level: "low" | "medium" | "high" | null;
  meal_intake_percentage: number | null;
  meal_staple_percentage: number | null;
  meal_side_percentage: number | null;
  meal_form: string | null;
  thickener: string | null;
  has_dysphagia_risk: boolean;
  meal_notes: string | null;
  oral_has_denture: boolean | null;
  oral_denture_fit: string | null;
  oral_cleaning_independence: string | null;
  oral_swallowing_issues: string[];
  oral_notes: string | null;
  related_conditions: string[];
  nutrition_method: string | null;
  nutrition_method_details: string | null;
  hydration_notes: string | null;
  overall_evaluation: "improved" | "improving" | "maintained" | "not_improved" | null;
  notes: string | null;
};

export type AssessmentDetail = Assessment & {
  mobility_method: string | null;
  cognition_decision_making: string | null;
  cognition_orientation: string | null;
  cognition_wandering: boolean;
  cognition_short_term_memory_loss: boolean;
  cognition_notes: string | null;
  communication_expression: string | null;
  communication_comprehension: string | null;
  communication_vision: string | null;
  communication_hearing: string | null;
  communication_notes: string | null;
  social_participation: string | null;
  social_isolation: boolean;
  social_role_change: string | null;
  social_notes: string | null;
  excretion_urination: string | null;
  excretion_defecation: string | null;
  excretion_diaper_use: boolean;
  excretion_portable_toilet: boolean;
  excretion_notes: string | null;
  bpsd_aggression: boolean;
  bpsd_wandering: boolean;
  bpsd_resistance: boolean;
  bpsd_collecting: boolean;
  bpsd_fire_risk: boolean;
  bpsd_unsanitary: boolean;
  bpsd_pica: boolean;
  bpsd_hallucination: boolean;
  bpsd_delusion: boolean;
  bpsd_sleep_disturbance: boolean;
  bpsd_notes: string | null;
  care_capacity_has_caregiver: boolean | null;
  care_capacity_caregiver_relationship: string | null;
  care_capacity_caregiver_willingness: string | null;
  care_capacity_caregiver_health: string | null;
  care_capacity_caregiver_burden: string | null;
  care_capacity_notes: string | null;
  living_environment_type: string | null;
  living_environment_barrier_free: boolean | null;
  living_environment_renovation_needed: boolean | null;
  living_environment_notes: string | null;
  living_environment_hazard_notes: string | null;
  special_abuse_suspected: boolean;
  special_terminal_care: boolean;
  special_notes: string | null;
  medical_tube_feeding: boolean;
  medical_oxygen_therapy: boolean;
  medical_suction: boolean;
  medical_tracheostomy: boolean;
  medical_urinary_catheter: boolean;
  medical_stoma: boolean;
  medical_insulin_injection: boolean;
  medical_dialysis: boolean;
  mental_emotions: string[];
  /** 意思表出。感情表出は `mental_expression_emotion` で別 */
  mental_expression: "can" | "sometimes" | "cannot" | null;
  mental_expression_emotion: string | null;
  mental_notes: string | null;
  mental_financial_anxiety: boolean;
  /** ⚠️ アセスメント**全体**の評価。`nutrition.overall_evaluation`（栄養状態）とは別物 */
  overall_evaluation: "improved" | "improving" | "maintained" | "not_improved" | null;
  memo: string | null;
  adl: AssessmentAdl | null;
  iadl: AssessmentIadl | null;
  body_map: AssessmentBodyMap | null;
  nutrition: AssessmentNutrition | null;
};

export type CreateAssessmentInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facility_id?: string;
  assessed_at: string;
  reason?: "initial" | "renewal" | "discharge" | "level_change" | "other";
  reason_other?: string;
  independence_mobility?: string;
  independence_dementia?: string;
  mobility_method?: string;
  cognition_decision_making?: string;
  cognition_orientation?: string;
  cognition_wandering?: boolean;
  cognition_short_term_memory_loss?: boolean;
  cognition_notes?: string;
  communication_expression?: string;
  communication_comprehension?: string;
  communication_vision?: string;
  communication_hearing?: string;
  communication_notes?: string;
  social_participation?: string;
  social_isolation?: boolean;
  social_role_change?: string;
  social_notes?: string;
  excretion_urination?: string;
  excretion_defecation?: string;
  excretion_diaper_use?: boolean;
  excretion_portable_toilet?: boolean;
  excretion_notes?: string;
  bpsd_aggression?: boolean;
  bpsd_wandering?: boolean;
  bpsd_resistance?: boolean;
  bpsd_collecting?: boolean;
  bpsd_fire_risk?: boolean;
  bpsd_unsanitary?: boolean;
  bpsd_pica?: boolean;
  bpsd_hallucination?: boolean;
  bpsd_delusion?: boolean;
  bpsd_sleep_disturbance?: boolean;
  bpsd_notes?: string;
  care_capacity_has_caregiver?: boolean;
  care_capacity_caregiver_relationship?: string;
  care_capacity_caregiver_willingness?: string;
  care_capacity_caregiver_health?: string;
  care_capacity_caregiver_burden?: string;
  care_capacity_notes?: string;
  living_environment_type?: string;
  living_environment_barrier_free?: boolean;
  living_environment_renovation_needed?: boolean;
  living_environment_notes?: string;
  living_environment_hazard_notes?: string;
  special_abuse_suspected?: boolean;
  special_terminal_care?: boolean;
  special_notes?: string;
  medical_tube_feeding?: boolean;
  medical_oxygen_therapy?: boolean;
  medical_suction?: boolean;
  medical_tracheostomy?: boolean;
  medical_urinary_catheter?: boolean;
  medical_stoma?: boolean;
  medical_insulin_injection?: boolean;
  medical_dialysis?: boolean;
  mental_emotions?: string[];
  mental_expression?: "can" | "sometimes" | "cannot";
  mental_expression_emotion?: string;
  mental_notes?: string;
  mental_financial_anxiety?: boolean;
  overall_evaluation?: "improved" | "improving" | "maintained" | "not_improved";
  summary?: string;
  memo?: string;
  adl?: Partial<AssessmentAdl>;
  iadl?: Partial<AssessmentIadl>;
  body_map?: Partial<AssessmentBodyMap>;
  nutrition?: Partial<AssessmentNutrition>;
};

export type UpdateAssessmentInput = Partial<Omit<CreateAssessmentInput, "facility_id">>;

export type AssessmentOcrType = "assessment_sheet" | "nutrition_screening";

/** ADL / IADL の段階（independent / monitoring / partially_assisted / fully_assisted / unable）。 */
export type AssessmentOcrLevel = string;

/** シートに書かれた利用者の基本情報（台帳の値ではない。取込時の照合・補完用）。 */
export type AssessmentOcrClientInfo = {
  name?: string;
  name_kana?: string;
  /** YYYY-MM-DD */
  birth_date?: string;
  gender?: string;
  address?: string;
  /** 例: 要介護2 */
  care_level?: string;
};

export type AssessmentSheetOcrResult = {
  type: "assessment_sheet";
  extracted: {
    client?: AssessmentOcrClientInfo;
    /** YYYY-MM-DD */
    assessed_at?: string;
    reason?: "initial" | "renewal" | "discharge" | "level_change" | "other" | (string & {});
    independence_mobility?: string;
    independence_dementia?: string;
    mobility_method?: string;
    adl?: {
      turning_over?: AssessmentOcrLevel;
      sitting_up?: AssessmentOcrLevel;
      transfer?: AssessmentOcrLevel;
      standing?: AssessmentOcrLevel;
      walking?: AssessmentOcrLevel;
      dressing?: AssessmentOcrLevel;
      eating?: AssessmentOcrLevel;
      bathing?: AssessmentOcrLevel;
      toileting?: AssessmentOcrLevel;
      grooming?: AssessmentOcrLevel;
    };
    iadl?: {
      cooking?: AssessmentOcrLevel;
      cleaning?: AssessmentOcrLevel;
      laundry?: AssessmentOcrLevel;
      shopping?: AssessmentOcrLevel;
      money_management?: AssessmentOcrLevel;
      medication_management?: AssessmentOcrLevel;
      phone_use?: AssessmentOcrLevel;
      transportation?: AssessmentOcrLevel;
      hobby_activities?: AssessmentOcrLevel;
    };
    cognition_wandering?: boolean;
    bpsd_aggression?: boolean;
    bpsd_wandering?: boolean;
    bpsd_resistance?: boolean;
    bpsd_collecting?: boolean;
    bpsd_fire_risk?: boolean;
    bpsd_unsanitary?: boolean;
    bpsd_pica?: boolean;
    summary?: string;
  };
  warnings: string[];
};

export type NutritionScreeningOcrResult = {
  type: "nutrition_screening";
  extracted: {
    client?: Pick<AssessmentOcrClientInfo, "name" | "birth_date">;
    /** YYYY-MM-DD */
    screened_at?: string;
    height?: number;
    weight?: number;
    bmi?: number;
    weight_loss_1m?: boolean;
    weight_loss_3m?: boolean;
    weight_loss_6m?: boolean;
    nutrition_risk_level?: "low" | "medium" | "high" | (string & {});
    meal_intake_percentage?: number;
    meal_staple_percentage?: number;
    meal_side_percentage?: number;
    meal_form?: string;
    thickener?: string;
    has_dysphagia_risk?: boolean;
    nutrition_method?: string;
    oral_has_denture?: boolean;
    oral_denture_fit?: string;
    oral_cleaning_independence?: string;
    oral_swallowing_issues?: string[];
    overall_evaluation?: "improved" | "improving" | "maintained" | "not_improved" | (string & {});
  };
  warnings: string[];
};

export type AssessmentOcrResult = AssessmentSheetOcrResult | NutritionScreeningOcrResult;

export type AssessmentOcrMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "application/pdf";

export type AssessmentOcrAnalyzeInput = {
  document_type: AssessmentOcrType;
  base64_content: string;
  mime_type: AssessmentOcrMimeType;
  /** 写真を上から帯に分けた続き（base64・形式は mime_type と同じ・画像のときだけ・最大 3 枚） */
  extra_parts?: string[];
};

/** `POST /assessment/ocr/analyze` の `data`（`type` で読み取り結果の形が決まる）。 */
export type AssessmentOcrAnalyzeResult = AssessmentOcrResult;

export type ToolEndpoint = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  content_type?: "multipart/form-data";
};

export type OutputFieldDef = {
  key: string;
  label: string;
  type: string;
  enum_labels?: Record<string, string>;
};

export type SubResourceDef = {
  key: string;
  title: string;
  output_fields: OutputFieldDef[];
};

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  module: string;
  scope: string;
  /**
   * チャット拡張機能グループ識別子（chat モジュールのツールのみ）。
   * 設定されていること自体が「トグル可能」の情報を兼ねる。registry 型（@qaito/tools）と整合
   */
  feature_group?: "web_search" | "code_execution" | "image_generation" | "file_generation";
  execution?: "heavy";
  /** chat 内部ツール（client-side 実行）等は endpoint を持たない。registry 型（@qaito/tools）と整合 */
  endpoint?: ToolEndpoint;
  response_type?: "blob";
  panel_type?: "list" | "detail" | "mutation" | "empty" | "none";
  resource?: string;
  /** OCR ツールの場合、結果を書き込む対象ツール名 */
  ocr_target_tool?: string;
  resource_label?: string;
  status_label?: string;
  output_fields?: OutputFieldDef[];
  sub_resources?: SubResourceDef[];
  /** テーブル表示時に使用するカラムキーの一覧（output_fields のサブセット） */
  table_columns?: string[];
};

export type ToolListParams = {
  format?: "anthropic" | "full";
};

export type ClientCompleteness = {
  family_count: number;
  care_certification_count: number;
  medical_count: number;
  document_count: number;
  assessment_count?: number;
};

export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export type MessageContentPart =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "image"; source: { type: "url"; url: string } };

export type MessageContent = string | MessageContentPart[];

export type CompletionMessage = {
  role: string;
  content: MessageContent;
};

export type CompletionInput = {
  messages: CompletionMessage[];
  model?: string;
  system?: string;
  tools?: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>;
  stream?: boolean;
};

export type CompletionResponse = {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }>;
  model: string;
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number };
};

export type ContractFieldDef = {
  type: string;
  label: string;
  nullable?: boolean;
  hidden?: boolean;
  required?: boolean;
  max_length?: number;
  enum?: string[];
  enum_labels?: Record<string, string>;
  description?: string;
};

export type ContractRelation = {
  key: string;
  label: string;
  resource: string;
  external?: boolean;
};

export type ContractUtility = {
  label: string;
  tool: string;
};

export type ContractDefinition = {
  resource: string;
  resource_label: string;
  db_tables?: string[];
  fields: Record<string, ContractFieldDef>;
  relations?: ContractRelation[];
  utilities?: ContractUtility[];
  table_columns?: string[];
  endpoints: Record<string, { method: string; path: string; sdk?: string }>;
  mcp_tools?: Record<string, { sdk_method: string; params: string[] }>;
};

export type OAuthUser = {
  id: string;
  name: string;
  scopes: string[];
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: OAuthUser;
};

/** GET /auth/userinfo（OpenID Connect UserInfo）。トークンが有効なら本人の情報を返す */
export type UserInfo = {
  /** ユーザー ID */
  sub: string;
  email: string | null;
  name: string | null;
  organization_id: string;
  /** 組織名（表示用）。見つからなければ null */
  organization_name: string | null;
  /** OAuth で発行したトークンのとき、その scope */
  scopes?: string[];
  /** 本人の顔写真の版。ポータルの `/api/me/photo?v={版}` を img にする。写真が無ければ null */
  avatar_version: string | null;
};

/** POST /integration/oauth-tokens/revoke — 失効させた本人の OAuth のトークンの数 */
export type OAuthTokensRevokeResult = { revoked: number };

/** GET /auth/oauth/client — 組み込みの外部アプリ（QaitoChat・ピアッザ）の、その組織の OAuth 公開クライアント */
export type BuiltinAppOAuthClient = {
  /** 認可リクエストの client_id（公開クライアントの key_prefix） */
  client_id: string;
  org_name: string;
};

/**
 * GET /integration/builtin-apps/:key — ログイン中ユーザーが入れる組み込みアプリ（QaitoChat・ピアッザ）と、その見た目。
 * 入れない・無い・無効は 404（区別しない）。
 */
export type BuiltinAppView = {
  /** 組み込みキー（`chat` / `piazza`） */
  builtin_key: string;
  name: string;
  /** 空文字あり */
  description: string;
  /** アイコンの名前（lucide） */
  icon_name: string;
  /** タイルのアクセント色（oklch） */
  theme_token: string;
  /** 組織が設定したロゴ（本番は同一オリジンの相対 `/user-profiles/...`）。null = アイコン */
  logo_url: string | null;
};

/**
 * GET /integration/builtin-apps/:key/members — その組み込みアプリに入れる人（呼んだ人が入れなければ 404）。
 * ルートとアーカイブ済みの人は出さない。`role` は組織の役（admin = コンソールに入れる管理者）。
 */
export type BuiltinAppMember = {
  user_id: string;
  name: string;
  /** 所属するグループの名前（名前の順） */
  groups: string[];
  role: "admin" | "member";
};

/**
 * GET /integration/working-facility?id= — いま作業している事業所（ポータルが置いた事業所の cookie の値を渡す）。
 * 認可の範囲の外・無効・UUID でない・他の組織は区別せず `facility: null`。`facility:read` は要らない。
 */
export type WorkingFacilityView = {
  facility: { id: string; name: string } | null;
};

/**
 * GET /integration/launcher — ヘッダーのアプリ一覧（ランチャー）の素材（組み込みアプリのヘッダーが使う）。
 * 業務アプリは `GET /apps` が返すので含めない。
 * `console_access` は表示のための事実（コンソールに入れるかの判定はコンソールの入口が持つ）。
 */
export type LauncherView = {
  console_access: boolean;
  /** ヘッダーにカレンダーを出すか（判定は api。組み込みアプリの側で scope を見ない） */
  calendar_access: boolean;
  /** ヘッダーにライブラリを出すか（同上） */
  library_access: boolean;
  external_apps: LauncherExternalApp[];
};

/** 入れる拡張アプリ（`builtin_key` あり）・連携アプリ（なし）。並びは棚と同じ */
export type LauncherExternalApp = {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  theme_token: string;
  /** 組織が設定したロゴ（本番は同一オリジンの相対 `/user-profiles/...`）。null = アイコン */
  logo_url: string | null;
  /** 連携アプリの URL。組み込みアプリは空文字（env ごとの origin は `@qaito/schemas/external-apps` で組む） */
  url: string;
  builtin_key: string | null;
};

export type TalkSession = {
  id: string;
  organization_id: string;
  user_id: string;
  client_id: string | null;
  title: string | null;
  model: string | null;
  started_at: string;
  ended_at: string | null;
  metadata: Record<string, unknown> | null;
  message_count?: number;
  created_at: string;
  updated_at: string;
};

export type TalkMessage = {
  id: string;
  session_id: string;
  organization_id: string;
  role: "human" | "ai" | "system";
  content: string;
  created_at: string;
};

export type CreateTalkSessionInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facility_id?: string;
  client_id?: string;
  title?: string;
  model?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateTalkSessionInput = {
  title?: string;
  ended_at?: string;
  client_id?: string;
};

export type AddTalkMessageInput = {
  role: "human" | "ai" | "system";
  content: string;
};

export type TalkIdentifyInput = {
  method: "insurance_number";
  value: string;
};

export type TalkIdentifyResult = {
  client_id: string;
  name: string;
  insurance_number: string | null;
};

export type CustomerClient = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者番号 */
  clientNumber: string;
  /** ステータス */
  status: string;
  familyName: string;
  /** 名 */
  givenName: string | null;
  /** 氏名（表示用） */
  displayName: string;
  /** 被保険者番号 */
  insuredNumber: string | null;
  /** 氏名（旧） */
  name: string;
  /** ふりがな */
  nameKana: string | null;
  /** 生年月日 */
  birthDate: string | null;
  /** 性別 */
  gender: string | null;
  /** 住所 */
  address: string | null;
  /** 電話番号 */
  phone: string | null;
  /** 要介護度 */
  careLevel: string | null;
  /** 登録日 */
  createdAt: string;
};

/**
 * /client/customer/clients/:id/overview のレスポンス型。
 * API は flat な data オブジェクトを返す（nested 構造ではない）。
 */
export type CustomerClientOverview = {
  id: string;
  client_number: string | null;
  status: import("@qaito/schemas/clients").ClientStatus;
  family_name: string | null;
  given_name: string | null;
  /** family_name + given_name または name から生成した表示用氏名（JOIN 結果） */
  display_name: string;
  name: string;
  name_kana: string | null;
  insured_number: string | null;
  birth_date: string | null;
  gender: "male" | "female" | "other" | null;
  address: string | null;
  phone: string | null;
  care_level: string | null;
  cert_valid_until: string | null;
  family_count: string | number;
  medical_count: string | number;
  assessment_count: string | number;
  last_assessed_at: string | null;
};

export type DevicePushToken = {
  id: string;
  platform: "ios" | "android";
  device_token: string;
  sns_endpoint_arn: string | null;
  app_version: string | null;
  last_active_at: string;
  revoked_at: string | null;
};

export type RegisterPushTokenInput = {
  /** どのアプリの通知先か（組み込みの外部アプリのキー。api は `BUILTIN_EXTERNAL_APP_KEY_LIST` の全部を受ける）。同じ端末のアプリごとに分けて登録する */
  app_key: import("@qaito/schemas/external-apps").BuiltinExternalAppKey;
  platform: "ios" | "android";
  device_token: string;
  app_version?: string;
};

export type RegisterPushTokenResult = {
  id: string;
  sns_endpoint_arn: string | null;
};

/** 自分の push トークンをすべて失効させた件数（全製品・全端末） */
export type RevokeOwnPushTokensResult = {
  revoked: number;
};

/**
 * 例外 1 件。**PII を入れない**（本文・氏名・入力値・トークンの欄は無い。api は知らない項目を 400 で断る）。
 * `message` と `stack` は送る前に除去する（`@qaito/schemas/client-errors` の `scrubClientErrorText`。api も同じ規則をもう一度当てる）
 */
export type ClientErrorReportInput = {
  kind: "js_uncaught" | "js_unhandled_rejection" | "api_error" | "js_caught";
  /** 例外の型名（`TypeError` など） */
  name: string;
  message: string;
  stack?: string;
  /** api の応答の request_id（`api_error` のとき） */
  request_id?: string;
  fatal: boolean;
  /** ISO 8601 */
  occurred_at?: string;
};

export type ReportClientErrorsInput = {
  /** 組み込みの外部アプリのキー（api は `BUILTIN_EXTERNAL_APP_KEY_LIST` の全部を受ける） */
  app_key: import("@qaito/schemas/external-apps").BuiltinExternalAppKey;
  platform: "ios" | "android";
  app_version?: string;
  os_version?: string;
  device_model?: string;
  /** 1〜20 件 */
  reports: ClientErrorReportInput[];
};

export type ReportClientErrorsResult = {
  accepted: number;
};

export type DeviceTokenInput = {
  grant_type: "face_recognition";
  user_id: string;
};

export type DeviceTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    login_id: string;
    display_name: string;
    role: string;
  };
};

export type UserFacePhoto = {
  user_id: string;
  display_name: string;
  face_photo_url: string;
};

export type CarePlan = {
  id: string;
  organization_id: string;
  client_id: string;
  source: "internal" | "external";
  status: "draft" | "approved" | "active" | "expired" | "revised";
  version: number;
  care_manager_name: string | null;
  care_manager_office: string | null;
  created_by_user_id: string | null;
  assessment_id: string | null;
  certification_id: string | null;
  client_wishes: string | null;
  family_wishes: string | null;
  overall_policy: string | null;
  life_support_reason: string | null;
  effective_from: string | null;
  effective_until: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CarePlanNeed = {
  id: string;
  care_plan_id: string;
  sort_order: number;
  need: string | null;
  long_term_goal: string | null;
  long_term_goal_period_start: string | null;
  long_term_goal_period_end: string | null;
  short_term_goal: string | null;
  short_term_goal_period_start: string | null;
  short_term_goal_period_end: string | null;
  service_content: string | null;
  service_type: string | null;
  provider_name: string | null;
  frequency: string | null;
  period_start: string | null;
  period_end: string | null;
};

export type CarePlanSchedule = {
  id: string;
  care_plan_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  service_content: string | null;
  service_type: string | null;
  provider_name: string | null;
  memo: string | null;
};

export type CarePlanDocument = {
  id: string;
  care_plan_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number | null;
  document_type: "original" | "supplement";
  created_at: string;
};

export type CarePlanDetail = CarePlan & {
  needs: CarePlanNeed[];
  schedules: CarePlanSchedule[];
};

export type CreateCarePlanInput = {
  client_id: string;
  source?: "internal" | "external";
  care_manager_name?: string;
  care_manager_office?: string;
  assessment_id?: string;
  certification_id?: string;
  client_wishes?: string;
  family_wishes?: string;
  overall_policy?: string;
  life_support_reason?: string;
  effective_from?: string;
  effective_until?: string;
  needs?: Omit<CarePlanNeed, "id" | "care_plan_id">[];
  schedules?: Omit<CarePlanSchedule, "id" | "care_plan_id">[];
};

export type UpdateCarePlanInput = Partial<Omit<CreateCarePlanInput, "client_id">>;

export type CarePlanDraft = {
  client_wishes: string;
  family_wishes: string;
  overall_policy: string;
  needs: Omit<CarePlanNeed, "id" | "care_plan_id">[];
};

export type GoalAchievementItem = {
  need_id: string;
  achievement: "achieved" | "partial" | "not_achieved";
  note?: string;
};

export type AlertItem = {
  kind: string;
  severity: "info" | "warning" | "critical";
  title?: string;
  subject: string;
  /** 判定が利用者単位のときの利用者 UUID（名簿バッジ・per-client 要対応判定用。集計/事業所系は null）。 */
  client_id?: string | null;
  due_date?: string | null;
  days_left?: number | null;
  count?: number | null;
  link: string;
  module_slug: string;
};

export type AlertSettingItem = {
  kind: string;
  label: string;
  description: string;
  contexts: string[];
  source_module: string;
  source_module_label: string;
  enabled: boolean;
};

/** 記録 4 種（介護記録 / バイタル / 連絡帳 / 機能訓練）。 */
export type AnalyticsRecordKind = "care_record" | "vital" | "contact_note" | "training";

/** 判定の段階（データ不足 / 基準内 / 要観察 / 要対応）。 */
export type AnalyticsMetricLevel = "unknown" | "ok" | "watch" | "alert";

/** GET /analytics/records のクエリ */
export type ListAnalyticsRecordsQuery = {
  from: string;
  to: string;
  /** カンマ区切り（`care_record,vital`）。省略は読める種別すべて */
  kinds?: string;
  client_id?: string;
  facility_id?: string;
  page?: number;
  page_size?: number;
};

/** 横断一覧の 1 行（記録の本体は所有モジュールの口で引く）。 */
export type AnalyticsRecord = {
  id: string;
  kind: AnalyticsRecordKind;
  client_id: string;
  facility_id: string | null;
  service_date: string;
  /** 記録種別の日本語ラベル */
  label: string;
  /** 表示用サマリー文 */
  summary: string;
  created_at: string;
};

export type AnalyticsRecordPage = {
  records: AnalyticsRecord[];
  total: number;
  totalByKind: Record<AnalyticsRecordKind, number>;
  /** read scope が無く読まなかった種別 */
  deniedKinds: AnalyticsRecordKind[];
  allowedKinds: AnalyticsRecordKind[];
};

/** 記録分析の対象の利用者 */
export type AnalyticsRecordClient = {
  id: string;
  family_name: string | null;
  given_name: string | null;
  family_name_kana: string | null;
  given_name_kana: string | null;
  client_number: string | null;
  status: string;
};

/** GET /analytics/records/summary のクエリ */
export type AnalyticsRecordsSummaryQuery = {
  from: string;
  to: string;
  facility_id?: string;
};

export type AnalyticsRecordsSummary = {
  rows: {
    client_id: string;
    client_name: string;
    care_record_count: number;
    vital_count: number;
    contact_note_count: number;
    training_count: number;
  }[];
  /** read scope が無く集計に含めなかった種別 */
  deniedKinds: AnalyticsRecordKind[];
};

/** GET /analytics/clients/:client_id/timeline のクエリ */
export type AnalyticsClientTimelineQuery = {
  from: string;
  to: string;
};

/** GET /analytics/clients/:client_id/trend のクエリ */
export type AnalyticsClientTrendQuery = {
  range?: "1m" | "3m" | "6m" | "1y";
  granularity?: "day" | "week" | "month";
};

/** 推移の 1 点（`value` が null = その区間に記録なし） */
export type AnalyticsTrendPoint = { date: string; value: number | null };

/** 1 人の推移の材料 */
export type AnalyticsClientTrend = {
  clientId: string;
  clientName: string;
  range: { from: string; to: string };
  /** ベースライン・前期比較のために遡って取った期間 */
  fetched: { from: string; to: string };
  rangeKey: "1m" | "3m" | "6m" | "1y";
  granularity: "day" | "week" | "month";
  asOf: string;
  weight: AnalyticsTrendPoint[];
  mealPct: AnalyticsTrendPoint[];
  waterMl: AnalyticsTrendPoint[];
  temperature: AnalyticsTrendPoint[];
  systolic: AnalyticsTrendPoint[];
  diastolic: AnalyticsTrendPoint[];
  pulse: AnalyticsTrendPoint[];
  spo2: AnalyticsTrendPoint[];
  bloodGlucose: (AnalyticsTrendPoint & { timing: "fasting" | "before_meal" | "after_meal" | "random" | null })[];
  barthel: AnalyticsTrendPoint[];
  training: { date: string; achievement: string | null; goalDomain: string | null }[];
  plans: { id: string; label: string; from: string; to: string | null }[];
  certifications: { id: string; careLevel: string; from: string; to: string | null }[];
  monitorings: { id: string; date: string; label: string }[];
  assessments: { id: string; date: string; label: string }[];
  /** 職員の自由記述（要配慮個人情報。ログに出さない） */
  notes: { date: string; source: string; text: string }[];
  heightCm: number | null;
  /** サービス利用開始日の代用（記録の最古日・推定） */
  serviceStartDate: string | null;
  /** 読めなかったデータソース */
  skipped: { label: string; scope: string }[];
};

/** GET /analytics/coverage のクエリ */
export type AnalyticsCoverageQuery = {
  /** YYYY-MM */
  month: string;
  facility_id?: string;
};

/** 記入状況（月 × 利用者 × 記録種別） */
export type AnalyticsCoverage = {
  month: string;
  from: string;
  to: string;
  facility_id: string | null;
  attended_days: number;
  active_clients: number;
  inactive_clients: number;
  record_summaries: {
    kind: AnalyticsRecordKind;
    expected: number;
    recorded: number;
    ratio: number | null;
    alert_clients: number;
    watch_clients: number;
    no_target_clients: number;
    judged: boolean;
  }[];
  client_coverages: {
    client_id: string;
    client_name: string;
    kind: AnalyticsRecordKind;
    expected: number;
    recorded: number;
    ratio: number | null;
    missing_dates: string[];
    level: AnalyticsMetricLevel;
    basis_rule: string;
    basis_source: string;
    judged: boolean;
  }[];
  additions: {
    group: string;
    label: string;
    item_code: string | null;
    filed: boolean;
    status: AnalyticsAdditionStatus;
    backed_units: number;
    excluded_units: number;
    unit_label: string;
    monthly_cap: number | null;
    countable: number;
    level: AnalyticsMetricLevel;
    basis_rule: string;
    basis_source: string;
    backing_label: string;
    clients_without_backing: number;
    clients_with_backing: number;
  }[];
  addition_clients: {
    group: string;
    addition_label: string;
    client_id: string;
    client_name: string;
    status: AnalyticsAdditionStatus;
    backed_units: number;
    excluded_units: number;
    unit_label: string;
    detail: string;
  }[];
  life: {
    total: number;
    accepted: number;
    submitted: number;
    draft: number;
    rejected: number;
    obligation_count: number;
    obligation_pending: number;
    obligation_missed: number;
  };
  life_gaps: {
    client_id: string;
    client_name: string;
    addition_labels: string[];
    last_accepted_period: string | null;
    months_since: number | null;
  }[];
  records_without_facility: number;
  /** 読めなかったデータソースのラベル */
  missing_scopes: string[];
};

/** 加算の充足の判定 */
export type AnalyticsAdditionStatus =
  | "ok"
  | "missed_no_record"
  | "missed_excluded"
  | "risk_no_evidence"
  | "opportunity_not_filed"
  | "unjudged";

/** GET /analytics/today のクエリ */
export type AnalyticsTodayQuery = {
  date: string;
  facility_id?: string;
};

/** その日の要観察者 */
export type AnalyticsTodayObservations = {
  date: string;
  clients: {
    clientId: string;
    clientName: string;
    facilityId: string | null;
    level: "watch" | "alert";
    score: number;
    findings: {
      kind: "spo2" | "temperature" | "systolic_bp" | "diastolic_bp" | "pulse" | "meal_intake" | "water_intake" | "weight";
      level: "watch" | "alert";
      current: number;
      baselineMean: number | null;
      baselineCount: number;
      sigma: number | null;
      headline: string;
      detail: string;
      source: string;
      recent: (number | null)[];
      baselineBand: { from: number; to: number } | null;
    }[];
  }[];
  recordedClientCount: number;
  missingSources: string[];
  hiddenNoFacilityCount: number;
};

/** POST /analytics/clients/:client_id/insight の body */
export type DraftAnalyticsClientInsightInput = {
  range?: "1m" | "3m" | "6m" | "1y";
  granularity?: "day" | "week" | "month";
};

/** POST /analytics/facility-insight の body */
export type DraftAnalyticsFacilityInsightInput = {
  range?: "3m" | "6m" | "12m";
  metric?: "clients" | "meal_pct" | "water_ml" | "attendance" | "training_rate";
  axis?: "care_level" | "age" | "gender" | "facility";
  facility_id?: string | null;
};

/** AI「気づきの支援」の結果（保存しない） */
export type AnalyticsInsight = {
  text: string;
  generated_at: string;
};

export type DayserviceReportSectionKey = "vitals" | "physical" | "treatments" | "summary";

/** GET /plan-review/dayservice-reports の 1 人 */
export type DayserviceReportTarget = {
  clientId: string;
  name: string | null;
  nameKana: string | null;
  /** 利用者番号 */
  clientNumber: string;
  /** 報告を保存するときに紐づける通所介護計画書 */
  carePlanId: string;
  /** その月の報告（無ければ null） */
  monitoringId: string | null;
  /** 報告の状態（未作成は null） */
  reportStatus: "draft" | "done" | null;
};

/** GET /plan-review/dayservice-reports/material の応答（日付は YYYY-MM-DD） */
export type DayserviceReportMaterial = {
  clientId: string;
  month: string;
  serviceDays: number;
  vitals: Array<{ date: string; tempCelsius: string | null; bpSystolic: number | null; bpDiastolic: number | null; pulse: number | null }>;
  /** 月ごとの最後の体重（その月と前 2 か月・古い順） */
  weights: Array<{ month: string; weightKg: string | null }>;
  training: Array<{ date: string; program: string; achievement: string | null }>;
  baths: Array<{ date: string; bathType: string | null; bathMethod: string | null }>;
  notes: Array<{ date: string; kind: "special" | "treatment" | "procedure" | "recheck" | "remarks"; text: string }>;
  contactNotes: Array<{ date: string; text: string }>;
};

/** POST /plan-review/dayservice-reports/draft のボディ */
export type DraftDayserviceReportInput = {
  facilityId: string;
  clientId: string;
  /** 対象月（YYYY-MM） */
  month: string;
  /** 作る節（省くと全部） */
  sections?: DayserviceReportSectionKey[];
};

/** AI の下書き（保存していない） */
export type DayserviceReportDraft = {
  sections: Partial<Record<DayserviceReportSectionKey, string>>;
};

/** GET /plan-review/monitorings/missing-count の応答 */
export type MonitoringMissingCount = {
  /** 対象月（YYYY-MM） */
  year_month: string;
  /** その月のモニタリングが未実施の利用者数 */
  missing_count: number;
};

export type Monitoring = {
  id: string;
  organization_id: string;
  care_plan_id: string;
  client_id: string;
  care_manager_id: string | null;
  life_submission_id: string | null;
  monitoring_date: string;
  monitoring_month: string | null;
  short_goal_status: GoalStatus | null;
  long_goal_status: GoalStatus | null;
  client_condition: string | null;
  family_opinion: string | null;
  service_status: string | null;
  service_status_level: ServiceStatusLevel | null;
  satisfaction_status: SatisfactionStatus | null;
  condition_change_status: ConditionChangeStatus | null;
  plan_change_required: boolean;
  plan_change_reason: string | null;
  assessor_id: string | null;
  memo: string | null;
  extra_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/**
 * 目標の達成状況（短期・長期共通）。
 * 値の正本は `@qaito/schemas/api/monitoring` の `goalStatusEnum`。
 */
export type GoalStatus =
  | "achieved"
  | "partial"
  | "not_achieved"
  | "not_implemented"
  | "not_evaluated";
/** 計画と実際のサービスの適合度 */
export type ServiceStatusLevel = "matched" | "mostly" | "not_matched";
export type SatisfactionStatus = "satisfied" | "dissatisfied";
export type ConditionChangeStatus = "no_change" | "changed";

export type CreateMonitoringInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facility_id?: string;
  care_plan_id: string;
  monitoring_date: string;
  monitoring_month?: string;
  short_goal_status?: GoalStatus;
  long_goal_status?: GoalStatus;
  client_condition?: string;
  family_opinion?: string;
  service_status?: string;
  service_status_level?: ServiceStatusLevel;
  satisfaction_status?: SatisfactionStatus;
  condition_change_status?: ConditionChangeStatus;
  plan_change_required?: boolean;
  plan_change_reason?: string;
  assessor_id?: string;
  memo?: string;
  extra_data?: Record<string, unknown>;
};

export type UpdateMonitoringInput = Partial<Omit<CreateMonitoringInput, "care_plan_id" | "facility_id">>;

/**
 * 計画評価。
 *
 * ⚠️ Monitoring と同じ理由で幽霊定義だった（`evaluated_at` / `goal_achievement` /
 * `next_plan_type` …）。SoT は `contracts/evaluation.evaluations.json` と
 * `@qaito/schemas/api/evaluation`。
 */
export type Evaluation = {
  id: string;
  organization_id: string;
  care_plan_id: string;
  client_id: string;
  care_manager_id: string | null;
  life_submission_id: string | null;
  evaluation_date: string;
  evaluation_type: EvaluationType;
  short_goal_achievement: GoalAchievement | null;
  long_goal_achievement: GoalAchievement | null;
  overall_assessment: string | null;
  reason_for_change: string | null;
  next_plan_direction: string | null;
  evaluator_id: string | null;
  memo: string | null;
  extra_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type EvaluationType = "interim" | "final";
/** 目標の達成度 */
export type GoalAchievement = "fully" | "partially" | "not_achieved" | "discontinued";

export type CreateEvaluationInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facility_id?: string;
  care_plan_id: string;
  evaluation_date: string;
  evaluation_type?: EvaluationType;
  short_goal_achievement?: GoalAchievement;
  long_goal_achievement?: GoalAchievement;
  overall_assessment?: string;
  reason_for_change?: string;
  next_plan_direction?: string;
  evaluator_id?: string;
  memo?: string;
  extra_data?: Record<string, unknown>;
};

export type UpdateEvaluationInput = Partial<Omit<CreateEvaluationInput, "care_plan_id" | "facility_id">>;

export type DraftEvaluationInput = {
  carePlanId: string;
  /** tsusho = 通所介護計画書 / kunren = 個別機能訓練計画書 */
  planType: "tsusho" | "kunren";
};

export type EvaluationDraft = {
  /** 評価の欄（キーは保存の入力と同じ camelCase: longGoalAchievement・shortGoalAchievement・outcomeSummary） */
  fields: Record<string, unknown>;
  /** サービス提供内容 ①〜⑤ の評価（no は計画の番号 1〜5）。通所だけ */
  services: { no: number; evalImplemented?: string; evalAchieved?: string; effectNote?: string }[];
  /** 欄ごとの根拠（材料の種類と時点・キーは欄のキーか services.<番号>） */
  evidence: Record<string, { source: string; asOf: string | null }[]>;
  /** 人が確かめる点 */
  checks: string[];
};

export type SaveEvaluationInput = {
  carePlanId: string;
  planType: "tsusho" | "kunren";
  evaluationDate: string;
  evaluationType?: "interim" | "final";
  reasonForChange?: string;
  nextPlanDirection?: string;
  evaluatorId?: string;
  longGoalAchievement?: "achieved" | "partial" | "not_achieved";
  shortGoalAchievement?: "achieved" | "partial" | "not_achieved";
  /** 通所だけ */
  outcomeSummary?: string;
  /** 通所だけ */
  reevaluatedOn?: string;
  /** 通所だけ。no は計画の番号 1〜5 */
  services?: {
    no: number;
    evalImplemented?: "done" | "partial" | "not_done";
    evalAchieved?: "achieved" | "partial" | "not_achieved";
    effectNote?: string;
  }[];
};

/** POST /plan-review/evaluations/save の応答（評価をした記録の行） */
export type SavedEvaluation = {
  evaluation: Evaluation;
};

export type ChatFeedback = {
  id: string;
  organization_id: string;
  session_id: string;
  message_id: string;
  user_id: string;
  rating: "good" | "bad";
  comment: string | null;
  created_at: string;
};

export type CreateChatFeedbackInput = {
  session_id: string;
  message_id: string;
  rating: "good" | "bad";
  comment?: string;
};

export type ChatShareInfo = {
  share_token: string;
  share_url: string;
  expires_at: string | null;
  created_at: string;
};

export type SharedChatSession = {
  session: Pick<ChatSession, "id" | "title" | "created_at" | "updated_at">;
  messages: Pick<ChatMessage, "id" | "role" | "content" | "created_at">[];
  shared_at: string;
  expires_at: string | null;
};

/** 会話メモリ（このユーザーについて AI が覚えていること）。 */
export type ChatMemory = {
  id: string;
  /** 覚えている内容（1 文） */
  content: string;
  /** 分類 */
  category: string;
  /** 種類（preference=好み / procedure=手順 / fact=事実 / person=人） */
  kind: ChatMemoryKind;
  /** 最後に会話へ使われた日時（ISO。未使用は null） */
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** まだ記憶になっていない候補（設定の画面の「覚える候補」。会話の中で「はい」と答えると記憶になる） */
export type ChatPendingMemory = {
  id: string;
  /** 候補の内容（1 文） */
  content: string;
  kind: ChatMemoryKind;
  createdAt: string;
};

/** 記憶を足す・直すときの入力 */
export type CreateChatMemoryInput = {
  content: string;
  category?: string;
  kind?: ChatMemoryKind;
  /** 会話のあとに抜き出した候補を記憶にするとき、その候補の ID */
  candidate_id?: string;
  /** この記憶で置き換える古い記憶の ID（承認の上で消える） */
  replaces_ids?: string[];
};
export type UpdateChatMemoryInput = {
  content: string;
  category?: string;
  kind?: ChatMemoryKind;
};

/** 記憶の種類 */
export type ChatMemoryKind = "preference" | "procedure" | "fact" | "person";

/** 会話のあとに抜き出した記憶の候補（まだ記憶ではない。利用者に確かめてから記憶にする） */
export type ChatMemoryCandidate = {
  id: string;
  kind: ChatMemoryKind;
  content: string;
  /** 前のターンで一度聞いた */
  asked: boolean;
  /** 置き換える古い記憶 */
  replaces: Array<{ id: string; content: string }>;
  createdAt: string;
};

/** 抜き出しに送る会話の最後のやり取り（文字だけ） */
export type ExtractChatMemoriesInput = {
  session_id: string;
  messages: Array<{ role: "user" | "assistant"; text: string }>;
};

/** 承認したツールの実行の状態（予約・確定の結果） */
export type ToolExecutionState = {
  /** reserved = 実行してよい / done = 既に成立（result を使う）/ no_turn = 予約の対象外 */
  status: "reserved" | "done" | "no_turn" | "failed";
  result: unknown;
};
export type ReserveToolExecutionInput = { tool_call_id: string };
export type SettleToolExecutionInput = {
  tool_call_id: string;
  status: "done" | "failed";
  result: unknown;
};

/**
 * `tools.read` の応答（api の本文のまま）。読める口（GET のツール）のうち、`data` の外に項目が付くのは
 * 件数（`total`）と補足（`meta`）だけ。
 */
export type ToolReadResponse<T = unknown> = {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
  /** 一覧の件数（利用者の証明書・計画・顧客の一覧など） */
  total?: number;
  /** 一覧の補足（職員のシフトの対象期間） */
  meta?: ToolReadMeta;
};

/** `tools.read` の応答の補足 */
export type ToolReadMeta = {
  /** シフトの一覧の対象期間（ラベル月・暦月・両端を含む日付） */
  period?: { month: string; start: string; end: string };
};

/** ツールのファイルの中身（`tools.download`）。名前と形式は api の応答のまま */
export type ToolDownload = {
  body: ArrayBuffer;
  contentType: string;
  contentDisposition: string;
};

/** 会話メモリの取得条件。`limit` を付けると `q` に近いものを検索する（`q` が無ければ最近使った順）。 */
export type ChatMemoryListParams = {
  q?: string;
  limit?: number;
};

export type ChatTemplate = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** ユーザーID */
  userId: string;
  /** タイトル */
  title: string;
  /** プロンプト */
  prompt: string;
  /** カテゴリ */
  category: string | null;
  /** 使用回数 */
  usageCount: number;
  /** 作成日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type CreateChatTemplateInput = {
  title: string;
  prompt: string;
  category?: string;
};

export type UpdateChatTemplateInput = Partial<CreateChatTemplateInput>;

export type GenerateTitleInput = {
  message: string;
};

export type GenerateTitleResult = {
  title: string;
};

export type GenerateFileContentType =
  | "text/markdown"
  | "text/csv"
  | "text/plain"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export type GenerateFileInput = {
  content_type: GenerateFileContentType;
  filename: string;
  content?: string;
  structured_data?: Record<string, unknown>;
};

export type GenerateFileResult = {
  download_url: string;
  filename: string;
  /**
   * Qaito ドライブ保存時 = 自動保存の失効時刻（30 日。URL 失効後は
   * /storage/files/:id/download で再取得可能）。
   * llm-temp フォールバック時（User Token 無しの MCP 呼び出し等）= 署名 URL の失効時刻（1h）。
   */
  expires_at: string;
  /** Qaito ドライブ（shared.user_files）保存時のみ付与 */
  file_id?: string;
  content_type?: string;
  size_bytes?: number;
};

export type ScheduleChangeType = "rest" | "date_change" | "add" | "time_change";

export type ScheduleChange = {
  id: string;
  clientId: string;
  changeType: ScheduleChangeType;
  /** YYYY-MM-DD（日付変更では元の日） */
  targetDate: string;
  movedToDate: string | null;
  /** HH:MM */
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  familyName: string | null;
  givenName: string | null;
  name: string | null;
  familyNameKana: string | null;
  givenNameKana: string | null;
  nameKana: string | null;
  clientStatus: string | null;
  /** お試し体験の来所（利用者が trial で「追加」） */
  isTrialVisit: boolean;
};

export type ListScheduleChangesQuery = {
  facility_id: string;
  /** YYYY-MM */
  month: string;
};

/** GET /schedule/weeks/state・/schedule/weeks/members のクエリ */
export type WeekQuery = {
  facility_id: string;
  /** 週頭（月曜・YYYY-MM-DD） */
  week_start: string;
};

/** 週（事業所 × 週頭）の予定の行の人数・作成日時・最終変更。行が無ければ memberCount 0・publishedAt null */
export type WeekPublishState = {
  memberCount: number;
  publishedAt: string | null;
  /** 最終変更（regular + spot の作成・更新・取り消しのうち最新） */
  lastModifiedAt: string | null;
};

/** 週の予定行（regular = 作成 / spot = 週の予定表で足した）。氏名は利用者台帳で引く */
export type WeeklyScheduleMember = {
  id: string;
  clientId: string;
  source: string;
  serviceDate: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
};

/** 週間予定の型紙（どの利用者が何曜日に通うか） */
export type ScheduleTemplate = {
  /** 事業所の型紙は UUID。システムテンプレート「契約の利用曜日」は `contract` */
  id: string;
  name: string;
  /** system = システムテンプレート（契約から導く・直せない）/ facility = 事業所の型紙 */
  kind: "system" | "facility";
  isDefault: boolean;
  /** 通う曜日が 1 つ以上ある人数 */
  memberCount: number;
};

/** POST /schedule/templates/:template_id/duplicate の body（複製元はパス） */
export type DuplicateScheduleTemplateInput = {
  name: string;
  /** 複製先の事業所（複製元が `contract` のとき必須） */
  facilityId?: string | null;
};

/** 週の状態。none = 未作成 / draft = 下書き / confirmed = 確定 / editing = 編集中 */
export type ScheduleWeekState = "none" | "draft" | "confirmed" | "editing";

/** 週の作り方。blank = 新しく作る / contract = 契約の利用曜日 / template = 型紙 / copy = 過去から複製 */
export type ScheduleWeekCreatedFrom = "blank" | "contract" | "template" | "copy";

/** GET /schedule/week-plans の 1 行（新しい順）。casing=camelCase */
export type ScheduleWeekPlanSummary = {
  /** 週の月曜（YYYY-MM-DD） */
  weekStart: string;
  state: Exclude<ScheduleWeekState, "none">;
  createdFrom: ScheduleWeekCreatedFrom;
  templateName: string | null;
  /** ISO 8601 */
  confirmedAt: string | null;
  cellCount: number;
  draftCount: number;
};

/** マス（利用者 × 日付）に利用者カレンダーの例外を重ねた姿 */
export type ScheduleWeekCell = {
  clientId: string;
  serviceDate: string;
  /** マスの時間（HH:MM。例外を当てる前） */
  startTime: string | null;
  endTime: string | null;
  /** 当たっている例外（休み・日付変更の元の日・時間変更） */
  changeId: string | null;
  changeType: "rest" | "date_change" | "add" | "time_change" | null;
  /** 例外を当てると来ない（休み・日付変更の元の日） */
  cancelled: boolean;
  effectiveStartTime: string | null;
  effectiveEndTime: string | null;
};

/** 例外で足す予定（追加 → spot / trial・日付変更の変更先 → substitute） */
export type ScheduleWeekExtraCell = {
  clientId: string;
  serviceDate: string;
  source: "substitute" | "spot" | "trial";
  startTime: string | null;
  endTime: string | null;
  substitutedForDate: string | null;
  change: {
    id: string;
    clientId: string;
    changeType: "rest" | "date_change" | "add" | "time_change";
    targetDate: string;
    movedToDate: string | null;
    startTime: string | null;
    endTime: string | null;
  };
};

/** GET /schedule/week-plans/:facility_id/:week_start */
export type ScheduleWeekPlan = {
  facilityId: string;
  weekStart: string;
  weekEnd: string;
  state: ScheduleWeekState;
  week: {
    id: string;
    status: "draft" | "confirmed";
    createdFrom: ScheduleWeekCreatedFrom;
    templateId: string | null;
    templateName: string | null;
    copiedFromWeekStart: string | null;
    confirmedAt: string | null;
    confirmedBy: string | null;
    confirmedByName: string | null;
    editingStartedAt: string | null;
    editingStartedBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  /** 下書き・編集中のマス（未作成・確定なら空） */
  draftCells: ScheduleWeekCell[];
  /** 確定したときのマス（未作成・下書きなら空） */
  confirmedCells: ScheduleWeekCell[];
  extraCells: ScheduleWeekExtraCell[];
  /** 編集中: 確定時から変えたマス */
  changedCells: { clientId: string; serviceDate: string; kind: "added" | "removed" | "retimed" }[];
  /** その週に掛かる例外。afterConfirm = 確定した後に入れた・直した */
  changes: {
    id: string;
    clientId: string;
    changeType: "rest" | "date_change" | "add" | "time_change";
    targetDate: string;
    movedToDate: string | null;
    startTime: string | null;
    endTime: string | null;
    afterConfirm: boolean;
  }[];
  /** 日々の画面に出ている予定の行 */
  schedules: {
    id: string;
    clientId: string;
    serviceDate: string;
    source: string;
    status: string;
    startTime: string | null;
    endTime: string | null;
    changeId: string | null;
  }[];
  recordedCells: { clientId: string; serviceDate: string; status: string }[];
  closedDates: string[];
  omitted: { clientId: string; name: string | null; reason: "no_contract" | "other_facility" | "no_days" | "not_in_week" }[];
  /** マスを押して「来る」にしたときに入る時間（契約の提供時間）。時間のある日だけ */
  defaultTimes: { clientId: string; serviceDate: string; startTime: string; endTime: string }[];
};

/** GET /schedule/week-plans/:facility_id/:week_start/status（その日を含む週の状態だけ） */
export type ScheduleWeekPlanStatus = {
  facilityId: string;
  /** 週の月曜（YYYY-MM-DD） */
  weekStart: string;
  weekEnd: string;
  state: ScheduleWeekState;
  /** 実績入力・ボード・連絡帳・送迎表に予定が出ているか（確定・編集中だけ true） */
  onDailyScreens: boolean;
  /** ISO 8601 */
  confirmedAt: string | null;
};

/** POST /schedule/week-plans/:facility_id/:week_start/draft の body */
export type CreateScheduleWeekDraftInput = {
  source: "blank" | "template" | "copy";
  /** 型紙の ID か、契約の利用曜日なら `contract`（source = template のとき必須） */
  templateId?: string | null;
  /** 写す週の月曜（source = copy のとき必須・確定した週） */
  copyFromWeekStart?: string | null;
};

/** 下書きを作った・入れ直した結果 */
export type ScheduleWeekDraftResult = {
  weekStart: string;
  state: "draft" | "editing";
  cells: number;
  /** 写さなかった人（その週にこの事業所の契約が無い） */
  skipped: { clientId: string; name: string | null; reason: "no_contract" }[];
};

/** PATCH /schedule/week-plans/:facility_id/:week_start/draft の body */
export type UpdateScheduleWeekDraftInput = {
  cells: {
    clientId: string;
    serviceDate: string;
    /** true = その日に来る（足す・時間を変える）/ false = 消す */
    attend: boolean;
    startTime?: string | null;
    endTime?: string | null;
  }[];
};

/** 確定の結果（予定に当てた件数と、触らなかった・足せなかったマス） */
export type ScheduleWeekApplyResult = {
  weekStart: string;
  inserted: number;
  updated: number;
  deleted: number;
  unrecorded: number;
  keptRecorded: number;
  notes: { clientId: string; serviceDate: string; reason: "recorded" | "occupied" | "deleted" | "closed" }[];
};

/** 契約を週に当てた結果（変わった週だけ）。 */
export type ContractWeekApplyResult = {
  weeks: (ScheduleWeekApplyResult & { facilityId: string; state: "none" | "draft" | "confirmed" | "editing" })[];
};

/** 型紙の中身 1 人分。days は通う曜日（1=月〜7=日）、空配列 = 休み */
/** 型紙の 1 曜日の時間（`HH:MM`。空は null ＝ 週間予定を作るときに契約の提供時間を使う） */
export type ScheduleTemplateDayTime = { day: number; startTime: string | null; endTime: string | null };

/** 型紙の中身 1 人（times は時間を入れた曜日だけ。システムテンプレートは契約の提供時間） */
export type ScheduleTemplateEntry = { clientId: string; days: number[]; times: ScheduleTemplateDayTime[] };

/** POST /schedule/templates の body（camelCase） */
export type CreateScheduleTemplateInput = {
  facilityId: string;
  name: string;
  copyFromTemplateId?: string | null;
  copyFromServicePlans?: boolean;
  /** 確定した過去の週（月曜）のマスと時間を写す。元の指定は 1 つだけ */
  copyFromWeekStart?: string | null;
};

/**
 * PUT /schedule/templates/:template_id/entries の body（変えた利用者だけ。days=null はその人を外す）。
 * times を渡すとその人の時間を丸ごと置き換え、省くと今の時間を残す。
 */
export type SaveScheduleTemplateEntriesInput = {
  entries: { clientId: string; days: number[] | null; times?: ScheduleTemplateDayTime[] }[];
};

/** GET /schedule/schedules/range のクエリ */
export type ListSchedulesInRangeQuery = {
  from: string;
  to: string;
  facility_id?: string;
};

/** 期間の予定（利用者名つき）。casing=camelCase */
export type ScheduleWithClient = {
  id: string;
  clientId: string;
  facilityId: string;
  serviceDate: string;
  serviceCategory: string;
  serviceTypeCode: string;
  startTime: string | null;
  endTime: string | null;
  source: string;
  status: string;
  absenceReason: string | null;
  absenceContactedAt: string | null;
  substitutedForDate: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  clientFamilyName: string | null;
  clientGivenName: string | null;
  clientFamilyNameKana: string | null;
  clientGivenNameKana: string | null;
  clientNumber: string | null;
  clientStatus: string | null;
};

/** POST /schedule/substitutes の body（camelCase） */
export type CreateSubstituteScheduleInput = {
  sourceScheduleId: string;
  newServiceDate: string;
  facilityId: string;
  note?: string | null;
};

/** POST /schedule/insurance-judge の body（camelCase） */
export type JudgeInsuranceInput = {
  facilityId: string;
  /** YYYY-MM */
  month: string;
};

/** 保険種別判定の結果（件数だけ。個別の根拠は返さない） */
export type InsuranceJudgeSummary = {
  judged: number;
  kaigo: number;
  iryo: number;
  /** 根拠（M1〜M4 等）ごとの件数 */
  byBasis: Record<string, number>;
};

export type UpsertScheduleChangeInput = {
  /** 更新するときの ID（省略 = 新規） */
  id?: string | null;
  clientId: string;
  facilityId: string;
  changeType: ScheduleChangeType;
  targetDate: string;
  movedToDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
};

export type RegisterTrialVisitInput = {
  familyName: string;
  givenName?: string | null;
  familyNameKana?: string | null;
  givenNameKana?: string | null;
  birthDate?: string | null;
  gender?: "male" | "female" | "other" | null;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  addressLine?: string | null;
  phone?: string | null;
  facilityId: string;
  trialDate: string;
  startTime?: string | null;
  endTime?: string | null;
};

/**
 * 予定の変更を書いたあと、週の予定表へ反映した結果。どちらも週頭（月曜 `YYYY-MM-DD`）。
 * まだ予定表を作っていない週はどちらにも入らない。`failedWeeks` が空でなければ、
 * 変更は保存済みだが予定表は古いまま（週間予定の「予定表を更新する」で作り直せる）。
 */
export type ScheduleChangeReflection = { reflectedWeeks: string[]; failedWeeks: string[] };

export type SavedScheduleChange = { id: string; reflection: ScheduleChangeReflection };

export type RemovedScheduleChange = { reflection: ScheduleChangeReflection };

export type RegisteredTrialVisit = {
  clientId: string;
  changeId: string;
  reflection: ScheduleChangeReflection;
};

export type ClientSchedule = {
  id: string;
  organization_id: string;
  client_id: string;
  facility_id: string;
  service_date: string;
  service_category: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  service_type_code: string;
  /** 提供時間（開始）"HH:MM" or "HH:MM:SS"。未設定は null */
  start_time: string | null;
  /** 提供時間（終了）"HH:MM" or "HH:MM:SS"。未設定は null */
  end_time: string | null;
  source: "regular" | "substitute" | "spot" | "trial";
  status: "scheduled" | "attended" | "absent" | "cancelled";
  absence_reason: string | null;
  absence_contacted_at: string | null;
  /** 欠席をケアマネに連絡したか（null = 記録なし） */
  absence_cm_notified: boolean | null;
  substituted_for_date: string | null;
  /** 旧方式の週の発行に使った型紙（いまは書かない。当てたテンプレートは週の行が持つ） */
  template_id: string | null;
  /** この行に当たっている利用者カレンダーの例外。null は例外が当たっていない */
  change_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateClientScheduleInput = {
  client_id: string;
  facility_id: string;
  service_date: string;
  service_category?: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  service_type_code: string;
  /** 提供時間（開始）"HH:MM" */
  start_time?: string | null;
  /** 提供時間（終了）"HH:MM" */
  end_time?: string | null;
  source?: "regular" | "substitute" | "spot" | "trial";
  status?: "scheduled" | "attended" | "absent" | "cancelled";
  substituted_for_date?: string | null;
  note?: string | null;
};

export type UpdateClientScheduleInput = Partial<Omit<CreateClientScheduleInput, "client_id" | "facility_id" | "service_date">> & {
  status?: "scheduled" | "attended" | "absent" | "cancelled";
  absence_reason?: string | null;
  absence_contacted_at?: string | null;
  note?: string | null;
};

export type AttendanceUpdateInput = {
  status: "attended" | "absent";
  absence_reason?: string | null;
  absence_contacted_at?: string | null;
  absence_cm_notified?: boolean | null;
};

export type GenerateMonthlyScheduleInput = {
  facility_id: string;
  year_month: string;
  client_ids?: string[];
};

export type ListClientSchedulesQuery = {
  /** 特定日（YYYY-MM-DD）で絞り込み */
  date?: string;
  /** 月（YYYY-MM）で絞り込み — API は date または month のいずれか */
  month?: string;
  client_id?: string;
  facility_id?: string;
  status?: "scheduled" | "attended" | "absent" | "cancelled";
};

export type GenerateMonthlyScheduleResult = {
  generated_count: number;
  skipped_count: number;
};

export type ClientOcrDocumentType = "insurance_card" | "certification" | "face_sheet" | "medication_notebook";

export type ClientOcrMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "application/pdf";

export type ClientOcrInput = {
  document_type: ClientOcrDocumentType;
  base64_content: string;
  mime_type: ClientOcrMimeType;
  /** 写真を上から帯に分けた続き（base64・形式は mime_type と同じ・画像のときだけ・最大 3 枚） */
  extra_parts?: string[];
};

export type ClientOcrResult = {
  type: ClientOcrDocumentType;
  extracted: Record<string, unknown>;
  warnings: string[];
};

export type ClientOcrAnalyzeDocumentType = "insurance_card" | "face_sheet";

export type ClientOcrAnalyzeInput = {
  document_type: ClientOcrAnalyzeDocumentType;
  base64_content: string;
  mime_type: ClientOcrMimeType;
  /** 写真を上から帯に分けた続き（base64・形式は mime_type と同じ・画像のときだけ・最大 3 枚） */
  extra_parts?: string[];
};

export type StaffMember = {
  id: string;
  organization_id: string;
  user_id: string | null;
  employee_number: string;
  /** 姓（漢字）*/
  family_name: string;
  /** 名（漢字）*/
  given_name: string;
  /** 姓（カナ）*/
  family_name_kana: string | null;
  /** 名（カナ）*/
  given_name_kana: string | null;
  birth_date: string | null;
  /** 入職日（YYYY-MM-DD、必須）*/
  hire_date: string;
  gender: "male" | "female" | "other" | null;
  status: "active" | "inactive" | "retired";
  /** 勤務区分（人員配置基準の常勤/非常勤）。null = 未設定 */
  employment_type: "full_time" | "part_time" | null;
  /** デフォルト勤務開始時刻（HH:MM）。シフト表のコマ入力の初期値。null = 未設定 */
  default_work_start: string | null;
  /** デフォルト勤務終了時刻（HH:MM）。null = 未設定 */
  default_work_end: string | null;
  phone: string | null;
  company_phone: string | null;
  company_email: string | null;
  personal_email: string | null;
  postal_code: string | null;
  prefecture: string | null;
  city: string | null;
  address_line: string | null;
  has_spouse: boolean;
  dependent_count: number;
  external_payroll_staff_id: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffQualification = {
  id: string;
  organization_id: string;
  staff_id: string;
  qualification_name: string;
  certificate_number: string | null;
  acquired_date: string | null;
  expiry_date: string | null;
  issuing_body: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffAssignment = {
  id: string;
  organization_id: string;
  staff_id: string;
  facility_id: string | null;
  company_id: string | null;
  is_primary: boolean;
  role: string | null;
  started_at: string;
  ended_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffFamily = {
  id: string;
  organization_id: string;
  staff_id: string;
  relation: "spouse" | "child" | "parent" | "sibling" | "other";
  name: string;
  name_kana: string | null;
  birth_date: string | null;
  is_dependent: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffEmergencyContact = {
  id: string;
  organization_id: string;
  staff_id: string;
  name: string;
  name_kana: string | null;
  relation: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  is_primary: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffEmployment = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 従業員ID */
  staffId: string;
  /** 雇用区分 */
  employeeCategory: string;
  /** 社会保険区分 */
  socialInsuranceCategory: string | null;
  /** 就業規則区分 */
  employmentRuleCategory: string | null;
  /** 週所定労働日数 */
  weeklyWorkDays: string | null;
  /** 1日所定労働時間 */
  dailyWorkHours: string | null;
  /** 週所定労働時間 */
  weeklyWorkHours: string | null;
  /** 通勤手段 */
  commuteMethod: string | null;
  /** 通勤距離(km) */
  commuteDistanceKm: string | null;
  /** 職種 */
  jobTitle: string | null;
  /** 健診対象 */
  healthCheckTarget: boolean;
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type StaffInsurance = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 従業員ID */
  staffId: string;
  /** 健康保険証番号 */
  healthInsuranceNumber: string | null;
  /** 税額表区分 */
  taxTableType: string | null;
  /** 雇用保険加入日 */
  employmentInsuranceStartDate: string | null;
  /** 雇用保険被保険者番号 */
  employmentInsuranceNumber: string | null;
  /** 雇用保険 */
  hasEmploymentInsurance: boolean;
  /** 社会保険 */
  hasSocialInsurance: boolean;
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type StaffAllowances = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 従業員ID */
  staffId: string;
  /** 資格手当 */
  hasQualificationAllowance: boolean;
  /** 家族手当（円） */
  familyAllowanceAmount: number | null;
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type StaffSubsidy = {
  id: string;
  organization_id: string;
  staff_id: string;
  subsidy_name: string;
  application_period: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

/** 要配慮個人情報（staff:sensitive スコープ必須）*/
export type StaffSpecialStatus = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 従業員ID */
  staffId: string;
  /** 障害区分 */
  disabilityCategory: string | null;
  /** 母子・父子区分 */
  singleParentCategory: string | null;
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

/** 健康診断（staff:sensitive スコープ必須）*/
export type StaffHealthCheck = {
  id: string;
  organization_id: string;
  staff_id: string;
  exam_date: string;
  exam_type: string;
  facility_name: string | null;
  result_category: "A" | "B" | "C" | "D" | "E" | null;
  next_exam_date: string | null;
  finding_memo: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateStaffInput = {
  family_name: string;
  given_name: string;
  family_name_kana?: string;
  given_name_kana?: string;
  gender?: "male" | "female" | "other";
  birth_date?: string;
  /** 入職日（YYYY-MM-DD、必須）*/
  hire_date: string;
  status?: "active" | "inactive" | "retired";
  employee_prefix?: string;
  /** 勤務区分（常勤/非常勤。人員配置基準の運用区分。null=未設定） */
  employment_type?: "full_time" | "part_time" | null;
  /** デフォルト勤務時間 開始（"HH:MM"・シフトのコマ入力プリフィル用） */
  default_work_start?: string | null;
  /** デフォルト勤務時間 終了（"HH:MM"） */
  default_work_end?: string | null;
  phone?: string;
  company_phone?: string;
  company_email?: string;
  personal_email?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  address_line?: string;
  has_spouse?: boolean;
  dependent_count?: number;
  external_payroll_staff_id?: string;
  memo?: string;
};

export type UpdateStaffInput = Partial<Omit<CreateStaffInput, "employee_prefix">>;

export type CreateStaffQualificationInput = {
  qualification_name: string;
  certificate_number?: string;
  acquired_date?: string;
  expiry_date?: string;
  issuing_body?: string;
  memo?: string;
};

export type UpdateStaffQualificationInput = Partial<CreateStaffQualificationInput>;

export type CreateStaffAssignmentInput = {
  facility_id?: string | null;
  company_id?: string | null;
  is_primary?: boolean;
  role?: string;
  started_at: string;
  ended_at?: string | null;
  memo?: string;
};

export type UpdateStaffAssignmentInput = Partial<CreateStaffAssignmentInput>;

export type CreateStaffFamilyInput = {
  relation: "spouse" | "child" | "parent" | "sibling" | "other";
  name: string;
  name_kana?: string;
  birth_date?: string;
  is_dependent?: boolean;
  memo?: string;
};

export type UpdateStaffFamilyInput = Partial<CreateStaffFamilyInput>;

export type CreateStaffEmergencyContactInput = {
  name: string;
  name_kana?: string;
  relation?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  is_primary?: boolean;
  memo?: string;
};

export type UpdateStaffEmergencyContactInput = Partial<CreateStaffEmergencyContactInput>;

export type CreateStaffEmploymentInput = {
  employee_category: "seishain" | "muki_koyo" | "yuki_koyo";
  social_insurance_category?: "seishain" | "tanjikan_seishain" | "muki_keiyaku" | "yuki_keiyaku" | null;
  employment_rule_category?: "seishain" | "tanjikan_seishain" | "muki_koyo" | "yuki_koyo" | null;
  weekly_work_days?: number | null;
  daily_work_hours?: number | null;
  weekly_work_hours?: number | null;
  commute_method?: string | null;
  commute_distance_km?: number | null;
  job_title?: string | null;
  health_check_target?: boolean;
};

export type CreateStaffInsuranceInput = {
  health_insurance_number?: string | null;
  tax_table_type?: "ko" | "otsu" | null;
  employment_insurance_start_date?: string | null;
  employment_insurance_number?: string | null;
  has_employment_insurance?: boolean;
  has_social_insurance?: boolean;
};

export type CreateStaffAllowancesInput = {
  has_qualification_allowance?: boolean;
  family_allowance_amount?: number | null;
};

export type CreateStaffSubsidyInput = {
  subsidy_name: string;
  application_period?: string;
  memo?: string;
};

export type UpdateStaffSubsidyInput = Partial<CreateStaffSubsidyInput>;

export type CreateStaffSpecialStatusInput = {
  disability_category?: "1" | "2" | "3" | "other" | null;
  single_parent_category?: "mother" | "father" | "other" | null;
};

export type CreateStaffHealthCheckInput = {
  exam_date: string;
  exam_type: string;
  facility_name?: string;
  result_category?: "A" | "B" | "C" | "D" | "E" | null;
  next_exam_date?: string | null;
  finding_memo?: string;
};

export type UpdateStaffHealthCheckInput = Partial<CreateStaffHealthCheckInput>;

/** デバイス台帳エントリ（DB: device.devices から Drizzle InferSelect の camelCase を snake_case に変換） */
export type Device = {
  id: string;
  organization_id: string;
  api_key_id: string;
  name: string;
  serial_number: string | null;
  /** 置いている事業所（会話の記録はこの事業所を写す）。null = 未設定 */
  facility_id: string | null;
  device_type: string;
  status: "active" | "revoked";
  log_transcript: boolean;
  log_face_auth_event: boolean;
  last_seen_at: string | null;
  failed_attempts: number;
  locked_until: string | null;
  revoked_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/** POST /device レスポンス（固有 API Key の生キーを 1 回限り含む） */
export type DeviceWithRawKey = Device & {
  api_key_raw: string;
  api_key_prefix: string;
};

/** 認証パラメータ（organizations テーブルの device_* カラム） */
export type DeviceAuthSettings = {
  deviceLivenessMode: "hmac" | "rekognition";
  deviceConfidenceThreshold: number;
  deviceLockMaxAttempts: number;
  deviceLockDurationMin: number;
};

/** POST /device リクエスト */
export type CreateDeviceInput = {
  name: string;
  serial_number?: string;
  notes?: string;
  /** 置いている事業所。省略・null = 未設定 */
  facility_id?: string | null;
};

/** PATCH /device/:id リクエスト */
export type UpdateDeviceInput = {
  name?: string;
  serial_number?: string | null;
  notes?: string | null;
  /** 置いている事業所。null = 未設定に戻す */
  facility_id?: string | null;
  log_transcript?: boolean;
  log_face_auth_event?: boolean;
};

/** PATCH /device/auth-settings リクエスト */
export type UpdateDeviceAuthSettingsInput = {
  device_liveness_mode?: "hmac" | "rekognition";
  device_confidence_threshold?: number;
  device_lock_max_attempts?: number;
  device_lock_duration_min?: number;
};

/** 訓練前後バイタル jsonb */
export type VitalSnapshot = {
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  pulse?: number | null;
  temp_celsius?: number | null;
  spo2?: number | null;
  weight_kg?: number | null;
  memo?: string;
};

/** GET /care-record/training/records 要素 / GET /care-record/training/records/:id */
export type TrainingRecord = {
  id: string;
  organization_id: string;
  client_id: string;
  facility_id: string | null;
  trainer_id: string | null;
  care_plan_id: string | null;
  service_date: string;
  recorded_at: string;
  service_category: string;
  service_type_code: string;
  goal_domain: "body_function" | "activity" | "participation" | null;
  program_name: string;
  training_method: string | null;
  duration_min: number | null;
  unit_count: number | null;
  /** 個別機能訓練加算(Ⅰ)イ/ロの算定対象として実施したか */
  addition_eligible: boolean;
  achievement: "achieved" | "partially" | "not_achieved" | "not_applicable" | null;
  achievement_note: string | null;
  vital_before: VitalSnapshot | null;
  vital_after: VitalSnapshot | null;
  life_form_code: string | null;
  life_linked_at: string | null;
  memo: string | null;
  template_id: string | null;
  extra_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** POST /care-record/training/records リクエスト */
export type CreateTrainingRecordInput = {
  clientId: string;
  facilityId?: string;
  trainerId?: string;
  carePlanId?: string;
  serviceDate: string;
  serviceCategory?: string;
  serviceTypeCode?: string;
  goalDomain?: "body_function" | "activity" | "participation";
  programName?: string;
  trainingMethod?: string;
  durationMin?: number;
  unitCount?: number;
  achievement?: "achieved" | "partially" | "not_achieved" | "not_applicable";
  achievementNote?: string;
  vitalBefore?: VitalSnapshot;
  vitalAfter?: VitalSnapshot;
  lifeFormCode?: string;
  lifeLinked?: boolean;
  memo?: string;
  templateId?: string;
  extraData?: Record<string, unknown>;
  exerciseMenuId?: string;
};

/** PATCH /care-record/training/records/:id リクエスト */
export type UpdateTrainingRecordInput = Partial<Omit<CreateTrainingRecordInput, "clientId">>;

/** GET /care-record/vitals/clients/:clientId/vitals 要素 / GET /care-record/vitals/clients/:clientId/vitals/:id */
/** 体重の推移の 1 か月（GET /care-record/vitals/clients/:clientId/weight-trend） */
export type WeightTrendMonth = {
  /** YYYY-MM */
  month: string;
  /** その月の最後に量った値（kg）。量っていなければ null */
  weight_kg: number | null;
  /** その値を量った日（YYYY-MM-DD） */
  measured_on: string | null;
  /** 前の月との差（kg）。どちらかの月に値が無ければ null */
  diff_kg: number | null;
  /** その月に量った回数 */
  count: number;
};
/** 体重の推移（古い月から新しい月の順） */
export type WeightTrend = { months: WeightTrendMonth[] };
/** months = 1〜24（既定 12）・to = 終わりの月 YYYY-MM（既定 今月） */
export type WeightTrendQuery = { months?: number; to?: string };

export type VitalRecord = {
  id: string;
  organization_id: string;
  client_id: string;
  facility_id: string | null;
  staff_id: string | null;
  source: "measured" | "transcribed";
  source_note: string | null;
  respiratory_rate: number | null;
  service_date: string;
  recorded_at: string;
  service_category: string;
  service_type_code: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  pulse: number | null;
  temp_celsius: string | null;
  spo2: number | null;
  blood_glucose: number | null;
  blood_glucose_timing: "fasting" | "before_meal" | "after_meal" | "random" | null;
  weight_kg: string | null;
  life_linked_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  /**
   * 保存（登録・更新）の応答だけに付く。その利用者のその日の実績表の「再検査」を、異常値なら立て、
   * 基準内に戻ったら外した結果（一覧・詳細には付かない）。
   * 基準: 体温 37.5℃以上 / 血圧（上）160 以上 または 90 未満 / 血圧（下）90 以上 /
   * 脈拍 100 以上 または 50 未満 / SpO2 90% 未満。外すのはその日の最後のバイタルが基準内のときだけ。
   */
  recheck?: VitalRecheckOutcome;
};

/**
 * バイタル保存時の自動再検査の結果。
 * - normal  … 基準内（立っていなかった・または最後のバイタルがまだ基準外）
 * - cleared … 基準内に戻ったので、立っていた再検査を今回 外した
 * - raised  … 異常値で、今回 再検査を立てた
 * - already … 異常値だが、すでに再検査が立っていた
 * - skipped … 異常値だが立てられなかった（事業所の無いバイタル / 実績表を書く権限が無い / 失敗）
 */
export type VitalRecheckOutcome =
  | { status: "normal" }
  | { status: "cleared" }
  | { status: "raised"; reasons: string[] }
  | { status: "already"; reasons: string[] }
  | { status: "skipped"; reasons: string[]; code: string };

/** POST /care-record/vitals/clients/:clientId/vitals リクエスト */
export type CreateVitalInput = {
  source?: "measured" | "transcribed";
  sourceNote?: string | null;
  respiratoryRate?: number | null;
  clientId: string;
  facilityId?: string | null;
  staffId?: string | null;
  serviceDate: string;
  recordedAt?: string;
  serviceCategory?: string;
  serviceTypeCode?: string;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  pulse?: number | null;
  tempCelsius?: number | null;
  spo2?: number | null;
  bloodGlucose?: number | null;
  bloodGlucoseTiming?: "fasting" | "before_meal" | "after_meal" | "random" | null;
  weightKg?: number | null;
  memo?: string | null;
};

/** PATCH /care-record/vitals/clients/:clientId/vitals/:id リクエスト */
export type UpdateVitalInput = Partial<Omit<CreateVitalInput, "clientId">>;

/** GET /care-record/vitals/clients/:clientId/vitals クエリパラメータ */
export type ListVitalsQuery = {
  from?: string;
  to?: string;
  limit?: number;
};

/** GET /care-record/notes 要素 / GET /care-record/notes/:id */
export type ContactNote = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者ID */
  clientId: string;
  /** 事業所ID */
  facilityId: string | null;
  /** 記録者ID */
  authorStaffId: string | null;
  /** サービス日 */
  serviceDate: string;
  /** 家族への連絡 */
  messageToFamily: string | null;
  /** 家族連絡方法 */
  familyContactMethod: string | null;
  /** 家族からの返信 */
  familyReply: string | null;
  /** 家族返信日時 */
  familyRepliedAt: string | null;
  /** 返信受信者 */
  familyRepliedBy: string | null;
  /** 写真キー(JSON配列) */
  photoKeys: unknown[];
  /**
   * 連絡票に載せる日常の記録の写真（media_logs.id）。
   * 単票の取得・作成・更新の応答だけに付く（一覧 GET /care-record/notes には出ない）。
   */
  mediaLogIds?: string[] | null;
  /** 自動で入る「その日の 1 枚」のうち外した写真（単票の応答だけに付く）。 */
  excludedMediaLogIds?: string[];
  /** 申し送り（スタッフ専用） */
  handoverNote: string | null;
  /** 職員の記入欄（家族に伝えたいこと。連絡事項の AI 生成が最優先で本文に反映する・家族の紙には載らない） */
  staffMemo: string | null;
  /** 削除日時 */
  /** 保存基準日 */
  /** 保存年数 */
  /** 登録日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
};

/** POST /care-record/notes リクエスト */
export type CreateContactNoteInput = {
  clientId: string;
  serviceDate: string;
  /** 事業所（未選択でも保存できる） */
  facilityId?: string | null;
  messageToFamily?: string;
  familyContactMethod?: "app" | "paper" | "phone" | "other";
  handoverNote?: string;
  /** 職員の記入欄（最大 1000 文字。空文字で消す） */
  staffMemo?: string;
  photoKeys?: string[];
  /** 連絡票に載せる日常の記録の写真（media_logs.id・最大 2 件） */
  mediaLogIds?: string[];
  /**
   * 連絡票に自動で入る「その日の 1 枚」のうち外す写真（media_logs.id・最大 20 件）。
   * 送らなければ変更しない。
   */
  excludedMediaLogIds?: string[];
};

/** PATCH /care-record/notes/:id リクエスト */
export type UpdateContactNoteInput = Partial<
  Omit<CreateContactNoteInput, "clientId" | "serviceDate" | "facilityId">
> & {
  /** 事業所の訂正（外すことはできない） */
  facilityId?: string;
};

/** PATCH /care-record/notes/:id/family-reply リクエスト */
export type UpsertFamilyReplyInput = {
  familyReply: string;
  familyRepliedBy?: string;
};

/** POST /care-record/notes/upload-url リクエスト */
export type ContactNoteUploadUrlInput = {
  clientId: string;
  serviceDate: string;
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/heic" | "image/webp";
  /** ファイルのバイト数（20MB まで）。PUT はこの大きさでないと通らない */
  sizeBytes: number;
  sha256?: string;
};

/** POST /care-record/notes/upload-url レスポンス */
export type ContactNoteUploadUrl = {
  upload_url: string;
  s3_key: string;
  expires_at: string;
};

/** GET /care-record/notes/:id/photo-urls 要素 */
export type ContactNotePhotoUrl = {
  key: string;
  url: string;
};

/** GET /care-record/notes クエリパラメータ */
export type ListContactNotesQuery = {
  clientId: string;
  from?: string;
  to?: string;
  limit?: number;
};

/** GET /care-record/handovers 要素（利用者 × 日で追記していく職員間の連絡） */
export type HandoverEntry = {
  id: string;
  clientId: string;
  facilityId: string;
  /** YYYY-MM-DD */
  serviceDate: string;
  body: string;
  /** 宛先（staff = 職員向け / family = 家族向け〔その日の連絡帳の連絡事項にも載せた〕/ memo = 保存だけ） */
  audience: "staff" | "family" | "memo";
  authorUserId: string | null;
  authorName: string | null;
  /** ISO 8601 */
  createdAt: string;
  /** 自分が書いたものか（消せるかの目印） */
  mine: boolean;
  /** 利用者の表示名（GET /care-record/handovers/day だけに付く） */
  clientName?: string;
};

/** GET /care-record/handovers/day 要素（利用者の表示名つき。client:read が無ければ「非公開」） */
export type DayHandoverEntry = HandoverEntry & { clientName: string };

/** POST /care-record/handovers リクエスト */
export type CreateHandoverEntryInput = {
  clientId: string;
  facilityId: string;
  serviceDate: string;
  /** 最大 2000 文字 */
  body: string;
  /** 宛先（省くと staff）。family はその日の連絡帳の連絡事項の末尾にも足す（申し送りを消しても連絡帳の文は残る） */
  audience?: "staff" | "family" | "memo";
};

/** GET /care-record/handovers クエリパラメータ（範囲を省くと今日） */
export type ListHandoverEntriesQuery = {
  clientId: string;
  from?: string;
  to?: string;
  limit?: number;
};

/** GET /care-record/handovers/day クエリパラメータ */
export type ListDayHandoverEntriesQuery = {
  facilityId: string;
  date: string;
};

/** GET /care-record/contact-note-templates 要素 */
export type ContactNoteTemplate = {
  id: string;
  organizationId: string;
  /** null は組織全体の定型文 */
  facilityId: string | null;
  name: string;
  body: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** POST /care-record/contact-note-templates リクエスト（facilityId を省くと組織全体・オーナー / 管理者だけ） */
export type CreateContactNoteTemplateInput = {
  facilityId?: string | null;
  /** 最大 50 文字 */
  name: string;
  /** 最大 4000 文字 */
  body: string;
  sortOrder?: number;
};

/** PATCH /care-record/contact-note-templates/:id リクエスト（送った項目だけ。事業所は付け替えない） */
export type UpdateContactNoteTemplateInput = {
  name?: string;
  body?: string;
  sortOrder?: number;
};

/** GET /care-record/contact-note-templates クエリパラメータ */
export type ListContactNoteTemplatesQuery = {
  /** その事業所の分 + 組織全体の分（省くと見える全部） */
  facilityId?: string;
};

/** 服薬状況（pending = 未 / done = 済 / refused = 拒否 / withheld = 見合わせ） */
export type MedicationStatus = "pending" | "done" | "refused" | "withheld";

/**
 * 服薬の実績 1 行（服薬管理の時間範囲＝窓に対するその日の実績。薬名・診断は持たない）。
 * POST /dayservice/medication/records の応答・GET /care-record/medication-administrations の要素。
 */
export type MedicationAdministration = {
  id: string;
  clientId: string;
  facilityId: string;
  /** YYYY-MM-DD */
  serviceDate: string;
  /** 窓の開始 HH:mm（JST） */
  windowStart: string;
  /** 窓の終了 HH:mm（JST） */
  windowEnd: string;
  status: MedicationStatus;
  /** 済 / 拒否 / 見合わせにした時刻（ISO 8601） */
  doneAt: string | null;
  doneByName: string | null;
  note: string | null;
  updatedAt: string;
  /** 利用者の表示名（GET /care-record/medication-administrations だけに付く） */
  clientName?: string;
};

/** GET /care-record/medication-administrations 要素（利用者の表示名つき。client:read が無ければ「非公開」） */
export type DayMedicationAdministration = MedicationAdministration & { clientName: string };

/** POST /dayservice/medication/records リクエスト（窓はその利用者の服薬管理にあるものだけ） */
export type RecordMedicationInput = {
  clientId: string;
  facilityId: string;
  serviceDate: string;
  /** HH:mm */
  windowStart: string;
  /** HH:mm */
  windowEnd: string;
  /** 省くと既存行は触らず、新しい行は未。取り消しは pending */
  status?: MedicationStatus;
  /** 最大 500 文字 */
  note?: string | null;
};

/** GET /care-record/medication-administrations クエリパラメータ */
export type ListDayMedicationAdministrationsQuery = {
  facilityId: string;
  date: string;
};

/** GET /transport/routes 要素 / GET /transport/routes/:routeId */
export type TransportRoute = {
  id: string;
  organizationId: string;
  facilityId: string | null;
  routeName: string;
  serviceCategory: string;
  serviceTypeCode: string;
  weekdaysActive: boolean[];
  departTime: string;
  returnTime: string | null;
  assignedVehicleId: string | null;
  driverStaffId: string | null;
  careStaffId: string | null;
  memo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** 停留所（GET /transport/routes/:routeId 詳細の stops 配列要素） */
export type TransportRouteStop = {
  id: string;
  organizationId: string;
  routeId: string;
  clientId: string | null;
  stopOrder: number;
  stopType: "pickup" | "dropoff" | "waypoint";
  addressLabel: string | null;
  latitude: string | null;
  longitude: string | null;
  scheduledTimeOffset: number | null;
  memo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** GET /transport/routes/:routeId（stops 込み詳細） */
export type TransportRouteDetail = TransportRoute & { stops: TransportRouteStop[] };

/** POST /transport/routes リクエスト */
export type CreateTransportRouteInput = {
  facilityId?: string | null;
  routeName: string;
  serviceCategory?: string;
  serviceTypeCode?: string;
  weekdaysActive?: boolean[];
  departTime: string;
  returnTime?: string | null;
  assignedVehicleId?: string | null;
  driverStaffId?: string | null;
  careStaffId?: string | null;
  memo?: string;
  isActive?: boolean;
};

/** PATCH /transport/routes/:routeId リクエスト */
export type UpdateTransportRouteInput = Partial<CreateTransportRouteInput>;

/** POST /transport/routes/:routeId/stops リクエスト */
export type CreateTransportRouteStopInput = {
  clientId?: string | null;
  stopOrder: number;
  stopType?: "pickup" | "dropoff" | "waypoint";
  addressLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  scheduledTimeOffset?: number | null;
  memo?: string;
  isActive?: boolean;
};

/** PATCH /transport/routes/:routeId/stops/:stopId リクエスト */
export type UpdateTransportRouteStopInput = Partial<CreateTransportRouteStopInput>;

/** PUT /transport/routes/:routeId/stops/reorder リクエスト */
export type ReorderTransportRouteStopsInput = {
  order: string[];
};

/** POST /transport/sheets/confirm・/edit・/cancel-edit のボディ（どの日のどちらの方向か） */
export type TransportSheetDayInput = {
  facilityId: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
  /** 迎え（pickup）/ 送り（dropoff）。**迎えと送りは別々に作り・確定する** */
  direction: "pickup" | "dropoff";
};

/** DELETE /transport/sheets/draft のクエリ */
export type TransportSheetDayQuery = {
  facility_id: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
  direction: "pickup" | "dropoff";
};

/** POST /transport/sheets/draft のボディ */
export type CreateTransportSheetDraftInput = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  /** 作り方（空から / テンプレートから / 過去の確定した日から） */
  source: "blank" | "template" | "copy";
  /** source = template のとき */
  templateId?: string;
  /** source = copy のとき（同じ方向の確定した日・YYYY-MM-DD） */
  copyFromDate?: string;
};

/** 作る・入れ直すの結果 */
export type CreateTransportSheetDraftResult = {
  date: string;
  direction: "pickup" | "dropoff";
  state: "draft" | "editing";
  /** 下書きに入れた行の数 */
  rows: number;
  /** その日の利用予定に無いので入れなかった人（名前は読める権限のときだけ） */
  skipped: { clientId: string; name: string }[];
};

/** 盤面の 1 行（まとめて保存・保存してから確定で送る形） */
export type TransportSheetEntryRowInput = {
  clientId: string;
  /** 車両（null = 未割当） */
  vehicleId: string | null;
  /** 運転者（null = 未割当） */
  driverStaffId: string | null;
  /** 何便目か（1〜20） */
  tripNo: number;
  /** 便の中の並び（0 から） */
  position: number;
  desiredTime?: string | null;
  plannedTime?: string | null;
  /** 到着予定（迎え = 事業所に着く / 送り = 家に着く） */
  arrivalTime?: string | null;
  note?: string | null;
};

/** POST /transport/sheets/confirm のボディ。`rows` を付けると保存してから確定する */
export type ConfirmTransportSheetInput = TransportSheetDayInput & {
  rows?: TransportSheetEntryRowInput[];
};

/** POST /transport/sheets/actual のボディ（車両運行記録・確定した日だけ）。`actualTime: null` で消す */
export type RecordTransportSheetActualInput = TransportSheetDayInput & {
  clientId: string;
  /** 利用者宅に着いた時刻（HH:MM） */
  actualTime: string | null;
};

/** POST /transport/sheets/cancel のボディ（車両運行記録・確定した日だけ）。`canceled: false` で取り消す */
export type SetTransportSheetCancelInput = TransportSheetDayInput & {
  clientId: string;
  canceled: boolean;
  reason?: string | null;
};

/** 車両運行記録を書いた結果 */
export type TransportSheetRecordResult = TransportSheetDayInput & { clientId: string };

/** PUT /transport/sheets/entries のボディ（その方向の盤面の行の全部。行に無い人は未割当に戻る） */
export type SaveTransportSheetEntriesInput = TransportSheetDayInput & {
  rows: TransportSheetEntryRowInput[];
};

/** まとめて保存の結果 */
export type SaveTransportSheetEntriesResult = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  state: "draft" | "editing";
  /** 保存した行の数 */
  rows: number;
};

/** 確定の結果 */
export type ConfirmTransportSheetResult = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  /** 確定した行の数 */
  rows: number;
};

/** 編集する・編集をやめる・下書きを捨てるの結果（どの日のどちらがどの状態になったか） */
export type TransportSheetStateResult = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  state: "none" | "draft" | "confirmed" | "editing";
  /** 編集する: 下書きに写した行の数 */
  rows?: number;
};

/** テンプレート 1 件（一覧に出すぶん）。 */
export type TransportTemplate = {
  id: string;
  name: string;
  direction: "pickup" | "dropoff";
  /** 使わない（作るたびに選ぶ。常に false） */
  isDefault: boolean;
  /** 中身の人数 */
  memberCount: number;
};

/** テンプレートの中身 1 行（送迎表の行から時刻を抜いた形）。 */
export type TransportTemplateEntry = {
  id: string;
  templateId: string;
  direction: "pickup" | "dropoff";
  vehicleId: string | null;
  driverStaffId: string | null;
  tripNo: number;
  clientId: string;
  /** 利用者の表示名（名前を読めない権限なら空文字） */
  clientName: string;
  /** 乗る時刻（迎え = 家に着く / 送り = 事業所を出る）。省略は旧サーバ */
  plannedTime?: string | null;
  /** 降りる場所に着く時刻（迎え = 事業所に着く / 送り = 家に着く） */
  arrivalTime?: string | null;
  position: number;
};

/** GET /transport/templates のクエリ */
export type TransportTemplateListQuery = {
  facility_id: string;
  direction: "pickup" | "dropoff";
};

/** POST /transport/templates のボディ */
export type CreateTransportTemplateInput = {
  facilityId: string;
  direction: "pickup" | "dropoff";
  name: string;
};

/** PATCH /transport/templates/:template_id のボディ */
export type UpdateTransportTemplateInput = {
  name?: string;
};

/** POST /transport/templates/:template_id/duplicate のボディ（名前を省くと「〇〇のコピー」） */
export type DuplicateTransportTemplateInput = {
  name?: string;
};

/** POST /transport/templates/from-day の body（過去の確定した日から作る） */
export type CreateTransportTemplateFromDayInput = {
  facilityId: string;
  direction: "pickup" | "dropoff";
  name: string;
  /** 写し元の確定した日（YYYY-MM-DD） */
  copyFromDate: string;
};

/** POST /transport/templates/generate の body（曜日の契約の利用曜日から AI で組む） */
export type GenerateTransportTemplateInput = {
  facilityId: string;
  direction: "pickup" | "dropoff";
  name: string;
  /** 曜日（ISO: 1=月〜7=日） */
  weekday: number;
  options?: GenerateTransportSheetInput["options"];
};

/** テンプレートを作った結果 */
export type TransportTemplateDraftResult = {
  templateId: string;
  name: string;
  direction: "pickup" | "dropoff";
  /** 中身に入れた行の数 */
  rows: number;
};

/** AI で組んだテンプレートの結果 */
export type GenerateTransportTemplateResult = TransportTemplateDraftResult & {
  trips: number;
  assignedDrivers: number;
  unassignedVehicles: number;
  usedAi: boolean;
  warnings: { kind: string; message: string }[];
};

/** テンプレートの盤面の材料（この事業所の利用者・車両・所属する職員） */
export type TransportTemplateBoard = {
  facilityId: string;
  facilityName: string | null;
  clientReadable: boolean;
  clients: TransportSheetClient[];
  vehicles: TransportSheet["vehicles"];
  drivers: TransportSheet["drivers"];
  avoidPairs: TransportSheet["avoidPairs"];
};

/** PUT /transport/templates/:template_id/entries のボディ */
export type ReplaceTransportTemplateEntriesInput = {
  direction: "pickup" | "dropoff";
  rows: {
    vehicleId: string | null;
    driverStaffId: string | null;
    tripNo: number;
    clientId: string;
    position: number;
    /** 時刻（省略は今の値を残す・null は消す） */
    plannedTime?: string | null;
    arrivalTime?: string | null;
  }[];
};

/** GET /transport/templates/:template_id/trip-times のクエリ（車 1 台 = 運転者込みのフレーム） */
export type TransportTemplateTripTimesQuery = {
  vehicle_id: string;
  /** 運転者（省略・空 = 未割当のフレーム） */
  driver_staff_id?: string;
};

/**
 * テンプレートの時刻の案（何も書かない）。利用時間は契約の提供時間。行・便・警告の形は送迎表と同じ。
 * 反映は `templates.replaceEntries` に時刻を付けて置き換える。
 */
export type TransportTemplateTripTimesSuggestion = Omit<
  TransportTripTimesSuggestion,
  "date" | "state" | "editable"
> & {
  templateId: string;
  editable: true;
};

/** GET /transport/sheets のクエリ */
export type TransportSheetQuery = { facility_id: string; date: string };

/** 送迎表の名簿 1 人分（提供時間・送迎設定・住所連絡先）。住所・電話は利用者台帳の read 権限があるときだけ */
export type TransportSheetClient = {
  clientId: string;
  name: string;
  kana: string;
  careLevel: string | null;
  isSupportLevel: boolean;
  serviceStart: string | null;
  serviceEnd: string | null;
  mobilityMeans: string | null;
  preArrivalNotice: string | null;
  transportNotes: string | null;
  /** 座席の指定（送迎設定） */
  seatAssignment: string | null;
  hasWheelchair: boolean;
  preferredPickupTime: string | null;
  preferredDropoffTime: string | null;
  preferredDriverStaffId: string | null;
  ngDriverIds: string[];
  city: string | null;
  address: string | null;
  telHome: string | null;
  telMobile: string | null;
  otherContacts: string[];
  /** その日欠席か（名簿の予定の行が absent。送迎のチェックの対象外）。テンプレートの盤面は常に false */
  absent: boolean;
};

/** 送迎表の割当 1 行 */
export type TransportSheetEntry = {
  id: string;
  direction: "pickup" | "dropoff";
  vehicleId: string | null;
  driverStaffId: string | null;
  tripNo: number;
  clientId: string;
  /** その日の希望時刻（手入力の上書きだけ） */
  desiredTime: string | null;
  /** 予定時刻（迎え = 家に着く / 送り = 事業所を出る） */
  plannedTime: string | null;
  /** 到着予定（迎え = 事業所に着く・便で同じ / 送り = 家に着く）。「時間を調整」が書く（省略は旧サーバ） */
  arrivalTime?: string | null;
  position: number;
  note: string | null;
  /** 車両運行記録（確定した日の行だけ・作業用の行は null）。利用者宅に着いた実測の時刻 "HH:MM" */
  actualTime?: string | null;
  /** キャンセルにした時刻（ISO）と理由 */
  canceledAt?: string | null;
  canceledReason?: string | null;
  clientName: string;
};

/** その日の送迎表 */
export type TransportSheet = {
  date: string;
  facilityId: string;
  facilityName: string | null;
  sheetId: string | null;
  canWrite: boolean;
  /** 割当の解除（行の物理削除）ができるか（`canWrite` と別軸） */
  canDelete: boolean;
  clientReadable: boolean;
  clients: TransportSheetClient[];
  entries: TransportSheetEntry[];
  vehicles: {
    id: string;
    name: string;
    capacity: number | null;
    wheelchairCapable: boolean;
    /** 車いすのまま乗れる台数（対応車で未設定なら null = 台数の制限なし） */
    wheelchairCapacity: number | null;
    /** 車いす 1 台でふさがる席の数（null は 1 とみなす） */
    seatsPerWheelchair: number | null;
    defaultDriverStaffId: string | null;
  }[];
  drivers: { staffId: string; name: string }[];
  /**
   * 行に入っている運転者のうち、`drivers`（その日に運転できる人）にいない人の名前（職員 ID → 名前）。
   * 休み・所属外の人が入った便を名前で出すのに使う。職員を読めなければ「非公開」（省略は旧サーバ）
   */
  driverNamesOfEntries?: Record<string, string>;
  /** 同じ便に乗せない利用者の組 */
  avoidPairs: { a: string; b: string }[];
  /**
   * その日を含む週の週間予定が確定しているか（確定・編集中 = true / 未作成・下書き = false）。
   * `false` のとき送迎表は「この週の予定が未確定です」と案内する（省略は旧サーバ。true と同じに扱う）
   */
  weekConfirmed?: boolean;
  /**
   * 方向ごとの状態。`entries` の中身はこれで決まる（下書き・編集中 = 下書きの行 /
   * 確定 = 確定したときの行から利用予定に無くなった人を外したもの / 未作成 = なし）
   */
  days: Record<"pickup" | "dropoff", TransportSheetDay>;
  /** 確定したときの行から利用予定に無くなった人を外したもの（確定・編集中の方向）。印刷に出るのはこれだけ */
  confirmedEntries: TransportSheetEntry[];
};

/** 日 × 方向の状態 */
export type TransportSheetDay = {
  state: "none" | "draft" | "confirmed" | "editing";
  createdFrom: "blank" | "template" | "copy" | "ai" | null;
  templateName: string | null;
  copiedFromDate: string | null;
  confirmedAt: string | null;
  confirmedByName: string | null;
  editingStartedAt: string | null;
  /** 確定後に利用予定に無くなった人（休み・日付変更の元の日） */
  removedAfterConfirm: { clientId: string; name: string }[];
  /** 利用予定にいるが確定した行に居ない人（追加・振替・お試し） */
  addedAfterConfirm: string[];
};

/** 作成済みの送迎表 1 件（snake_case） */
export type TransportSheetHistoryItem = {
  sheet_date: string;
  pickup_count: number;
  dropoff_count: number;
  updated_at: string;
};

/** POST /transport/sheets/entries の body */
export type AssignTransportSheetEntryInput = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  clientId: string;
  vehicleId: string | null;
  driverStaffId: string | null;
  /** 入れる便（省略は今の便・新しく入れるなら 1） */
  tripNo?: number;
  desiredTime?: string | null;
};

/** PATCH /transport/sheets/entries の body */
export type UpdateTransportSheetEntryInput = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  clientId: string;
  tripNo?: number;
  desiredTime?: string | null;
  plannedTime?: string | null;
  /** 到着予定（迎え = 事業所に着く / 送り = 家に着く） */
  arrivalTime?: string | null;
  position?: number;
  note?: string | null;
};

/** DELETE /transport/sheets/entries のクエリ */
export type RemoveTransportSheetEntryQuery = {
  facility_id: string;
  date: string;
  direction: "pickup" | "dropoff";
  client_id: string;
};

/** POST /transport/sheets/generate の body（options は省略 = 既定） */
export type GenerateTransportSheetInput = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  options?: {
    windowMinutes?: number;
    maxPerTrip?: number;
    staggerMinutes?: number;
    vehicleOverlapMinutes?: number;
    useAi?: boolean;
  };
};

/** 自動生成の結果 */
export type GenerateTransportSheetResult = {
  direction: "pickup" | "dropoff";
  trips: number;
  rows: number;
  assignedDrivers: number;
  unassignedVehicles: number;
  /** AI の提案を 1 便でも採ったか */
  usedAi: boolean;
  /** 便ごとの配置の出どころ（tripKey → "ai" | "rule" | "none"） */
  sources: Record<string, "ai" | "rule" | "none">;
  warnings: { kind: string; message: string }[];
};

/** GET /transport/sheets/trip-times のクエリ（車 1 台 = 運転者込みのフレーム） */
export type TransportTripTimesQuery = {
  facility_id: string;
  date: string;
  direction: "pickup" | "dropoff";
  vehicle_id: string;
  /** 運転者（省略・空 = 未割当のフレーム） */
  driver_staff_id?: string;
};

/** 区間をどれで数えたか（ルート計算 / 直線距離の概算 / 位置が無いので 10 分の目安） */
export type TransportTripTimingBasis = "route" | "estimate" | "default";

/** 時刻の案（何も書かない）。並び順は変えない */
/** POST /transport/sheets/trip-times/suggest のボディ（画面の下書きの便・並びで案を出す。何も書かない） */
export type SuggestTransportTripTimesForRowsInput = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  vehicleId: string;
  /** 運転者（null = 未割当のフレーム） */
  driverStaffId: string | null;
  /** そのフレームの行（下書きの便・並び・今の時刻） */
  rows: {
    clientId: string;
    tripNo: number;
    position: number;
    plannedTime?: string | null;
    arrivalTime?: string | null;
  }[];
};

export type TransportTripTimesSuggestion = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  vehicleId: string;
  driverStaffId: string | null;
  state: "none" | "draft" | "confirmed" | "editing";
  /** 反映できるか（下書き・編集中だけ。確定なら先に「編集する」） */
  editable: boolean;
  /** 事業所の位置があるか（無ければ事業所との区間は目安） */
  facilityLocated: boolean;
  basis: TransportTripTimingBasis;
  rows: {
    clientId: string;
    clientName: string;
    tripNo: number;
    current: { plannedTime: string | null; arrivalTime: string | null };
    /** 案（計算できなかった便の行は null） */
    proposed: { plannedTime: string; arrivalTime: string } | null;
    basis: TransportTripTimingBasis;
    changed: boolean;
  }[];
  trips: {
    tripNo: number;
    departFacility: string | null;
    arriveFacility: string | null;
    basis: TransportTripTimingBasis;
    issue: "no_service_time" | "out_of_day" | null;
  }[];
  /** 同じ車の前の便が次の便の出発に間に合わない（ずらさない） */
  warnings: { kind: "overlap"; tripNo: number; nextTripNo: number; arriveFacility: string; nextDepartFacility: string }[];
};

/** POST /transport/sheets/trip-times の body（選んだ行だけ。監査ログは 1 件） */
export type ApplyTransportTripTimesInput = {
  facilityId: string;
  date: string;
  direction: "pickup" | "dropoff";
  vehicleId: string;
  driverStaffId: string | null;
  rows: { clientId: string; plannedTime: string | null; arrivalTime: string | null }[];
};

/** POST /transport/sheets/trip-times の結果 */
export type ApplyTransportTripTimesResult = {
  date: string;
  direction: "pickup" | "dropoff";
  rows: number;
};

/** POST /transport/routes/draft-from-schedules レスポンス要素 */
export type TransportDraftStop = {
  clientId: string;
  clientName: string;
  /** 迎えの住所（利用者台帳の住所） */
  pickupAddress: string | null;
  /** 迎えの位置（numeric は文字で返る）。自宅前の停車位置、無ければ住所の位置 */
  pickupLatitude: string | null;
  pickupLongitude: string | null;
  hasWheelchair: boolean;
  transportAssistanceNote: string | null;
  ngDriverStaffIds: string[];
};

/** GET /transport/routes クエリパラメータ */
export type ListTransportRoutesQuery = {
  facilityId?: string;
  isActive?: boolean;
};

export type CareRecordType =
  | "service_provision"
  | "physical_restraint"
  | "complaint"
  | "accident"
  | "absence"
  | "care_conference"
  | "nutrition"
  | "oral"
  | "recreation"
  | "snack";

export type BathType = "full" | "partial" | "wiping" | "none";
export type ExcretionType = "toilet" | "portable" | "diaper" | "catheter" | "none";
export type ExcretionStool = "yes" | "no" | "unknown";

/** client.care_records 1行（1日1行ワイド型） */
export type CareRecord = {
  id: string;
  organization_id: string;
  client_id: string;
  facility_id: string | null;
  staff_id: string | null;
  service_date: string;
  recorded_at: string;
  service_category: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  service_type_code: string;
  record_type: CareRecordType;
  bath_type: BathType | null;
  /** 入浴方法（浴槽形態。bath_type〔体の範囲〕とは別の軸。footbath は足浴の印） */
  bath_method: "general" | "individual" | "shower" | "machine" | "other" | "footbath" | "cancelled" | null;
  bath_memo: string | null;
  meal_intake_pct: number | null;
  /** 主食・副食・おやつの個別の摂取率（meal_intake_pct は総合値） */
  meal_staple_pct: number | null;
  meal_side_pct: number | null;
  snack_intake_pct: number | null;
  water_intake_ml: number | null;
  meal_memo: string | null;
  excretion_type: ExcretionType | null;
  excretion_urine_count: number | null;
  excretion_stool: ExcretionStool | null;
  excretion_memo: string | null;
  special_note: string | null;
  treatment_memo: string | null;
  activity_name: string | null;
  activity_start: string | null;
  activity_end: string | null;
  extra_data: Record<string, unknown>;
  template_id: string | null;
  /** 論理削除の日時。一覧で include_deleted を付けたとき、削除済みの行を見分ける */
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

/** POST /care-record/records リクエスト */
export type CreateCareRecordInput = {
  client_id: string;
  facility_id?: string | null;
  staff_id?: string | null;
  service_date: string;
  service_category?: "kaigo_hoken" | "shogai_fukushi" | "sogo_jigyo";
  service_type_code?: string;
  record_type?: CareRecordType;
  bath_type?: BathType | null;
  bath_memo?: string | null;
  meal_intake_pct?: number | null;
  water_intake_ml?: number | null;
  meal_memo?: string | null;
  excretion_type?: ExcretionType | null;
  excretion_urine_count?: number | null;
  excretion_stool?: ExcretionStool | null;
  excretion_memo?: string | null;
  special_note?: string | null;
  treatment_memo?: string | null;
  extra_data?: Record<string, unknown>;
  template_id?: string | null;
};

/** PATCH /care-record/records/:id リクエスト */
export type UpdateCareRecordInput = Partial<Omit<CreateCareRecordInput, "client_id">>;

/** PATCH /care-record/records/:id/delete リクエスト */
export type SoftDeleteCareRecordInput = {
  retention_base_date?: string;
};

/** GET /care-record/records クエリパラメータ */
export type ListCareRecordsQuery = {
  client_id?: string;
  facility_id?: string;
  service_date?: string;
  date_from?: string;
  date_to?: string;
  record_type?: CareRecordType;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
};

/** tool.record_templates（記録テンプレートマスタ） */
export type RecordTemplate = {
  id: string;
  organization_id: string | null;
  service_type_code: string | null;
  record_type: CareRecordType;
  template_name: string;
  template_def: Record<string, unknown>;
  is_default: boolean;
  life_form_code: string | null;
  created_at: string;
  updated_at: string;
};

/** POST /care-record/templates リクエスト */
export type CreateRecordTemplateInput = {
  service_type_code?: string | null;
  record_type: CareRecordType;
  template_name: string;
  template_def?: Record<string, unknown>;
  is_default?: boolean;
  life_form_code?: string | null;
};

/** PATCH /care-record/templates/:id リクエスト */
export type UpdateRecordTemplateInput = Partial<CreateRecordTemplateInput>;

/** client.import_jobs 1 行（DDL / contracts/client-intake.jobs.json 準拠、snake_case） */
export type ImportJob = {
  id: string;
  organization_id: string;
  created_by: string | null;
  import_type: "client_bulk" | string;
  /** S3 キーまたは論理ファイル識別子。表示用ファイル名は meta.file_name を参照 */
  file_key: string;
  total_rows: number | null;
  success_rows: number | null;
  error_rows: number | null;
  /** PII 非格納: [{ row, field, type }] のみ */
  error_details: Array<{ row: number; field: string; type: string; message?: string }>;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  /** 補助情報（file_name 等の表示用情報を格納する JSONB） */
  meta: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** GET /client/intake/template — テンプレートダウンロード URL レスポンス */
export type IntakeTemplateResult = {
  /** 署名付きダウンロード URL（一時有効）*/
  download_url: string;
  /** ファイル名（例: qaito_client_template_20260612.xlsx）*/
  file_name: string;
  /** テンプレート種別 */
  template_type: "client_wide" | string;
  /** カラム定義一覧 */
  columns: Array<{
    name: string;
    label: string;
    required: boolean;
    type: string;
    example?: string;
  }>;
};

/** 本人らしさ（かな・生年月日）。`match` のときだけ利用者の行を「更新する」を選べる */
export type IntakePersonaMatch = "match" | "mismatch" | "unverified";

/** 決定が要る重なり（プレビューで返る）。確定では `rowIndex`〜`digest` をそのまま送り返す */
export type IntakeOverlap = {
  /** Excel の行番号 */
  rowIndex: number;
  kind: "client" | "family" | "certification" | "medication";
  /** 利用者の行は 0。子の行は同じ Excel 行の中で何番目か */
  seq: number;
  existingId: string;
  /** 利用者の行だけ。子の行は null */
  personaMatch: IntakePersonaMatch | null;
  /** 列ごとの差分（from = 今の値・to = 取り込む値） */
  diff: Array<{ field: string; from: unknown; to: unknown }>;
  /** 版の印（不透明）。プレビューのあとに変わっていたら確定で STALE_OVERLAP */
  digest: string;
};

/** 重なりの解決。送らなかった重なりは飛ばす（既定） */
export type IntakeOverlapResolution = {
  rowIndex: number;
  kind: IntakeOverlap["kind"];
  seq: number;
  existingId: string;
  digest: string;
  /**
   * update = 差分をすべて取り込む / merge = 今の値が空の項目だけ埋める / fields = 項目ごと（利用者の行だけ。
   * 利用者番号・証の番号・ふりがな・生年月日・事業所は value で直せない）/ create_new = 別の人として作る
   */
  resolution:
    | { kind: "update" }
    | { kind: "merge" }
    | { kind: "fields"; fields: Record<string, { take: "current" | "incoming" } | { value: string | number | boolean | null }> }
    | { kind: "create_new"; clientNumberOverride?: string };
};

export type IntakeConvertWarning = { sheet: string; row: number; field: string; message: string };

export type IntakeRowErrorItem = { row: number; field: string; type: string; message?: string };

/** POST /client/intake/upload — プレビュー（書き込まない） */
export type IntakeUploadPreview = {
  fileName: string;
  fileRowCount: number;
  parsedRowCount: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  newCount: number;
  noChangeCount: number;
  overlapCount: number;
  overlaps: IntakeOverlap[];
  /** この表は選んだ事業所のものではなさそう（ブロックはしない） */
  facilityMismatchWarning: boolean;
  errors: IntakeRowErrorItem[];
  /** 取り込まない行・値（シート名・行番号・項目・理由。値そのものは載せない） */
  warnings: IntakeConvertWarning[];
  preview: Array<{
    rowIndex: number;
    clientNumber?: string;
    status?: string;
    familyCount: number;
    certCount: number;
    medCount: number;
  }>;
};

/** POST /client/intake/commit — 確定の結果 */
export type IntakeCommitResult = {
  jobId: string;
  summary: {
    fileName: string;
    totalRows: number;
    successCount: number;
    errorCount: number;
    createdCount: number;
    updatedCount: number;
    noChangeCount: number;
    skippedCount: number;
    createdNewCount: number;
    familyCount: number;
    certificationCount: number;
    medicationCount: number;
    errors: IntakeRowErrorItem[];
    warnings: IntakeConvertWarning[];
  };
};

/** GET /client/intake/jobs — ジョブ一覧クエリ */
export type ListImportJobsQuery = {
  status?: ImportJob["status"];
  import_type?: string;
  limit?: number;
  offset?: number;
};

/** client.transport_logs 1 行 */
export type TransportLog = {
  id: string;
  organization_id: string;
  client_id: string;
  facility_id: string | null;
  route_id: string | null;
  route_stop_id: string | null;
  driver_staff_id: string | null;
  service_date: string;
  service_category: string;
  service_type_code: string;
  transport_type: "pickup" | "dropoff";
  scheduled_time: string | null;
  actual_time: string | null;
  pickup_address: string | null;
  pickup_latitude: string | null;
  pickup_longitude: string | null;
  dropoff_address: string | null;
  dropoff_latitude: string | null;
  dropoff_longitude: string | null;
  boarding_status: "boarded" | "absent" | "cancelled";
  /** 出どころ（sheet=送迎表の確定から / manual=人が付け外した / backfill=過去分の移し / null=従来） */
  origin: "sheet" | "manual" | "backfill" | null;
  absence_reason: string | null;
  vital_note: string | null;
  driver_note: string | null;
  memo: string | null;
  /** 送迎表のキャンセル欄（boarding_status の cancelled と併せて時刻と理由を持つ） */
  canceled_at: string | null;
  canceled_reason: string | null;
  created_at: string;
  updated_at: string;
};

/** GET /transport/logs クエリパラメータ */
export type ListTransportLogsQuery = {
  service_date?: string;
  month?: string;
  facility_id?: string;
  transport_type?: "pickup" | "dropoff";
  limit?: number;
  offset?: number;
};

/** POST /transport/logs リクエスト */
export type CreateTransportLogInput = {
  client_id: string;
  facility_id?: string | null;
  route_id?: string | null;
  route_stop_id?: string | null;
  driver_staff_id?: string | null;
  service_date: string;
  service_category?: string;
  service_type_code?: string;
  transport_type: "pickup" | "dropoff";
  scheduled_time?: string | null;
  actual_time?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  boarding_status?: "boarded" | "absent" | "cancelled";
  absence_reason?: string | null;
  vital_note?: string | null;
  driver_note?: string | null;
  memo?: string | null;
};

/** PATCH /transport/logs/:id リクエスト */
export type UpdateTransportLogInput = Partial<CreateTransportLogInput>;

/** PATCH /transport/logs/:id/checkin リクエスト */
export type RecordTransportLegsFromSheetInput = {
  facilityId: string;
  serviceDate: string;
  /** 合わせる向き（両方なら 1 つの transaction） */
  transportTypes: ("pickup" | "dropoff")[];
  /** true = 人が手で付け外した行も送迎表に合わせる（既定は送迎表から入った行だけ） */
  includeManual?: boolean;
  /** true = 書かずに内訳だけ返す */
  dryRun?: boolean;
};

/** 送迎のチェックを送迎表に合わせる処理の、向きごとの内訳 */
export type TransportLegsFromSheetBreakdown = {
  /** その向きの送迎表が確定しているか（false なら何も動かさない） */
  sheetConfirmed: boolean;
  /** チェックを付ける（付けた）人数 */
  toCheck: number;
  /** チェックを外す（外した）人数 */
  toUncheck: number;
  /** 上のうち、人が手で付け外した（または従来の）行を動かす人数（includeManual のときだけ動く） */
  manualChanged: number;
  /** 送迎表には載っているが、その日は来ない人の人数（欠席・キャンセル・名簿に居ない） */
  notAttending: number;
  /** 送迎表には載っているが、利用者の状態が利用中・お試し以外（利用開始前・一時停止・入院中・利用中止）の人数。チェックを付けない */
  notActive: number;
  /** いまチェックが付いている人数（この向き・この事業所） */
  checkedNow: number;
  /** チェックを外す人（dryRun のときだけ。名前は氏名を読める人にだけ・読めなければ ''。origin は出どころ） */
  uncheckClients: { clientId: string; name: string; origin: "sheet" | "manual" | "backfill" | null }[];
};

/** POST /transport/logs/day-legs-from-sheet レスポンス */
export type TransportLegsFromSheetResult = {
  pickup?: TransportLegsFromSheetBreakdown;
  dropoff?: TransportLegsFromSheetBreakdown;
  /** 日次の確定（締め）済みで何も動かさなかったとき true */
  dayClosed: boolean;
  /** 動かした行の数 */
  written: number;
};

/** POST /transport/logs/day-leg（その日の送迎の片道 1 本のチェックを付け外す・camelCase のまま送る） */
export type RecordTransportLegForDayInput = {
  clientId: string;
  facilityId: string;
  serviceDate: string;
  transportType: "pickup" | "dropoff";
  /** チェックを付ける = true（乗車）/ 外す = false（行は残る） */
  boarded: boolean;
  /** 【廃止予定】受けても使われない（時間は到着・早退の欄） */
  actualTime?: string | null;
};

export type CheckInTransportLogInput = {
  boarding_status: "boarded" | "absent" | "cancelled";
  actual_time?: string | null;
  absence_reason?: string | null;
};

/** 訓練プログラム要素 */
export type TrainingPlanProgram = {
  name: string;
  method?: string | null;
  frequency?: string | null;
  duration_min?: number | null;
  staff?: string | null;
  note?: string | null;
};

/** 多職種関与者要素 */
export type TrainingPlanParticipant = {
  occupation: string;
  name?: string | null;
  role?: string | null;
};

/** GET /care-plan/training/plans レスポンス要素 */
export type TrainingPlanDetail = {
  /** 計画書ID */
  id: string;
  /** 計画ID */
  care_plan_id: string;
  /** 組織ID */
  organization_id: string;
  /** 利用者ID */
  client_id: string;
  /** 計画種別 */
  plan_type: string;
  /** 事業所ID */
  facility_id: string | null;
  /** 状態 */
  status: string;
  /** 開始日 */
  effective_from: string | null;
  /** 終了日 */
  effective_until: string | null;
  base_care_plan_id: string | null;
  /** 訓練担当者ID */
  trainer_id: string | null;
  /** 初回評価日 */
  assessment_date: string | null;
  /** 見直し予定日 */
  review_date: string | null;
  /** 身体機能目標 */
  goal_body_function: string | null;
  /** 活動目標 */
  goal_activity: string | null;
  /** 参加目標 */
  goal_participation: string | null;
  /** プログラム(JSON配列) */
  programs: Record<string, unknown>;
  /** 多職種参加者(JSON配列) */
  multidisciplinary_participants: Record<string, unknown>;
  /** 本人同意日 */
  client_consent_at: string | null;
  /** 家族同意日 */
  family_consent_at: string | null;
  /** 本人の望む日常生活 */
  client_goal: string | null;
  /** LIFE帳票コード */
  life_form_code: string | null;
  /** LIFE連携日時 */
  life_linked_at: string | null;
  /** メモ */
  memo: string | null;
  /** 追加データ */
  extra_data: Record<string, unknown>;
  /** 削除日時 */
  /** 保存基準日 */
  /** 保存年数 */
  /** 登録日時 */
  created_at: string;
  /** 更新日時 */
  updated_at: string;
};

/** GET /care-plan/training/plans クエリパラメータ */
export type TrainingPlanDetailRecord = {
  id: string;
  organizationId: string;
  carePlanId: string;
  clientId: string;
  facilityId: string | null;
  trainerId: string | null;
  assessmentDate: string | null;
  reviewDate: string | null;
  goalBodyFunction: string | null;
  goalActivity: string | null;
  goalParticipation: string | null;
  programs: Record<string, unknown>[];
  multidisciplinaryParticipants: Record<string, unknown>[];
  clientConsentAt: string | null;
  familyConsentAt: string | null;
  clientGoal: string | null;
  lifeFormCode: string | null;
  lifeLinkedAt: string | null;
  memo: string | null;
  healthConditionNote: string | null;
  trainingCaution: string | null;
  longGoalAchievement: string | null;
  shortGoalAchievement: string | null;
  extraData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type TrainingPlanDetailCreateInput = import("@qaito/schemas/training-plan-details").CreateTrainingPlanDetails;
/** PATCH /care-plan/training/details/:detailId */
export type TrainingPlanDetailUpdateInput = import("@qaito/schemas/training-plan-details").UpdateTrainingPlanDetails;

export type TrainingPlanDraft = {
  /** 欄の値（キーは更新の入力と同じ camelCase） */
  fields: Record<string, unknown>;
  /** プログラムの提案（name / method / note だけ） */
  programs: { name: string; method?: string; note?: string }[];
  /** 欄ごとの根拠（キーは欄 または programs.<番号>） */
  evidence: Record<string, { source: string; as_of: string | null }[]>;
  checks: string[];
  materials: { kind: CarePlanMaterialKind; row_id: string | null; as_of: string | null; period_from: string | null; period_to: string | null }[];
};

export type ListTrainingPlanDetailsQuery = {
  client_id?: string;
  care_plan_id?: string;
  limit?: number;
  offset?: number;
};

export type CreateTrainingPlanDetailInput = import("@qaito/schemas/api/training-plan").CreateTrainingPlanApiInput;

/** PATCH /care-plan/training/plans/:id リクエスト（camelCase。同上） */
export type UpdateTrainingPlanDetailInput = import("@qaito/schemas/api/training-plan").UpdateTrainingPlanApiInput;

/** GET /care-plan/plans */
export type Careplan = {
  id: string;
  organization_id: string;
  client_id: string;
  source: "internal" | "external";
  status: "draft" | "approved" | "active" | "expired" | "revised";
  version: number;
  care_manager_name: string | null;
  care_manager_office: string | null;
  created_by_user_id: string | null;
  assessment_id: string | null;
  certification_id: string | null;
  client_wishes: string | null;
  family_wishes: string | null;
  overall_policy: string | null;
  life_support_reason: string | null;
  effective_from: string | null;
  effective_until: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CareplanNeed = {
  id: string;
  care_plan_id: string;
  sort_order: number;
  need: string | null;
  long_term_goal: string | null;
  long_term_goal_period_start: string | null;
  long_term_goal_period_end: string | null;
  short_term_goal: string | null;
  short_term_goal_period_start: string | null;
  short_term_goal_period_end: string | null;
  service_content: string | null;
  service_type: string | null;
  provider_name: string | null;
  frequency: string | null;
  period_start: string | null;
  period_end: string | null;
};

export type CareplanSchedule = {
  id: string;
  care_plan_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  service_content: string | null;
  service_type: string | null;
  provider_name: string | null;
  memo: string | null;
};

/** サービス担当者会議の出席者（第4表） */
export type CareplanConferenceAttendee = {
  name?: string;
  role?: string;
  affiliation?: string;
};

/** サービス担当者会議の要点（第4表・`client.care_plan_conferences`） */
export type CareplanConference = {
  id: string;
  organizationId: string;
  carePlanId: string;
  clientId: string;
  /** 開催日（YYYY-MM-DD） */
  heldOn: string;
  location: string | null;
  attendees: CareplanConferenceAttendee[];
  agendaItems: string | null;
  conclusion: string | null;
  remainingIssues: string | null;
  recordedBy: string | null;
  memo: string | null;
  deletedAt: string | null;
  retentionBaseDate: string | null;
  retentionYears: number;
  createdAt: string;
  updatedAt: string;
};

/** POST /care-plan/plans/:id/conferences リクエスト */
export type CreateCareplanConferenceInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facilityId?: string;
  heldOn: string;
  location?: string;
  attendees?: CareplanConferenceAttendee[];
  agendaItems?: string;
  conclusion?: string;
  remainingIssues?: string;
  memo?: string;
};

/** PATCH /care-plan/plans/:id/conferences/:conferenceId リクエスト（null = 空にする） */
export type UpdateCareplanConferenceInput = {
  heldOn?: string;
  location?: string | null;
  attendees?: CareplanConferenceAttendee[] | null;
  agendaItems?: string | null;
  conclusion?: string | null;
  remainingIssues?: string | null;
  memo?: string | null;
};

/** 居宅介護支援経過（第5表・`client.care_plan_progress_notes`） */
export type CareplanProgressNote = {
  id: string;
  organizationId: string;
  carePlanId: string;
  clientId: string;
  /** 記録日（YYYY-MM-DD） */
  recordedOn: string;
  itemLabel: string | null;
  content: string;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** POST /care-plan/plans/:id/progress-notes リクエスト */
export type CreateCareplanProgressNoteInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facilityId?: string;
  recordedOn: string;
  itemLabel?: string;
  content: string;
};

/** PATCH /care-plan/plans/:id/progress-notes/:noteId リクエスト */
export type UpdateCareplanProgressNoteInput = {
  recordedOn?: string;
  itemLabel?: string | null;
  content?: string;
};

/** POST /care-plan/plans/:id/needs リクエスト（第2表の 1 行・キーは camelCase） */
export type CreateCareplanNeedInput = import("@qaito/schemas/api/careplan").CreateCareplanNeedApi;
/** PATCH /care-plan/plans/:id/needs/:needId リクエスト（渡したキーだけ・空文字で消す） */
export type UpdateCareplanNeedInput = import("@qaito/schemas/api/careplan").UpdateCareplanNeedApi;
/** POST /care-plan/plans/:id/schedules リクエスト（第3表の 1 行・曜日は 0=日〜6=土・7 も日曜） */
export type CreateCareplanScheduleInput = import("@qaito/schemas/api/careplan").CreateCareplanScheduleApi;
/** PATCH /care-plan/plans/:id/schedules/:scheduleId リクエスト（渡したキーだけ・空文字で消す） */
export type UpdateCareplanScheduleInput = import("@qaito/schemas/api/careplan").UpdateCareplanScheduleApi;

export type CareplanDetail = {
  /** 計画書ID */
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者ID */
  clientId: string;
  /** 作成元 */
  source: string;
  /** 介護支援専門員名 */
  careManagerName: string | null;
  /** 居宅介護支援事業所名 */
  careManagerOffice: string | null;
  /** アセスメントID */
  assessmentId: string | null;
  /** 介護認定ID */
  certificationId: string | null;
  /** 本人の意向 */
  clientWishes: string | null;
  /** 家族の意向 */
  familyWishes: string | null;
  /** 総合的な援助の方針 */
  overallPolicy: string | null;
  /** 生活援助中心型の理由 */
  lifeSupportReason: string | null;
  /** 状態 */
  status: string;
  /** 版数 */
  version: number;
  /** 開始日 */
  effectiveFrom: string | null;
  /** 終了日 */
  effectiveUntil: string | null;
  /** 承認日時 */
  approvedAt: string | null;
  /** 削除日時 */
  /** 保存基準日 */
  /** 保存年数 */
  /** 登録日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
  /** 作成者ID */
  createdByUserId: string | null;
  /** ニーズ */
  needs: unknown[];
  /** 週間予定 */
  schedules: unknown[];
};

/** POST /care-plan/plans リクエスト */
export type CreateCareplanInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facility_id?: string;
  client_id: string;
  source?: "internal" | "external";
  care_manager_name?: string;
  care_manager_office?: string;
  assessment_id?: string;
  certification_id?: string;
  client_wishes?: string;
  family_wishes?: string;
  overall_policy?: string;
  life_support_reason?: string;
  effective_from?: string;
  effective_until?: string;
  needs?: Omit<CareplanNeed, "id" | "care_plan_id">[];
  schedules?: Omit<CareplanSchedule, "id" | "care_plan_id">[];
};

/** PATCH /care-plan/plans/:id リクエスト */
export type UpdateCareplanInput = Partial<Omit<CreateCareplanInput, "client_id" | "facility_id">>;

/** PATCH /care-plan/plans/:id/status リクエスト */
export type UpdateCareplanStatusInput = {
  status: "draft" | "approved" | "active" | "expired" | "revised";
};

/** POST /care-plan/plans/generate-draft リクエスト（AI 素案・保存しない） */
export type GenerateCareplanDraftInput = {
  client_id: string;
  assessment_id?: string;
};

export type KyotakuClientPlan = {
  id: string;
  status: string;
  version: number;
  effective_from: string | null;
  effective_until: string | null;
  /** 第1表の作成日（YYYY-MM-DD）。今は登録した日 */
  created_on: string;
  source: "internal" | "external";
  intake: "app" | "ocr" | "link" | "manual";
  care_office_id: string | null;
  care_manager_id: string | null;
  care_office_name: string | null;
  care_manager_name: string | null;
  previous_plan_id: string | null;
  origin_document_id: string | null;
};

export type CarePlanClientServicePlan = {
  id: string;
  /** tsusho / kunren / houmonkaigo / fukushiyogu / houmonkango / riha */
  plan_type: string;
  status: string;
  version: number;
  effective_from: string | null;
  effective_until: string | null;
  /** 登録した日（YYYY-MM-DD） */
  created_on: string;
  created_by_user_id: string | null;
  /** 元にしたケアプラン（通所・訓練だけ） */
  base_care_plan_id: string | null;
  /** 前の版 */
  previous_plan_id: string | null;
  /** 個別機能訓練計画書の明細の id（詳細の画面はこの id で開く・ほかの種類は null） */
  detail_id: string | null;
  /** 元のケアプランより後に確定のケアプランが入った（元が無い行は false） */
  needs_review: boolean;
  /** 評価の欄に 1 つでも値があるか（評価の欄を持たない種類は null） */
  evaluated?: boolean | null;
  /** 最後に変えた日（YYYY-MM-DD） */
  updated_on?: string;
};

/** GET /care-plan/clients/:client_id/plans（利用者の事業所の計画書の版の並び） */
export type CarePlanClientServicePlanList = {
  plans: CarePlanClientServicePlan[];
};

export type CarePlanOverviewCell = {
  care_plan_id: string;
  /** 個別機能訓練計画書の明細の id（ほかの種類は null） */
  detail_id: string | null;
  version: number;
  status: string;
  effective_from: string | null;
  effective_until: string | null;
  /** 確定した版が無く、下書きだけ */
  draft_only: boolean;
};

export type CarePlanOverviewRow = {
  client_id: string;
  name: string;
  name_kana: string | null;
  /** 利用状態（active / suspended / hospitalized） */
  client_status: string;
  /** 顔写真の版（無ければ null） */
  face_photo_version: string | null;
  facility_id: string | null;
  kyotaku: CarePlanOverviewCell | null;
  plans: Record<string, CarePlanOverviewCell | null>;
};

export type CarePlanOverview = {
  /** 列にする計画書の種類（tsusho / kunren / houmonkaigo / houmonkango / riha / fukushiyogu） */
  plan_types: string[];
  /** 事業所 ID → その事業所の列（画面がトップバーの事業所で絞るときに使う） */
  facility_plan_types: Record<string, string[]>;
  kyotaku_readable: boolean;
  clients_readable: boolean;
  rows: CarePlanOverviewRow[];
};

export type DayservicePlanDraft = {
  /** 欄の値（キーは更新の入力と同じ camelCase。許可した欄だけ・材料の無い欄は無い） */
  fields: Record<string, unknown>;
  /** サービス提供内容 ①〜⑤（periodFrom / periodTo / purposeAndContent） */
  services: Record<string, unknown>[];
  /** 欄ごとの根拠（キーは欄 または services.<番号>） */
  evidence: Record<string, { source: string; asOf: string | null }[]>;
  /** 人が確かめる点 */
  checks: string[];
  /** 下書きに使った材料 */
  materials: { kind: CarePlanMaterialKind; rowId: string | null; asOf: string | null; periodFrom: string | null; periodTo: string | null }[];
};

export type CarePlanMaterialKind =
  | "kyotaku_plan"
  | "dayservice_plan"
  | "plan_evaluation"
  | "assessment"
  | "interest_check"
  | "life_function_check"
  | "life_submission"
  | "care_record"
  | "training_record"
  | "clinical";

/** 計画書の版に選んだ材料 1 つ */
export type CarePlanMaterial = {
  kind: CarePlanMaterialKind;
  row_id: string | null;
  as_of: string | null;
  period_from: string | null;
  period_to: string | null;
  /** 前の版のあとに入った材料 */
  is_new: boolean;
};

/** 選べる材料 1 つ */
export type CarePlanMaterialCandidate = {
  kind: CarePlanMaterialKind;
  row_id: string | null;
  as_of: string | null;
  title: string;
  is_new: boolean;
};

/** GET /care-plan/materials/:plan_id（計画書の版の材料・選べる材料・既定の期間） */
export type CarePlanMaterials = {
  purpose: "plan" | "evaluation";
  /** false のとき materials ははじめに選ぶ材料（保存していない） */
  saved: boolean;
  period_from: string;
  period_to: string;
  materials: CarePlanMaterial[];
  candidates: CarePlanMaterialCandidate[];
  /** 表示権限の無い材料の種類 */
  unavailable: CarePlanMaterialKind[];
};

/** PUT /care-plan/materials/:plan_id リクエスト（その用途の材料を全部入れ替える） */
export type ReplaceCarePlanMaterialsInput = import("@qaito/schemas/care-plan-materials").ReplaceCarePlanMaterialsInput;

export type CarePlanNewPlanMaterials = {
  plan_type: "tsusho" | "kunren";
  /** 次の版の元（確定の最新版）。新しい計画書なら null */
  renew_from: { id: string; version: number } | null;
  base_care_plan_id: string | null;
  period_from: string;
  period_to: string;
  materials: CarePlanMaterial[];
  candidates: CarePlanMaterialCandidate[];
  unavailable: CarePlanMaterialKind[];
};

/** POST /care-plan/clients/:client_id/new-plan リクエスト（材料を選んで計画書の下書きを作る） */
export type CreateClientCarePlanInput = import("@qaito/schemas/care-plan-materials").CreateClientCarePlanInput;

/** POST /care-plan/clients/:client_id/new-plan の応答 */
export type CreatedClientCarePlan = {
  plan_id: string;
  /** 個別機能訓練計画書の明細の id。通所介護計画書は null */
  detail_id: string | null;
  version: number;
  /** 次の版として作ったか */
  renewed: boolean;
};

/** 期間が重なる確定のケアプランの ID の組 */
export type KyotakuPlanOverlap = [string, string];

/** GET /kyotaku-plan/clients/:client_id/plans（版の並び・今のケアプラン・期間の重なり） */
export type KyotakuClientPlanList = {
  plans: KyotakuClientPlan[];
  /** その日に期間が掛かる確定のケアプランのうち作成日が新しい方。無ければ null */
  current_plan_id: string | null;
  overlaps: KyotakuPlanOverlap[];
};

/** POST /careplan-link/files/:id/link・/rows/:rowNo/link の結果（結び付けた行・結び付け待ちの行・全部結び付けたか） */
export type UpplanLinkSummary = {
  linked: number;
  pending: number;
  imported: boolean;
};

/** POST /careplan-link/files/:id/rows/:rowNo/link リクエスト */
export type LinkUpplanRowInput = import("@qaito/schemas/api/careplan-link").LinkUpplanRowApi;

/** GET /careplan-link/upplan/pending の 1 行（被保険者番号は下 4 桁だけ） */
export type PendingUpplanRow = {
  fileId: string;
  rowNo: number;
  /** invalid_key / no_date / office_unknown / client_not_found / client_ambiguous / receive_failed / not_tried */
  reason: string;
  insuredNumberLast4: string;
  insurerNumber: string;
  createdOn: string | null;
  effectiveFrom: string | null;
  partnerOfficeNumber: string | null;
  targetMonth: string | null;
  receivedAt: string;
};

/**
 * POST /kyotaku-plan/clients/:client_id/plans/external リクエスト（外のケアプランの受け取り・下書きで入る）。
 * キーは camelCase（Zod が口の契約）。`intake='ocr'` のときだけ `stagedId` が要る（元の書類を staging〔用途
 * `kyotaku_plan_origin`〕に置いた id）。
 */
export type ReceiveExternalKyotakuPlanInput = import("@qaito/schemas/api/careplan").ReceiveExternalKyotakuPlanApi;

/** GET /kyotaku-plan/plans/:id/origin-document（読み取りで受け取った元の書類の短期の署名 URL） */
export type KyotakuOriginDocumentLink = {
  document_id: string;
  file_name: string | null;
  mime_type: string;
  size_bytes: number | null;
  /** 署名付き GET URL（attachment・数分で切れる） */
  url: string;
  expires_at: string;
};

/** POST /care-plan/ocr/analyze リクエスト（紙の計画書の OCR・保存しない） */
export type CareplanOcrAnalyzeInput = {
  base64_content: string;
  mime_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf";
  /** 写真を上から帯に分けた続き（base64・形式は mime_type と同じ・画像のときだけ・最大 3 枚） */
  extra_parts?: string[];
};

/**
 * 居宅サービス計画書の AI（OCR / 素案）の結果。第1〜3表の項目を snake_case で持つ
 * （`client_wishes` / `overall_policy` / `needs[]` / `schedules[]` 等）。AI の出力なので
 * キーは省略されうる。保存するときは `careplan.plans.create` の形へ写す。
 */
export type CareplanAiResult = Record<string, unknown>;

/** tsushoplan_details 行 */
export type DayservicePlanDetail = {
  id: string;
  organization_id: string;
  care_plan_id: string;
  client_id: string;
  facility_id: string | null;
  service_days_per_week: number | null;
  service_time_per_day: number | null;
  service_start_time: string | null;
  service_end_time: string | null;
  daily_life_goal: string | null;
  functional_goal: string | null;
  service_content: string | null;
  life_support_activity: string | null;
  client_consent_at: string | null;
  family_consent_at: string | null;
  program_manager_id: string | null;
  trainer_id: string | null;
  life_form_code: string | null;
  life_linked_at: string | null;
  memo: string | null;
  extra_data: Record<string, unknown>;
  deleted_at: string | null;
  retention_base_date: string | null;
  retention_years: number;
  created_at: string;
  updated_at: string;
};

/** care_plans + tsushoplan_details を合わせた計画書オブジェクト */
export type DayservicePlanWithDetails = {
  /** 計画書ID */
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者ID */
  clientId: string;
  /** 計画種別 */
  planType: string;
  /** 作成元 */
  source: string;
  /** 事業所ID */
  facilityId: string | null;
  /** 状態 */
  status: string;
  /** 版数 */
  version: number;
  /** 開始日 */
  effectiveFrom: string | null;
  /** 終了日 */
  effectiveUntil: string | null;
  /** 週あたり利用日数 */
  serviceDaysPerWeek: number | null;
  /** 1日あたり利用時間(h) */
  serviceTimePerDay: string | null;
  /** サービス開始時刻 */
  serviceStartTime: string | null;
  /** サービス終了時刻 */
  serviceEndTime: string | null;
  /** 日常生活上の目標 */
  dailyLifeGoal: string | null;
  /** 機能訓練上の目標 */
  functionalGoal: string | null;
  /** サービス内容 */
  serviceContent: string | null;
  /** 生活機能向上支援活動 */
  lifeSupportActivity: string | null;
  /** プログラム責任者ID */
  programManagerId: string | null;
  /** 訓練担当者ID */
  trainerId: string | null;
  /** 本人同意日 */
  clientConsentAt: string | null;
  /** 承認日時 */
  approvedAt: string | null;
  /** 家族同意日 */
  familyConsentAt: string | null;
  /** LIFE帳票コード */
  lifeFormCode: string | null;
  /** LIFE連携日時 */
  lifeLinkedAt: string | null;
  /** メモ */
  memo: string | null;
  /** 追加データ */
  extraData: Record<string, unknown>;
  /** 削除日時 */
  /** 保存基準日 */
  /** 保存年数 */
  /** 登録日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
  /** 作成者ID */
  createdByUserId: string | null;
  /** 介護支援専門員名 */
  careManagerName: string | null;
  /** 居宅介護支援事業所名 */
  careManagerOffice: string | null;
  /** アセスメントID */
  assessmentId: string | null;
  /** 介護認定ID */
  certificationId: string | null;
  baseCarePlanId: string | null;
  /** 本人の意向 */
  clientWishes: string | null;
  /** 家族の意向 */
  familyWishes: string | null;
  /** 総合的な援助の方針 */
  overallPolicy: string | null;
  /** 通所計画の詳細 */
  details: Record<string, unknown>;
  services: DayservicePlanServiceRow[];
};

/** 通所介護計画書のサービス提供内容 ①〜⑤ の 1 行（`tsushoplan_services`） */
export type DayservicePlanServiceRow = {
  id: string;
  sortOrder: number;
  periodFrom: string | null;
  periodTo: string | null;
  purposeAndContent: string | null;
  evalImplemented: string | null;
  evalAchieved: string | null;
  effectNote: string | null;
};

export type CreateDayservicePlanInput = import("@qaito/schemas/api/dayservice-plan").CreateDayservicePlanApiInput;

export type UpdateDayservicePlanInput = import("@qaito/schemas/api/dayservice-plan").UpdateDayservicePlanApiInput;

/** PATCH /care-plan/dayservice/plans/:id/status リクエスト */
export type UpdateDayservicePlanStatusInput = {
  status: "draft" | "review" | "approved" | "active" | "expired" | "revised";
};

export type LifeFormCode = "1-1" | "1-3" | "1-4" | "2" | "3-3" | "4-1-1" | "5" | "6";
export type LifeSubmissionType = "initial" | "periodic" | "change" | "cancel";
export type LifeSubmissionStatus = "draft" | "pending" | "accepted" | "rejected" | "cancelled";

export type LifeSubmission = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者ID */
  clientId: string;
  /** ケアプランID */
  carePlanId: string | null;
  /** 事業所ID */
  facilityId: string | null;
  /** LIFE様式 */
  lifeFormCode: string;
  /** 提出種別 */
  submissionType: string;
  /** ステータス */
  status: string;
  /** 提出対象月 */
  submissionPeriod: string | null;
  /** 提出データ */
  submittedData: Record<string, unknown>;
  /** 提出日時 */
  submittedAt: string | null;
  /** 受理日時 */
  acceptedAt: string | null;
  /** 差し戻し日時 */
  rejectedAt: string | null;
  /** 差し戻し理由 */
  rejectionReason: string | null;
  /** メモ */
  memo: string | null;
  /** 提出バッチID */
  batchId: string | null;
  /** 外部管理番号 */
  extManagementNo: string | null;
  /** 外部明細番号 */
  extDetailNo: string | null;
  /** 親提出ID */
  parentSubmissionId: string | null;
  /** 仕様バージョン */
  specVersion: string | null;
  /** 元データ参照 */
  sourceRefs: Record<string, unknown>;
  /** 削除日時 */
  /** 保存基準日 */
  /** 保存年数 */
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type CreateLifeSubmissionInput = {
  care_plan_id?: string;
  facility_id?: string;
  life_form_code: LifeFormCode;
  submission_type: LifeSubmissionType;
  status?: LifeSubmissionStatus;
  submitted_data?: Record<string, unknown>;
  /** 提出対象月（YYYY-MM） */
  submission_period?: string;
  submitted_at?: string;
  memo?: string;
};

export type UpdateLifeSubmissionInput = Partial<Omit<CreateLifeSubmissionInput, "life_form_code">>;

export type AssessmentScoreType =
  | "barthel"
  | "fim"
  | "mmse"
  | "mna"
  | "life_adl"
  | "life_iadl"
  | "life_nutrition";

export type AssessmentScore = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者ID */
  clientId: string;
  /** アセスメントID */
  assessmentId: string | null;
  /** ケアプランID */
  carePlanId: string | null;
  /** スコア種別 */
  scoreType: string;
  /** 評価日 */
  scoreDate: string;
  /** 合計点 */
  totalScore: string | null;
  /** 項目別スコア */
  subScores: Record<string, unknown>;
  /** 評価者ID */
  scorerId: string | null;
  /** LIFE様式 */
  lifeFormCode: string | null;
  /** LIFE連携日時 */
  lifeLinkedAt: string | null;
  /** メモ */
  memo: string | null;
  /** 削除日時 */
  /** 保存基準日 */
  /** 保存年数 */
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type CreateAssessmentScoreInput = {
  score_type: AssessmentScoreType;
  assessment_id?: string;
  life_submission_id?: string;
  life_form_code?: LifeFormCode;
  score_value?: number;
  score_details?: Record<string, unknown>;
  score_date?: string;
  notes?: string;
};

export type UpdateAssessmentScoreInput = Partial<Omit<CreateAssessmentScoreInput, "score_type">>;

export type BasicChecklist = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者ID */
  clientId: string;
  /** 評価日 */
  assessedOn: string;
  /** No.1 バスや電車で1人で外出 */
  q1: boolean | null;
  /** No.2 日用品の買物 */
  q2: boolean | null;
  /** No.3 預貯金の出し入れ */
  q3: boolean | null;
  /** No.4 友人の家を訪ねる */
  q4: boolean | null;
  /** No.5 家族や友人の相談にのる */
  q5: boolean | null;
  /** No.6 手すりなしで階段昇降 */
  q6: boolean | null;
  /** No.7 何もつかまらず立ち上がる */
  q7: boolean | null;
  /** No.8 15分位続けて歩く */
  q8: boolean | null;
  /** No.9 この1年間の転倒 */
  q9: boolean | null;
  /** No.10 転倒への不安 */
  q10: boolean | null;
  /** No.11 6ヶ月で2〜3kg以上の体重減少 */
  q11: boolean | null;
  /** No.12 身長（cm） */
  heightCm: number | null;
  /** No.12 体重（kg） */
  weightKg: number | null;
  /** No.13 固いものが食べにくい */
  q13: boolean | null;
  /** No.14 お茶や汁物でむせる */
  q14: boolean | null;
  /** No.15 口の渇き */
  q15: boolean | null;
  /** No.16 週1回以上の外出 */
  q16: boolean | null;
  /** No.17 外出回数の減少 */
  q17: boolean | null;
  /** No.18 物忘れの指摘 */
  q18: boolean | null;
  /** No.19 自分で電話番号を調べて電話 */
  q19: boolean | null;
  /** No.20 今日の日付がわからない */
  q20: boolean | null;
  /** No.21 毎日の生活に充実感がない */
  q21: boolean | null;
  /** No.22 楽しめていたことが楽しめない */
  q22: boolean | null;
  /** No.23 以前は楽にできたことがおっくう */
  q23: boolean | null;
  /** No.24 自分が役に立つ人間だと思えない */
  q24: boolean | null;
  /** No.25 わけもなく疲れた感じ */
  q25: boolean | null;
  /** 評価者ID */
  assessorId: string | null;
  /** メモ */
  memo: string | null;
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type InterestChecklist = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者ID */
  clientId: string;
  /** 評価日 */
  assessedOn: string;
  /** 項目別回答 */
  items: Record<string, unknown>;
  /** その他 自由記述1 */
  otherNote1: string | null;
  /** その他 自由記述2 */
  otherNote2: string | null;
  /** その他 自由記述3 */
  otherNote3: string | null;
  /** その他 自由記述4 */
  otherNote4: string | null;
  /** 評価者ID */
  assessorId: string | null;
  /** メモ */
  memo: string | null;
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

export type LifeFunctionChecklist = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 利用者ID */
  clientId: string;
  /** 評価日 */
  assessedOn: string;
  /** 評価スタッフ職種 */
  assessorRole: string | null;
  /** 項目別回答 */
  items: Record<string, unknown>;
  /** 評価者ID */
  assessorId: string | null;
  /** メモ */
  memo: string | null;
  /** 登録日 */
  createdAt: string;
  /** 更新日 */
  updatedAt: string;
};

/** 「はい / いいえ」で答える設問（未回答は null）。 */
export type ChecklistYesNo = boolean | null;

export type CreateBasicChecklistInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facilityId?: string;
  assessedOn: string;
  q1?: ChecklistYesNo;
  q2?: ChecklistYesNo;
  q3?: ChecklistYesNo;
  q4?: ChecklistYesNo;
  q5?: ChecklistYesNo;
  q6?: ChecklistYesNo;
  q7?: ChecklistYesNo;
  q8?: ChecklistYesNo;
  q9?: ChecklistYesNo;
  q10?: ChecklistYesNo;
  q11?: ChecklistYesNo;
  /** 身長（cm）。BMI 判定（q12 相当）の入力 */
  heightCm?: number | null;
  /** 体重（kg）。BMI 判定（q12 相当）の入力 */
  weightKg?: number | null;
  q13?: ChecklistYesNo;
  q14?: ChecklistYesNo;
  q15?: ChecklistYesNo;
  q16?: ChecklistYesNo;
  q17?: ChecklistYesNo;
  q18?: ChecklistYesNo;
  q19?: ChecklistYesNo;
  q20?: ChecklistYesNo;
  q21?: ChecklistYesNo;
  q22?: ChecklistYesNo;
  q23?: ChecklistYesNo;
  q24?: ChecklistYesNo;
  q25?: ChecklistYesNo;
  /** 記入した職員ID */
  assessorId?: string;
  memo?: string;
};

export type UpdateBasicChecklistInput = Partial<Omit<CreateBasicChecklistInput, "facilityId">>;

export type CreateInterestChecklistInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facilityId?: string;
  assessedOn: string;
  /** 項目ごとの関心度（キーは様式の項目名）。制度値が未確定のため任意の JSON で受ける */
  responses?: Record<string, unknown>;
  assessorId?: string;
  memo?: string;
};

export type UpdateInterestChecklistInput = Partial<Omit<CreateInterestChecklistInput, "facilityId">>;

export type CreateLifeFunctionChecklistInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facilityId?: string;
  assessedOn: string;
  /** 項目ごとの評価（キーは様式の項目名）。制度値が未確定のため任意の JSON で受ける */
  responses?: Record<string, unknown>;
  assessorId?: string;
  memo?: string;
};

export type UpdateLifeFunctionChecklistInput = Partial<Omit<CreateLifeFunctionChecklistInput, "facilityId">>;

export type BarthelUpdateInput = {
  barthel_feeding?: 0 | 5 | 10;
  barthel_transfer?: 0 | 5 | 10 | 15;
  barthel_grooming?: 0 | 5;
  barthel_toilet_use?: 0 | 5 | 10;
  barthel_bathing?: 0 | 5;
  barthel_walking?: 0 | 5 | 10 | 15;
  barthel_stair_climbing?: 0 | 5 | 10;
  barthel_dressing?: 0 | 5 | 10;
  barthel_bowel_control?: 0 | 5 | 10;
  barthel_bladder_control?: 0 | 5 | 10;
  mobility_method?: string;
};

export type UserFileSource =
  | "upload"
  | "generated_file"
  | "generated_image"
  | "chat_attachment";

export type UserFileStatus = "pending" | "ready";

export type UserFile = {
  id: string;
  /** null = root（または expires_at NOT NULL の自動保存） */
  folder_id: string | null;
  file_name: string;
  content_type: string;
  size_bytes: number;
  source: UserFileSource;
  status: UserFileStatus;
  chat_session_id: string | null;
  chat_message_id: string | null;
  /** NOT NULL = 自動保存（30 日 TTL）。null = 恒久保存 */
  expires_at: string | null;
  /** 画面いっぱいで開いた / ダウンロードした時刻（最近使ったアイテムの並び） */
  last_opened_at: string | null;
  /** ゴミ箱に入れた時刻。ゴミ箱の一覧以外では常に null */
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserFolder = {
  id: string;
  /** null = root 直下 */
  parent_id: string | null;
  name: string;
  /** ゴミ箱に入れた時刻。ゴミ箱の一覧以外では常に null */
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StorageListFilesParams = {
  /** 省略 = root。auto / q と排他的に使う */
  folder_id?: string;
  /** true = 自動保存ビュー（expires_at IS NOT NULL） */
  auto?: boolean;
  /** ファイル名部分一致検索（フォルダ横断） */
  q?: string;
  kind?: "photo" | "video" | "media" | "file";
  /**
   * true = 最近使ったアイテム（開いた・ダウンロードした・追加した・更新したの新しい順、
   * 最大 50 件。フォルダ・自動保存を横断）。folder_id / auto / q より優先する。
   */
  recent?: boolean;
};

/** ゴミ箱の一覧（直接ゴミ箱に入れたものだけ・入れた日時の新しい順） */
export type StorageTrash = {
  folders: UserFolder[];
  files: UserFile[];
};

export type StorageMarkOpenedResult = {
  last_opened_at: string;
};

export type StorageRestoreFileResult = {
  id: string;
  /** 戻した先。null = マイドライブ直下（元のフォルダがゴミ箱 / 不在のとき） */
  folder_id: string | null;
};

export type StorageRestoreFolderResult = {
  id: string;
  /** 戻した先。null = マイドライブ直下（元の親がゴミ箱 / 不在のとき） */
  parent_id: string | null;
};

export type StorageEmptyTrashResult = {
  purged_files: number;
  purged_folders: number;
  /** 日常の記録へ共有中で残したファイルの数 */
  skipped_shared: number;
};

export type StorageSaveFileInput = {
  file_name: string;
  content_type: string;
  /** テキスト系のみ ≤ 1MB */
  content_text: string;
  folder_id?: string | null;
};

export type StorageUploadUrlInput = {
  file_name: string;
  content_type: string;
  /** 宣言サイズ（pending 行のクォータ enforce に使用。実サイズは commit で検証） */
  size_bytes: number;
  folder_id?: string | null;
  /**
   * 出どころ。省略 = `upload`（利用者が置いたもの）。それ以外は自動保存で、
   * フォルダに置けず 30 日で失効する
   */
  source?: "upload" | "chat_attachment" | "generated_file" | "generated_image";
  /** 会話の添付なら、どの会話・どの発言に付いたか（`source: "chat_attachment"` のときだけ） */
  chat_session_id?: string;
  chat_message_id?: string;
};

export type StorageUploadUrlResult = {
  file_id: string;
  /** presigned PUT URL（Content-Type は宣言値で署名済み） */
  upload_url: string;
};

export type StorageDownloadUrlResult = {
  download_url: string;
  /** 署名 URL の失効時刻（ISO 8601） */
  expires_at: string;
};

export type StorageReadFileResult = {
  content: string;
  /** 50KB 切詰が発生したか */
  truncated: boolean;
};

export type StorageUpdateFileInput = {
  file_name?: string;
  /** キー欠落 = 変更なし / null = root へ / uuid = 当該フォルダへ移動（移動 = 恒久化） */
  folder_id?: string | null;
};

export type StorageCreateFolderInput = {
  name: string;
  /** 省略 or null = root 直下 */
  parent_id?: string | null;
};

export type StorageUpdateFolderInput = {
  name?: string;
  /** キー欠落 = 変更なし / null = root へ / uuid = 当該フォルダへ移動 */
  parent_id?: string | null;
};

export type StorageQuota = {
  permanent: { used_bytes: number };
  auto: { used_bytes: number };
};

export type ClaimsBillingBatchStatus = "open" | "locked" | "exported" | "submitted" | "void";
export type ClaimsBenefitCategory = "kaigo" | "yobo" | "sogo";
export type ClaimsStatementStatus =
  | "draft"
  | "validated"
  | "needs_fix"
  | "confirmed"
  | "exported"
  | "submitted"
  | "accepted"
  | "paid"
  | "assessed"
  | "held"
  | "returned"
  | "kago_pending"
  | "voided"
  | "void";
/** recordStatementStatus() が受け付ける手動記録可能な状態 */
export type ClaimsManualStatementStatus =
  | "submitted"
  | "accepted"
  | "paid"
  | "assessed"
  | "held"
  | "returned"
  | "kago_pending"
  | "voided";
export type ClaimsUserInvoiceStatus = "draft" | "issued" | "superseded" | "void";
export type ClaimsUserInvoiceLineKind = "insurance_copay" | "over_limit" | "self_pay";
export type ClaimsTaxClass = "taxable" | "nontaxable";
export type ClaimsMedicalDeductionClass = "medical" | "welfare" | "none";
export type ClaimsFindingSeverity = "error" | "warning";

/** GET /claims/batches 要素 / GET /claims/batches/:batchId の batch（tool.billing_batches） */
/** サービス利用票（第6表）の月ヘッダ（URL は /care-plan/riyohyo・所有は claims）。camelCase */
export type RiyohyoMonth = {
  id: string;
  facilityId: string | null;
  clientId: string;
  carePlanId: string | null;
  /** YYYY-MM-01 */
  targetMonth: string;
  hokenshaNo: string | null;
  hihokenshaNo: string | null;
  careLevelCode: string | null;
  /** draft（下書き）から交付・実績・確定へ進む */
  status: string;
  revision: number;
  deliveredAt: string | null;
  fixedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 利用票 1 件（明細・日ごとの回数・別表の行は列の多い表なのでそのまま） */
export type RiyohyoMonthDetail = RiyohyoMonth & {
  clientName: string | null;
  lines: Record<string, unknown>[];
  lineDays: Record<string, unknown>[];
  beppyo: Record<string, unknown>[];
};

export type ListRiyohyoMonthsQuery = { clientId?: string; status?: string; targetMonth?: string; offset?: number };

export type CreateRiyohyoMonthInput = {
  clientId: string;
  /** YYYY-MM-01 */
  targetMonth: string;
  carePlanId?: string | null;
  hokenshaNo?: string | null;
  hihokenshaNo?: string | null;
  careLevelCode?: string | null;
  facilityId?: string;
};

export type UpdateRiyohyoMonthInput = {
  hokenshaNo?: string | null;
  hihokenshaNo?: string | null;
  careLevelCode?: string | null;
  carePlanId?: string | null;
};

/** 利用票の状態の操作の本文。開き直し（reopen）は approvedByStaffId が要る */
export type RiyohyoMonthOpInput = {
  /** 開き直しを承認した職員の ID */
  approvedByStaffId?: string | null;
  /** 補足（事由のコードなど。個人の情報は書かない） */
  note?: string | null;
};

export type ClaimsBatch = {
  id: string;
  organizationId: string;
  facilityId: string;
  billingYearMonth: string;
  status: ClaimsBillingBatchStatus;
  csvObjectKey: string | null;
  totalUnits: number | null;
  totalClaimYen: number | null;
  totalCopayYen: number | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** tool.statements 行（明細書 — 第一級エンティティ） */
export type ClaimsStatement = {
  id: string;
  organizationId: string;
  facilityId: string;
  clientId: string;
  serviceYearMonth: string;
  insurerNumber: string;
  benefitCategory: ClaimsBenefitCategory;
  revision: number;
  previousStatementId: string | null;
  batchId: string | null;
  status: ClaimsStatementStatus;
  careLevelDisplay: string | null;
  certValidFromSnapshot: string | null;
  certValidUntilSnapshot: string | null;
  insuredNumberDisplay: string | null;
  representativeBenefitRate: number | null;
  totalUnits: number | null;
  limitTargetUnits: number | null;
  coveredUnits: number | null;
  overLimitUnits: number | null;
  insuranceClaimYen: number | null;
  kohiClaims: ClaimsKohiClaim[] | null;
  copayYen: number | null;
  engineVersion: string | null;
  masterVersionRefs: Record<string, string> | null;
  latestRunId: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClaimsKohiClaim = {
  legal_category: string;
  payer_number: string;
  claim_yen: number;
  /** 公費 n（1〜3。この項目を足す前に確定した明細書には無い） */
  slot?: number;
  /** 公費分単位数（記載要領 ク） */
  units?: number;
  /** 公費分本人負担（記載要領 ス） */
  copay_yen?: number;
};

/** tool.statement_lines 行 */
export type ClaimsStatementLine = {
  id: string;
  organizationId: string;
  statementId: string;
  lineNo: number;
  serviceTypeCode: string;
  itemCode: string;
  category: string;
  layer: string;
  unitValueSnapshot: number;
  quantity: number;
  subtotalUnits: number;
  segmentUnits: Record<string, number> | null;
  /** 公費ごとの公費分回数・公費対象単位数（公費の無い明細書と 0545 より前に計算した行は null） */
  kohiCounts: { kohi1?: { count: number; units: number }; kohi2?: { count: number; units: number } } | null;
  limitTargetSnapshot: boolean;
  medicalDeductionClassSnapshot: string;
  serviceDates: string[] | null;
  tekiyo: string | null;
};

/** tool.statement_daily_basis 行 */
export type ClaimsStatementDailyBasis = {
  id: string;
  organizationId: string;
  statementId: string;
  serviceDate: string;
  attended: boolean;
  appliedCareLevel: string | null;
  appliedTimeBand: string | null;
  appliedScaleClass: string | null;
  baseItemCode: string | null;
  notes: string | null;
};

/** tool.statement_summaries 行 */
export type ClaimsStatementSummary = {
  id: string;
  organizationId: string;
  statementId: string;
  serviceTypeCode: string;
  totalUnits: number;
  insuranceClaimYen: number;
  kohiClaims: ClaimsKohiClaim[] | null;
  copayYen: number;
};

/** tool.validation_findings 行 */
export type ClaimsValidationFinding = {
  id: string;
  organizationId: string;
  statementId: string;
  ruleId: string;
  severity: ClaimsFindingSeverity;
  expectedErrorCode: string | null;
  message: string;
  resolvedAt: string | null;
  waivedBy: string | null;
  createdAt: string;
};

/** GET /claims/statements/:statementId の runs（calculation_runs の抜粋列） */
export type ClaimsCalculationRunSummary = {
  id: string;
  engineVersion: string;
  masterVersionRefs: Record<string, string>;
  startedAt: string;
  finishedAt: string | null;
  result: "ok" | "error";
  diffSummary: ClaimsBatchDiffSummary | null;
  triggeredBy: string | null;
};

/** GET /claims/statements/:statementId レスポンス data */
export type ClaimsStatementDetail = {
  statement: ClaimsStatement;
  lines: ClaimsStatementLine[];
  dailyBasis: ClaimsStatementDailyBasis[];
  summaries: ClaimsStatementSummary[];
  findings: ClaimsValidationFinding[];
  runs: ClaimsCalculationRunSummary[];
};

/** GET /claims/batches/:batchId レスポンス data */
export type ClaimsBatchDetail = {
  batch: ClaimsBatch;
  statements: ClaimsStatement[];
};

/** バッチ全体の再計算差分要約 */
export type ClaimsBatchDiffSummary = {
  statementsChanged: number;
  unitsDelta: number;
  claimYenDelta: number;
};

/** calculate/create バッチ計算で validation_findings に未添付だった finding */
export type ClaimsPersistFinding = {
  ruleId: string;
  severity: string;
  expectedErrorCode: string | null;
  message: string;
};

/** createBatch(input) */
export type CreateClaimsBatchInput = {
  facilityId: string;
  billingYearMonth: string;
};

/** POST /claims/batches レスポンス data */
export type CreateClaimsBatchResult = {
  batchId: string;
  unattachedFindings: ClaimsPersistFinding[];
};

/** GET /claims/batches クエリパラメータ */
export type ListClaimsBatchesQuery = {
  status?: ClaimsBillingBatchStatus;
  facilityId?: string;
};

/** POST /claims/batches/:batchId/calculate レスポンス data */
export type RunClaimsBatchCalculationResult = {
  runIds: string[];
  diffSummary: ClaimsBatchDiffSummary;
  unattachedFindings: ClaimsPersistFinding[];
};

/** POST /claims/batches/calculate-month レスポンス data（無ければ作る → 計算 → 検証） */
export type ClaimsImportStatusRow = {
  clientId: string;
  status: "imported" | "not_imported" | "unconfirmed" | "no_sheet" | "confirmed_no_records";
};

export type ClaimsImportPreview = {
  facilityId: string;
  billingYearMonth: string;
  serviceYearMonth: string;
  batchId: string | null;
  provisionBilled: boolean;
  toImport: number;
  notImported: number;
  unconfirmed: number;
  noSheet: number;
  confirmedNoRecords: number;
  rows: ClaimsImportStatusRow[];
};

export type CalculateClaimsMonthResult = {
  batchId: string;
  /** この呼び出しで月締めを作ったか */
  created: boolean;
  diffSummary: ClaimsBatchDiffSummary;
  unattachedFindings: ClaimsPersistFinding[];
  /** 検証のあとの未解決の error / warning の件数 */
  errors: number;
  warnings: number;
};

/** POST /claims/batches/:batchId/validate レスポンス data */
export type ValidateClaimsBatchResult = {
  errors: number;
  warnings: number;
};

/** confirmBatch(batchId, input) */
export type ConfirmClaimsBatchInput = {
  waivedFindingIds?: string[];
};

/** POST /claims/batches/:batchId/confirm レスポンス data */
export type ConfirmClaimsBatchResult = {
  confirmedCount: number;
};

/** recordBatchSubmitted(batchId, input) — 手動記録 */
export type RecordClaimsBatchSubmittedInput = {
  submittedAt: string;
};

/** voidBatch(batchId, input) */
export type VoidClaimsBatchInput = {
  reason: string;
};

export type WithdrawClaimsBatchSubmissionInput = {
  reason: string;
};

/** POST /claims/batches/:batchId/export レスポンス data */
export type ExportClaimsBatchResult = {
  batchId: string;
  fileCount: number;
  exchangeIds: string[];
  downloadUrl: string;
};

/** GET /claims/batches/:batchId/csv レスポンス data */
export type ClaimsBatchCsvDownload = {
  downloadUrl: string;
};

/** GET /claims/statements クエリパラメータ */
export type ListClaimsStatementsQuery = {
  status?: ClaimsStatementStatus;
  clientId?: string;
  facilityId?: string;
  /** true = batch_id IS NULL（月遅れ滞留・未割当のみ） */
  unassigned?: boolean;
};

/** POST /claims/statements/:statementId/recalculate レスポンス data */
export type RecalculateClaimsStatementResult = {
  diffSummary: ClaimsBatchDiffSummary;
};

/** recordStatementStatus(statementId, input) — 前方遷移のみサーバ検証 */
export type RecordClaimsStatementStatusInput = {
  to: ClaimsManualStatementStatus;
  notedAt: string;
  memo?: string;
};

/** createRevision(statementId) — reason は任意（未指定時は既定文言） */
export type CreateClaimsStatementRevisionInput = {
  reason?: string;
};

/** POST /claims/statements/:statementId/revise レスポンス data */
export type CreateClaimsStatementRevisionResult = {
  newStatementId: string;
};

/** POST /claims/statements/findings/:findingId/waive レスポンス data */
export type WaiveClaimsFindingResult = {
  findingId: string;
};

/** updateNote(statementId, input) — 明細書の備考（500 字まで。null か空の文で消す） */
export type UpdateClaimsStatementNoteInput = {
  note: string | null;
};

export type UpdateClaimsStatementNoteResult = {
  statementId: string;
  note: string | null;
};

/** tool.user_invoices 行 */
export type ClaimsUserInvoice = {
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string;
  billingYearMonth: string;
  revision: number;
  supersedesId: string | null;
  status: ClaimsUserInvoiceStatus;
  sourceStatementIds: string[];
  sourceAdjustmentCaseId: string | null;
  billedYen: number;
  taxableYen: number;
  nontaxableYen: number;
  taxYen: number;
  medicalDeductionYen: number;
  issuedAt: string | null;
  /** 支払期日（YYYY-MM-DD・未設定は null。口座振替の請求書は依頼ファイルを作ると引落日が入る） */
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** PATCH /claims/invoices/:invoiceId/due-date — 支払期日（null で空にする） */
export type SetClaimsInvoiceDueDateInput = { dueDate: string | null };

/** 利用者入金の状況（unpaid = 未入金 / partial = 一部入金 / settled = 入金済み） */
export type ClaimsReceivableStatus = "unpaid" | "partial" | "settled";

/** GET /claims/user-payments/receivables クエリ（1 回に最大 200 件。続きは offset） */
export type ListClaimsReceivablesQuery = {
  status?: ClaimsReceivableStatus;
  facilityId?: string;
  /** 請求年月 'YYYY-MM-01' */
  yearMonth?: string;
  offset?: number;
};

/** GET /claims/user-payments/receivables の 1 行（発行済みの請求書 1 枚と入金の状況） */
export type ClaimsReceivable = {
  id: string;
  clientId: string;
  /** client:read が無ければ「非公開」 */
  clientName: string;
  clientNameKana: string | null;
  facilityId: string;
  facilityName: string;
  officeNumber: string | null;
  /** 'YYYY-MM-DD' */
  billingYearMonth: string;
  serviceYearMonth: string | null;
  serviceTypeCode: string | null;
  revision: number;
  billedYen: number;
  /** 自費・実費の行の合計 */
  selfPayYen: number;
  /** ISO 8601 */
  issuedAt: string | null;
  paidYen: number;
  /** 請求額 − 入金合計（負値 = 過入金） */
  outstandingYen: number;
  receivableStatus: ClaimsReceivableStatus;
  /** 'YYYY-MM-DD' */
  dueDate: string | null;
  lastReceivedAt: string | null;
  directDebit: { batchStatus: string; resultCode: string | null; matchStatus: string } | null;
  /** client-billing:read を持つか。false のとき billingMethod / mandateStatus は null */
  billingVisible: boolean;
  billingMethod: string | null;
  mandateStatus: string | null;
};

/** 入金の方法 */
export type ClaimsUserPaymentMethod = "cash" | "transfer" | "direct_debit";

/** 利用者入金の記録 1 件 */
export type ClaimsUserPayment = {
  id: string;
  invoiceId: string;
  method: ClaimsUserPaymentMethod;
  amountYen: number;
  /** 'YYYY-MM-DD' */
  receivedAt: string;
  matched: boolean;
  memo: string | null;
  createdAt: string;
};

/** POST /claims/user-payments（発行済みの請求書だけ。返金はマイナス） */
export type RecordClaimsUserPaymentInput = {
  invoiceId: string;
  method: ClaimsUserPaymentMethod;
  amountYen: number;
  /** 'YYYY-MM-DD' */
  receivedAt: string;
  matched?: boolean;
  memo?: string | null;
};

/** POST /claims/user-payments レスポンス data */
export type RecordClaimsUserPaymentResult = {
  payment: ClaimsUserPayment;
  paidYen: number;
  outstandingYen: number;
  receivableStatus: ClaimsReceivableStatus;
};

/** tool.user_invoice_lines 行 */
export type ClaimsUserInvoiceLine = {
  id: string;
  organizationId: string;
  invoiceId: string;
  lineNo: number;
  kind: ClaimsUserInvoiceLineKind;
  description: string;
  quantity: number | null;
  amountYen: number;
  taxClass: ClaimsTaxClass;
  medicalDeductionClass: ClaimsMedicalDeductionClass;
  statementLineId: string | null;
};

/** tool.receipts 行 */
export type ClaimsReceipt = {
  id: string;
  organizationId: string;
  invoiceId: string;
  issuedAt: string;
  issuedBy: string;
  reissueReason: string | null;
};

/** レンダラ finding（over-limit 円未供給・0 円請求スキップ・既発行スキップ等） */
export type ClaimsInvoiceRenderFinding = {
  ruleId: string;
  severity: "warning" | "info";
  clientId: string | null;
  message: string;
};

/** POST /claims/invoices/generate/:batchId レスポンス data */
export type GenerateClaimsInvoicesResult = {
  count: number;
  findings: ClaimsInvoiceRenderFinding[];
};

/** POST /claims/invoices/generate-month/:yearMonth 本文（省略 = 見える事業所すべて） */
export type GenerateClaimsInvoicesForMonthInput = { facilityId?: string };

/** GET /claims/invoices クエリパラメータ */
export type ListClaimsInvoicesQuery = {
  status?: ClaimsUserInvoiceStatus;
  clientId?: string;
  facilityId?: string;
  billingYearMonth?: string;
};

/** GET /claims/invoices/:invoiceId レスポンス data */
export type ClaimsInvoiceDetail = {
  invoice: ClaimsUserInvoice;
  lines: ClaimsUserInvoiceLine[];
  receipts: ClaimsReceipt[];
};

/**
 * upsertSelfPayLine(invoiceId, line) の line 入力（user_invoice_lines・kind 固定 'self_pay'）。
 * 自費の項目から足す形（`{ selfPayItemId, quantity }`・名前・単価 × 数・課税・控除は項目から写す）か、
 * 項目に無いものを手で足す形。
 */
export type ClaimsSelfPayLineInput =
  | { selfPayItemId: string; quantity: number; /** 単価を決めていない項目では必須 */ unitPriceYen?: number }
  | {
      description: string;
      quantity?: number | null;
      amountYen: number;
      taxClass: ClaimsTaxClass;
      medicalDeductionClass?: ClaimsMedicalDeductionClass;
    };

/** POST /claims/invoices/:invoiceId/self-pay-lines レスポンス data */
export type AddClaimsSelfPayLineResult = {
  lineId: string;
  lineNo: number;
};

/** POST /claims/invoices/:invoiceId/self-pay-purchases/sync の結果（足した・置き換えた・外した行の数と、合わせたあとの請求額） */
export type SyncClaimsSelfPayPurchasesResult = {
  added: number;
  updated: number;
  removed: number;
  billedYen: number;
};

/** 自費購入とのずれ（下書きの請求書 1 枚） */
export type ClaimsSelfPayPurchaseInvoiceNotice = {
  invoiceId: string;
  clientId: string;
  /** 直された・取り消された購入の行の数 */
  changed: number;
  /** まだ入っていない購入の数 */
  missing: number;
};

/** GET /claims/invoices/self-pay-purchase-notice の結果 */
export type ClaimsSelfPayPurchaseNotice = {
  /** ずれのある下書きの請求書 */
  invoices: ClaimsSelfPayPurchaseInvoiceNotice[];
  /** 請求書に入っていない自費購入の数（明細書の無い人など） */
  unbilled: number;
};

/** GET /claims/invoices/self-pay-purchase-notice の問い */
export type ClaimsSelfPayPurchaseNoticeQuery = {
  /** 請求年月（YYYY-MM） */
  billingYearMonth: string;
  facilityId?: string;
};

/** issueReceipt(invoiceId, input?) — 再発行時のみ必須 */
export type IssueClaimsReceiptInput = {
  reissueReason: string;
};

/** GET /claims/statements/search — 利用者名で探した明細書（最大 30 件） */
export type ClaimsStatementCandidate = {
  id: string;
  client_name: string;
  service_year_month: string;
  benefit_category: string;
  status: string;
  revision: number;
};

/** GET /claims/statements/equipment-rental — 福祉用具貸与（17）を含む明細書 */
export type ClaimsEquipmentRentalStatement = {
  statement_id: string;
  service_year_month: string;
  facility_id: string;
  facility_name: string | null;
  benefit_category: string;
  revision: number;
  total_units: number | null;
  insurance_claim_yen: number | null;
  copay_yen: number | null;
  status: string;
  batch_billing_year_month: string | null;
};

/** GET /claims/batches/:batchId/findings */
export type ClaimsBatchFinding = {
  id: string;
  statement_id: string;
  client_name: string;
  rule_id: string;
  severity: ClaimsFindingSeverity;
  expected_error_code: string | null;
  /** ログ・開発用の文。職員に伝えるときは display_text */
  message: string;
  /** 職員に見せる現場の言葉の文（画面と同じ文） */
  display_text: string;
  resolved_at: string | null;
  waived_by: string | null;
};

/** GET /claims/batches/:batchId/performance */
export type ClaimsBatchPerformance = {
  client_count: number;
  attended_day_total: number;
  last_updated_at: string | null;
  facility_service_type_code: string | null;
  clients: {
    client_id: string;
    client_name: string;
    statement_id: string;
    service_year_month: string;
    attended_days: number;
    addition_count: number;
    additions: { item_code: string; layer: string; tekiyo: string | null }[];
    has_warning: boolean;
  }[];
};

/** GET /claims/dashboard/batch-progress */
export type ClaimsDashboardBatchProgress = {
  billing_year_month: string;
  open_count: number;
  locked_count: number;
  exported_count: number;
  submitted_count: number;
  void_count: number;
  total_claim_yen: number;
  total_copay_yen: number;
};

/** GET /claims/dashboard/facility-batches */
export type ClaimsDashboardFacilityBatch = {
  batch_id: string;
  facility_id: string;
  facility_name: string;
  status: string;
  statement_count: number;
  total_claim_yen: number;
  total_copay_yen: number;
};

/** GET /claims/dashboard/return-assess-rate */
export type ClaimsDashboardReturnAssessRate = {
  since: string;
  submitted_or_later_count: number;
  returned_count: number;
  assessed_count: number;
};

/** GET /claims/dashboard/reconciliation-summary */
export type ClaimsDashboardReconciliationSummary = {
  matched_count: number;
  mismatch_count: number;
  unmatched_count: number;
  total_decided_yen: number;
};

/** GET /claims/dashboard/outstanding-summary */
export type ClaimsDashboardOutstandingSummary = {
  outstanding_count: number;
  outstanding_total_yen: number;
};

/** GET /claims/dashboard/billing-progress — ホームの進行表（請求月 × 工程） */
export type ClaimsBillingProgressStep =
  | "performance"
  | "structure"
  | "check"
  | "confirm"
  | "submit"
  | "result"
  | "fix"
  | "payment";

export type ClaimsBillingProgressCell = {
  state: "none" | "waiting" | "active" | "done" | "blocked";
  label: string;
};

export type ClaimsBillingProgressRow = {
  billing_year_month: string;
  service_year_month: string;
  deadline_date: string;
  days_left: number;
  batch_count: number;
  statement_count: number;
  cells: Record<ClaimsBillingProgressStep, ClaimsBillingProgressCell>;
};

export type ClaimsBillingProgressNextAction = {
  billing_year_month: string;
  step: ClaimsBillingProgressStep;
  severity: "info" | "warning" | "critical";
  message: string;
  days_left: number;
};

export type ClaimsBillingProgressBlocker = {
  billing_year_month: string;
  rule_id: string;
  title: string;
  error_count: number;
  statement_count: number;
  deadline_date: string;
  days_left: number;
};

export type ClaimsBillingProgress = {
  today: string;
  rows: ClaimsBillingProgressRow[];
  next_actions: ClaimsBillingProgressNextAction[];
  blockers: ClaimsBillingProgressBlocker[];
};

/** GET /claims/kyufu/months — 確定済みの給付管理票（利用者×月） */
export type ClaimsKyufuMonth = {
  id: string;
  client_id: string;
  client_name: string;
  target_month: string;
  care_level_code: string | null;
  insurer_number: string | null;
  insured_number: string | null;
  revision: number;
  fixed_at: string | null;
  row_count: number;
};
export type ListClaimsKyufuMonthsQuery = { targetMonth?: string };

/** GET /claims/provision/* の絞り込み（yearMonth = 提供年月 YYYY-MM / facilityId = 作業文脈の事業所） */
export type ClaimsProvisionQuery = { yearMonth?: string; facilityId?: string };

/** GET /claims/provision/clients/:clientId — サービス提供票（行はこのキーが camelCase） */
export type ClaimsProvisionSheet = {
  clientId: string;
  clientName: string;
  yearMonth: string;
  daysInMonth: number;
  computed: boolean;
  dailyAvailable: boolean;
  hasClaimsScope: boolean;
  hasClaimsWrite: boolean;
  monthlyAdditions: ClaimsNursingMonthlyAddition[];
  /** 算定対象の加算の設定不備・計算失敗。対象外の説明は含めない（互換性のためフィールド名を維持）。 */
  monthlyAdditionWarnings: string[];
  rows: {
    key: string;
    kind: "plan" | "actual" | "attendance";
    serviceTypeCode: string | null;
    itemCode: string | null;
    name: string;
    nameResolved?: boolean;
    layer: string | null;
    statementId: string | null;
    monthly: boolean;
    cells: Record<number, { text: string; override?: boolean; status?: "absent" | "cancelled" }>;
    totalCount: number;
    totalUnits: number | null;
  }[];
  /** 実績の段の出所: statement = 明細書 / estimate = 明細書の無い月の見込み（請求の確定値ではない）/ none */
  actualSource: "statement" | "estimate" | "none";
  /** 予定タブ（提供票の予定 = 自分の事業所の行、まだ無ければ Qaito の予定から作った初期値） */
  plan: ClaimsProvisionPlanTab;
  /** 実績タブの自分の事業所の行。saved なら lines が提供票の実績、diffDays = 記録（見込み）と違う日 */
  ownActual: {
    saved: boolean;
    confirmed: boolean;
    confirmedAt: string | null;
    returned: boolean;
    returnedAt: string | null;
    carePlanOwned: boolean;
    /** 確定のあとでケアマネの利用票が変わった（確定した行は残してある） */
    planChangedAfterConfirm: boolean;
    lines: ClaimsProvisionActualLine[];
    diffDays: number[];
    /** 実績の初期値（記録から作った見込み・明細書の日を持つ行） */
    estimateLines: ClaimsProvisionActualLine[];
  };
  /** この利用者のこの月の明細書に返戻・保留がある */
  statementReturnedOrHeld: boolean;
  /** 当サービス提供月の被保険者証（利用者を読めない人には null） */
  insuranceCard: {
    certValidFrom: string | null;
    certValidUntil: string | null;
    careLevel: string | null;
    insurerNumber: string | null;
    insurerName: string | null;
    insuredNumber: string | null;
    limitUnits: number | null;
    /** 担当の居宅介護支援事業所と担当ケアマネ（care-office:read が無ければ null） */
    careOffice: { officeName: string | null; officeNumber: string | null; careManagerName: string | null } | null;
    careOfficeVisible: boolean;
  } | null;
  summary: {
    plannedCount: number;
    attendedCount: number;
    absentCount: number;
    cancelledCount: number;
    totalUnits: number | null;
  };
};

/** サービス提供票の予定の 1 行（自分の事業所の行。days = 日 → 予定の回数） */
export type ClaimsProvisionPlanLine = {
  lineId: string | null;
  serviceTypeCode: string | null;
  serviceCode: string | null;
  name: string;
  startTime: string | null;
  endTime: string | null;
  unitValue: number | null;
  days: Record<number, number>;
};

/** サービス提供票の予定タブ */
export type ClaimsProvisionPlanTab = {
  facilityId: string | null;
  facilityName: string | null;
  serviceOfficeId: string | null;
  source: "riyohyo" | "qaito" | "none";
  editable: boolean;
  readOnlyReason: string | null;
  /** 直せない理由の種類（readOnlyReason と対） */
  readOnlyCode:
    | "no_facility"
    | "facility_ambiguous"
    | "provision_no_service_office"
    | "provision_care_plan_owned"
    | "provision_month_not_editable"
    | "provision_billed"
    | "provision_actual_locked"
    | "provision_plan_confirmed"
    | null;
  riyohyoMonthId: string | null;
  returned: boolean;
  /** 予定を確定したか（確定したら予定は読むだけ） */
  planConfirmed: boolean;
  planConfirmedAt: string | null;
  lines: ClaimsProvisionPlanLine[];
};

/** 提供票の一覧の段（予定取り込み → 実績入力中 → 実績確定 → 返送 → 請求手続き中 → 請求済み） */
export type ClaimsProvisionProgressStep = "plan" | "input" | "confirm" | "return" | "billing" | "billed";

/** 予定・実績の数（単位は確かな値が無ければ null） */
export type ClaimsProvisionCounts = { days: number; count: number; units: number | null };

/** GET /claims/provision/clients — サービス提供票の一覧（利用者 × 月） */
export type ClaimsProvisionListRow = {
  clientId: string;
  clientName: string;
  plan: ClaimsProvisionCounts;
  /** estimated = 出欠から数えた見込み（請求の計算の前） */
  actual: ClaimsProvisionCounts & { estimated: boolean };
  progress: {
    cells: Record<ClaimsProvisionProgressStep, { state: "done" | "partial" | "none" | "blocked" | "na"; label: string }>;
    /** 今の段（済んでいない段のうち最初）。無ければ null */
    current: ClaimsProvisionProgressStep | null;
  };
};

/** PUT /claims/provision/clients/:clientId/plan */
export type SaveClaimsProvisionPlanInput = {
  yearMonth: string;
  facilityId: string;
  lines: ClaimsProvisionPlanLine[];
};

export type AnalyzeClaimsProvisionSheetInput = {
  base64_content: string;
  mime_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf";
  /** 写真を上から帯に分けた続き（base64・形式は mime_type と同じ・画像のときだけ・最大 3 枚） */
  extra_parts?: string[];
  /** 事業所番号で当たらなかったときの事業所 */
  facility_id?: string;
  /** 提供年月が読めなかったときの提供年月（YYYY-MM） */
  year_month?: string;
};

/** 読み取った提供票の行（serviceCode が null の行は当たらなかった行。保存の前に選ぶか外す） */
export type ClaimsProvisionOcrLine = {
  readCode: string | null;
  readName: string;
  serviceTypeCode: string | null;
  serviceCode: string | null;
  name: string;
  unitValue: number | null;
  startTime: string | null;
  endTime: string | null;
  days: Record<number, number>;
  match: "code" | "name" | "none";
};

/** POST /claims/provision/ocr レスポンス data（予定の下書き。保存はしていない） */
export type ClaimsProvisionOcrDraft = {
  yearMonth: string | null;
  facility: { id: string; name: string; serviceTypeCode: string | null } | null;
  client: { id: string | null; miss: "not_read" | "not_found" | "ambiguous" | "not_this_facility" | null };
  /** 確かめの表示だけに使う値（当てるのには使わない） */
  read: {
    clientName: string | null;
    birthDate: string | null;
    careLevel: string | null;
    insuredNumber: string | null;
    officeNumber: string | null;
  };
  lines: ClaimsProvisionOcrLine[];
  /** 基本のサービス以外（加算など）に当たって外した行の数 */
  excluded: number;
};

/** POST /claims/provision/clients/:clientId/return（/confirm・/unconfirm も同じ形） */
export type ReturnClaimsProvisionSheetInput = { yearMonth: string; facilityId: string };

/** 提供票の実績の 1 行（サービスコード単位。days = 日 → 回数） */
export type ClaimsProvisionActualLine = {
  serviceTypeCode: string;
  itemCode: string;
  name: string;
  days: Record<string, number>;
};

/** PUT /claims/provision/clients/:clientId/actuals */
export type SaveClaimsProvisionActualsInput = {
  yearMonth: string;
  facilityId: string;
  lines: ClaimsProvisionActualLine[];
};

/** 予定の保存・返送の結果 */
export type ClaimsProvisionWriteResult = { riyohyoMonthId: string; lines: number; actualSource?: "statement" | "estimate" };
/** POST /claims/provision/clients/:clientId/confirm の入力。dryRun = チェックだけ（確定しない） */
export type ConfirmClaimsProvisionSheetInput = ReturnClaimsProvisionSheetInput & { dryRun?: boolean };
/** 確定のときのチェックの 1 件（文は検証の結果と同じ形） */
export type ClaimsProvisionCheckFinding = { ruleId: string; message: string };
export type ClaimsNursingMonthlyAddition = {
  key: import("@qaito/schemas").NursingMonthlyAdditionKey;
  itemCode: string; name: string; units: number; quantity: number; reason: string; excluded: boolean; manual?: boolean;
};
export type ClaimsProvisionConfirmCheck = {
  /** 今の記録から出し直した値と、確定する提供票で中身が違う日（日の数字・昇順）。止めない */
  recordDiffDays: number[];
  /** 確定する提供票で計算した結果（保存しない）。明細書ごと */
  statements: {
    insurerNumber: string;
    benefitCategory: string;
    totalUnits: number;
    insuranceClaimYen: number;
    kohiClaimYen: number;
    copayYen: number;
  }[];
  totals: { totalUnits: number; insuranceClaimYen: number; kohiClaimYen: number; copayYen: number };
  /** 提供票の行を請求に使えない（V27）。あれば確定しない */
  unusable: ClaimsProvisionCheckFinding[];
  /** 計算・検証のエラー（証の期限など）。確定は止めない */
  errors: ClaimsProvisionCheckFinding[];
  warnings: ClaimsProvisionCheckFinding[];
  /** 記録書Ⅱを提出していない実施済みの訪問の数（訪問看護だけ・通所介護は null）。あれば確定しない */
  missingNursingRecords: number | null;
  monthlyAdditions: ClaimsNursingMonthlyAddition[];
  monthlyAdditionWarnings?: string[];
  blockedBy: "provision_lines_unusable" | "provision_nursing_records_missing" | null;
};
/** POST /claims/provision/clients/:clientId/confirm の応答。dryRun のときは confirmed=false・riyohyoMonthId は空・lines は 0 */
export type ClaimsProvisionConfirmResult = ClaimsProvisionWriteResult & { confirmed: boolean; check: ClaimsProvisionConfirmCheck };
/** GET /claims/nursing-billing・DELETE /claims/nursing-billing/clients/:clientId/confirm のクエリ */
export type ClaimsNursingBillingQuery = { facilityId: string; month: string };
/** 訪問看護の実績の確定の 1 行（利用者 × 月） */
export type ClaimsNursingBillingRow = {
  clientId: string;
  clientName: string;
  monthlyAdditions: ClaimsNursingMonthlyAddition[];
  /** 算定対象の加算の設定不備・計算失敗。対象外の説明は含めない（互換性のためフィールド名を維持）。 */
  monthlyAdditionWarnings: string[];
  /** 介護の分（介護の訪問が無ければ null）。visitCount = 実施済みの介護の訪問 */
  kaigo: { stage: "none" | "draft" | "confirmed" | "returned"; visitCount: number } | null;
  /** 医療の分（医療の訪問も確定も無ければ null） */
  iryo: { visitCount: number; confirmationId: string | null; confirmedAt: string | null } | null;
  /** 実施済みで記録書Ⅱを提出していない訪問の数 */
  missingRecords: number;
  /** その訪問（日付の順） */
  missingRecordVisits: { visitId: string; serviceDate: string }[];
  /** 保険を手で変えた訪問の数 */
  overrideCount: number;
  /** 指示書の期間外の実施済みの訪問の数 */
  outsideInstructionCount: number;
  pendingSpecialInstructionCount: number;
};
/** POST /claims/nursing-billing/clients/:clientId/confirm の入力 */
export type ConfirmClaimsNursingBillingInput = ClaimsNursingBillingQuery & { dryRun?: boolean; excludedAdditions?: import("@qaito/schemas").NursingMonthlyAdditionKey[]; manualAdditions?: import("@qaito/schemas").NursingMonthlyManualAddition[] };
/** POST /claims/nursing-billing/clients/:clientId/confirm の応答（dryRun のときは confirmed=false） */
export type ClaimsNursingBillingConfirmResult = {
  confirmed: boolean;
  kaigo: { alreadyConfirmed: boolean; check: ClaimsProvisionConfirmCheck | null } | null;
  iryo: { visitCount: number; missingRecords: number; alreadyConfirmed: boolean; confirmationId: string | null } | null;
};
/** DELETE /claims/nursing-billing/clients/:clientId/confirm の応答 */
export type ClaimsNursingBillingUnconfirmResult = { kaigoUnconfirmed: boolean; iryoUnconfirmed: boolean };

export type ClaimsProvisionPlanBulkOp =
  | { kind: "add"; serviceCode: string; days?: "base" | "none" }
  | { kind: "replace"; fromServiceCode: string; toServiceCode: string }
  | { kind: "remove"; serviceCode: string };

/** POST /claims/provision/plan-bulk/dry-run */
export type PreviewClaimsProvisionPlanBulkInput = {
  yearMonth: string;
  facilityId: string;
  /** 200 人まで */
  clientIds: string[];
  op: ClaimsProvisionPlanBulkOp;
};

/** POST /claims/provision/plan-bulk（expected = 下見の counts と digest。違えば 409） */
export type ApplyClaimsProvisionPlanBulkInput = PreviewClaimsProvisionPlanBulkInput & {
  expected: { clients: number; lines: number; digest: string };
};

/** 一括設定で対象外にした理由（1 人の保存が断る理由と同じ種類 + 提供票が開けない人） */
export type ClaimsProvisionBulkSkipReason = NonNullable<ClaimsProvisionPlanTab["readOnlyCode"]> | "not_found";

/** 一括設定で変えない理由（already = もう同じコードの行がある / absent = そのコードの行が無い / no_base = 基本の行が無い / target_exists = 置き換え先がもうある） */
export type ClaimsProvisionBulkNoopReason = "already" | "absent" | "no_base" | "target_exists";

/** 一括設定の下見の結果 */
export type ClaimsProvisionPlanBulkPreview = {
  /** マスタで引いた操作（名前・種類つき） */
  op: Record<string, unknown> & { kind: "add" | "replace" | "remove" };
  counts: { clients: number; lines: number };
  /** 実行のときに expected.digest へそのまま渡す */
  digest: string;
  skipped: Partial<Record<ClaimsProvisionBulkSkipReason, number>>;
  unchanged: Partial<Record<ClaimsProvisionBulkNoopReason, number>>;
  rows: {
    clientId: string;
    clientName: string;
    outcome:
      | { kind: "change"; changedLines: number; savesInitialPlan: boolean }
      | { kind: "noop"; reason: ClaimsProvisionBulkNoopReason }
      | { kind: "skipped"; reason: ClaimsProvisionBulkSkipReason };
  }[];
};

/** 一括設定の実行の結果（変わる人がいなければ bulkEditId は空） */
export type ClaimsProvisionPlanBulkApplied = { bulkEditId: string; clients: number; lines: number };

/** GET /claims/provision/plan-bulk のクエリ（どちらも必須） */
export type ListClaimsProvisionPlanBulkEditsQuery = { facilityId: string; yearMonth: string };

/** 一括設定の記録 */
export type ClaimsProvisionPlanBulkEdit = {
  id: string;
  operation: Record<string, unknown>;
  summary: Record<string, unknown>;
  clients: number;
  createdAt: string | null;
  createdByUserId: string | null;
  undoneAt: string | null;
};

/** POST /claims/provision/plan-bulk/:bulkEditId/undo の結果（戻さなかった人と理由つき） */
export type ClaimsProvisionPlanBulkUndoResult = {
  bulkEditId: string;
  restored: number;
  skipped: { clientId: string; reason: string }[];
};

/** GET /claims/provision/monthly-status — 事業所ごとの月次請求バッチ（status=null は未作成） */
export type ClaimsMonthlyBatchStatus = {
  facilityId: string;
  facilityName: string;
  status: string | null;
  batchId: string | null;
};

/** GET /claims/form-output のクエリ（どちらも必須） */
export type ClaimsFormOutputQuery = { billingYearMonth: string; facilityId: string };

/** 紙の様式の区画。meisai = 介護給付費（様式第一 + 第二・第二の二）・sogo = 総合事業費（第一の二 + 第二の三）・kyufu = 給付管理票（第十一） */
export type ClaimsPaperFormKind = "meisai" | "sogo" | "kyufu";

/** GET /claims/form-output/:billingYearMonth/:kind/pdf のクエリ（どちらも必須。serviceYearMonth は給付管理票なら対象年月） */
export type ClaimsPaperFormsPdfQuery = { facilityId: string; serviceYearMonth: string };

/** 様式出力の区画の 1 行（サービス提供月ごとの件数） */
export type ClaimsFormOutputMonthRow = { serviceYearMonth: string; count: number };

/** GET /claims/form-output — 様式出力（事業所 × 請求年月）。batch は void 以外の月次請求（無ければ null） */
export type ClaimsFormOutput = {
  billingYearMonth: string;
  facilityId: string;
  facilityName: string;
  kyufuAuthor: boolean;
  batch: { id: string; status: string; csvExported: boolean } | null;
  meisai: ClaimsFormOutputMonthRow[];
  sogo: ClaimsFormOutputMonthRow[];
  kyufu: ClaimsFormOutputMonthRow[];
};

/** 伝送管理の様式の確定の状況（none = 該当するデータが無い） */
export type ClaimsFormConfirmState = "confirmed" | "unconfirmed" | "none";

/** GET /claims/transmission-overview — 伝送管理（事業所 × 請求年月）。prefecture は事業所の所在地の都道府県（未設定は null） */
export type ClaimsTransmissionOverview = {
  billingYearMonth: string;
  facilityId: string;
  facilityName: string;
  prefecture: string | null;
  /** 請求先の国保連の電話・ページ（事業所の請求の設定に手で入れたもの。未設定は null） */
  kokuhorenPhone: string | null;
  kokuhorenUrl: string | null;
  kyufuAuthor: boolean;
  /** その月の月締め（取消を除く）。無ければ null */
  batchId: string | null;
  batchStatus: string | null;
  meisai: ClaimsFormConfirmState;
  sogo: ClaimsFormConfirmState;
  kyufu: { state: ClaimsFormConfirmState | "partial"; fixed: number; total: number };
  submission: { submittedAt: string; submittedBy: string | null } | null;
};

/** GET /claims/results — 結果系 4 状態（paid / assessed / held / returned）の明細書 */
export type ClaimsResult = {
  id: string;
  client_id: string;
  client_name: string;
  facility_id: string;
  facility_name: string;
  service_year_month: string;
  benefit_category: string;
  status: string;
  revision: number;
  insurance_claim_yen: number | null;
  error_code: string | null;
  amount_delta: number | null;
  notice_id: string | null;
  notice_kind: string | null;
  notice_received_at: string | null;
};

/** GET /claims/results/error-codes — コード → 辞書の行 */
export type ClaimsErrorCodeInfo = {
  code: string;
  title: string;
  cause: string | null;
  action_template: string | null;
  category: string;
};

/** GET /claims/masters/versions */
export type ClaimsMasterVersion = {
  id: string;
  master_kind: string;
  version_label: string;
  effective_from: string;
  effective_until: string | null;
  status: string;
  imported_at: string;
  imported_by: string;
  row_count: number;
};

/** GET /claims/masters/service-codes */
export type ClaimsServiceCode = {
  id: string;
  service_type_code: string;
  item_code: string;
  name: string;
  short_name: string | null;
  unit_value: number;
  unit_basis: string;
  category: string;
  alt_table: string;
  exclusive_group: string | null;
};
export type SearchClaimsServiceCodesQuery = {
  search?: string;
  category?: string;
  /** サービス種類（2 桁・完全一致）。件数の上限より先に絞る */
  service_type_code?: string;
  /** 6 桁のコードのカンマ区切り（完全一致・100 件まで） */
  codes?: string;
  /** true = 提供票の行に足せるもの（基本と、日の単位の加算）だけ */
  provision_addable?: boolean;
  limit?: number;
  offset?: number;
};

export type ClaimsRegionalUnitPriceTable = {
  version: { label: string; effective_from: string } | null;
  rows: { grade: string; labor_ratio_class: string; price_hundredths: number }[];
};

/** GET /claims/facilities/:facilityId/{summary,additions} の絞り込み（提供年月 YYYY-MM） */
export type ClaimsFacilityMonthQuery = { year_month: string };

export type ClaimsFacilityMonthTotals = {
  statements: number;
  total_units: number;
  insurance_claim_yen: number;
  copay_yen: number;
};

export type ClaimsFacilitySummary = {
  facility_id: string;
  facility_name: string;
  office_number: string | null;
  service_type_code: string;
  capacity: number;
  year_month: string;
  /** 計算に使う級地（未設定なら 'other' で計算する） */
  region_grade: string;
  region_grade_set: boolean;
  unit_price_hundredths: number | null;
  labor_ratio_class: number | null;
  shogu_kaizen_tier: string | null;
  /** 計算に使う規模区分（未設定なら 'normal' で計算する） */
  scale_class: string;
  scale_class_set: boolean;
  profile_set: boolean;
  filed_additions: {
    addition_group: string;
    label: string;
    billable_from: string;
    billable_until: string | null;
    billed_clients: number;
    billed_units: number;
  }[];
  billed_additions: { code: string; name: string; clients: number; total_units: number }[];
  month: ClaimsFacilityMonthTotals;
  previous_month: ClaimsFacilityMonthTotals;
  warnings: string[];
};

export type ClaimsFacilityAdditionList = {
  facility_id: string;
  service_type_code: string;
  year_month: string;
  rows: {
    addition_group: string;
    label: string;
    codes: { code: string; name: string | null; unit_value: number | null; unit_basis: string | null }[];
    filed: boolean;
    billable_from: string | null;
    billable_until: string | null;
    billed_clients: number;
    billed_units: number;
  }[];
};

/** GET /claims/teigen-assignments/board の絞り込み（両方必須） */
export type ClaimsTeigenBoardQuery = { facilityId: string; month: string };

/** GET /claims/teigen-assignments/board — 居宅介護支援の逓減の割当ボード */
export type ClaimsTeigenBoard = {
  facility: { id: string; name: string; office_number: string | null };
  month: string;
  monthly: {
    teigen_kubun: "i" | "ii";
    caseload_band: "band1" | "band2" | "band3" | null;
    caseload_count: number | null;
    confirmed_at: string | null;
    memo: string | null;
  } | null;
  clients: {
    client_id: string;
    client_name: string;
    assigned_band: "i" | "ii" | "iii" | null;
    source: "default_rule" | "manual_override" | null;
    override_reason: string | null;
    suggested_band: "i" | "ii" | "iii" | null;
    managed: boolean;
    held_elsewhere: boolean;
  }[];
  assignedCount: number;
  managedCount: number;
};

/** PUT /claims/teigen-assignments/assignments — 逓減段の一括確定（1 人でも不可なら全体を拒否） */
export type UpsertClaimsTeigenAssignmentsInput = {
  facilityId: string;
  month: string;
  changes: { clientId: string; assignedBand: "i" | "ii" | "iii"; overrideReason?: string }[];
};

/** POST /claims/adjustments — 是正の手動起票 */
export type CreateClaimsAdjustmentCaseInput = {
  trigger: "returned" | "assessed" | "kago" | "copay_retro" | "benefit_mgmt_revised";
  statementId: string;
  noticeItemId?: string;
  impactDraft?: {
    currentInvoiceId: string | null;
    deltaCopayYen: number | null;
    deltaMedicalDeductionYen: number | null;
    basis: "notice" | "recalc_draft";
    note: string;
  };
};

/** POST /claims/kago — 過誤申立（支払済みの明細書のみ） */
export type SubmitClaimsKagoClaimInput = {
  statementId: string;
  kind: "same_month" | "normal";
  /** 申立先の保険者番号（6 桁） */
  insurerNumber: string;
  submittedAt?: string;
};

/** POST /claims/adjustments/:caseId/approve — 是正の承認（重厚操作） */
export type ApproveClaimsAdjustmentCaseInput = {
  actions: { reviseStatement: boolean; regenerateInvoiceDraft: boolean };
  reason?: string;
};

/** POST /claims/kago/:kagoClaimId/decision — 過誤申立の決定の反映 */
export type RecordClaimsKagoDecisionInput = {
  decision: "approved" | "rejected";
  decidedAt?: string;
};

/** POST /claims/statements/:statementId/overrides — 加算オーバーライド（理由必須） */
export type CreateClaimsStatementLineOverrideInput = {
  /** 項目コード（4 桁の数字） */
  itemCode: string;
  /** サービス提供日（YYYY-MM-DD。月次の加算は省略） */
  serviceDate?: string | null;
  action: "add" | "remove" | "set_count";
  /** add は 1 以上・set_count は 0 以上・remove では指定しない */
  count?: number | null;
  reason: string;
};

/** POST /claims/statements/:statementId/edits — 明細書の編集の保存（調整を足すときは理由が必須） */
export type SaveClaimsStatementEditsInput = {
  /** 調整の理由（全部の調整に同じ理由を付ける） */
  reason?: string;
  overrides?: Omit<CreateClaimsStatementLineOverrideInput, "reason">[];
  /** 取り消す調整の ID */
  removeOverrideIds?: string[];
  /** 備考（省略すると変えない・null で消す） */
  note?: string | null;
};

/** POST /claims/statements/:statementId/edits レスポンス data */
export type SaveClaimsStatementEditsResult = {
  overridesCreated: number;
  overridesRemoved: number;
  noteUpdated: boolean;
  /** 調整を変えて計算し直したか */
  recalculated: boolean;
  diffSummary: ClaimsBatchDiffSummary | null;
  errors: number | null;
  warnings: number | null;
};

/** PUT /claims/teigen-assignments/assignment — 利用者別の逓減段の手動確定 */
export type UpsertClaimsTeigenAssignmentInput = {
  clientId: string;
  facilityId: string;
  month: string;
  assignedBand: "i" | "ii" | "iii";
  overrideReason?: string;
};

/** DELETE /claims/teigen-assignments/assignment — 割当の解除（facilityId は割当を持っている事業所） */
export type ReleaseClaimsTeigenAssignmentQuery = { clientId: string; facilityId: string; month: string };

/** PUT /claims/teigen-assignments/monthly — 事業所別の逓減区分と取扱件数の確定 */
export type UpsertClaimsTeigenMonthlyInput = {
  facilityId: string;
  month: string;
  teigenKubun: "i" | "ii";
  caseloadBand?: "band1" | "band2" | "band3" | null;
  caseloadCount?: number | null;
  memo?: string;
};

/** POST /claims/annual/scale — 規模区分の手動登録 */
export type AddClaimsScaleClassificationInput = {
  facilityId: string;
  fiscalYear: number;
  scaleClass: "normal" | "large1" | "large2";
  method: "manual" | "exception";
};

/** POST /claims/annual/scale/:id/confirm — 提案の人手確定（区分の上書きは任意） */
export type ConfirmClaimsScaleClassificationInput = { scaleClass?: "normal" | "large1" | "large2" };

/** POST /claims/annual/scale/compute — 規模区分の根拠の試算（保存しない） */
export type ComputeClaimsScaleEvidenceInput = {
  facilityId: string;
  fiscalYear: number;
  opts?: {
    sevenSeventhsMonths?: string[];
    firstIssueEventInclusion?: boolean;
    forceSpecialProjection?: boolean;
  };
};

/** POST /claims/annual/scale/recompute・/claims/annual/shogu-filings/ensure — 年度の指定 */
export type ClaimsAnnualFiscalYearInput = { fiscalYear: number };

/** POST /claims/annual/shogu-filings/:id/transition — 処遇改善届出の状態遷移 */
export type TransitionClaimsShoguFilingInput = {
  to: "submitted" | "accepted" | "overdue";
  submittedAt?: string | null;
  notes?: string | null;
};

/**
 * POST /claims/notices/:noticeId/items/:itemId/match — 通知明細の手動突合。
 * `to` は返戻一覧の通知で `apply: true` のときだけ必須（returned=返戻 / held=保留）。ほかの通知では送らない（400）。
 */
export type ApplyClaimsManualNoticeMatchInput = {
  statementId: string;
  apply?: boolean;
  to?: ClaimsManualNoticeMatchTarget;
};

/** 返戻一覧の手動突合で選ぶ遷移先 */
export type ClaimsManualNoticeMatchTarget = "returned" | "held";

/**
 * POST /claims/notices/import — 国保連の通知帳票ファイルの取込。ファイルは先に staged upload
 * （`POST /storage/uploads/staged`・用途 `kokuhoren_notice`）で置き、ここには staged_id だけを渡す。
 */
export type ImportClaimsNoticeInput = {
  staged_id: string;
  kind:
    | "shinsa_zogen"
    | "zogen_tanisu"
    | "henrei_ichiran"
    | "saishinsa_kettei"
    | "kago_kettei"
    | "shiharai_uchiwake"
    | "shiharai_kettei"
    | "jigyoshobetsu_meisai"
    | "kogaku_taisho";
  /** 事業所 ID。PDF の通知のときだけ使う（CSV はファイルの事業所番号から引く） */
  facility_id?: string;
  /** 受領日時（ISO 8601）。省略時はサーバの現在時刻 */
  received_at?: string;
};

/** POST /claims/payments/notices/:paymentNoticeId/reconcile — 国保連入金の消込 */
export type ReconcileClaimsPaymentsInput = { lines: { statementId: string; decidedYen: number }[] };

/** PATCH /claims/payments/notices/:paymentNoticeId — 支払通知の変更（送った項目だけ変える。事業所は変えない） */
export type UpdateClaimsPaymentNoticeInput = {
  /** 支払年月（YYYY-MM-01） */
  paymentYearMonth?: string;
  /** 受領日時（ISO 8601） */
  receivedAt?: string;
  /** 元の支払決定額通知（取り込んだ通知帳票）の ID。同じ事業所のものだけ */
  noticeId?: string;
  /** 支払決定額合計（円・0 以上の整数）。null で空にする */
  totalPaidYen?: number | null;
};

/** POST /claims/payments/notices/:paymentNoticeId/void — 支払通知の取消 */
export type VoidClaimsPaymentNoticeInput = {
  /** 取消の理由（必須・500 文字まで） */
  reason: string;
};

/** 支払通知の行（変更・取消の応答。core の rawQuery の出力で camelCase） */
export type ClaimsPaymentNotice = {
  id: string;
  organizationId: string;
  facilityId: string;
  paymentYearMonth: string;
  receivedAt: string;
  s3Key: string;
  totalPaidYen: number | null;
  parseStatus: string;
  noticeId: string | null;
  /** 取消の日時（取消していなければ null） */
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  createdAt: string;
};

/** 消込の取り消しを断る理由 */
export type ClaimsUnreconcileBlockedReason = "unreconcile_statement_progressed" | "unreconcile_adjustment_in_progress";

/** 消込の取り消しを断るときの理由と、原因の明細書 / 是正の ID */
export type ClaimsUnreconcileBlocked = {
  reason: ClaimsUnreconcileBlockedReason;
  ids: string[];
};

/** GET /claims/payments/notices/:paymentNoticeId/unreconcile-preview — 消込の取り消しの下見 */
export type ClaimsUnreconcilePreview = {
  /** 消す消込の行の件数 */
  removableLines: number;
  /** 支払済み → 受理済み（審査中）に戻す明細書 */
  revertStatementIds: string[];
  /** 取り下げる是正 */
  withdrawCaseIds: string[];
  /** 取り消せないときの理由（取り消せるなら null） */
  blocked: ClaimsUnreconcileBlocked | null;
};

/** POST /claims/payments/notices/:paymentNoticeId/unreconcile — 消込の取り消しの結果 */
export type ClaimsUnreconcileResult = {
  removedLines: number;
  revertedStatementIds: string[];
  withdrawnCaseIds: string[];
};

/** POST /claims/direct-debit/batches — 口座振替の依頼バッチ（下書き）の作成 */
export type CreateClaimsDirectDebitBatchInput = {
  profileId: string;
  /** 請求年月（その月の 1 日。YYYY-MM-01） */
  billingYearMonth: string;
  /** 引落日（YYYY-MM-DD） */
  debitDate: string;
};

/**
 * PATCH /claims/direct-debit/profiles/:id — 提出先プロファイルの変更（送った項目だけ）。
 * 有効・無効はここでは変えない（無効化は `claims.directDebit.profiles.deactivate`。有効へ戻す口は無い）。
 * 生成済み・提出済みの依頼があるあいだは、依頼ファイルに入る項目（name・debitDayOptions 以外）は 409。
 */
export type UpdateClaimsDirectDebitProfileInput = {
  name?: string;
  kind?: "shunou_daikou" | "bank_direct";
  consignorCode?: string;
  consignorNameKana?: string;
  /** 委託者の口座 = 入金口座（`claims.receivingAccounts`・用途が口座振替の入金先でカナの銀行名と支店名があるもの） */
  receivingAccountId?: string;
  /** N = 右詰め・前を 0 / C = 左詰め・後ろを空白 */
  customerNoAttr?: "N" | "C";
  lineEnding?: "crlf" | "cr" | "lf" | "none";
  typeCode?: string;
  fieldOverrides?: Record<string, unknown>;
  debitDayOptions?: Record<string, unknown>;
};

/** 入金口座（`tool.receiving_bank_accounts`）。口座番号は末尾 4 桁だけ（AI への応答では無い） */
export type ClaimsReceivingAccount = {
  id: string;
  facilityId: string | null;
  facilityName: string | null;
  /** direct_debit = 口座振替の入金先 / transfer = 振込先（請求書に印字） */
  purpose: "direct_debit" | "transfer";
  bankName: string;
  bankNameKana: string | null;
  bankCode: string;
  branchName: string;
  branchNameKana: string | null;
  branchCode: string;
  /** 1 = 普通 / 2 = 当座 */
  accountType: "1" | "2";
  accountNumberLast4?: string;
  holderNameKana: string;
  /** この口座を入金先にしている有効な口座振替の提出先 */
  directDebitProfiles: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
};
/** POST /claims/receiving-accounts */
export type CreateClaimsReceivingAccountInput = {
  facilityId?: string | null;
  purpose: "direct_debit" | "transfer";
  bankName: string;
  /** 全銀の半角カナ（口座振替の入金先に使うときは必須） */
  bankNameKana?: string | null;
  bankCode: string;
  branchName: string;
  branchNameKana?: string | null;
  branchCode: string;
  accountType: "1" | "2";
  accountNumber: string;
  holderNameKana: string;
};
/** PATCH /claims/receiving-accounts/:id（送った項目だけ） */
export type UpdateClaimsReceivingAccountInput = Partial<CreateClaimsReceivingAccountInput>;
/** GET /claims/receiving-accounts の絞り込み */
export type ListClaimsReceivingAccountsQuery = { purpose?: "direct_debit" | "transfer" };

/** 自費の項目（`tool.self_pay_items`）。事業所ごとの自費・実費の品目 */
export type ClaimsSelfPayItem = {
  id: string;
  facilityId: string;
  facilityName: string | null;
  name: string;
  /** 税込の単価（円・値引きの項目は負） */
  unitPriceYen: number | null;
  /** 回・食・枚 など */
  unit: string;
  taxClass: ClaimsTaxClass;
  medicalDeductionClass: ClaimsMedicalDeductionClass;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
/** POST /claims/self-pay-items */
export type CreateClaimsSelfPayItemInput = {
  facilityId: string;
  name: string;
  unitPriceYen: number | null;
  unit: string;
  taxClass: ClaimsTaxClass;
  medicalDeductionClass?: ClaimsMedicalDeductionClass;
  sortOrder?: number;
};
/** PATCH /claims/self-pay-items/:id（送った項目だけ・事業所は変えない） */
export type UpdateClaimsSelfPayItemInput = Partial<Omit<CreateClaimsSelfPayItemInput, "facilityId">>;
/** GET /claims/self-pay-items の絞り込み */
export type ListClaimsSelfPayItemsQuery = { facility_id?: string };

/** GET /claims/payments/reconciliation-candidates の絞り込み */
export type ListClaimsReconciliationCandidatesQuery = { facilityId: string; excludePaymentNoticeId?: string };

/** GET /claims/payments/reconciliation-candidates — 国保連入金の消込候補 */
export type ClaimsReconciliationCandidate = {
  statement_id: string;
  client_name: string;
  service_year_month: string;
  insurance_claim_yen: number | null;
  status: string;
  already_reconciled_elsewhere: boolean;
};

/** GET /claims/billing-settings/facilities */
export type ClaimsBillingSettingsFacility = {
  id: string;
  office_number: string | null;
  name: string;
  capacity: number | null;
  /** 自動判定（事業所の台帳のコード → 無ければ定員から 78 / 15） */
  derived_service_type_code: string | null;
  service_type_code_override: string | null;
  region_grade_override: string | null;
  derived_region_grade: string | null;
  shogu_kaizen_tier: string | null;
  designation_kind: string | null;
  active: boolean;
};

/** GET /claims/billing-settings/facilities/:facilityId */
export type ClaimsFacilityBillingContext = {
  facility: {
    id: string;
    name: string;
    office_number: string | null;
    capacity: number | null;
    prefecture: string | null;
    city: string | null;
    is_active: boolean;
    /** 事業所台帳のサービス種類コード（2 桁）。体制届出に並べる加算グループの絞り込みに使う */
    service_type_code: string | null;
  };
  profile: {
    region_grade_override: string | null;
    shogu_kaizen_tier: string | null;
    /** 事業所の種類（介護予防通所リハ 66 のコードが分かれる） */
    riha_provider_kind: "hospital_clinic" | "roken" | "iryoin" | null;
    service_type_code_override: string | null;
    designation_kind: string;
    designation_valid_until: string | null;
    /** 請求先の国保連の電話・ページ（職員が手で入れる。伝送管理に出す） */
    kokuhoren_phone: string | null;
    kokuhoren_url: string | null;
    active: boolean;
  };
  derived: {
    service_type_code: string | null;
    effective_service_type_code: string | null;
    region_grade: string | null;
    effective_region_grade: string | null;
    unit_price_hundredths: number | null;
    shogu_rate_permille: number | null;
  };
};

/** PUT /claims/billing-settings/facilities/:facilityId/profile — 送ったキーだけ更新 */
export type SaveClaimsBillingProfileInput = {
  regionGradeOverride?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "other" | null;
  shoguKaizenTier?: string | null;
  /** 事業所の種類（病院又は診療所 / 介護老人保健施設 / 介護医療院。介護予防通所リハ 66 の基本のコードが分かれる） */
  rihaProviderKind?: "hospital_clinic" | "roken" | "iryoin" | null;
  serviceTypeCodeOverride?: string | null;
  designationKind?: "honai" | "minashi";
  designationValidUntil?: string | null;
  /** 請求先の国保連の電話番号（数字とハイフン） */
  kokuhorenPhone?: string | null;
  /** 請求先の国保連のページの URL（http(s)） */
  kokuhorenUrl?: string | null;
  active?: boolean;
};

/** GET /claims/billing-settings/facilities/:facilityId/addition-filings */
export type ClaimsAdditionFiling = {
  id: string;
  addition_group: string;
  filed_at: string | null;
  accepted_at: string | null;
  billable_from: string;
  billable_until: string | null;
  notes: string | null;
};

/** POST /claims/billing-settings/facilities/:facilityId/addition-filings（算定開始月はサーバが導出） */
export type SaveClaimsAdditionFilingInput = {
  additionGroup: string;
  filedAt?: string | null;
  acceptedAt: string;
};

/**
 * PATCH /claims/billing-settings/facilities/:facilityId/addition-filings/:filingId — 体制届出の変更。
 * 加算グループは変えない。受理日を変えると算定開始月をサーバが作り直す。受理日は届出日より前にできない。
 */
export type UpdateClaimsAdditionFilingInput = {
  filedAt?: string | null;
  acceptedAt?: string;
  notes?: string | null;
};

/** PATCH /claims/billing-settings/facilities/:facilityId/addition-filings/:filingId の応答 */
export type UpdateClaimsAdditionFilingResult = {
  id: string;
  billableFrom: string;
  billableUntil: string | null;
};

/**
 * POST /claims/billing-settings/facilities/:facilityId/addition-filings/:filingId/end — 体制届出の終了。
 * `billable_until` を算定終了月の末日にする（行は残る）。終了月は算定開始月より前にできない・終了済みは 409。
 */
export type EndClaimsAdditionFilingInput = {
  /** 算定を終える月（YYYY-MM） */
  endMonth: string;
};

/** GET /claims/billing-settings/facilities/:facilityId/compliance-periods */
export type ClaimsCompliancePeriod = {
  id: string;
  kind: "bcp" | "gyakutai" | "teicho" | "jinketsu" | "pt_kajo";
  applies_from: string;
  applies_until: string | null;
  evidence: Record<string, boolean> | null;
  retro_policy: "none" | "to_event_month" | "to_discovery_month";
  created_at: string;
  /** いま減算が続いている期間か（終了日が空） */
  active: boolean;
  /** 取り消した期間か（同じ月の申告を適合に直した行。減算の計算には効かない） */
  cancelled: boolean;
};

/** POST /claims/billing-settings/facilities/:facilityId/compliance-periods */
export type OpenClaimsCompliancePeriodInput = {
  kind: "bcp" | "gyakutai" | "teicho" | "jinketsu" | "pt_kajo";
  appliesFrom: string;
  evidence?: Record<string, boolean> | null;
  retroPolicy?: "none" | "to_event_month" | "to_discovery_month";
};

/** POST /claims/billing-settings/facilities/:facilityId/compliance-periods/:periodId/close */
export type CloseClaimsCompliancePeriodInput = { appliesUntil: string };

/** GET /claims/billing-settings/facilities/:facilityId/compliance-declarations */
export type ClaimsComplianceDeclaration = {
  id: string;
  facility_id: string;
  /** 提供月（YYYY-MM） */
  service_year_month: string;
  kind: "bcp" | "gyakutai";
  result: "compliant" | "noncompliant";
  declared_on: string;
  declared_by_user_id: string;
  evidence: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
};

/** GET /claims/billing-settings/facilities/:facilityId/compliance-declarations の query（YYYY-MM・両端を含む） */
export type ListClaimsComplianceDeclarationsQuery = { from?: string; to?: string };

/** PUT /claims/billing-settings/facilities/:facilityId/compliance-declarations */
export type UpsertClaimsComplianceDeclarationInput = {
  serviceYearMonth: string;
  kind: "bcp" | "gyakutai";
  result: "compliant" | "noncompliant";
  evidence?: Record<string, boolean> | null;
};

/** GET /claims/billing-settings/transmission */
export type ClaimsTransmissionSettings = {
  agents: {
    agent_id: string;
    name: string;
    certificate_expires_at: string | null;
    capacity: number;
    active: boolean;
  }[];
  facilities: {
    facility_id: string;
    facility_name: string;
    office_number: string | null;
    profile_missing: boolean;
    transmission_agent_id: string | null;
    transmission_agent_name: string | null;
  }[];
};

/** PUT /claims/billing-settings/transmission/agent — `agentId: null` で解除 */
export type AssignClaimsTransmissionAgentInput = { facilityId: string; agentId: string | null };

/** GET /care-plan/homecare/plans[/:id] レスポンス行（care_plans + details JOIN。get は patterns 配列を含む）*/
export type HomecarePlan = {
  id: string;
  organizationId: string;
  clientId: string;
  source: string;
  /** 状態 */
  status: string;
  /** 版数 */
  version: number;
  careManagerName: string | null;
  careManagerOffice: string | null;
  createdByUserId: string | null;
  assessmentId: string | null;
  certificationId: string | null;
  clientWishes: string | null;
  familyWishes: string | null;
  overallPolicy: string | null;
  lifeSupportReason: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  planType: string;
  careManagerId: string | null;
  lifeFormCode: string | null;
  carePlanId: string;
  facilityId: string | null;
  serviceCategory: string;
  serviceTypeCode: string;
  serviceManagerId: string | null;
  supportGoal: string | null;
  dailyLifeGoal: string | null;
  serviceContent: string | null;
  precautions: string | null;
  kyotakuPlanRef: string | null;
  hinkaiShintai02: boolean;
  hinkaiBasis: string | null;
  clientConsentAt: string | null;
  familyConsentAt: string | null;
  deliveredAt: string | null;
  memo: string | null;
  extraData: Record<string, unknown>;
  detailId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  serviceKind: string;
  standardMinutes: number;
  bodyCareMinutes: number | null;
  lifeSupportMinutes: number | null;
  twoHelpers: boolean;
  sortOrder: number;
  /** 週間パターン(get のみ) */
  patterns: Record<string, unknown> | null;
  detailsId: string | null;
};
/** 週間サービスパターン（1:N）*/
export type HomecarePattern = {
  id: string;
  organizationId: string;
  detailId: string;
  clientId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  serviceKind: string;
  standardMinutes: number;
  bodyCareMinutes: number | null;
  lifeSupportMinutes: number | null;
  twoHelpers: boolean;
  serviceContent: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
export type ListHomecarePlansQuery = { clientId?: string; status?: string; q?: string; limit?: number; offset?: number };
export type CreateHomecarePlanInput = {
  clientId: string;
  source?: "internal" | "external";
  careManagerName?: string;
  careManagerOffice?: string;
  assessmentId?: string;
  certificationId?: string;
  clientWishes?: string;
  familyWishes?: string;
  overallPolicy?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  facilityId?: string;
  serviceCategory?: string;
  serviceTypeCode?: string;
  serviceManagerId?: string;
  supportGoal?: string;
  dailyLifeGoal?: string;
  serviceContent?: string;
  precautions?: string;
  kyotakuPlanRef?: string;
  hinkaiShintai02?: boolean;
  hinkaiBasis?: string;
  clientConsentAt?: string;
  familyConsentAt?: string;
  deliveredAt?: string;
  memo?: string;
  renkei?: Record<string, unknown>;
  patterns?: HomecarePattern[];
};
export type UpdateHomecarePlanInput = Partial<Omit<CreateHomecarePlanInput, "clientId" | "patterns">>;
export type HomecarePlanStatus = string;
export type ReplaceHomecarePatternsInput = { patterns: HomecarePattern[] };

export type EquipmentCatalogItem = {
  id: string;
  organizationId: string;
  productCode: string;
  codeKind: string;
  itemCategory: number;
  /** 名称 */
  name: string;
  /** 製造元 */
  manufacturer: string | null;
  /** 型番 */
  model: string | null;
  isSelectableItem: boolean;
  isDeleted: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  catalogItemId: string;
  facilityId: string;
  monthlyPriceYen: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
};
export type CreateEquipmentCatalogItemInput = {
  productCode: string;
  codeKind: string;
  itemCategory: number;
  name: string;
  manufacturer?: string;
  model?: string;
  isSelectableItem?: boolean;
  notes?: string;
};
export type UpdateEquipmentCatalogItemInput = Partial<CreateEquipmentCatalogItemInput>;
export type EquipmentCatalogPrice = {
  id: string;
  organizationId: string;
  catalogItemId: string;
  facilityId: string;
  monthlyPriceYen: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateEquipmentCatalogPriceInput = {
  facilityId: string;
  monthlyPriceYen: number;
  effectiveFrom: string;
  effectiveUntil?: string;
};
export type UpdateEquipmentCatalogPriceInput = Partial<Omit<CreateEquipmentCatalogPriceInput, "facilityId">>;
export type EquipmentRentalContract = {
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string;
  serviceCategory: string;
  serviceTypeCode: string;
  catalogItemId: string;
  productCode: string;
  productName: string;
  itemCategory: number;
  startDate: string;
  endDate: string | null;
  monthlyPriceYen: number;
  supersedesId: string | null;
  isSelectableRental: boolean;
  /** 状態 */
  status: string;
  notes: string | null;
  extraData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
export type CreateEquipmentRentalContractInput = {
  clientId: string;
  facilityId: string;
  catalogItemId: string;
  serviceCategory?: string;
  serviceTypeCode?: string;
  productCode?: string;
  productName?: string;
  itemCategory?: number;
  monthlyPriceYen?: number;
  startDate: string;
  endDate?: string;
  isSelectableRental?: boolean;
  notes?: string;
};
export type UpdateEquipmentRentalContractInput = {
  serviceCategory?: string;
  serviceTypeCode?: string;
  endDate?: string | null;
  isSelectableRental?: boolean;
  status?: string;
  notes?: string | null;
};
export type SupersedeEquipmentRentalContractInput = {
  startDate: string;
  catalogItemId?: string;
  productCode?: string;
  productName?: string;
  itemCategory?: number;
  monthlyPriceYen?: number;
  isSelectableRental?: boolean;
  notes?: string;
};
export type EquipmentExceptionApproval = {
  id: string;
  organizationId: string;
  clientId: string;
  itemCategory: number;
  appliesFrom: string;
  appliesUntil: string | null;
  doctorOpinionAt: string | null;
  municipalityConfirmedAt: string | null;
  evidence: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateEquipmentExceptionApprovalInput = {
  clientId: string;
  itemCategory: number;
  appliesFrom: string;
  appliesUntil?: string;
  doctorOpinionAt?: string;
  municipalityConfirmedAt?: string;
  evidence?: Record<string, unknown>;
  notes?: string;
};
export type UpdateEquipmentExceptionApprovalInput = Partial<Omit<CreateEquipmentExceptionApprovalInput, "clientId">>;
export type EquipmentPlan = {
  id: string;
  organizationId: string;
  clientId: string;
  source: string;
  /** 状態 */
  status: string;
  version: number;
  careManagerName: string | null;
  careManagerOffice: string | null;
  createdByUserId: string | null;
  assessmentId: string | null;
  certificationId: string | null;
  clientWishes: string | null;
  familyWishes: string | null;
  overallPolicy: string | null;
  lifeSupportReason: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  planType: string;
  careManagerId: string | null;
  lifeFormCode: string | null;
  carePlanId: string;
  facilityId: string | null;
  serviceCategory: string;
  serviceTypeCode: string;
  consultantId: string | null;
  usageGoal: string | null;
  kyotakuPlanAlignment: string | null;
  clientConsentAt: string | null;
  familyConsentAt: string | null;
  deliveredAt: string | null;
  cmDeliveredAt: string | null;
  memo: string | null;
  extraData: Record<string, unknown>;
  detailId: string;
  itemServiceCode: string;
  catalogItemId: string | null;
  productCode: string | null;
  productName: string | null;
  selectionReason: string | null;
  isSelectableItem: boolean;
  sortOrder: number;
  /** 機種明細(get のみ) */
  items: Record<string, unknown> | null;
  detailsId: string | null;
};
export type EquipmentPlanItem = {
  id: string;
  organizationId: string;
  detailId: string;
  clientId: string;
  itemServiceCode: string;
  catalogItemId: string | null;
  productCode: string | null;
  productName: string | null;
  selectionReason: string | null;
  isSelectableItem: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
export type CreateEquipmentPlanInput = {
  clientId: string;
  source?: "internal" | "external";
  careManagerName?: string;
  careManagerOffice?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  facilityId?: string;
  serviceCategory?: string;
  serviceTypeCode?: string;
  consultantId?: string;
  usageGoal?: string;
  kyotakuPlanAlignment?: string;
  clientConsentAt?: string;
  familyConsentAt?: string;
  deliveredAt?: string;
  cmDeliveredAt?: string;
  memo?: string;
  items?: EquipmentPlanItem[];
};
export type UpdateEquipmentPlanInput = Partial<Omit<CreateEquipmentPlanInput, "clientId" | "items">>;
export type ReplaceEquipmentPlanItemsInput = { items: EquipmentPlanItem[] };
export type EquipmentMonitoring = {
  id: string;
  organizationId: string;
  clientId: string;
  detailId: string;
  monitoredOn: string;
  monitoringKind: string;
  itemFindings: Record<string, unknown>;
  goalAchievement: string | null;
  /** 判定 */
  decision: string | null;
  reportedToCmAt: string | null;
  consultantId: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateEquipmentMonitoringInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facilityId?: string;
  clientId: string;
  detailId: string;
  monitoredOn: string;
  monitoringKind: string;
  itemFindings?: Record<string, unknown>[];
  goalAchievement?: string;
  decision?: string;
  reportedToCmAt?: string;
  consultantId?: string;
  memo?: string;
};
export type UpdateEquipmentMonitoringInput = Partial<Omit<CreateEquipmentMonitoringInput, "clientId" | "detailId" | "facilityId">>;
export type ListEquipmentQuery = { clientId?: string; facilityId?: string; status?: string; category?: number; q?: string; asOf?: string; detailId?: string; includeDeleted?: boolean; limit?: number; offset?: number };

export type NursingPlan = {
  id: string;
  organizationId: string;
  clientId: string;
  source: string;
  /** 状態 */
  status: string;
  version: number;
  careManagerName: string | null;
  careManagerOffice: string | null;
  createdByUserId: string | null;
  assessmentId: string | null;
  certificationId: string | null;
  clientWishes: string | null;
  familyWishes: string | null;
  overallPolicy: string | null;
  lifeSupportReason: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  planType: string;
  careManagerId: string | null;
  lifeFormCode: string | null;
  carePlanId: string;
  facilityId: string | null;
  serviceCategory: string;
  serviceTypeCode: string | null;
  medicalInstitutionId: string | null;
  doctorName: string | null;
  doctorInstructionId: string | null;
  nursingGoal: string | null;
  serviceContent: Record<string, unknown>;
  hygieneMaterials: string | null;
  ptJointType: string;
  authorNurseId: string | null;
  clientConsentAt: string | null;
  familyConsentAt: string | null;
  deliveredAt: string | null;
  submittedToDoctorAt: string | null;
  memo: string | null;
  extraData: Record<string, unknown>;
  detailsId: string | null;
};
export type CreateNursingPlanInput = {
  clientId: string;
  source?: "internal" | "external";
  careManagerName?: string;
  careManagerOffice?: string;
  assessmentId?: string;
  certificationId?: string;
  clientWishes?: string;
  familyWishes?: string;
  overallPolicy?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  facilityId?: string;
  serviceCategory?: string;
  serviceTypeCode?: string;
  medicalInstitutionId?: string;
  doctorName?: string;
  doctorInstructionId?: string;
  nursingGoal?: string;
  serviceContent?: Record<string, unknown>[];
  hygieneMaterials?: string;
  ptJointType?: string;
  authorNurseId?: string;
  clientConsentAt?: string;
  familyConsentAt?: string;
  deliveredAt?: string;
  submittedToDoctorAt?: string;
  memo?: string;
};
export type UpdateNursingPlanInput = Partial<Omit<CreateNursingPlanInput, "clientId">> & { expectedUpdatedAt?: string };
export type NursingReport = {
  /** 下書きの材料・詳細・発行時の通知（保存する本文には含めない） */
  warnings?: import("@qaito/schemas/special-instructions").NursingReportWarnings;
  /** その月にリハ職の実施済みの訪問があるか（詳細の読みだけ・別添のタブを出すか） */
  hasRehabVisits?: boolean;
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string | null;
  carePlanId: string | null;
  reportMonth: string;
  medicalInstitutionId: string | null;
  doctorName: string | null;
  dayMarks: Record<string, unknown>;
  conditionProgress: string | null;
  nursingContent: string | null;
  homeCareStatus: string | null;
  hygieneMaterialsUsage: string | null;
  /** 状態 */
  status: string;
  issuedAt: string | null;
  /** 確認済みにした時刻 */
  reviewedAt: string | null;
  /** 主治医あて送付済みの時刻 */
  doctorSentAt: string | null;
  /** ケアマネあて送付済みの時刻 */
  careManagerSentAt: string | null;
  /** 版の番号 */
  revision: number;
  authorNurseId: string | null;
  memo: string | null;
  /** printDetails / rehabDetail（別添・リハ職）/ aiFields（欄 → "ai" | "manual"）を持つ */
  extraData: Record<string, unknown>;
  /** 旧: この報告書で AI の文案を作れた回数。下書きの作成・作り直しの数は今は数えていない（列は次のリリースで消す） */
  aiRuns: number;
  createdAt: string;
  updatedAt: string;
};
/**
 * 下書きの作成・AI の文案の作り直しの結果。`aiFailed` = AI の文案を作れなかった欄がある。
 * `aiFailedReason: "quota"` = AI の利用上限（法人のトークン管理）で文案を作れなかった
 */
export type NursingReportWithAiStatus = {
  warnings: import("@qaito/schemas/special-instructions").NursingReportWarnings;
  report: NursingReport;
  aiFailed: boolean;
  aiFailedReason?: "quota";
};
export type CreateNursingReportFromSourcesInput = import("@qaito/schemas/api/nursing-plan").CreateNursingReportFromSourcesApi;
export type MarkNursingReportSentInput = import("@qaito/schemas/api/nursing-plan").MarkNursingReportSentApi;
export type CreateNursingReportInput = {
  clientId: string;
  facilityId?: string;
  carePlanId?: string;
  reportMonth: string;
  medicalInstitutionId?: string;
  doctorName?: string;
  dayMarks?: Record<string, unknown>;
  conditionProgress?: string;
  nursingContent?: string;
  homeCareStatus?: string;
  hygieneMaterialsUsage?: string;
  authorNurseId?: string;
  memo?: string;
};
export type UpdateNursingReportInput = Partial<Omit<CreateNursingReportInput, "clientId" | "reportMonth">>;
export type NursingIntakeRecord = {
  status: "draft" | "final";
  finalizedAt: string | null;
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string | null;
  firstVisitDate: string | null;
  baselineSnapshot: Record<string, unknown>;
  authorNurseId: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateNursingIntakeInput = import("@qaito/schemas/api/nursing-plan").CreateNursingIntakeApi;
export type UpdateNursingIntakeInput = Partial<Omit<CreateNursingIntakeInput, "clientId">>;
export type ListNursingPlansQuery = { clientId?: string; status?: string; q?: string; month?: string; limit?: number; offset?: number };

export type RehabPlan = {
  id: string;
  organizationId: string;
  clientId: string;
  source: string;
  /** 状態 */
  status: string;
  version: number;
  careManagerName: string | null;
  careManagerOffice: string | null;
  createdByUserId: string | null;
  assessmentId: string | null;
  certificationId: string | null;
  clientWishes: string | null;
  familyWishes: string | null;
  overallPolicy: string | null;
  lifeSupportReason: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  planType: string;
  careManagerId: string | null;
  lifeFormCode: string | null;
  carePlanId: string | null;
  facilityId: string | null;
  serviceCategory: string;
  serviceTypeCode: string;
  consentDate: string | null;
  initialConsentDate: string | null;
  deliveredAt: string | null;
  prescribingDoctorName: string | null;
  doctorExplained: boolean;
  doctorExplainedAt: string | null;
  healthCondition: string | null;
  goalShortTerm: string | null;
  goalLongTerm: string | null;
  rehabPrograms: Record<string, unknown>;
  standardMinutesPerSession: number | null;
  sessionsPerWeek: number | null;
  continuationReason: string | null;
  endTarget: string | null;
  externalDoctorInfoBased: boolean;
  externalDoctorNote: string | null;
  lifeLinkedAt: string | null;
  memo: string | null;
  extraData: Record<string, unknown>;
  heldOn: string;
  attendees: Record<string, unknown>;
  doctorAttendance: string;
  summary: string | null;
  absenteeSharedAt: string | null;
  assessedOn: string;
  assessmentKind: string;
  achievement: string | null;
  findings: string | null;
  assessorId: string | null;
  /** リハ会議(get) */
  conferences: Record<string, unknown> | null;
  /** 経時評価(get) */
  assessments: Record<string, unknown> | null;
  /** 医師指示(get) */
  doctorInstructions: Record<string, unknown> | null;
  detailsId: string | null;
};
export type CreateRehabPlanInput = {
  clientId: string;
  source?: "internal" | "external";
  careManagerName?: string;
  careManagerOffice?: string;
  assessmentId?: string;
  certificationId?: string;
  clientWishes?: string;
  familyWishes?: string;
  overallPolicy?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  facilityId?: string;
  serviceCategory?: string;
  serviceTypeCode: string;
  consentDate?: string;
  initialConsentDate?: string;
  deliveredAt?: string;
  prescribingDoctorName?: string;
  doctorExplained?: boolean;
  doctorExplainedAt?: string;
  healthCondition?: string;
  goalShortTerm?: string;
  goalLongTerm?: string;
  rehabPrograms?: Record<string, unknown>[];
  standardMinutesPerSession?: number;
  sessionsPerWeek?: number;
  continuationReason?: string;
  endTarget?: string;
  externalDoctorInfoBased?: boolean;
  externalDoctorNote?: string;
  memo?: string;
};
export type UpdateRehabPlanInput = Partial<Omit<CreateRehabPlanInput, "clientId" | "serviceTypeCode">>;
export type RehabConference = {
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string | null;
  carePlanId: string | null;
  heldOn: string;
  attendees: Record<string, unknown>;
  doctorAttendance: string;
  summary: string | null;
  absenteeSharedAt: string | null;
  memo: string | null;
  extraData: Record<string, unknown>;
  deletedAt: string | null;
  retentionBaseDate: string | null;
  retentionYears: number;
  createdAt: string;
  updatedAt: string;
};
export type CreateRehabConferenceInput = {
  heldOn: string;
  doctorAttendance: string;
  attendees?: string[];
  summary?: string;
  absenteeSharedAt?: string | null;
  facilityId?: string;
  memo?: string;
};
export type UpdateRehabConferenceInput = Partial<CreateRehabConferenceInput>;
export type RehabAssessment = {
  id: string;
  organizationId: string;
  carePlanId: string;
  clientId: string;
  assessedOn: string;
  assessmentKind: string;
  achievement: string | null;
  findings: string | null;
  assessorId: string | null;
  memo: string | null;
  extraData: Record<string, unknown>;
  deletedAt: string | null;
  retentionBaseDate: string | null;
  retentionYears: number;
  createdAt: string;
  updatedAt: string;
};
export type CreateRehabAssessmentInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facilityId?: string;
  assessedOn: string;
  assessmentKind: string;
  achievement?: string;
  findings?: string;
  assessorId?: string | null;
  memo?: string;
};
export type UpdateRehabAssessmentInput = Partial<Omit<CreateRehabAssessmentInput, "facilityId">>;
export type RehabDoctorInstruction = {
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string | null;
  carePlanId: string | null;
  examinationEventId: string | null;
  instructedOn: string;
  doctorName: string;
  instructionKinds: Record<string, unknown>;
  body: string | null;
  recordedInChart: boolean;
  memo: string | null;
  deletedAt: string | null;
  retentionBaseDate: string | null;
  retentionYears: number;
  createdAt: string;
  updatedAt: string;
};
export type CreateRehabDoctorInstructionInput = {
  instructedOn: string;
  doctorName: string;
  instructionKinds: string[];
  examinationEventId?: string | null;
  body?: string | null;
  recordedInChart?: boolean;
  memo?: string | null;
};
export type UpdateRehabDoctorInstructionInput = Partial<CreateRehabDoctorInstructionInput>;
export type ListRehabPlansQuery = { clientId?: string; status?: string; serviceTypeCode?: string; q?: string; limit?: number; offset?: number };

export type ClinicalDoctorInstruction = {
  id: string;
  organizationId: string;
  clientId: string;
  instructionType: string;
  documentStatus: string;
  issuingInstitutionId: string | null;
  issuingDoctorName: string | null;
  issueDate: string | null;
  validFrom: string | null;
  validUntil: string | null;
  contentSummary: string | null;
  formData: Record<string, unknown> | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalConditionPeriod = {
  id: string;
  organizationId: string;
  clientId: string;
  /** 区分 */
  category: string;
  conditionCode: string;
  conditionLabel: string;
  validFrom: string;
  validUntil: string | null;
  basisDiagnosisId: string | null;
  basisNote: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalDiagnosis = {
  id: string;
  organizationId: string;
  clientId: string;
  diseaseCode: string | null;
  diseaseName: string;
  icd10Code: string | null;
  /** 修飾語コード（支払基金の修飾語マスターの 4 桁・傷病名の前後に付ける順）。名前（diseaseName）は書き換えない */
  modifierCodes: string[];
  isPrimary: boolean;
  isPsychiatric: boolean;
  onsetDate: string | null;
  /** 転帰 */
  outcome: string | null;
  endDate: string | null;
  /** 診てもらっている通院先（同じ利用者の client_medical の行 ID）。未設定は null */
  clientMedicalId: string | null;
  /** コードと修飾語からマスター（有効な版）で引いた名前（例: 悪性リンパ腫の疑い）。コードが無い・未コード化・マスターに無いときは null。画面・帳票はこちらを出し、記録の名前と違うときだけ記録の名前を小さく添える */
  masterName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalHospitalization = {
  id: string;
  organizationId: string;
  clientId: string;
  episodeKind: string;
  institutionId: string | null;
  institutionNameSnapshot: string | null;
  admissionDate: string;
  dischargeDate: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalRenkeiEvent = {
  id: string;
  organizationId: string;
  clientId: string;
  serviceCategory: string;
  serviceTypeCode: string;
  eventType: string;
  eventDate: string;
  eventTime: string | null;
  institutionId: string | null;
  hospitalizationEpisodeId: string | null;
  /** 手段 */
  method: string | null;
  /** 相手方 */
  counterpart: string | null;
  participants: Record<string, unknown> | null;
  body: string | null;
  extraData: Record<string, unknown> | null;
  recordedBy: string | null;
  /** 確定した時刻（訪問看護の退院時共同指導。null = 下書き） */
  confirmedAt: string | null;
  /** 確定した人 */
  confirmedBy: string | null;
  /** 確定した人の名前（一覧だけが返す） */
  confirmedByName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalDoctorExam = {
  id: string;
  organizationId: string;
  clientId: string;
  serviceCategory: string;
  serviceTypeCode: string;
  examinationDate: string;
  doctorKind: string;
  doctorName: string | null;
  institutionId: string | null;
  infoProvidedDate: string | null;
  doctorTrainingCompleted: boolean | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};
/** 看護経過記録の種別（event = 事象 / treatment = 処置 / plan = 方針） */
export type NursingProgressKind = "event" | "treatment" | "plan";

/** 看護経過記録 1 行（通所の看護経過ボード）。本文は要配慮の医療情報 */
export type ClinicalNursingProgress = {
  id: string;
  organizationId: string;
  facilityId: string;
  clientId: string;
  /** YYYY-MM-DD */
  serviceDate: string;
  /** 発生時刻（ISO 8601） */
  occurredAt: string;
  kind: NursingProgressKind;
  body: string;
  authorUserId: string | null;
  authorName: string | null;
  /** 付けた写真（日常の記録の写真の ID） */
  photoMediaLogIds: string[];
  contactReflectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** GET /clinical-record/nursing-progress/day 要素（利用者の表示名つき。client:read が無ければ「非公開」） */
export type DayNursingProgress = {
  id: string;
  clientId: string;
  facilityId: string;
  serviceDate: string;
  occurredAt: string;
  kind: NursingProgressKind;
  body: string;
  authorUserId: string | null;
  authorName: string | null;
  mine: boolean;
  clientName: string;
  /** 付けた写真（日常の記録の写真の ID） */
  photoMediaLogIds: string[];
  contactReflectedAt: string | null;
};

export type CreateNursingProgressInput = {
  facilityId: string;
  serviceDate: string;
  /** ISO 8601。省くと記録した時刻 */
  occurredAt?: string;
  kind: NursingProgressKind;
  /** 最大 4000 文字 */
  body: string;
  /** 写真（日常の記録の写真の ID・最大 4 枚。同じ利用者・事業所の撮影済みの写真だけ） */
  photoMediaLogIds?: string[];
};
export type UpdateNursingProgressInput = Partial<Omit<CreateNursingProgressInput, "facilityId">> & {
  contactReflected?: boolean;
};
export type ListDayNursingProgressQuery = { facilityId: string; date: string };

/** 看護経過表の 1 件（看護経過そのもの。利用者名は持たない） */
export type NursingChartEntry = Omit<DayNursingProgress, "clientName">;
export type NursingChartVital = {
  serviceDate: string;
  recordedAt: string;
  tempCelsius: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  pulse: number | null;
  spo2: number | null;
  bloodGlucose: number | null;
  bloodGlucoseTiming: "fasting" | "before_meal" | "after_meal" | "random" | null;
};
export type NursingChartDay = {
  /** YYYY-MM-DD */
  date: string;
  events: NursingChartEntry[];
  treatments: NursingChartEntry[];
  plans: NursingChartEntry[];
  photoMediaLogIds: string[];
  vitals: NursingChartVital[];
  /** 実績の Ns 処置（印と今までのメモ） */
  nsProcedure: { nsProcedure: boolean; note: string | null } | null;
};
/** 1 利用者の看護経過表（GET /clinical-record/clients/:clientId/nursing-chart） */
export type NursingChart = {
  from: string;
  to: string;
  /** 記録のある日だけ（新しい順） */
  days: NursingChartDay[];
  /** from より前の直近の処置（前回の処置） */
  lastTreatment: NursingChartEntry | null;
  canVitals: boolean;
  canNsProcedure: boolean;
};
export type NursingChartQuery = { from?: string; to?: string };
export type ClinicalRecordListQuery = { from?: string; to?: string; limit?: number };

export type VitalRecheckThresholds = {
  clientId: string;
  tempCelsiusHigh: number | null;
  bpSystolicHigh: number | null;
  bpSystolicLow: number | null;
  bpDiastolicHigh: number | null;
  pulseHigh: number | null;
  pulseLow: number | null;
  spo2Low: number | null;
  note: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

/** 再検査の基準を設定する入力。送った項目だけ変わる（null でその項目は全体の基準） */
export type SetVitalRecheckThresholdsInput = {
  tempCelsiusHigh?: number | null;
  bpSystolicHigh?: number | null;
  bpSystolicLow?: number | null;
  bpDiastolicHigh?: number | null;
  pulseHigh?: number | null;
  pulseLow?: number | null;
  spo2Low?: number | null;
  note?: string | null;
};

/** 再検査の判定の入力（POST /care-record/vitals/recheck-judgement）。最大 200 件 */
export type JudgeVitalRecheckInput = {
  items: {
    clientId: string;
    tempCelsius?: number | string | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    pulse?: number | null;
    spo2?: number | null;
  }[];
};

/** 再検査の判定の結果。基準の値は含まない（個別の基準で外れた項目の文言は数値を出さない） */
export type VitalRecheckJudgement = {
  clientId: string;
  individual: boolean;
  abnormal: boolean;
  reasons: string[];
  /** 基準を外れた項目の名前（tempCelsius / bpSystolic / bpDiastolic / pulse / spo2。値は含まない） */
  items: ("tempCelsius" | "bpSystolic" | "bpDiastolic" | "pulse" | "spo2")[];
};
export type CreateDoctorInstructionInput = {
  instructionType: string;
  documentStatus?: string;
  issuingInstitutionId?: string | null;
  issuingDoctorName?: string | null;
  issueDate?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  contentSummary?: string | null;
  formData?: Record<string, unknown> | null;
  memo?: string | null;
  sourceStagedIds?: string[];
  diagnosisNames?: string[];
  /** 名前・コード・ICD-10・修飾語つきの傷病名（`diagnosisNames` は名前だけ。同じ名前は `diagnoses` を使う） */
  diagnoses?: InstructionDiagnosisInput[];
};
/** 更新でも `diagnoses`（足す傷病名）を受ける。モジュールが指示書の更新と同じ流れで傷病名を作る（同じ名前の今の傷病名があれば作らない） */
export type UpdateDoctorInstructionInput = Partial<Omit<CreateDoctorInstructionInput, "sourceStagedIds" | "diagnosisNames">>;
export type ClinicalDocumentOcrInput = import("@qaito/schemas/clinical-document-ocr").ClinicalDocumentOcrInput;
/** 読み取った項目（項目名 → 値。読めなかった項目は null） */
export type ClinicalDocumentOcrFields = Record<string, string | null>;
export type ClinicalDocumentOcrResult = {
  kind: "nursing_instruction" | "special_instruction" | "discharge_guidance" | "unknown" | "other";
  fields: ClinicalDocumentOcrFields;
  missing: string[];
  /** 指示書の様式の欄（様式16・18。読めた欄だけ。○の選択には要確認の印 `ocr`） */
  form?: Record<string, unknown>;
};
export type ClinicalSourceDocumentPage = { id: string; page: number; mimeType: string };
export type ClinicalSourceDocumentLink = { id: string; page: number; mimeType: string; url: string };
export type CreateConditionPeriodInput = {
  category: string;
  conditionCode: string;
  conditionLabel: string;
  validFrom: string;
  validUntil?: string | null;
  basisDiagnosisId?: string | null;
  basisNote?: string | null;
};
export type UpdateConditionPeriodInput = Partial<CreateConditionPeriodInput>;
export type CreateDiagnosisInput = {
  diseaseCode?: string | null;
  diseaseName: string;
  icd10Code?: string | null;
  /** 修飾語コード（4 桁・5 件まで）。省略は付けない（更新で省略すると今の値のまま） */
  modifierCodes?: string[];
  isPrimary?: boolean;
  isPsychiatric?: boolean;
  onsetDate?: string | null;
  outcome?: string | null;
  endDate?: string | null;
};
export type UpdateDiagnosisInput = Partial<CreateDiagnosisInput>;
export type CreateHospitalizationInput = {
  episodeKind: string;
  institutionId?: string | null;
  institutionNameSnapshot?: string | null;
  admissionDate: string;
  dischargeDate?: string | null;
  memo?: string | null;
};
export type UpdateHospitalizationInput = Partial<CreateHospitalizationInput>;
export type CreateRenkeiEventInput = {
  /** 作る記録の事業所（省けば作業中の事業所 → 利用者の今の事業所）。作ったあとは変えられない */
  facilityId?: string;
  serviceCategory?: string;
  serviceTypeCode: string;
  eventType: string;
  eventDate: string;
  eventTime?: string | null;
  institutionId?: string | null;
  hospitalizationEpisodeId?: string | null;
  method?: string | null;
  counterpart?: string | null;
  participants?: Record<string, unknown> | null;
  body?: string | null;
  extraData?: Record<string, unknown> | null;
};
export type UpdateRenkeiEventInput = Partial<Omit<CreateRenkeiEventInput, "facilityId">>;
/** 退院時共同指導を 1 回で保存する口の入力（`POST /clinical-record/renkei-events/clients/:clientId/discharge-guidance`） */
export type SaveDischargeGuidanceInput = import("@qaito/schemas/save-discharge-guidance").SaveDischargeGuidanceInput;
/** 退院時共同指導の 1 回の保存の結果。`confirm` で確定に足りなければ `confirmed: false` と足りない項目（下書きは保存済み） */
export type SaveDischargeGuidanceResult = {
  /** 保存した記録（医療連携イベント）の ID */
  id: string;
  /** 記録にひも付けた入退院（新しく作ったものを含む） */
  hospitalizationEpisodeId: string | null;
  /** 確定まで進んだか */
  confirmed: boolean;
  /** 確定に足りない項目（`confirm` で確定できなかったとき） */
  missing?: string[];
  /** 保存した（確定したなら確定後の）記録 */
  record: ClinicalRenkeiEvent;
};
export type CreateDoctorExamInput = {
  serviceCategory?: string;
  serviceTypeCode: string;
  examinationDate: string;
  doctorKind: string;
  doctorName?: string | null;
  institutionId?: string | null;
  infoProvidedDate?: string | null;
  doctorTrainingCompleted?: boolean | null;
  memo?: string | null;
};
export type UpdateDoctorExamInput = Partial<CreateDoctorExamInput>;

export type LifeFormDef = {
  id: string;
  organizationId: string | null;
  formCode: string;
  dataTypePhysicalName: string;
  formName: string;
  specVersion: string;
  parentFormCode: string | null;
  requiresDetailNumber: boolean;
  targetServiceTypeCodes: string[];
  submissionTrigger: string;
  cycleMonths: number | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
export type LifeSubmissionBatch = {
  id: string;
  organizationId: string;
  facilityId: string;
  targetMonth: string;
  /** 状態 */
  status: string;
  generatedAt: string | null;
  downloadedAt: string | null;
  submittedAt: string | null;
  resultRecordedAt: string | null;
  generatedBy: string | null;
  specVersion: string;
  memo: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateLifeBatchInput = { facilityId: string; targetMonth: string; memo?: string };
export type UpdateLifeBatchInput = { memo?: string | null };
export type TransitionLifeBatchStatusInput = { status: string };
export type GenerateLifeBatchInput = { formCodes?: string[] };
export type LifeSubmissionObligation = {
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string;
  additionKind: string;
  formCode: string | null;
  obligationMonth: string;
  dueDate: string | null;
  triggerKind: string;
  /** 状態 */
  status: string;
  lifeSubmissionId: string | null;
  missedAt: string | null;
  missedReportedAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateLifeObligationInput = {
  clientId: string;
  facilityId: string;
  additionKind: string;
  formCode?: string;
  obligationMonth: string;
  dueDate?: string;
  triggerKind?: string;
  memo?: string;
};
export type UpdateLifeObligationInput = {
  status?: string;
  formCode?: string | null;
  dueDate?: string | null;
  triggerKind?: string;
  lifeSubmissionId?: string | null;
  missedAt?: string | null;
  missedReportedAt?: string | null;
  memo?: string | null;
};
export type ListLifeBatchesQuery = { facilityId?: string; targetMonth?: string; status?: string; includeDeleted?: boolean; limit?: number; offset?: number };
export type ListLifeObligationsQuery = { clientId?: string; facilityId?: string; additionKind?: string; obligationMonth?: string; status?: string; serviceTypeCode?: string; limit?: number; offset?: number };

export type CareplanLinkFile = {
  id: string;
  organizationId: string;
  /** 連携方向 */
  direction: string;
  fileKind: string;
  fileName: string | null;
  sequenceNo: number | null;
  csvVersion: string | null;
  partnerOfficeNumber: string | null;
  serviceTypeCode: string | null;
  targetMonth: string | null;
  rawBytes: string | null;
  sha256: string | null;
  parsedPayload: Record<string, unknown> | null;
  rowCount: number | null;
  /** 状態 */
  status: string;
  errorDetails: Record<string, unknown> | null;
  processedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ListCareplanLinkFilesQuery = { direction?: string; status?: string; partnerOfficeNumber?: string; targetMonth?: string; limit?: number; offset?: number };
/** GET /careplan-link/service-offices — 第6/7表に載せるサービス提供事業所（他社は facilityId = null） */
export type CareplanLinkServiceOffice = {
  id: string;
  officeNumber: string;
  satelliteCode: string | null;
  name: string;
  nameKana: string | null;
  facilityId: string | null;
};
/** POST /careplan-link/service-offices */
export type CreateCareplanLinkServiceOfficeInput = {
  /** 事業所番号（10 桁の数字） */
  officeNumber: string;
  satelliteCode?: string | null;
  name: string;
  nameKana?: string | null;
  /** 自社の事業所として紐づけるときだけ */
  facilityId?: string | null;
};
/** GET /careplan-link/service-offices の絞り込み。`unlinked: "true"` は事業所に結ばれていない行（他社として入っている行）だけ */
export type ListCareplanLinkServiceOfficesQuery = { facilityId?: string; officeNumber?: string; unlinked?: "true" | "false" };
/** POST /careplan-link/service-offices/register-facility（番号と名前は事業所の台帳から取る） */
export type RegisterCareplanLinkFacilityServiceOfficeInput = {
  /** 登録する自社の事業所 */
  facilityId: string;
};
/** POST /careplan-link/service-offices/:id/facility */
export type AttachCareplanLinkServiceOfficeFacilityInput = {
  /** 結ぶ自社の事業所 */
  facilityId: string;
};

/** お知らせ（管理の形。掲示前の予約・期限切れを含む） */
export type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishFrom: string;
  /** null = 期限なし */
  publishUntil: string | null;
  createdAt: string;
  updatedAt: string;
  /** 書いた人の名前。アカウントが消えていれば null */
  createdByName: string | null;
  updatedByName: string | null;
};
/** 掲示中のお知らせ（ポータルのホームが読む形） */
export type PublishedAnnouncement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishFrom: string;
  publishUntil: string | null;
  /** 掲示から 3 日以内 */
  isNew: boolean;
};
export type CreateAnnouncementInput = {
  title: string;
  body: string;
  pinned?: boolean;
  /** 省略 = 今から掲示 */
  publishFrom?: string;
  /** null = 期限なし */
  publishUntil?: string | null;
};
/** 送った項目だけを変える */
export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput>;

/** カレンダーの持ち主の種類（個人のカレンダーだけ） */
export type CalendarOwnerKind = "user";
/** カレンダーの出どころ（いまは `local` だけ） */
export type CalendarSourceKind = "local" | "google";

/** 自分の実効レベル（view < edit < full = 持ち主） */
export type CalendarShareLevel = "view" | "edit" | "full";
/** 共有で渡せるレベル（見る / 編集） */
export type CalendarShareInputLevel = "view" | "edit";
/** 共有先の種類（人だけ） */
export type CalendarShareSubjectKind = "user";
/** カレンダーで自分ができること（画面の出し分け。止めるのは常にサーバー） */
export type CalendarCapabilities = {
  writeEvents: boolean;
  deleteEvents: boolean;
  /** 共有を決められる（持ち主だけ） */
  share: boolean;
};

/** カレンダー（見えるもの。自分の実効レベルとできることつき） */
export type Calendar = {
  id: string;
  ownerKind: CalendarOwnerKind;
  /** 自分の個人のカレンダーか（違えば、だれかに共有されたもの） */
  isMine: boolean;
  /** 個人のカレンダーの持ち主 */
  ownerUserId: string | null;
  name: string;
  color: string | null;
  /** IANA のタイムゾーン */
  timezone: string;
  source: CalendarSourceKind;
  isPrimary: boolean;
  /** 自分の実効レベル */
  level: CalendarShareLevel;
  can: CalendarCapabilities;
  createdAt: string;
  updatedAt: string;
};
/** 自分の実効レベル（`none` = 見えない） */
export type CalendarLevel = "none" | CalendarShareLevel;
/** 共有 1 行（人への共有） */
export type CalendarShare = {
  id: string;
  calendarId: string;
  subjectKind: CalendarShareSubjectKind;
  subjectId: string;
  /** 人の氏名（消えていれば null） */
  subjectName: string | null;
  level: CalendarShareInputLevel;
  createdAt: string;
  updatedAt: string;
};
export type SetCalendarShareInput = {
  subjectKind: CalendarShareSubjectKind;
  subjectId: string;
  level: CalendarShareInputLevel;
};
/** 共有の候補の 1 件 */
export type CalendarShareCandidate = { id: string; name: string };
export type CalendarShareCandidates = {
  users: CalendarShareCandidate[];
};
/** 予定の参加者の役 */
export type CalendarAttendeeRole = "organizer" | "required" | "optional";
/** 出欠 */
export type CalendarAttendeeResponse = "needs_action" | "accepted" | "declined" | "tentative";
/** 予定の参加者 1 人 */
export type CalendarAttendee = {
  id: string;
  eventId: string;
  userId: string;
  /** 職員の氏名（アカウントが消えていれば null） */
  name: string | null;
  role: CalendarAttendeeRole;
  response: CalendarAttendeeResponse;
  respondedAt: string | null;
};
export type SetCalendarAttendeesInput = {
  /** 丸ごと置き換える（同じ人の出欠は残る）。role の省略 = required */
  attendees: { userId: string; role?: CalendarAttendeeRole }[];
};
export type RespondToCalendarInviteInput = { response: "accepted" | "declined" | "tentative" };
/** 自分のリマインダー 1 つ */
export type CalendarReminder = { id: string; eventId: string; minutesBefore: number };
export type SetCalendarRemindersInput = {
  /** 何分前（0〜40320・5 つまで）。空 = なし */
  minutesBefore: number[];
};
/** 空き時間の条件（同じ組織の職員 20 人まで・31 日まで） */
export type FindCalendarFreeTimeParams = {
  userIds: string[];
  /** オフセット付き ISO 8601 */
  from: string;
  to: string;
  /** これより短い空きは返さない（分・既定 30） */
  minMinutes?: number;
};
/** 空き時間の答え（区間だけ・予定の中身は無い） */
export type CalendarFreeTime = {
  busy: { userId: string; intervals: { start: string; end: string }[] }[];
  free: { start: string; end: string }[];
};
/** 予定に招ける職員 */
export type CalendarPerson = { id: string; name: string };
/** 重ね表示の種類（shifts = 自分のシフト / schedules = 利用予定の件数 / visits = 自分が担当の訪問 / oncall = 自分のオンコールの当番） */
export type CalendarOverlayKind = "shifts" | "schedules" | "visits" | "oncall";
/** 重ね表示の条件（JST の日付・両端を含む・62 日まで） */
export type ListCalendarOverlaysParams = {
  from: string;
  to: string;
  /** 省略 = すべて */
  kinds?: CalendarOverlayKind[];
  /** 利用予定を数える事業所（省略 = 認可の範囲すべて） */
  facilityId?: string;
};
/** 重ね表示の自分のシフト 1 コマ（実際 = 予定 + 実績） */
export type CalendarOverlayShift = {
  date: string;
  facilityId: string;
  facilityName: string | null;
  /** work（勤務）/ leave（休み） */
  kind: string;
  shiftCode: string | null;
  startTime: string | null;
  endTime: string | null;
  absent: boolean;
};
/** 重ね表示の利用予定の件数（日 × 事業所。利用者の氏名・ID は無い） */
export type CalendarOverlayScheduleDay = {
  date: string;
  facilityId: string;
  facilityName: string | null;
  /** 予定・出席（取り消し・欠席を除く） */
  count: number;
  absent: number;
};
/** 重ね表示の自分のシフトの欄（available = false は読めないので重ねない） */
export type CalendarOverlayShifts = { available: boolean; items: CalendarOverlayShift[] };
/** 重ね表示の利用予定の欄（available = false は読めないので重ねない） */
export type CalendarOverlaySchedules = { available: boolean; days: CalendarOverlayScheduleDay[] };
/** 重ね表示の自分が担当の訪問 1 件（利用者の ID・氏名・保険の判定は無い） */
export type CalendarOverlayVisit = {
  visitId: string;
  date: string;
  /** 予定の開始・終了（HH:MM）。終了は未定なら null */
  startTime: string;
  endTime: string | null;
  /** 予定の終了が翌日 */
  endsNextDay: boolean;
  visitKind: string;
  serviceTypeCode: string;
  facilityId: string;
  facilityName: string | null;
  /** scheduled / provided（取り消しは入らない） */
  status: string;
  /** primary / second / accompany_saseki / accompany_expert / assistant */
  role: string;
};
/** 重ね表示の担当の訪問の欄（available = false は読めないので重ねない） */
export type CalendarOverlayVisits = { available: boolean; items: CalendarOverlayVisit[] };
/** 重ね表示の自分のオンコールの当番 1 件（開始日の欄に出す） */
export type CalendarOverlayOncall = {
  /** どの日の当番か（開始日・YYYY-MM-DD） */
  date: string;
  facilityId: string;
  facilityName: string | null;
  /** 区間（ISO 8601）。日をまたぐ（18:00〜翌 8:30 など） */
  startsAt: string;
  endsAt: string;
  /** 番手（1 = 1 番手） */
  shiftCode: string;
};
/** 重ね表示の当番の欄（available = false は読めないので重ねない） */
export type CalendarOverlayOncalls = { available: boolean; items: CalendarOverlayOncall[] };
/** 重ね表示（読むだけ） */
export type CalendarOverlays = {
  shifts: CalendarOverlayShifts;
  schedules: CalendarOverlaySchedules;
  visits: CalendarOverlayVisits;
  oncall: CalendarOverlayOncalls;
};
/** 本人の Google カレンダーの連携で重ねているカレンダー 1 つ（Google のカレンダー ID は返さない） */
export type CalendarGoogleLinkedCalendar = {
  id: string;
  name: string;
  color: string | null;
  lastSyncedAt: string | null;
  /** 続けて同期に失敗している */
  failing: boolean;
};
/** 本人の Google カレンダーの連携（status: active / reauth_required = 連携し直しが要る） */
export type CalendarGoogleConnection = {
  id: string;
  status: string;
  connectedAt: string;
  calendars: CalendarGoogleLinkedCalendar[];
};
/** 本人の Google カレンダーの連携の状態（available = false はこの環境では Google との連携をまだ使えない） */
export type CalendarGoogleStatus = {
  available: boolean;
  connection: CalendarGoogleConnection | null;
};
/** 同期した Google の予定 1 件（読むだけ・終日の endDate は含む日・説明は持たない） */
export type CalendarGoogleEvent = {
  id: string;
  /** 重ねている Google のカレンダー（CalendarGoogleLinkedCalendar の id） */
  calendarId: string;
  calendarName: string;
  color: string | null;
  /** 題名（非公開などで無ければ null） */
  title: string | null;
  location: string | null;
  allDay: boolean;
  startsAt: string | null;
  endsAt: string | null;
  startDate: string | null;
  endDate: string | null;
  htmlLink: string | null;
};
/** 同期した Google の予定の期間（JST の日付・両端を含む・92 日まで） */
export type ListCalendarGoogleEventsParams = { from: string; to: string };
/** Google の同意の画面の URL（人がブラウザで開く。戻り先は Qaito の Web） */
export type CalendarGoogleConnectStart = { authorizationUrl: string };
/** 同意の画面からの戻り（state は始めた本人・組織のものだけを 1 回だけ受ける） */
export type CompleteCalendarGoogleConnectInput = { state: string; code: string };
/** 今すぐ同期の受付（取り直しを依頼したカレンダーの数） */
export type CalendarGoogleSyncResult = { queued: number };

/** 繰り返しの予定を変える・消す範囲（この予定だけ / これ以降 / すべて） */
export type CalendarEditScope = "this" | "following" | "all";
/** 繰り返しの予定のどの回か（this / following では occurrenceStart が要る） */
export type CalendarOccurrenceTarget = {
  scope?: CalendarEditScope;
  occurrenceStart?: string;
};
/** 予定。時刻のある予定（startsAt / endsAt）か、終日の予定（startDate / endDate・endDate は含む日）のどちらか */
export type CalendarEvent = {
  id: string;
  /** 元の予定の ID（展開した回でも親の ID） */
  eventId: string;
  calendarId: string;
  /** 回の識別子（ISO 8601）。この回だけを変える・消すときに送り返す */
  occurrenceStart: string;
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  /** 時刻のある予定の開始・終了。終日なら null */
  startsAt: string | null;
  endsAt: string | null;
  /** 終日の予定の開始日・終了日（`YYYY-MM-DD`）。時刻ありなら null */
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  /** 繰り返し（RRULE の一部）。null = 繰り返さない */
  rrule: string | null;
  /** この回が「この予定だけ」で変えられているか */
  modified: boolean;
  /** カレンダーは見えないが、参加者として招かれているので見える予定（中身は変えられない） */
  invited: boolean;
  /** 自分の出欠（参加者でなければ null） */
  myResponse: CalendarAttendeeResponse | null;
  /** 自分がこの予定を変えられるか（詳細 `getEvent` だけが返す。一覧には無い） */
  canEdit?: boolean;
  createdAt: string;
  updatedAt: string;
};
/** 予定の一覧の条件（JST の日付・両端を含む・92 日まで） */
export type ListCalendarEventsParams = {
  from: string;
  to: string;
  calendarId?: string;
};
export type CreateCalendarEventInput = {
  /** 省略 = 自分の個人のカレンダー（無ければ作る） */
  calendarId?: string;
  title: string;
  description?: string | null;
  location?: string | null;
  /** 省略 = false（時刻のある予定） */
  allDay?: boolean;
  /** オフセット付き ISO 8601 */
  startsAt?: string | null;
  endsAt?: string | null;
  /** `YYYY-MM-DD`（endDate は含む日） */
  startDate?: string | null;
  endDate?: string | null;
  /** IANA のタイムゾーン（省略 = Asia/Tokyo） */
  timezone?: string;
  /** 繰り返し（FREQ=DAILY / WEEKLY;BYDAY=… / MONTHLY;BYMONTHDAY=… か BYDAY=2TU、COUNT か UNTIL）。null = 繰り返さない */
  rrule?: string | null;
};
/** 送った項目だけを変える（カレンダーの付け替えはしない）。繰り返しの予定は scope と occurrenceStart で範囲を選ぶ */
export type UpdateCalendarEventInput = Partial<Omit<CreateCalendarEventInput, "calendarId">> & CalendarOccurrenceTarget;

export type LibraryArea = import("@qaito/schemas/library").LibraryArea;
export type LibraryNodeKind = import("@qaito/schemas/library").LibraryNodeKind;
export type LibraryVisibility = import("@qaito/schemas/library").LibraryVisibility;
export type LibraryMemberLevel = import("@qaito/schemas/library").LibraryMemberLevel;
/** 本文の形式。`blocks` は Notion の形のブロック（`body` は `LibraryBlocksBody` の JSON の文字列）。新しいページの既定は `blocks` */
export type LibraryPageFormat = import("@qaito/schemas/library").LibraryPageFormat;
export type LibraryBlocksBody = import("@qaito/schemas/library").LibraryBlocksBody;

/** 中に入れるノード（本文は含めない） */
export type LibraryNode = import("@qaito/schemas/library").LibraryNode;
/** 本文つきのノード */
export type LibraryNodeWithBody = import("@qaito/schemas/library").LibraryNodeWithBody;
/** 1 つ開いたときのノード（本文・できること・非公開の根の名前・見せる人の数） */
export type LibraryNodeView = import("@qaito/schemas/library").LibraryNodeView;
export type LibraryNodeSaved = import("@qaito/schemas/library").LibraryNodeSaved;
export type LibraryDesignReport = import("@qaito/schemas/library").LibraryDesignReport;
export type LibraryDesignReportItem = import("@qaito/schemas/library").LibraryDesignReportItem;
export type LibraryDesignPreview = import("@qaito/schemas/library").LibraryDesignPreview;
/** 名前だけ見える非公開の根（中は読めない） */
export type LibraryOutlineNode = import("@qaito/schemas/library").OutlineNode;
/** 置き場の木（入れるノードと、名前だけのノード） */
export type LibraryTree = import("@qaito/schemas/library").LibraryTree;
export type LibrarySearchHit = import("@qaito/schemas/library").LibrarySearchHit;
export type LibraryVisibilityPreview = import("@qaito/schemas/library").LibraryVisibilityPreview;
export type LibraryNames = import("@qaito/schemas/library").LibraryNames;
export type LibraryNameEntry = import("@qaito/schemas/library").LibraryNameEntry;

export type GetLibraryTreeQuery = import("@qaito/schemas/library").GetLibraryTreeInput;
/** `limit` は 1〜50（既定 20） */
export type SearchLibraryNodesQuery = { q: string; area?: LibraryArea; facilityId?: string; limit?: number };
export type CreateLibraryNodeInput = import("@qaito/schemas/library").CreateLibraryNodeInput;
export type UpdateLibraryNodeInput = import("@qaito/schemas/library").UpdateLibraryNodeInput;
export type SaveLibraryBodyInput = import("@qaito/schemas/library").SaveLibraryBodyInput;
export type EditLibraryDesignInput = import("@qaito/schemas/library").EditLibraryDesignInput;
export type StepLibraryVersionInput = import("@qaito/schemas/library").StepLibraryVersionInput;
export type PreviewLibraryDesignInput = import("@qaito/schemas/library").PreviewLibraryDesignInput;
export type GetLibraryNodeQuery = import("@qaito/schemas/library").GetLibraryNodeQuery;
export type MoveLibraryNodeInput = import("@qaito/schemas/library").MoveLibraryNodeInput;
export type SetLibraryVisibilityInput = import("@qaito/schemas/library").SetLibraryVisibilityInput;
export type SetLibraryNamesInput = import("@qaito/schemas/library").SetLibraryNamesInput;
export type CopyLibraryNodeInput = import("@qaito/schemas/library").CopyLibraryNodeInput;

/** 自分の置き場（組織・所属する事業所・個人）と、書けるか */
export type LibraryMyAccess = import("@qaito/schemas/library").LibraryMyAccess;
/** 版の 1 行（本文なし）と、版 1 つ（本文つき） */
/** ライブラリの画像（置き場のキーは返さない）と、短期の署名 URL */
export type LibraryAsset = import("@qaito/schemas/library").LibraryAsset;
export type LibraryAssetUrl = import("@qaito/schemas/library").LibraryAssetUrl;
/** 画像の取り込み。実体は storage のアップロード窓口（用途 `library_asset`）に置いた stagedId で渡す */
export type UploadLibraryAssetInput = { stagedId: string; width?: number; height?: number };
/** 公式のノード（組織を持たない・版は無い） */
export type LibraryOfficialNode = import("@qaito/schemas/library").LibraryOfficialNode;
export type LibraryOfficialNodeWithBody = import("@qaito/schemas/library").LibraryOfficialNodeWithBody;
export type LibraryOfficialTree = import("@qaito/schemas/library").LibraryOfficialTree;
/** 「この画面の使い方」（公式の help_key で引く）。`url` は web の読む画面 */
export type LibraryHelpTarget = import("@qaito/schemas/library").LibraryHelpTarget;

/** メンバーが入っているグループ（とそのグループに割り当てた権限セット） */
export type AccessControlMemberGroup = {
  group_id: string;
  user_groups: {
    id: string;
    name: string;
    group_assignments: {
      permission_set_id: string;
      permission_sets: { id: string; name: string; scopes: string[] } | null;
    }[];
  };
};

/** メンバー（ルートアカウントは含まない） */
export type AccessControlMember = {
  id: string;
  email: string;
  name: string;
  login_id: string;
  created_at: string;
  /** アーカイブ（ログイン無効化）した日時。null = 有効 */
  archived_at: string | null;
  /** 最終ログイン日時。null = 一度もログインしていない */
  last_sign_in_at: string | null;
  user_group_members: AccessControlMemberGroup[];
  /** 所属事業所（必須。空は直す必要のある人か、組織に有効な事業所がまだ無い間だけ） */
  facilities: { facility_id: string; name: string; is_default: boolean }[];
  /** 所属事業所が 0 件で直す必要がある（組織に有効な事業所があり、アーカイブされていない） */
  facility_missing: boolean;
  /** `facility_missing` の人だけ: 職員台帳の今の主の発令の事業所（所属にする候補）。ほかは null */
  facility_candidate: { facility_id: string; name: string } | null;
};

/** メンバー一覧の絞り込み */
export type ListAccessControlMembersQuery = {
  /** true なら所属事業所の無い人（`facility_missing`）だけ */
  without_facility?: boolean;
};

/** メンバー 1 人（所属事業所は一覧の側にだけある） */
export type AccessControlMemberDetail = Omit<AccessControlMember, "facilities" | "facility_missing" | "facility_candidate">;

export type PortalLinkKind = "shortcut" | "site";

/** ポータルのホームのリンク（保存された行） */
export type PortalLink = {
  id: string;
  kind: PortalLinkKind;
  name: string;
  description: string | null;
  url: string;
  /** 画像のキー（同梱画像は `bundled:*`）。連携サイトだけ */
  imageKey: string | null;
  position: number;
};

/** 表示用のリンク（画像は URL に解決済み） */
export type PortalLinkView = {
  id: string;
  kind: PortalLinkKind;
  name: string;
  description: string | null;
  url: string;
  imageKey: string | null;
  image: { src: string; position: string } | null;
  /** ポータルの中のパス（同じタブで開く）。false は https の絶対 URL */
  internal: boolean;
};

export type PortalLinkLists = { shortcuts: PortalLinkView[]; sites: PortalLinkView[] };

/**
 * 画像の指定。省略 = 変えない / null = 外す / `{ stagedId }` = `storage.uploads` で
 * 用途 `portal_link_image` に上げたもの（連携サイトだけ）。
 */
export type PortalLinkImageInput = { stagedId: string } | null;

export type CreatePortalLinkInput = {
  kind: PortalLinkKind;
  /** 40 文字以内 */
  name: string;
  /** 80 文字以内 */
  description?: string | null;
  /** https の URL（よく使う機能は `/` で始まるポータルの中のパスも可） */
  url: string;
  image?: PortalLinkImageInput;
};

/** 区画は変えられない（名前と URL は必須） */
export type UpdatePortalLinkInput = Omit<CreatePortalLinkInput, "kind">;

/** 並べ替え（その区画の全件を上から順に） */
export type ReorderPortalLinksInput = { kind: PortalLinkKind; ids: string[] };

export type ShelfOrderApp = {
  kind: "internal" | "external";
  id: string;
  /** 内部アプリの slug（連携アプリは null） */
  slug: string | null;
  name: string;
  iconName: string;
  themeToken: string;
  logoUrl: string | null;
  enabled: boolean;
  /** 組み込みの連携アプリ（QaitoChat） */
  builtin: boolean;
};

export type ShelfOrderSettings = {
  internalApps: ShelfOrderApp[];
  externalApps: ShelfOrderApp[];
  /** 組織が並び順を決めているか */
  customized: boolean;
};

/** 棚の並び順（上から順。空で既定の順に戻る） */
export type SaveShelfOrderInput = { apps: { kind: "internal" | "external"; appId: string }[] };

/** 件数だけを返す保存の口の戻り値 */
export type OrganizationSaveCount = { count: number };

/** 絞り込みを保存できる画面（`@qaito/schemas/saved-filters` の `SAVED_FILTER_SURFACES`） */
export type SavedFilterSurface = "nursing-calendar-staff";

/** 保存した絞り込み 1 件（本人の行だけ。casing = camelCase） */
export type SavedFilter = {
  id: string;
  surface: SavedFilterSurface;
  name: string;
  /** 訪問カレンダー: 表示する職員の ID（担当未定は "unassigned"） */
  payload: { staffIds: string[] };
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SaveSavedFilterInput = { surface: SavedFilterSurface; name: string; payload: { staffIds: string[] } };
export type UpdateSavedFilterInput = { name?: string; payload?: { staffIds: string[] } };

/** 帳票様式（全 org 共通の [G] マスタ・`tool.form_templates`） */
export type FormTemplate = {
  id: string;
  /** カタログのキー（UUID ではない。例: `tsusho_plan_3_4`） */
  formId: string;
  /** 様式番号（`別紙様式3-4` / `様式第十一` / `第3表` 等） */
  formNo: string | null;
  title: string;
  /** 帳票を出力する口を持つモジュールの slug */
  ownerModule: string;
  /** 対象サービス種別コード（null = 共通） */
  serviceCategories: string[] | null;
  /** テンプレ原本の S3 key（null = HTML→PDF の帳票） */
  templateKey: string | null;
  /** `xlsx` / `pdf` */
  outputKind: string;
  downloadPath: string;
  /** 様式改定年月（`202404` 等） */
  revision: string | null;
  sortOrder: number;
};
/** 帳票の出力履歴（`tool.form_outputs`・org + 事業所境界。利用者・職員は ID のみ） */
export type FormOutput = {
  id: string;
  organizationId: string;
  formId: string;
  clientId: string | null;
  facilityId: string | null;
  /** 月次帳票の対象（`YYYY-MM`） */
  targetPeriod: string | null;
  /** 日次帳票の対象（`YYYY-MM-DD`） */
  targetDate: string | null;
  outputBy: string | null;
  outputAt: string;
};
/** 出力履歴の取得件数（既定 200・上限 1000） */
export type ListFormOutputsQuery = { limit?: number };

export type VisitTimeDeviation = {
  visitId: string;
  serviceDate: string;
  plannedMinutes: number;
  actualMinutes: number;
  plannedBracketLabel: string;
  actualBracketLabel: string;
};
export type ListVisitTimeDeviationsInput = import("@qaito/schemas/schedule-visits").ListVisitTimeDeviationsInput;
export type AcknowledgeVisitTimeDeviationInput = import("@qaito/schemas/schedule-visits").AcknowledgeVisitTimeDeviationInput;
export type ScheduleVisit = {
  timeDeviation?: VisitTimeDeviation | null;
  timeDeviationAcknowledgedAt: string | null;
  timeDeviationAcknowledgedBy: string | null;
  /** 詳細取得時のみ。同じ利用者の次の予定。予定なしは null。 */
  nextVisit?: import("@qaito/schemas/api/schedule-visits").NextScheduledVisit | null;
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string;
  scheduleId: string;
  serviceDate: string;
  planConfirmed: boolean;
  serviceCategory: string;
  serviceTypeCode: string;
  visitKind: string;
  plannedStartTime: string;
  plannedEndTime: string | null;
  plannedEndsNextDay: boolean;
  plannedMinutes: number | null;
  planDetailId: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  actualEndsNextDay: boolean;
  actualTimeReason: string | null;
  /** 状態 */
  status: string;
  cancelReason: string | null;
  cancelledAt: string | null;
  /** 発生源 */
  source: string;
  substitutedForVisitId: string | null;
  emergency: boolean;
  emergencyRequestedAt: string | null;
  emergencyRequestNote: string | null;
  twoPersonBilling: boolean;
  sasekiDoko: boolean;
  insuranceResult: string | null;
  insuranceJudgedAt: string | null;
  /** 保険の手の直し（null = 自動のまま。効く値 = 手の直し ?? insuranceResult） */
  insuranceOverride: string | null;
  insuranceOverrideReason: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ListScheduleVisitsQuery = {
  schedule_id?: string;
  client_id?: string;
  facility_id?: string;
  date?: string;
  month?: string;
  status?: string;
  service_type_code?: string;
};
export type CreateScheduleVisitInput = {
  /** 省略時は利用日の見出しを訪問と同じトランザクションで用意する。 */
  scheduleId?: string;
  clientId: string;
  facilityId: string;
  serviceDate: string;
  serviceCategory?: string;
  serviceTypeCode: string;
  visitKind: string;
  plannedStartTime: string;
  plannedEndTime?: string | null;
  plannedEndsNextDay?: boolean;
  plannedMinutes?: number | null;
  planDetailId?: string | null;
  source?: string;
  substitutedForVisitId?: string | null;
  emergency?: boolean;
  emergencyRequestedAt?: string | null;
  emergencyRequestNote?: string | null;
  twoPersonBilling?: boolean;
  sasekiDoko?: boolean;
  note?: string | null;
  /** 同じ利用者・担当職員の前後 15 分以内に別の予定があるとき、確認のうえ続ける場合だけ true。重なりは常に 409（reason: visit_time_overlap）。 */
  acknowledgeNearby?: boolean;
};
export type UpdateScheduleVisitInput = Partial<Omit<CreateScheduleVisitInput, "scheduleId" | "clientId" | "facilityId" | "serviceDate">> & {
  acknowledgeShift?: boolean;
  planConfirmed?: boolean;
  acknowledgeConfirmed?: boolean;
  expectedUpdatedAt?: string;
};
export type MoveScheduleVisitInput = import("@qaito/schemas/schedule-visits").MoveScheduleVisitInput;
export type ProvideScheduleVisitInput = { actualStartTime: string; actualEndTime?: string | null; actualEndsNextDay?: boolean; actualTimeReason?: string | null };
export type CancelScheduleVisitInput = { cancelReason?: string | null };
export type ScheduleVisitProvider = {
  id: string;
  organizationId: string;
  visitId: string;
  staffId: string | null;
  staffName: string | null;
  role: string;
  qualification: string;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  deletedAt: string | null;
  retentionBaseDate: string | null;
  retentionYears: number;
  createdAt: string;
  updatedAt: string;
};
export type CreateVisitProviderInput = {
  staffId?: string | null;
  staffName?: string | null;
  role?: string;
  qualification: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
  /** 同じ職員の前後 15 分以内に別の予定があるとき、確認のうえ続ける場合だけ true。重なりは常に 409。 */
  acknowledgeNearby?: boolean;
  /** 訪問看護の勤務警告を利用者が確認した場合のみ true。 */
  acknowledgeShift?: boolean;
};
export type UpdateVisitProviderInput = Partial<CreateVisitProviderInput>;
export type ScheduleVisitPattern = {
  id: string;
  organizationId: string;
  clientId: string;
  facilityId: string;
  serviceCategory: string;
  serviceTypeCode: string;
  visitKind: string;
  /** 曜日(ISO 1-7) */
  weekday: number;
  startTime: string;
  endTime: string | null;
  plannedMinutes: number | null;
  /** 繰り返し: 月の第何週か（1〜5。毎週は 1〜5 全部） */
  monthWeeks: number[];
  planDetailId: string | null;
  defaultProviders: Record<string, unknown>;
  twoPersonBilling: boolean;
  effectiveFrom: string;
  effectiveUntil: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ListVisitPatternsQuery = { client_id?: string; facility_id?: string; active_only?: boolean };
export type CreateVisitPatternInput = {
  clientId: string;
  facilityId: string;
  serviceCategory?: string;
  serviceTypeCode: string;
  visitKind: string;
  weekday: number;
  startTime: string;
  endTime?: string | null;
  plannedMinutes?: number | null;
  /** 繰り返し: 月の第何週か（1〜5。省略で毎週） */
  monthWeeks?: number[] | null;
  planDetailId?: string | null;
  defaultProviders?: Record<string, unknown>[];
  twoPersonBilling?: boolean;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  note?: string | null;
};
export type UpdateVisitPatternInput = Partial<Omit<CreateVisitPatternInput, "clientId" | "facilityId">>;
export type SetupVisitPatternsInput = import("@qaito/schemas/schedule-visits").SetupVisitPatternsInput;
export type GenerateVisitScheduleInput = { facilityId: string; yearMonth: string; clientIds?: string[] };

export type MediaLogType = "photo" | "video" | "audio";
export type MediaLogStatus = "pending" | "ready";

/** client.media_logs の 1 行（一覧・詳細は status='ready' のみ返る） */
export type MediaLog = {
  id: string;
  /** 組織ID */
  organizationId: string;
  /** 事業所ID */
  facilityId: string;
  /** 利用者ID */
  clientId: string | null;
  /** 種別 */
  mediaType: string;
  /**
   * 保存キー。**NULL = 自前の実体を持たない**（Qaito ドライブの写真を共有した受け取り）。
   * その場合の実体は `userFileId` が指す先にあり、置き場も別のバケットになる
   * （配信は `GET /media/logs/:id/media-url` に解決させる）
   */
  s3Key: string | null;
  /** 値あり = Qaito ドライブのファイルを共有した受け取り（実体はそちら） */
  userFileId: string | null;
  /** ファイル形式 */
  contentType: string;
  /** サイズ(バイト) */
  sizeBytes: number | null;
  /** 長さ(秒) */
  durationSeconds: number | null;
  /** 状態 */
  status: string;
  /** 記録日 */
  recordedOn: string;
  /** ひとことメモ */
  caption: string | null;
  /** 記録者ID */
  recordedBy: string | null;
  /** 登録日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
};

/** GET /media/logs のクエリ */
export type ListMediaLogsQuery = {
  mediaType?: MediaLogType;
  clientId?: string;
  facilityId?: string;
  from?: string;
  to?: string;
  /** ひとことメモの部分一致 */
  q?: string;
  limit?: number;
  offset?: number;
};

/** PATCH /media/logs/:id */
export type UpdateMediaLogInput = {
  caption?: string | null;
  /** null で利用者の紐付けを解除する */
  clientId?: string | null;
  recordedOn?: string;
};

/** Qaito ドライブのファイルを日常の記録へ共有する入力 */
export type ShareUserFileInput = {
  /** Qaito ドライブのファイル ID（写真・動画・音声） */
  userFileId: string;
  /** 共有先の事業所 */
  facilityId: string;
  /** 紐付ける利用者（省略可。あとから update でも付けられる） */
  clientId?: string | null;
  /** 記録日（YYYY-MM-DD）。省略時はサーバが当日（JST）を入れる */
  recordedOn?: string;
  caption?: string | null;
};

/** 共有の結果。`created: false` = 既に共有済みだった（冪等） */
export type SharedMediaLog = {
  mediaId: string;
  created: boolean;
};

/** 共有を外した結果。写真の実体（Qaito ドライブの行）は残る */
export type UnsharedMediaLog = {
  mediaId: string;
  userFileId: string;
};

/** POST /media/logs/client-photo の body（共有 + その日の 1 枚） */
export type RecordClientPhotoInput = {
  userFileId: string;
  facilityId: string;
  /** 写っている利用者（必須） */
  clientId: string;
  /** 記録日（YYYY-MM-DD）。省略時はサーバが当日（JST） */
  recordedOn?: string;
  caption?: string | null;
  /** その日の 1 枚にするか（既定 true） */
  dailyPick?: boolean;
};

/** POST /media/logs/client-photo のレスポンス */
export type RecordedClientPhoto = {
  mediaId: string;
  created: boolean;
  /** その日の 1 枚にできたか（false でも共有は済んでいる） */
  picked: boolean;
};

/** PUT /media/logs/:id/daily-pick の body */
export type SetMediaLogDailyPickInput = {
  /** true = その日の 1 枚にする（同じ利用者・同じ日の前の 1 枚は外れる）/ false = 外す */
  picked: boolean;
};

/** PUT /media/logs/:id/daily-pick のレスポンス */
export type MediaLogDailyPick = {
  mediaId: string;
  picked: boolean;
};

/** GET /media/logs/:id/media-url のレスポンス */
export type MediaLogMediaUrl = {
  media_url: string;
  content_type: string;
  expires_at: string;
};

export type DirectiveAudienceKind = "all" | "facility" | "group" | "users";

/** 送った業務連絡 1 件（一覧・確認状況の見出し） */
export type Directive = {
  id: string;
  /** 件名 */
  title: string;
  /** 本文 */
  body: string;
  /** 確認を求める */
  requiresAck: boolean;
  /** 期限（YYYY-MM-DD） */
  dueOn: string | null;
  /** 宛先の種類 */
  audienceKind: DirectiveAudienceKind;
  /** 宛先ID */
  audienceIds: string[];
  /** 送信者ID */
  sentBy: string | null;
  /** 送信者 */
  sentByName: string | null;
  /** 送信日時 */
  sentAt: string;
  /** 取り消し日時 */
  revokedAt: string | null;
  /** 宛先の人数 */
  recipientCount: number;
  /** 既読の人数 */
  readCount: number;
  /** 確認済みの人数 */
  ackedCount: number;
};

/** 確認状況の宛先 1 人 */
export type DirectiveRecipient = {
  userId: string;
  userName: string | null;
  readAt: string | null;
  ackedAt: string | null;
  /** 受け取った人の文字の返信 */
  reply: string | null;
  repliedAt: string | null;
};

/** GET /directive/directives/:id（まだ確認していない人が先） */
export type DirectiveStatus = Directive & { recipients: DirectiveRecipient[] };

/** POST /directive/directives */
export type SendDirectiveInput = {
  title: string;
  body: string;
  /** 既定 true */
  requiresAck?: boolean;
  /** YYYY-MM-DD */
  dueOn?: string | null;
  audienceKind: DirectiveAudienceKind;
  /** 組織の全員宛（all）のときは空 */
  audienceIds?: string[];
};

/** GET /directive/audience-options（送り手が選べるものだけ） */
export type DirectiveAudienceOptions = {
  /** 組織の全員宛を選べるか（業務連絡を書ける人なら true。所属事業所が 0 件の送り手だけ false） */
  canSendAll: boolean;
  /** 組織の全員宛で届く人数（自分・ルートアカウント・アーカイブ済みを除く） */
  orgMemberCount: number;
  facilities: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  users: { id: string; name: string }[];
};

/** GET /directive/directives のクエリ */
export type ListSentDirectivesQuery = { limit?: number; offset?: number };

/** 自分宛の業務連絡 1 件（本文は送信時点の写し） */
export type MyDirective = {
  /** 業務連絡ID */
  directiveId: string;
  /** 件名 */
  title: string;
  /** 本文 */
  body: string;
  /** 確認を求める */
  requiresAck: boolean;
  /** 期限 */
  dueOn: string | null;
  /** 送信者ID */
  sentBy: string | null;
  /** 送信者 */
  sentByName: string | null;
  /** 送信日時 */
  sentAt: string;
  /** 既読日時 */
  readAt: string | null;
  /** 確認日時 */
  ackedAt: string | null;
  /** 返信 */
  reply: string | null;
  /** 返信日時 */
  repliedAt: string | null;
};

/** POST /directive/inbox/:id/reply（1〜1000 文字・1 回だけ） */
export type ReplyToDirectiveInput = { text: string };

/** GET /directive/inbox のクエリ（pending = まだ済んでいないもの） */
export type ListMyDirectivesQuery = { status?: "pending" | "all"; limit?: number };

/** 種類（opinion = ご意見 / issue = 障害報告） */
export type FeedbackKind = "opinion" | "issue";

/** 状態（open = 未対応 / in_progress = 対応中 / done = 対応済み） */
export type FeedbackStatus = "open" | "in_progress" | "done";

/** 受け取った側の 1 件（一覧・詳細）。匿名なら送った人は null */
export type FeedbackItem = {
  id: string;
  /** 種類 */
  kind: FeedbackKind;
  /** 件名 */
  title: string;
  /** 本文 */
  body: string;
  /** 匿名 */
  anonymous: boolean;
  /** 送った人ID（匿名なら null） */
  submittedBy: string | null;
  /** 送った人（匿名なら null） */
  submittedByName: string | null;
  /** 送った画面の URL（障害報告のとき） */
  pageUrl: string | null;
  /** 状態 */
  status: FeedbackStatus;
  /** 返事 */
  response: string | null;
  /** 返事をした人ID */
  respondedBy: string | null;
  /** 返事をした人 */
  respondedByName: string | null;
  /** 返事の日時 */
  respondedAt: string | null;
  /** 送信日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
};

/** 自分の分の 1 件（名前つきで送ったもの）。返事をした人の名前は持たない */
export type MyFeedback = {
  id: string;
  /** 種類 */
  kind: FeedbackKind;
  /** 件名 */
  title: string;
  /** 本文 */
  body: string;
  /** 送った画面の URL */
  pageUrl: string | null;
  /** 状態 */
  status: FeedbackStatus;
  /** 返事 */
  response: string | null;
  /** 返事の日時 */
  respondedAt: string | null;
  /** 送信日時 */
  createdAt: string;
};

/** POST /feedback/submissions の応答（匿名なら本人も後から見られないので ID と種類だけ） */
export type SubmittedFeedback = {
  id: string;
  kind: FeedbackKind;
  anonymous: boolean;
  createdAt: string;
};

/** POST /feedback/submissions */
export type SubmitFeedbackInput = {
  kind: FeedbackKind;
  title: string;
  body: string;
  /** 既定 false（名前つき） */
  anonymous?: boolean;
  /** 送った画面の URL（障害報告のとき・http / https のみ） */
  pageUrl?: string | null;
};

/** GET /feedback/items のクエリ */
export type ListFeedbackQuery = {
  kind?: FeedbackKind;
  status?: FeedbackStatus;
  limit?: number;
  offset?: number;
};

/** GET /feedback/submissions のクエリ */
export type ListMyFeedbackQuery = { limit?: number };

/** GET /usage-billing/me/usage の応答 */
export type MyUsageThisMonth = {
  /** 日本時間の月 'YYYY-MM' */
  month: string;
  /** 月の 1 日から今日（JST）までの日ごとの QT。使っていない日は 0 */
  days: { date: string; qt: number }[];
  /** 今月の合計（QT） */
  totalQt: number;
};

/** 今日の気分（本人の分）。付けていなければ mood は null。day は JST の今日（YYYY-MM-DD） */
export type MyMoodToday = {
  /** 日 */
  day: string;
  /** 気分（1 = つらい … 5 = とても良い） */
  mood: number | null;
};

export type JobRole = {
  id: string;
  organization_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  /** シフト表に表示するか（役割単位の設定。全役割 false の職員のみ名簿から外れる） */
  show_on_shift: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateJobRoleInput = {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
  showOnShift?: boolean;
};

export type UpdateJobRoleInput = Partial<CreateJobRoleInput>;

/** GET /staff/job-role/staff/:staffId/roles・PUT の応答共通 */
export type StaffJobRole = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

/** PUT /staff/job-role/staff/:staffId/roles の入力（配列で置換） */
export type ReplaceStaffJobRolesInput = {
  jobRoleIds: string[];
};

/** 1 行分の結果。id は成功時のみ / error は失敗時のみ入る */
export type BulkRowResult = {
  index: number;
  id?: string;
  error?: string;
};

/** bulk レスポンスの data 部（create 系 = created / update 系 = updated） */
export type BulkWriteSummary = {
  requested: number;
  created?: number;
  updated?: number;
  failed: number;
  results: BulkRowResult[];
};

/** bulk ルートの共通エンベロープ（1 コール最大 100 行） */
export type BulkRowsInput<T> = {
  rows: T[];
};

/** POST /care-record/records/meal-amounts の入力（主食・副食とも null で消す＝未入力に戻す） */
export type SetMealAmountsInput = {
  facilityId: string;
  /** YYYY-MM-DD */
  serviceDate: string;
  /** 1〜100 人 */
  clientIds: string[];
  mealStaplePct: number | null;
  mealSidePct: number | null;
};

/** POST /care-record/records/meal-amounts の利用者 1 人ぶんの成否 */
export type MealAmountsResult =
  | { clientId: string; status: "created" | "updated" | "cleared" | "unchanged"; id: string | null }
  | { clientId: string; error: string };

/**
 * POST /care-record/daily-checks/bulk の入力（入浴・ハブラシ・個別の一括）。
 * apply=付ける / revert=付けた分を戻す（ハブラシ・個別は行の論理削除なので削除の権限が要る）/ preview=個別（training）だけ・書かずに計画の有無を返す
 */
export type BulkSetDailyChecksInput = {
  facilityId: string;
  serviceDate: string;
  check: "bath" | "oral" | "training";
  clientIds: string[];
  mode?: "apply" | "revert" | "preview";
  /** revert のとき、apply が返した付けた行の印。印が今の行と一致する行だけ戻す（そのあと触られた行は戻さない） */
  marks?: BulkMark[];
};

/** 一括で付けた行の印（行の id と付けた直後の updated_at） */
export type BulkMark = { clientId: string; id: string; updatedAt: string };

/** POST /care-record/daily-checks/bulk の結果（applied / marks は元に戻すのに使う） */
export type BulkDailyChecksResult = {
  dayClosed: boolean;
  applied: string[];
  /** 付けた行の印（revert に返す）。revert のときは戻した行 */
  marks: BulkMark[];
  /** revert: そのあと変更されている・もう無いので戻さなかった利用者 */
  notReverted: string[];
  unchanged: number;
  notAttending: number;
  outOfScope: number;
  /** 利用中・お試し以外（利用開始前・一時停止・入院中・利用中止）なので対象から外した利用者（付ける・preview のときだけ） */
  inactive: string[];
  /** training: 計画のプログラムが 2 つ以上で一括の対象にしなかった利用者 */
  multiProgram: string[];
  skippedPeople: { clientId: string; reason: "not_attending" | "elsewhere" | "inactive" | "multi_program" }[];
  /** 見えない利用者・存在しない ID・他の組織の ID（渡した ID のうち理由を分けないもの。存在の有無は区別しない） */
  hidden: string[];
  /** training の preview: 計画のある人・ない人 */
  withPlan?: string[];
  noPlan?: string[];
};

/** POST /care-record/records/meal-amounts の結果（利用者ごとの成否） */
export type MealAmountsSummary = {
  requested: number;
  written: number;
  failed: number;
  results: MealAmountsResult[];
  /** 入れるとき: その日来ていない（欠席・キャンセル・名簿にいない）ので書かなかった人（reason は not_attending） */
  skippedPeople: { clientId: string; reason: "not_attending" | "elsewhere" | "inactive" | "multi_program" }[];
};

export type DayRecreationsQuery = {
  facility_id: string;
  /** YYYY-MM-DD */
  service_date: string;
};

/** その日のレク・おやつの 1 つの枠 */
export type DayRecreationSlotState = {
  /** 入っているレク・おやつの名前（人によって違えば一番多いもの）。無ければ null */
  name: string | null;
  /** その枠の行が介護記録にある人数 */
  count: number;
};

export type DayRecreations = {
  morning: DayRecreationSlotState;
  afternoon: DayRecreationSlotState;
  event: DayRecreationSlotState;
  snack: DayRecreationSlotState;
};

/** PUT /care-record/day-recreations の入力（渡した枠だけが変わる。空・null はその枠を外す） */
export type SetDayRecreationsInput = {
  facility_id: string;
  /** YYYY-MM-DD */
  service_date: string;
  morning?: string | null;
  afternoon?: string | null;
  event?: string | null;
  snack?: string | null;
  client_ids?: string[];
  /** 入れ方。sync（既定）= 入れ直す（ほかの人の行・空の枠の行は外す）。add = client_ids の人に空でない枠だけを入れる（何も外さない） */
  mode?: "sync" | "add";
};

/** PUT /care-record/day-recreations の結果 */
export type DayRecreationsWriteResult = {
  /** 出席の人数（入れる相手） */
  attendees: number;
  created: number;
  updated: number;
  removed: number;
  /** 外すはずだったが、呼んだ人が care-record:delete を持たないので残した行 */
  kept: number;
};

/** PATCH /schedule/schedules/bulk-attendance の 1 行 */
export type BulkAttendanceRowInput = {
  scheduleId: string;
  status: "attended" | "absent";
  absenceReason?: string | null;
  absenceContactedAt?: string | null;
};

/** 自分の所属・職種・資格（GET /staff/me/profile・snake_case）。紐づいていなければ null が返る */
export type MyStaffProfile = {
  staff_id: string;
  assignments: { facility_id: string; facility_name: string | null; is_primary: boolean; role: string | null; started_at: string | null }[];
  job_roles: string[];
  qualifications: {
    qualification_name: string;
    acquired_date: string | null;
    expiry_date: string | null;
    issuing_body: string | null;
  }[];
};

/** 自分の職員（GET /staff/me・snake_case）。紐づいていなければ null が返る */
export type MyStaffMember = {
  id: string;
  employee_number: string;
  family_name: string;
  given_name: string;
};

/** GET /schedule/visits/mine のクエリ（JST の日付・両端を含む・62 日まで） */
export type ListMyScheduleVisitsQuery = { from: string; to: string };

/** 自分が担当の訪問 1 件（GET /schedule/visits/mine・camelCase。利用者の ID・氏名・保険の判定は無い） */
export type MyScheduleVisit = {
  visitId: string;
  serviceDate: string;
  /** 予定の開始・終了（HH:MM）。終了は未定なら null */
  plannedStartTime: string;
  plannedEndTime: string | null;
  /** 予定の終了が翌日 */
  plannedEndsNextDay: boolean;
  visitKind: string;
  serviceTypeCode: string;
  facilityId: string;
  facilityName: string | null;
  /** scheduled / provided（取り消しは入らない） */
  status: string;
  /** primary / second / accompany_saseki / accompany_expert / assistant */
  role: string;
};

/** 実績の確定 1 件。行があれば確定済みで、その日の実績は読むだけになる。 */
export type DayserviceDailyConfirmation = {
  /** 確定した日時（ISO 8601） */
  confirmedAt: string;
  /** 確定した人（消えたユーザーなら null） */
  confirmedBy: string | null;
};

/** GET / DELETE /dayservice/confirmations のクエリ */
export type DayserviceDailyConfirmationQuery = {
  facility_id: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
};

/** PUT /dayservice/confirmations のボディ */
export type ConfirmDailyRecordsInput = {
  facilityId: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
};

/** 解除の結果（どの日を操作したか） */
export type DayserviceDailyConfirmationResult = {
  facilityId: string;
  date: string;
};

/** 確定の結果。確定はその日のシフトの実績も締めるので、締めたかも返す */
export type DayserviceDailyConfirmedDay = DayserviceDailyConfirmationResult & {
  /** シフトの実績も締めたか（シフトを書く権限が無いときは締めずに進むので false） */
  shiftClosed: boolean;
};

/** POST /dayservice/contact-sheets/generate のボディ（1 名を AI で作り直す・上書き） */
export type GenerateContactSheetNoteInput = {
  facilityId: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
  clientId: string;
};

/** 1 名の AI 生成の結果（保存した文章） */
export type GeneratedContactSheetNote = {
  clientId: string;
  text: string;
};

/** POST /dayservice/contact-sheets/generate-all のボディ（未入力の人の分を AI で作る） */
export type GenerateAllContactSheetNotesInput = {
  facilityId: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
  /** 作る人の利用者ID（省くとその日の全員） */
  clientIds?: string[];
  /** true で入力済みの人も作り直す（既定 false = 未入力の人だけ） */
  overwrite?: boolean;
  preview?: boolean;
};

/** AI 一括生成の結果（人数） */
export type GenerateAllContactSheetNotesSummary = {
  /** 新しく作れた人数 */
  generated: number;
  /** すでに入力があって触らなかった人数 */
  kept: number;
  /** 文章が返らず作れなかった人数 */
  noText: number;
  /** AI や保存に失敗した人数 */
  failed: number;
  /** 失敗した利用者の ID（画面の並び順） */
  failedClientIds: string[];
  /** preview: true のときだけ: 作った文（保存していない） */
  drafts?: GeneratedContactSheetNote[];
};

/** POST /dayservice/contact-sheets/set-all のボディ（その日の全員に同じ文章を入れる） */
export type SetAllContactSheetNotesInput = {
  facilityId: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
  /** 全員に入れる文章（4000 文字以内） */
  text: string;
  /** 入れ方（fill_empty = 未入力の人だけ〔既定〕/ overwrite = 全員を置き換え / append = 全員の末尾に足す） */
  mode?: "fill_empty" | "overwrite" | "append";
  /** 入れる人（その日の連絡票の人のうちこの人たちだけ）。省くと全員 */
  clientIds?: string[];
  /** 入れる欄（comment = 連絡事項〔既定〕/ staffMemo = 家族に伝えたいこと。入れた人は作り直し待ちの印が立つ） */
  field?: "comment" | "staffMemo";
};

export type ReflectNursingToContactSheetInput = {
  facilityId: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
  clientId: string;
  /** 反映する看護経過記録の ID */
  nursingProgressId: string;
  /** 連絡帳に保存する連絡事項の文全体（家族向けに直した文・4000 文字以内） */
  text: string;
};

/** 看護経過を連絡帳へ反映した結果 */
export type ReflectNursingToContactSheetResult = {
  /** 看護経過に立てた「連絡帳に反映済み」の時刻（ISO 8601） */
  contactReflectedAt: string | null;
};

/** POST /dayservice/contact-sheets/proofread のボディ（連絡事項の文を AI で校正する・保存しない） */
export type ProofreadContactSheetNoteInput = {
  facilityId: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
  /** 校正する文章（4000 文字以内） */
  text: string;
};

/** AI 校正の結果 */
export type ProofreadContactSheetNoteResult = {
  /** 校正した文章（保存はしていない） */
  text: string;
};

/** 一括登録の結果（人数） */
export type SetAllContactSheetNotesSummary = {
  /** 文章を入れた人数 */
  applied: number;
  /** すでに入力があって触らなかった人数 */
  kept: number;
  /** 保存に失敗した人数 */
  failed: number;
};

export type DayserviceStatusRecord = {
  id: string;
  facilityId: string;
  clientId: string;
  /** 記録日（YYYY-MM-DD） */
  recordDate: string;
  /** 再検の有無（異常値のバイタルを保存すると自動で true、再測定で基準内に戻ると自動で false になる） */
  recheck: boolean;
  /** 再検メモ（再測定の時刻・値など。例「10:30 再測定 132/84」） */
  recheckNote: string | null;
  /** Ns処置の有無 */
  nsProcedure: boolean;
  nsProcedureNote: string | null;
  eyeDrops: boolean;
  bento: boolean;
  recreation: boolean;
  snack: boolean;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

/** GET /dayservice/status-records のクエリ */
export type ListDayserviceStatusRecordsQuery = {
  facility_id: string;
  date: string;
  client_id?: string;
};

/** PUT /dayservice/status-records の入力（省略キーは既存値保持） */
export type UpsertDayserviceStatusRecordInput = {
  facilityId: string;
  clientId: string;
  date: string;
  recheck?: boolean;
  recheckNote?: string | null;
  nsProcedure?: boolean;
  nsProcedureNote?: string | null;
  eyeDrops?: boolean;
  bento?: boolean;
  recreation?: boolean;
  snack?: boolean;
  remarks?: string | null;
};

/** POST /dayservice/status-records/bulk-flags の入力（弁当・おやつの一括。apply=付ける / revert=付けた分を外す） */
export type BulkSetStatusFlagsInput = {
  facilityId: string;
  date: string;
  field: "bento" | "snack";
  clientIds: string[];
  mode?: "apply" | "revert";
  /** revert のとき、apply が返した付けた行の印（そのあと触られた行は外さない） */
  marks?: BulkMark[];
};

/** POST /dayservice/status-records/bulk-flags の結果（applied は付けた／外した利用者・元に戻すのに使う） */
export type BulkSetStatusFlagsResult = {
  dayClosed: boolean;
  applied: string[];
  /** 付けた行の印（revert に返す）。revert のときは外した行 */
  marks: BulkMark[];
  /** revert: そのあと変更されている・もう無いので外さなかった利用者 */
  notReverted: string[];
  unchanged: number;
  notAttending: number;
  outOfScope: number;
  /** 利用中・お試し以外（利用開始前・一時停止・入院中・利用中止）なので対象から外した利用者（付けるときだけ） */
  inactive: string[];
  skippedPeople: { clientId: string; reason: "not_attending" | "elsewhere" | "inactive" | "multi_program" }[];
  /** 見えない利用者・存在しない ID・他の組織の ID（渡した ID のうち理由を分けないもの。存在の有無は区別しない） */
  hidden: string[];
};

/** PATCH /dayservice/status-records/:record_id の入力 */
export type UpdateDayserviceStatusRecordInput = Omit<
  UpsertDayserviceStatusRecordInput,
  "facilityId" | "clientId" | "date"
>;

export type DayserviceDailyTask = {
  id: string;
  facilityId: string;
  /** タスク日（YYYY-MM-DD） */
  taskDate: string;
  /** null = 事業所全体のタスク */
  clientId: string | null;
  label: string;
  sortOrder: number;
  /** null = 未実施 / 非 null = 実施済み */
  doneAt: string | null;
  /** 実施者名のスナップショット */
  doneBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** GET /dayservice/tasks のクエリ */
export type ListDayserviceDailyTasksQuery = {
  facility_id: string;
  date: string;
  client_id?: string;
};

/** GET /dayservice/{daily-records,boards/bath,boards/meal,boards/vitals,contact-sheet,board-version} のクエリ */
export type DayserviceFacilityDayQuery = {
  facility_id: string;
  /** 対象日（YYYY-MM-DD） */
  date: string;
};

/** 実績表のある日 1 件（GET /dayservice/record-days） */
export type DayserviceRecordDay = {
  /** 日付（YYYY-MM-DD） */
  d: string;
  /** 曜日（1=月〜7=日） */
  dow: number;
  /** その日の人数 */
  cnt: number;
};

/** 利用者の氏名の列（`client:read` が無ければ null）。 */
export type DayserviceClientNameColumns = {
  familyName: string | null;
  givenName: string | null;
  name: string | null;
  familyNameKana: string | null;
  givenNameKana: string | null;
  nameKana: string | null;
};

/** 今日の実績 1 行（利用者 1 人分の当日の全マス）。 */
export type DayserviceDailyRecordRow = DayserviceClientNameColumns & {
  scheduleId: string;
  clientId: string;
  /** 予定の開始・終了（HH:MM） */
  startTime: string | null;
  endTime: string | null;
  /** 出欠（利用予定の状態） */
  attendanceStatus: string;
  /** その日のバイタル（無ければ未測定） */
  vital: {
    id: string;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    pulse: number | null;
    tempCelsius: string | null;
    weightKg: string | null;
  } | null;
  /** その日のサービス提供記録（入浴・食事量。無ければ未作成） */
  care: {
    id: string;
    bathType: string | null;
    /** 主食の量（0〜100 の割合） */
    mealStaplePct: number | null;
    /** 副食の量（0〜100 の割合） */
    mealSidePct: number | null;
  } | null;
  /** 歯磨き（口腔ケア記録）の id。null なら未実施 */
  oralId: string | null;
  /** 機能訓練（運動）の件数と最初の 1 件 */
  training: { count: number; firstId: string | null };
  /** 実績表の現場様式固有欄（無ければ未作成） */
  status: {
    recheck: boolean;
    recheckNote: string | null;
    nsProcedure: boolean;
    nsProcedureNote: string | null;
    eyeDrops: boolean;
    bento: boolean;
    recreation: boolean;
    snack: boolean;
    remarks: string | null;
  } | null;
  /** その日の 1 枚（選択済の写真 = media_logs.id）。顔写真とは別物 */
  dailyPickMediaId: string | null;
  exerciseComplete: boolean;
  bathExcluded: boolean;
  mealExcluded: boolean;
  exerciseMenus: { menuId: string; name: string; checked: boolean }[];
};

/** 今日の実績で読めたソース */
export type DayserviceDailyRecordsScope = {
  client: { read: boolean };
  careRecord: { read: boolean; write: boolean };
  media: { read: boolean };
  schedule: { read: boolean; write: boolean };
  dayserviceWrite: boolean;
};

/** GET /dayservice/daily-records のレスポンス */
export type DayserviceDailyRecords = {
  rows: DayserviceDailyRecordRow[];
  scope: DayserviceDailyRecordsScope;
};

/** 入浴ボード 1 行 */
export type DayserviceBathBoardRow = DayserviceClientNameColumns & {
  scheduleId: string;
  clientId: string;
  attendanceStatus: string;
  /** 入浴の値（bathType が入っていれば入浴済み。無ければ未作成） */
  care: { id: string; bathType: string | null } | null;
  /** バイタル 3 列（揃っていれば入浴できる。入浴はバイタル測定の後） */
  vital: { tempCelsius: string | null; bpSystolic: number | null; pulse: number | null } | null;
  /** 再検査の印（立っている間は入浴に進めない。血圧が基準内に戻ると外れる） */
  recheck: boolean;
  /** その日の 1 枚（選択済の写真）の media_logs.id */
  photoMediaId: string | null;
};

/** 入浴ボードで読めたソース */
export type DayserviceBathBoardScope = {
  client: { read: boolean };
  careRecord: { read: boolean; write: boolean };
  schedule: { read: boolean };
  media: { read: boolean };
};

/** GET /dayservice/boards/bath のレスポンス */
export type DayserviceBathBoard = {
  rows: DayserviceBathBoardRow[];
  scope: DayserviceBathBoardScope;
};

/** 食事ボード 1 行 */
export type DayserviceMealBoardRow = DayserviceClientNameColumns & {
  scheduleId: string;
  clientId: string;
  attendanceStatus: string;
  /** 食事量（0〜100 の割合。無ければ未作成） */
  care: { id: string; mealStaplePct: number | null; mealSidePct: number | null } | null;
  /** 歯磨き（口腔ケア記録）の id。null なら未実施 */
  oralId: string | null;
  /** その日の 1 枚（選択済の写真）の media_logs.id */
  photoMediaId: string | null;
};

/** 食事ボードで読めたソース */
export type DayserviceMealBoardScope = {
  client: { read: boolean };
  careRecord: { read: boolean; write: boolean; delete: boolean };
  schedule: { read: boolean };
  media: { read: boolean };
};

/** GET /dayservice/boards/meal のレスポンス */
export type DayserviceMealBoard = {
  rows: DayserviceMealBoardRow[];
  scope: DayserviceMealBoardScope;
};

/** バイタルボード 1 行 */
export type DayserviceVitalsBoardRow = DayserviceClientNameColumns & {
  scheduleId: string;
  clientId: string;
  attendanceStatus: string;
  /** その日の最後のバイタル（無ければ未測定。`care-record:read` が無ければ常に null） */
  vital: {
    id: string;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    pulse: number | null;
    tempCelsius: string | null;
    weightKg: string | null;
  } | null;
  /** その日の 1 回目の測定（2 回以上測った日だけ。1 回だけなら null） */
  firstVital: {
    bpSystolic: number | null;
    bpDiastolic: number | null;
    pulse: number | null;
    tempCelsius: string | null;
  } | null;
  /** 再検査（基準外の値で測り直しが要る。行が無ければ false） */
  recheck: boolean;
  /** その日の 1 枚（選択済の写真）の media_logs.id */
  photoMediaId: string | null;
};

/** バイタルボードで読めたソース */
export type DayserviceVitalsBoardScope = {
  client: { read: boolean };
  careRecord: { read: boolean; write: boolean };
  schedule: { read: boolean };
  media: { read: boolean };
};

/** GET /dayservice/boards/vitals のレスポンス */
export type DayserviceVitalsBoard = {
  rows: DayserviceVitalsBoardRow[];
  scope: DayserviceVitalsBoardScope;
};

/** 服薬の窓 1 つ（利用者 × 時間範囲。薬名は持たない） */
export type DayserviceMedicationBoardRow = DayserviceClientNameColumns & {
  /** 画面のキー（`{clientId}:{start}-{end}`） */
  key: string;
  /** 実績の id。服薬管理にあるがまだ記録が無い窓は null */
  id: string | null;
  scheduleId: string;
  clientId: string;
  attendanceStatus: string;
  /** 窓の開始 HH:mm（JST） */
  windowStart: string;
  /** 窓の終了 HH:mm（JST） */
  windowEnd: string;
  /** 服薬管理にいまある窓か（管理から消えた窓の記録は false・読み取りだけ） */
  planned: boolean;
  status: MedicationStatus;
  doneAt: string | null;
  doneByName: string | null;
  note: string | null;
  /** その窓の薬（`clinical-record:read` を持つときだけ。持たなければ null）。削除済みの薬は deleted=true */
  medications: { name: string; deleted: boolean }[] | null;
};

/** 服薬ボードで読めたソース */
export type DayserviceMedicationBoardScope = {
  client: { read: boolean };
  schedule: { read: boolean };
  /** 服薬管理（臨床情報）を読めるか。無ければ窓が出ない */
  clinicalRecord: { read: boolean };
  /** 服薬の実績（ケア記録）。write は記録を入れられるか */
  careRecord: { read: boolean; write: boolean };
};

/** その日の名簿の 1 人（窓の有無に依らない） */
export type DayserviceMedicationBoardPerson = DayserviceClientNameColumns & {
  scheduleId: string;
  clientId: string;
  attendanceStatus: string;
};

/** GET /dayservice/boards/medication のレスポンス */
export type DayserviceMedicationBoard = {
  rows: DayserviceMedicationBoardRow[];
  /** その日の名簿（窓の無い人も含む・名簿の順） */
  roster: DayserviceMedicationBoardPerson[];
  /** 服薬管理に時間範囲が未設定の行がある、名簿の利用者 */
  unsetWindowClientIds: string[];
  scope: DayserviceMedicationBoardScope;
};

/** 連絡票に載せている写真（日常の記録の行） */
export type DayserviceContactSheetPhoto = {
  id: string;
  caption: string | null;
  /** 記録日（YYYY-MM-DD） */
  recordedOn: string;
};

/** 今日の連絡票 1 行 */
export type DayserviceContactSheetRow = DayserviceClientNameColumns & {
  clientId: string;
  tempCelsius: string | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  pulse: number | null;
  /** その日に 2 回以上測った（体温・血圧・脈拍は最後の測定 = 再検の値） */
  vitalRechecked: boolean;
  weightKg: string | null;
  mealStaplePct: number | null;
  mealSidePct: number | null;
  bathType: string | null;
  bathMethod: string | null;
  /** 入浴のメモ（お休みのときは理由が書かれる） */
  bathMemo: string | null;
  rehabPrograms: string[];
  /** 保存済みの「デイサービスからの連絡事項」（空文字なら未入力） */
  comment: string;
  /** 職員の記入欄（家族に伝えたいこと・空文字なら未入力）。連絡事項の AI 生成が最優先で使う。紙には出さない */
  staffMemo: string;
  /** 連絡事項を作る素材（紙には出さない） */
  material: { rehab: string[]; recreation: string[]; snacks: string[]; treatments: string[]; cases: string[]; rechecks: string[]; familyHandovers: string[]; drinks?: string[]; bento?: boolean };
  /** 連絡票に載せている写真（保存済みの選択 + 自動で入ったその日の 1 枚） */
  photos: DayserviceContactSheetPhoto[];
  /** 手で選んで保存した写真（contact_notes.media_log_ids） */
  selectedMediaIds: string[];
  /** 自動で入る写真から外したもの（contact_notes.excluded_media_log_ids） */
  excludedMediaIds: string[];
  /** その利用者のその日の 1 枚 */
  dailyPickId: string | null;
  /** 紙に載せる写真 = 保存済みの選択 ∪ その日の 1 枚 − 外した写真 */
  shownMediaIds: string[];
  /** shownMediaIds のうち自動で入った写真 */
  autoMediaId: string | null;
};

/** 今日の連絡票で読めたソース */
export type DayserviceContactSheetScope = {
  client: boolean;
  careRecord: boolean;
  schedule: boolean;
  contactNoteRead: boolean;
  contactNoteWrite: boolean;
  mediaLog: boolean;
};

/** GET /dayservice/contact-sheet のレスポンス */
export type DayserviceContactSheet = {
  rows: DayserviceContactSheetRow[];
  scope: DayserviceContactSheetScope;
};

/** GET /dayservice/board-version のレスポンス（中身の分からない版の文字列） */
export type DayserviceBoardVersion = {
  version: string;
};

/** 保険証（被保険者証）の期間履歴 — client.insurance_registrations */
export type InsuranceRegistration = {
  id: string;
  organizationId: string;
  clientId: string;
  insurerNumber: string;
  insuredNumber: string;
  /** 保険者名（市区町村名）。表示専用で請求は参照しない */
  insurerName: string | null;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateInsuranceRegistrationInput = {
  insurerNumber: string;
  insuredNumber: string;
  /** YYYY-MM-DD */
  validFrom: string;
  validUntil?: string | null;
};

export type UpdateInsuranceRegistrationInput = Partial<CreateInsuranceRegistrationInput>;

/** 負担割合証 — client.copay_certificates */
export type CopayCertificate = {
  id: string;
  organizationId: string;
  clientId: string;
  copayRatio: 1 | 2 | 3;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCopayCertificateInput = {
  copayRatio: 1 | 2 | 3;
  /** YYYY-MM-DD */
  validFrom: string;
  validUntil?: string | null;
};

export type UpdateCopayCertificateInput = Partial<CreateCopayCertificateInput>;

/** 公費受給者証（0〜3 件/人） — client.kohi_certificates */
export type KohiCertificate = {
  id: string;
  organizationId: string;
  clientId: string;
  /** 法別 2 桁（'12' 生活保護 / '15' / '19' / '54' …） */
  legalCategory: string;
  payerNumber: string;
  recipientNumber: string;
  benefitRate: number | null;
  copayAmount: number | null;
  priority: 1 | 2 | 3;
  validFrom: string;
  validUntil: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateKohiCertificateInput = {
  legalCategory: string;
  payerNumber: string;
  recipientNumber: string;
  benefitRate?: number | null;
  copayAmount?: number | null;
  /** 既定 1。生活保護（'12'）は按分順序をエンジンが強制するため入力値に依らない */
  priority?: 1 | 2 | 3;
  /** YYYY-MM-DD */
  validFrom: string;
  validUntil?: string | null;
  memo?: string | null;
};

export type UpdateKohiCertificateInput = Partial<CreateKohiCertificateInput>;

export type MapGeocodeInput = {
  /** 都道府県から建物名まで（200 文字以内）。3 分割なら `joinAddress` で 1 本にしてから渡す */
  address: string;
  /** 候補の最大件数（1〜5。既定 5） */
  maxResults?: number;
};

export type MapGeocodeCandidate = {
  /** 表示用の住所（正式表記）。入力そのままではない */
  label: string;
  latitude: number;
  longitude: number;
  /** 入力との一致度（0〜1）。取れなければ null */
  matchScore: number | null;
  placeId: string | null;
};

export type MapGeocodeResult = {
  /** 一致度の高い順。0 件のときは 404 `MAP_NO_RESULT` なので、ここは常に 1 件以上 */
  candidates: MapGeocodeCandidate[];
};

export type MapPostalAddressInput = {
  /** 郵便番号（7 桁。ハイフンは任意） */
  postalCode: string;
};

export type MapPostalAddress = {
  /** ハイフン付きに揃えた郵便番号（例 `100-0001`） */
  postalCode: string;
  /** 都道府県（例 `東京都`）。取れなければ空文字 */
  prefecture: string;
  /** 市区町村（郡がある住所は郡を含む。例 `河東郡音更町`） */
  city: string;
  /** 町域（例 `千代田`）。番地の欄の頭に入れる想定 */
  town: string;
};

export type MapPostalAddressResult = {
  /** 住所の欄。**座標は返さない**（郵便番号は町域までしか決まらない） */
  address: MapPostalAddress;
};

export type MessageChannelType = "public" | "private" | "dm" | "group_dm";
export type MessageChannelKind = "general" | "facility";

export type MessageChannel = {
  id: string;
  organizationId: string;
  type: MessageChannelType;
  kind: MessageChannelKind;
  /** 組織の既定のチャンネルの印（全体連絡 = announce・雑談 = chitchat）。古いサーバーは返さない */
  systemKey?: "announce" | "chitchat" | null;
  facilityId: string | null;
  dmKey: string | null;
  name: string | null;
  description: string | null;
  topic: string | null;
  broadcastRestricted: boolean;
  isSecret: boolean;
  createdBy: string | null;
  archivedAt: string | null;
  /** アーカイブした人（0497 より前のアーカイブ・退職で消えた人は null） */
  archivedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  /** 一覧（GET /message/channels）と 1 件（GET /message/channels/:id）に付く */
  isMember?: boolean;
  isFavorite?: boolean;
  /** 本流の未読件数。MESSAGE_UNREAD_COUNT_CAP（100）で数え止める ── 100 は「99 件超え」（画面は 99+） */
  unreadCount?: number;
  /** チャンネル本流の最後の投稿の時刻（投稿が無ければ null） */
  lastMessageAt?: string | null;
  /** DM / グループ DM の参加者（参加した順。DM 以外は null。一覧と 1 件） */
  dmMembers?: { userId: string; name: string }[] | null;
  /** 自分の通知の段（設定が無ければ "all"。一覧と 1 件） */
  notifyLevel?: MessageNotifyLevel;
  /** グループ DM に自分が付けた呼び名（本人にだけ見える。付けていない・グループ DM 以外は null。一覧と 1 件） */
  nickname?: string | null;
  /** アーカイブした人の名前（アーカイブ済みのときだけ・分からなければ null。一覧と 1 件） */
  archivedByName?: string | null;
};

/** チャンネルごとの通知の段。all = すべて / direct = 自分あて（@自分・返信・DM）だけ / none = ミュート */
export type MessageNotifyLevel = "all" | "direct" | "none";

/** PUT /message/channels/:id/notify-level の入力 */
export type SetMessageChannelNotifyLevelInput = { level: MessageNotifyLevel };
export type MessageChannelNotifyLevelResult = { channelId: string; level: MessageNotifyLevel };

/** POST /message/channels/bulk（Piazza の管理者だけ） */
export type BulkMessageChannelChange = "archive" | "unarchive" | "restrict-broadcast" | "allow-broadcast";
export type BulkUpdateMessageChannelsInput = { channelIds: string[]; change: BulkMessageChannelChange };
/** done = 変えた（もう同じ状態だったものも含む）/ skipped = 変えられなかったもの（理由のコードつき） */
export type MessageBulkChannelResult = { done: string[]; skipped: { channelId: string; reason: string }[] };

/** GET / PUT /message/messages/:id/follow（following = 新しい返信の通知が届くか・explicit = 本人が押した設定か） */
export type MessageThreadFollow = { parentId: string; following: boolean; explicit: boolean };

/** GET /message/mutes の 1 行（自分がミュートしている人。その人が起こした通知は自分に届かない） */
export type MessageMutedUser = { userId: string; name: string | null; mutedAt: string };

/** PUT /message/channels/:id/nickname の入力（null か空で外す・40 文字まで） */
export type SetMessageChannelNicknameInput = { nickname: string | null };
export type MessageChannelNicknameResult = { channelId: string; nickname: string | null };

export type ListMessageChannelsQuery = {
  favoriteOnly?: boolean;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
};

export type CreateMessageChannelInput = {
  type?: "public" | "private";
  name: string;
  description?: string | null;
  topic?: string | null;
  isSecret?: boolean;
  broadcastRestricted?: boolean;
};

export type CreateMessageDmInput = { userIds: string[] };

export type UpdateMessageChannelInput = {
  name?: string;
  description?: string | null;
  topic?: string | null;
  broadcastRestricted?: boolean;
  /** 公開 → 非公開の一方向のみ。投稿・既読のある人と作成者がメンバーになる */
  type?: "private";
  /** 非公開チャンネルのみ */
  isSecret?: boolean;
};

export type MessageChannelMember = {
  userId: string;
  name: string;
  /** 職種（職員台帳の役割の名前・並び順どおり）。職員台帳にいない人・見えない人は空 */
  jobRoles: string[];
  joinedAt: string;
};

/** リアクションした人。`name` はユーザー行が引けないとき null */
export type MessageReactionUser = { id: string; name: string | null };

/** `users` はリアクションした人（付けた順・全員） */
export type MessageReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  users: MessageReactionUser[];
};
export type MessageAttachmentSummary = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

/** 投稿者の表示名（退職・削除で `userId` が null のときは `author` も null）。 */
export type MessageAuthor = { id: string; name: string };

/** GET /message/attachments/:id/url のレスポンス（presigned GET、有効期限あり） */
export type MessageAttachmentDownloadUrl = {
  url: string;
  expires_at: string;
  file_name: string;
  content_type: string;
  size: number;
  /** この URL の Content-Disposition（画面で開く = inline / ダウンロード = attachment） */
  disposition: "inline" | "attachment";
};

/**
 * GET /message/attachments/:id/url のクエリ。`inline` は画面内表示用で、画像・PDF・動画・音声だけ
 * （それ以外は 400）。省略時は従来どおり（画像は inline、それ以外は attachment）。
 */
export type MessageAttachmentDownloadQuery = { disposition?: "inline" | "attachment" };

/** GET /message/attachments/:id/text — テキスト・CSV の中身（先頭 256KB まで） */
export type MessageAttachmentText = {
  text: string;
  /** 先頭だけを返した（元のファイルはもっと大きい） */
  truncated: boolean;
  encoding: "utf-8" | "shift_jis";
  file_name: string;
  content_type: string;
  size: number;
};

/** 投稿そのもの（POST / PATCH / DELETE /message/messages の応答。投稿者・リアクションなどは付かない） */
export type MessageMessageRow = {
  id: string;
  organizationId: string;
  channelId: string;
  userId: string | null;
  parentId: string | null;
  content: string;
  replyCount: number;
  broadcastToChannel: boolean;
  hasAttachment: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  /** 発言者の種類（qaito は AI の答え。userId は null）。見た目は `describeAuthor`（@qaito/modules/message/pure）で決める */
  authorKind: MessageAuthorKind;
  /** Qaito の答えが答えた質問の投稿（Qaito 以外は null） */
  questionId: string | null;
  /** Qaito の答えの根拠の投稿（5 件まで・ID だけ。Qaito 以外は null） */
  qaitoSources: MessageQaitoSource[] | null;
};

/** 投稿の発言者の種類（user = 人 / qaito = AI の答え / system = 自動の通知〔表示「電話受付」〕）。正本は `@qaito/schemas/message` の messageAuthorKindValues */
export type MessageAuthorKind = import("@qaito/schemas/message").MessageAuthorKind;
/** Qaito の答えの根拠の投稿（ID だけ。チャンネル名・本文は載せない） */
export type MessageQaitoSource = { messageId: string; channelId: string; parentId: string | null };

/** 投稿（一覧・単票・検索）。投稿者・リアクション・添付などを同梱する */
export type MessageMessage = MessageMessageRow & {
  author: MessageAuthor | null;
  /** Qaito の答えを頼んだ人（Qaito 以外・退職では null） */
  askedBy: MessageAuthor | null;
  reactions: MessageReactionSummary[];
  attachments: MessageAttachmentSummary[];
  /** スレッドの親に付く返信の概要（返信が無ければ null）。participants は返信した人を新しい順に最大 3 人 */
  thread: MessageThreadSummary | null;
  /** 「チャンネルにも投稿」した返信に付く親投稿の冒頭（それ以外は null）。親が削除済みなら excerpt は null */
  parentPreview: MessageParentPreview | null;
};

export type MessageThreadSummary = { lastReplyAt: string | null; participants: { id: string; name: string | null }[] };
export type MessageParentPreview = {
  id: string;
  excerpt: string | null;
  author: MessageAuthor | null;
  authorKind: MessageAuthorKind;
  askedBy: MessageAuthor | null;
  deleted: boolean;
  /** スレッドの最終返信の時刻。この返信より新しければ「新しい返信を確認する」を出す */
  lastReplyAt: string | null;
};

export type ListMessagesQuery = {
  parentId?: string;
  before?: string;
  after?: string;
  limit?: number;
};

export type CreateMessageInput = {
  content?: string;
  parentId?: string | null;
  broadcastToChannel?: boolean;
  attachmentIds?: string[];
};

export type UpdateMessageInput = { content: string };

/** POST /message/channels/:id/typing — 「入力中」の合図。parentId はスレッドで打っているとき、stopped は取り下げ */
export type MessageTypingInput = { parentId?: string | null; stopped?: boolean };

export type SearchMessagesQuery = {
  q: string;
  channelId?: string;
  userId?: string;
  from?: string;
  to?: string;
  hasAttachment?: boolean;
  limit?: number;
  offset?: number;
};

/** GET /message/activity の 1 行（メンション / 返信 / リアクション / DM の実体化） */
export type MessageNotification = {
  id: string;
  organizationId: string;
  userId: string;
  kind: "mention" | "reply" | "reaction" | "dm";
  channelId: string;
  messageId: string;
  actorId: string | null;
  emoji: string | null;
  readAt: string | null;
  createdAt: string;
  content: string;
  author: MessageAuthor | null;
  authorKind: MessageAuthorKind;
  askedBy: MessageAuthor | null;
};

/** GET /message/channels/:channelId/pins の 1 行（メッセージ本文を JOIN 済み） */
export type MessagePin = {
  id: string;
  organizationId: string;
  channelId: string;
  messageId: string;
  pinnedBy: string | null;
  pinnedAt: string;
  content: string;
  messageUserId: string | null;
  messageCreatedAt: string;
  messageEditedAt: string | null;
  /** スレッドの返信なら親の投稿 ID（チャンネルにも投稿した返信は messageBroadcastToChannel が true） */
  messageParentId: string | null;
  messageBroadcastToChannel: boolean;
  author: MessageAuthor | null;
  authorKind: MessageAuthorKind;
  askedBy: MessageAuthor | null;
  /** ピン留めした人の名前（ユーザーが引けなければ null） */
  pinnedByName: string | null;
  /** 投稿と同じ形のリアクション・添付（ピン一覧でも投稿をそのまま見せるため） */
  reactions: MessageReactionSummary[];
  attachments: MessageAttachmentSummary[];
};

/** POST /message/channels/:channelId/scheduled */
export type CreateMessageScheduledInput = {
  content: string;
  parentId?: string | null;
  /** ISO 日時。未来日時であること */
  scheduledFor: string;
};

export type MessageScheduledMessage = {
  id: string;
  organizationId: string;
  channelId: string;
  userId: string;
  parentId: string | null;
  content: string;
  scheduledFor: string;
  claimedAt: string | null;
  sentAt: string | null;
  failedReason: string | null;
  createdAt: string;
};

/** POST /message/reminders（messageId か note のいずれかが必須） */
export type CreateMessageReminderInput = {
  messageId?: string | null;
  note?: string | null;
  remindAt: string;
};

export type MessageReminder = {
  id: string;
  organizationId: string;
  userId: string;
  messageId: string | null;
  channelId: string | null;
  note: string | null;
  remindAt: string;
  doneAt: string | null;
  notifiedAt: string | null;
  createdAt: string;
};

/** GET /message/reminders の 1 行（投稿の本文と投稿者を付ける。見えなくなった投稿は null） */
export type MessageReminderListItem = MessageReminder & {
  messageContent: string | null;
  messageDeletedAt: string | null;
  author: MessageAuthor | null;
  authorKind: MessageAuthorKind;
  askedBy: MessageAuthor | null;
};

/** POST /message/emoji（png/gif/jpeg/webp のみ・256KB 上限） */
export type CreateMessageCustomEmojiInput = {
  name: string;
  contentType: string;
  sizeBytes: number;
};

export type MessageCustomEmoji = {
  id: string;
  organizationId: string;
  name: string;
  s3Key: string;
  createdBy: string | null;
  usageCount: number;
  createdAt: string;
};

/**
 * GET /message/emoji の 1 件。画像の署名つき URL（期限 1 時間）を同梱する。使われた回数の多い順に 500 件まで署名し、
 * それより後と、まだアップロードが終わっていない行は画像が出ない（null か 404）ので名前で代わりに出す
 */
export type MessageCustomEmojiListItem = MessageCustomEmoji & { imageUrl?: string | null };

/** POST /message/emoji のレスポンス（upload_url へ直 PUT したのち complete で確定） */
export type CreateMessageCustomEmojiResult = {
  emoji: MessageCustomEmoji;
  upload_url: string;
  expires_in: number;
};

/**
 * GET /message/permission-context — 画面の出し分けに使う権限の材料のうち「自分のこと」。
 * 投稿・チャンネルの応答に入っている投稿者・作成者と合わせて `@qaito/modules/message/permissions` の規則で評価する。
 */
export type MessagePermissionContext = {
  userId: string;
  /** 組織の管理者（管理コンソールに入れる人）。常に Piazza の管理者（role は admin） */
  isAdmin: boolean;
  /** Piazza の役（管理者・モデレーター・メンバー）。画面は @qaito/modules/message/permissions の規則に渡す */
  role: MessageRole;
};

/** POST /message/channels/facility（施設チャンネルの get-or-create。console 柱アクセス限定） */
export type CreateMessageFacilityChannelInput = { facilityId: string };

export type MessageAttachmentKind = "all" | "image" | "other";

/** GET /message/attachments のクエリ */
export type ListMessageAttachmentsQuery = {
  channelId?: string;
  kind?: MessageAttachmentKind;
  q?: string;
  limit?: number;
  offset?: number;
};

/** GET /message/attachments の 1 行（投稿と投稿者を JOIN 済み） */
export type MessageAttachmentListItem = {
  id: string;
  channelId: string;
  messageId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  messageCreatedAt: string | null;
  author: MessageAuthor | null;
  authorKind: MessageAuthorKind;
  askedBy: MessageAuthor | null;
};

/** POST /message/channels/:channelId/attachments の入力 */
export type CreateMessageAttachmentUploadInput = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

/** POST /message/channels/:channelId/attachments の応答（presigned PUT。`upload_url` へ直 PUT） */
export type MessageAttachmentUploadTicket = {
  attachment_id: string;
  upload_url: string;
  expires_in: number;
};

export type MessageAttachmentStatus = "pending" | "ready";

/** 添付行（POST /message/attachments/:id/complete の応答） */
export type MessageAttachment = {
  id: string;
  organizationId: string;
  messageId: string | null;
  channelId: string;
  /** 退職・削除で null */
  uploadedBy: string | null;
  s3Key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: MessageAttachmentStatus;
  createdAt: string;
};

/** GET /message/authors の 1 行 */
export type MessageAuthorListItem = { userId: string; name: string };

/** GET /message/mention-targets の 1 行（@ で所属の全員に知らせられるグループ・事業所） */
export type MessageMentionTarget = { kind: "group" | "facility"; id: string; name: string };

/** GET /message/channels/:channelId/active-days（その月に投稿のある日・JST の YYYY-MM-DD 昇順） */
export type MessageActiveDays = { month: string; days: string[] };

/** GET /message/directory の 1 行 */
/** GET /message/people/photos の 1 行（写真のある人だけ。version は写真の鍵の最後の部分で ?v= に使う） */
export type MessagePersonPhoto = { userId: string; version: string };
/** GET /message/people/:userId/photo（短い期限の署名 URL） */
export type MessagePhotoTicket = { url: string };

export type MessageDirectoryUser = {
  userId: string;
  name: string;
  /** ステータス（本人が設定した今の状況）。未設定は null */
  statusEmoji: string | null;
  statusText: string | null;
  /** 職種（職員台帳の役割の名前・並び順どおり）。職員台帳にいない人・見えない人は空 */
  jobRoles: string[];
};

/** GET /message/threads のクエリ */
export type ListMessageThreadsQuery = { limit?: number; offset?: number };

/** GET /message/threads の 1 行（親投稿 + 返信集計 + 自分の既読） */
export type MessageThreadListItem = {
  id: string;
  channelId: string;
  userId: string | null;
  content: string;
  replyCount: number;
  createdAt: string;
  author: MessageAuthor | null;
  authorKind: MessageAuthorKind;
  askedBy: MessageAuthor | null;
  lastReplyAt: string | null;
  actualReplyCount: number;
  lastReadAt: string | null;
  hasUnread: boolean;
};

/** GET /message/reminders のクエリ（既定 open） */
export type ListMessageRemindersQuery = { status?: "open" | "done" | "all" };

/**
 * 未読のまとめ（GET /message/unread-summary）。モバイルのバッジ・見出しの件数。
 * どれも 100 で数え止める（100 は「99 件を超えている」の意味）。
 */
export type MessageUnreadSummary = {
  /** 未読のアクティビティ（自分あてのメンション・返信・リアクション・DM の通知）。バッジはこの数 */
  activity: number;
  /** 未読の投稿がある、参加中の DM・グループ DM の数 */
  directChannels: number;
  /** 未読の投稿がある、参加中のチャンネルの数（DM・アーカイブ済みを除く） */
  channels: number;
};

/** アクティビティの出し分け（個人設定・staff.message_user_prefs） */
export type MessageUserPrefs = {
  showMention: boolean;
  showReply: boolean;
  showReaction: boolean;
  showBroadcast: boolean;
  /** ステータス（プロフィール・ディレクトリに出す今の状況）。未設定は null */
  statusEmoji: string | null;
  statusText: string | null;
  /** スマートフォンへの push を受け取るか（アクティビティの行は止めない） */
  pushEnabled: boolean;
  /** push を止める時間帯（JST の "HH:MM"・日をまたいでよい）。無ければ両方 null */
  quietStart: string | null;
  quietEnd: string | null;
};

/** PATCH /message/prefs の入力（いずれか 1 項目以上。ステータスは空文字で外す） */
export type UpdateMessageUserPrefsInput = Partial<Omit<MessageUserPrefs, "statusEmoji" | "statusText">> & {
  statusEmoji?: string;
  statusText?: string;
};

/** 位置 1 点（WGS 84） */
export type MapPoint = { latitude: number; longitude: number };

/** POST /map/route-legs の body（区間は最大 60。区間 1 つが Amazon Location の 1 ルート分の課金） */
export type MapRouteLegsInput = {
  legs: { from: MapPoint; to: MapPoint }[];
};

export type MapRouteLegsResult = {
  /** 入力と同じ順。車で走る分数（切り上げ）。その区間だけ計算できなければ null */
  legs: { minutes: number | null }[];
};

export type VoiceTranscribeResult = {
  /** 認識テキスト（表記の後段補正まで済んだもの）。0 文字のときは 422 なので常に 1 文字以上 */
  text: string;
};

/** GET /client/customer/clients/:id/actual-timeline の 1 件（記録 4 種 + 送迎 + モニタリング / 評価）。 */
export type CustomerActualTimelineEvent = {
  event_type: string;
  /** YYYY-MM-DD */
  event_date: string;
  id: string;
  payload: Record<string, unknown>;
};

/** GET /client/customer/clients/:id/actual-timeline・/timeline・/monitorings のクエリ。 */
export type CustomerMonthsQuery = {
  /** 遡る月数（上限 24） */
  months?: number;
};

/** GET /client/customer/clients/:id/care-trend — 要介護度 × ADL の推移。 */
export type CustomerCareTrend = {
  certifications: Array<{
    care_level: string;
    certified_date: string;
    valid_from: string;
  }>;
  assessmentsWithAdl: Array<{
    assessed_at: string;
    adl: {
      walking: string | null;
      eating: string | null;
      bathing: string | null;
      toileting: string | null;
      dressing: string | null;
    } | null;
  }>;
};

/** GET /client/customer/clients/:id/certification-alert — 認定期限と再アセスメントの目安。 */
export type CustomerCertificationAlert = {
  daysUntilExpiry: number | null;
  validUntil: string | null;
  careLevel: string | null;
  latestAssessmentAt: string | null;
  daysSinceAssessment: number | null;
};

/** GET /client/customer/clients/:id/timeline の 1 件（介護認定・アセスメント・録音の出来事）。 */
export type CustomerTimelineEvent = {
  type: "certification" | "assessment" | "recording";
  date: string;
  payload: Record<string, unknown>;
};

/** GET /client/customer/clients/:id/care-records のクエリ。 */
export type CustomerCareRecordsQuery = {
  /** 遡る月数（既定 12・上限 24） */
  months?: number;
  /** 記録の種類ごとの最大件数（既定 50・上限 100） */
  limit_per_source?: number;
};

/** GET /client/customer/clients/:id/care-records の 1 件。 */
export type CustomerCareRecordEvent = {
  type: "vitals" | "care_record" | "training_record" | "contact_note" | "transport_log";
  /** YYYY-MM-DD */
  date: string;
  id: string;
  payload: Record<string, unknown>;
};

/** GET /client/customer/clients/:id/monitorings — モニタリングと計画評価。 */
export type CustomerMonitoringList = {
  monitorings: Array<{
    id: string;
    monitoring_date: string;
    short_goal_status: string | null;
    long_goal_status: string | null;
    client_condition: string | null;
    family_opinion: string | null;
    service_status: string | null;
    plan_change_required: boolean;
    plan_change_reason: string | null;
  }>;
  evaluations: Array<{
    id: string;
    evaluation_date: string;
    evaluation_type: string;
    short_goal_achievement: string | null;
    long_goal_achievement: string | null;
    overall_assessment: string | null;
    reason_for_change: string | null;
    next_plan_direction: string | null;
  }>;
};

/** GET /client/customer/contracts の 1 行（契約状況つき利用者一覧）。 */
export type CustomerContractClient = {
  id: string;
  name: string;
  active_plan_count: number;
  total_plan_count: number;
  latest_valid_until: string | null;
};

/** GET /client/clients/:client_id/registrations/current・/client/registrations/current・/client/clients/:client_id/certifications/current のクエリ。 */
export type CurrentInsuranceQuery = {
  /** 基準日（YYYY-MM-DD。省略時は業務日の今日） */
  as_of?: string;
};

/** その日に有効な被保険者証 1 件（番号の正は insurance_registrations の期間履歴）。 */
export type CurrentInsuranceRegistration = {
  clientId: string;
  insuredNumber: string;
  insurerNumber: string;
  insurerName: string | null;
  validFrom: string;
  validUntil: string | null;
};

/** GET /client/certificates のクエリ。 */
export type ClientCertificateListQuery = {
  /** 事業所で絞る（画面の絞り込みで、認可の境界ではない） */
  facility_id?: string;
};

/** GET /client/certificates の 1 行（利用者 × 証 4 種の要約）。 */
export type ClientCertificateSummary = {
  id: string;
  name: string;
  current_care_level: string | null;
  current_copay_ratio: number | null;
  copay_valid_until: string | null;
  insurer_number: string | null;
  kohi_count: number;
  /** 30 日以内に期限切れとなる証（負担割合・保険者登録・公費）があるか */
  expiring_soon: boolean;
};

/** GET /client/clients/:client_id/service-schedule — 有効契約の利用曜日・提供時間。 */
export type ClientServiceSchedule = {
  /** ISO weekday（1=月〜7=日）。null = 未設定 / [] = 休み */
  days: number[] | null;
  /** "HH:MM" */
  start_time: string | null;
  end_time: string | null;
  facility_id: string | null;
  /** 曜日ごとの提供時間（共通と違う曜日だけ。キーは ISO weekday の文字列）。null = 全曜日が共通 */
  day_times: ClientServiceDayTimes | null;
};

/** 曜日ごとの提供時間（`{ "5": { start: "10:00", end: "15:00" } }`）。 */
export type ClientServiceDayTimes = Partial<Record<"1" | "2" | "3" | "4" | "5" | "6" | "7", { start: string; end: string }>>;

/**
 * PUT /client/clients/:client_id/service-schedule の入力。
 * **`days` が 1 つ以上なら `start_time` / `end_time`（`"HH:MM"`・開始 < 終了）は必須**（無いと 400）。
 * `days: []`（休み）のときだけ省けて、省くと提供時間は変わらない。
 */
export type SetClientServiceScheduleInput = {
  days: number[];
  start_time?: string | null;
  end_time?: string | null;
  facility_id?: string | null;
  /** 曜日ごとの提供時間（共通と違う曜日だけ・開始 < 終了）。省くと変わらない・null で消す */
  day_times?: ClientServiceDayTimes | null;
};

/** GET /client/service-days のクエリ。 */
export type ClientServiceDaysQuery = {
  facility_id?: string;
};

/** GET /client/service-days の 1 行（有効な契約が無い利用者は載らない）。 */
export type ClientServiceDays = {
  client_id: string;
  /** ISO weekday（1=月〜7=日）。[] = 休み */
  service_days: number[];
};

/** PUT /client/clients/:client_id/documents/:id/ocr-result の入力（中身のキーは変換しない）。 */
export type SaveClientDocumentOcrResultInput = {
  ocr_result: Record<string, unknown>;
};

/** GET /clinical-record/clients/:client_id/bundle — 1 利用者の臨床記録 6 種（行は snake_case）。 */
export type ClinicalRecordBundle = {
  instructions: Array<{
    id: string; instruction_type: string; document_status: string;
    issuing_institution_id: string | null; issuing_doctor_name: string | null;
    issue_date: string | null; valid_from: string | null; valid_until: string | null;
    content_summary: string | null; memo: string | null;
  }>;
  conditions: Array<{
    id: string; category: string; condition_code: string; condition_label: string;
    valid_from: string; valid_until: string | null; basis_diagnosis_id: string | null;
    basis_note: string | null; confirmed_at: string | null;
  }>;
  diagnoses: Array<{
    id: string; disease_code: string | null; disease_name: string; icd10_code: string | null;
    is_primary: boolean; is_psychiatric: boolean; onset_date: string | null;
    outcome: string | null; end_date: string | null;
    /** 診てもらっている通院先（同じ利用者の client_medical の行 ID） */
    client_medical_id: string | null;
  }>;
  hospitalizations: Array<{
    id: string; episode_kind: string; institution_id: string | null;
    institution_name_snapshot: string | null; admission_date: string; discharge_date: string | null;
    memo: string | null;
  }>;
  renkeiEvents: Array<{
    id: string; service_category: string; service_type_code: string; event_type: string;
    event_date: string; event_time: string | null; institution_id: string | null;
    hospitalization_episode_id: string | null; method: string | null; counterpart: string | null;
    body: string | null;
    participants: unknown; extra_data: Record<string, unknown> | null;
    /** 確定（訪問看護の退院時共同指導）。null = 下書き */
    confirmed_at: string | null; confirmed_by_name: string | null;
  }>;
  doctorExams: Array<{
    id: string; service_category: string; service_type_code: string; examination_date: string;
    doctor_kind: string; doctor_name: string | null; institution_id: string | null;
    info_provided_date: string | null; doctor_training_completed: boolean | null; memo: string | null;
  }>;
  truncatedKinds?: Array<"instructions" | "conditions" | "diagnoses" | "hospitalizations" | "renkei-events" | "doctor-exams">;
};

/** GET /equipment-rental/catalog/:id/default-price のクエリ（camelCase）。 */
export type EquipmentDefaultPriceQuery = {
  facilityId: string;
  /** 基準日（YYYY-MM-DD。省略時は業務日の今日） */
  asOf?: string;
};

/** GET /equipment-rental/catalog/:id/default-price — 月額の初期値（定価が無ければ null）。 */
export type EquipmentDefaultPrice = {
  monthlyPriceYen: number | null;
  asOf: string;
};

/** Piazza の役。組織の管理者は常に admin・割り当てが無ければ member */
export type MessageRole = "admin" | "moderator" | "member";

/** POST /message/roles（人かグループのどちらか一方。同じ相手に別の役があれば付け替え） */
export type AssignMessageRoleInput =
  | { role: "admin" | "moderator"; userId: string }
  | { role: "admin" | "moderator"; groupId: string };

/** 役の割り当て 1 行（相手は人かグループ） */
export type MessageRoleAssignment = {
  id: string;
  role: "admin" | "moderator";
  subjectKind: "user" | "group";
  subjectId: string;
  name: string | null;
  /** 人が退職している（グループは常に false） */
  archived: boolean;
  /** グループの人数（人なら null） */
  memberCount: number | null;
  /** グループの在籍のメンバー（人なら null） */
  memberIds: string[] | null;
  createdAt: string;
};

/** GET /message/roles（役の画面がこれ 1 本で描ける。Piazza の管理者だけ） */
export type MessageRolesView = {
  assignments: MessageRoleAssignment[];
  /** 常に管理者の人（組織の管理者。外せない） */
  orgAdmins: { userId: string; name: string }[];
  /** 追加の候補（組織の在籍の職員とグループ） */
  candidates: {
    users: { userId: string; name: string }[];
    groups: { groupId: string; name: string; memberCount: number; memberIds: string[] }[];
  };
  /** 呼んだ本人（自分の役が変わる警告の計算に使う） */
  me: { userId: string; isOrgAdmin: boolean; groupIds: string[] };
};

/** 日次業務のアイコンのキー（`@qaito/schemas` の `DAILY_JOB_ICONS`） */
export type DayserviceDailyJobIcon =
  | "task"
  | "disinfect"
  | "clean"
  | "ventilate"
  | "laundry"
  | "trash"
  | "meal"
  | "drink"
  | "bath"
  | "temperature"
  | "inspect"
  | "document";

/** GET /dayservice/daily-jobs のクエリ */
export type DayserviceDailyJobsQuery = {
  facility_id: string;
  /** true で非表示の業務も */
  include_archived?: boolean;
};

/** 日次業務 1 件 */
export type DayserviceDailyJob = {
  id: string;
  name: string;
  /** JST の HH:mm */
  dueTime: string;
  icon: string;
  sortOrder: number;
  /** 場面（prepare = 準備 / cleanup = 片付け / null = 指定なし） */
  scene: string | null;
  archivedAt: string | null;
};

/** POST /dayservice/daily-jobs の body */
export type CreateDayserviceDailyJobInput = {
  facilityId: string;
  name: string;
  /** JST の HH:mm */
  dueTime: string;
  icon?: DayserviceDailyJobIcon;
  sortOrder?: number;
  scene?: "prepare" | "cleanup" | null;
};

/** PATCH /dayservice/daily-jobs/:id の body（送った項目だけ直す） */
export type UpdateDayserviceDailyJobInput = {
  facilityId: string;
  name?: string;
  dueTime?: string;
  icon?: DayserviceDailyJobIcon;
  sortOrder?: number;
  scene?: "prepare" | "cleanup" | null;
};

/** 日次チェックの 1 マス（日次業務 + その日の完了） */
export type DayserviceDailyCheckItem = {
  id: string;
  name: string;
  dueTime: string;
  icon: string;
  sortOrder: number;
  scene: string | null;
  checked: boolean;
  checkedAt: string | null;
  checkedByName: string | null;
  /** 非表示にした業務（その日に完了記録が残っているときだけ出る） */
  archived: boolean;
};

/** GET /dayservice/daily-checks のレスポンス（時刻順） */
export type DayserviceDailyChecks = {
  facilityId: string;
  date: string;
  jobs: DayserviceDailyCheckItem[];
};

/** PUT /dayservice/daily-checks の body */
export type SetDayserviceDailyJobCheckInput = {
  jobId: string;
  date: string;
  checked: boolean;
};

/** PUT /dayservice/daily-checks のレスポンス */
export type DayserviceDailyJobCheck = {
  jobId: string;
  date: string;
  checked: boolean;
  checkedAt: string | null;
  checkedByName: string | null;
};

/** 削除・非表示化・取り消しのクエリ（facility_id のみ。id はパス） */
export type DayserviceFacilityQuery = {
  facility_id: string;
};

/** DELETE /dayservice/daily-jobs/:id ・ /drink-board/menus/:id ・ /seating/rules/:id のレスポンス */
export type DayserviceBoardDeleted = { id: string };

export type DayserviceDrinkOption = "with" | "without";

/** ドリンクのメニュー 1 件 */
export type DayserviceDrinkMenu = {
  id: string;
  name: string;
  sortOrder: number;
  allowSugar: boolean;
  allowMilk: boolean;
  /** カテゴリ（null = なし） */
  category: string | null;
  /** 色（chart-1〜chart-8・null = 既定） */
  color: string | null;
  archivedAt: string | null;
};

/** 注文 1 件 */
export type DayserviceDrinkOrder = {
  id: string;
  menuId: string | null;
  /** 注文したときのメニュー名の写し */
  menuName: string;
  sugar: DayserviceDrinkOption | null;
  milk: DayserviceDrinkOption | null;
};

/** ドリンクボード 1 行（名簿の 1 人） */
export type DayserviceDrinkBoardRow = DayserviceClientNameColumns & {
  scheduleId: string;
  clientId: string;
  attendanceStatus: string;
  orders: DayserviceDrinkOrder[];
};

/** GET /dayservice/drink-board のレスポンス */
export type DayserviceDrinkBoard = {
  rows: DayserviceDrinkBoardRow[];
  menus: DayserviceDrinkMenu[];
  /** メニューごとの注文数（欠席の人は数えない・砂糖ミルクの内訳は添えない） */
  totals: { menuId: string | null; menuName: string; count: number }[];
  scope: { client: { read: boolean }; schedule: { read: boolean } };
};

/** GET /dayservice/drink-board/menus のクエリ */
export type DayserviceDrinkMenusQuery = {
  facility_id: string;
  include_archived?: boolean;
};

/** PUT /dayservice/drink-board/menus の body（id なし = 作る〔name 必須〕/ id あり = 直す） */
export type SaveDayserviceDrinkMenuInput = {
  facilityId: string;
  id?: string;
  name?: string;
  allowSugar?: boolean;
  allowMilk?: boolean;
  sortOrder?: number;
  category?: string | null;
  color?: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5" | "chart-6" | "chart-7" | "chart-8" | null;
};

/** PUT /dayservice/drink-board/orders の body（その人のその日の注文を置き換える） */
export type SetDayserviceDrinkOrderInput = {
  facilityId: string;
  date: string;
  clientId: string;
  orders: { menuId: string; sugar?: DayserviceDrinkOption; milk?: DayserviceDrinkOption }[];
};

/** 請求書とのつながり。issued = 発行済みの請求書の行（足す・直す・取り消すは 409）・draft = 下書きの請求書の行・none = まだ */
export type DayserviceSelfPayInvoiceState = "none" | "draft" | "issued";

/** 自費購入 1 件。名前・単位はマスタの品目なら今のマスタの値・その 1 回限りの物ならその行の値 */
export type DayserviceSelfPayPurchase = {
  id: string;
  facilityId: string;
  clientId: string;
  serviceDate: string;
  /** マスタの品目（その 1 回限りの物は null） */
  selfPayItemId: string | null;
  name: string;
  unit: string;
  /** マスタで使わなくした品目 */
  itemArchived: boolean;
  quantity: number;
  unitPriceYen: number;
  /** 足したときにマスタの単価と違う額を入れた */
  priceOverridden: boolean;
  amountYen: number;
  taxClass: "taxable" | "nontaxable";
  medicalDeductionClass: "medical" | "welfare" | "none";
  note: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  invoiceState: DayserviceSelfPayInvoiceState;
};

/** GET /dayservice/self-pay-purchases のレスポンス */
export type DayserviceSelfPayPurchaseList = {
  rows: DayserviceSelfPayPurchase[];
  totalAmountYen: number;
};

/** GET /dayservice/self-pay-purchases のクエリ（date か ym のどちらか一方） */
export type DayserviceSelfPayPurchasesQuery = {
  facility_id: string;
  date?: string;
  ym?: string;
  client_id?: string;
};

/** 選べる品目。unitPriceYen が null = 単価を決めていない品目（購入のときに額を入れる） */
export type DayserviceSelfPayItemOption = {
  id: string;
  name: string;
  unit: string;
  unitPriceYen: number | null;
  taxClass: "taxable" | "nontaxable";
  medicalDeductionClass: "medical" | "welfare" | "none";
};

/** POST /dayservice/self-pay-purchases の body。selfPayItemId（マスタ）か name（その 1 回限り）のどちらか一方 */
export type CreateDayserviceSelfPayPurchaseInput = {
  facilityId: string;
  clientId: string;
  serviceDate: string;
  quantity: number;
  selfPayItemId?: string;
  name?: string;
  unit?: string;
  /** マスタの品目では違う額にするときだけ（上書きの印が立つ）。単価の無い品目・その 1 回限りの物は必須 */
  unitPriceYen?: number;
  taxClass?: "taxable" | "nontaxable";
  note?: string;
};

/** PATCH /dayservice/self-pay-purchases/:id の body（数量・単価・一言だけ） */
export type UpdateDayserviceSelfPayPurchaseInput = {
  quantity?: number;
  unitPriceYen?: number;
  note?: string | null;
};

/** POST /dayservice/self-pay-purchases/with-new-item の body（品目の登録は user-billing:write の人だけ） */
export type CreateDayserviceSelfPayPurchaseWithNewItemInput = {
  facilityId: string;
  clientId: string;
  serviceDate: string;
  quantity: number;
  unitPriceYen?: number;
  note?: string;
  item: {
    name: string;
    unit: string;
    /** null = 単価を決めていない品目 */
    unitPriceYen: number | null;
    taxClass: "taxable" | "nontaxable";
    medicalDeductionClass?: "medical" | "welfare" | "none";
  };
};

/** DELETE /dayservice/drink-board/orders のクエリ */
export type ClearDayserviceDrinkOrderQuery = {
  facility_id: string;
  date: string;
  client_id: string;
};

export type DayserviceBoardSetting = {
  clientId: string;
  /** 入浴しない人（入浴ボードのタスクと進捗の分母から外す） */
  bathExcluded: boolean;
  /** 食事をとらない人（主食・副食の入力と未入力の印を外す） */
  mealExcluded: boolean;
};

/** PUT /dayservice/board-settings の body（省いた項目は触らない・どちらかは渡す） */
export type SetDayserviceBoardSettingInput = {
  facilityId: string;
  clientId: string;
  bathExcluded?: boolean;
  mealExcluded?: boolean;
};

export type DayserviceExerciseMenu = {
  id: string;
  name: string;
  sortOrder: number;
  /** 実施時間の初めの値（分・null = 入れない）。チェックで作る個別機能訓練の記録の duration_min に入る */
  defaultMinutes: number | null;
  archivedAt: string | null;
};

/** 機能訓練ボードの進み具合（割り当ての数で等分・全部チェックで済） */
export type DayserviceExerciseProgress = { total: number; done: number; complete: boolean };

/** 機能訓練ボード 1 行（名簿の 1 人） */
export type DayserviceExerciseBoardRow = DayserviceClientNameColumns & {
  scheduleId: string;
  clientId: string;
  attendanceStatus: string;
  /** 割り当てたメニュー（並び順）と、その日にチェックしたか */
  menus: { menuId: string; name: string; checked: boolean }[];
  progress: DayserviceExerciseProgress;
  /** その日に有効な個別機能訓練計画書があるか（介護記録の閲覧権限が無い・欠席なら null） */
  hasTrainingPlan: boolean | null;
  /** 加算の欄（運動が 1 つでも済み かつ 計画書あり）。計画書の有無が分からなければ null */
  additionEligible: boolean | null;
};

/** GET /dayservice/exercise-board のレスポンス */
export type DayserviceExerciseBoard = {
  rows: DayserviceExerciseBoardRow[];
  menus: DayserviceExerciseMenu[];
  scope: { client: { read: boolean }; schedule: { read: boolean } };
  /** 加算の欄を出せるか（介護記録の閲覧権限） */
  additionReadable: boolean;
};

/** GET /dayservice/exercise-board/menus のクエリ */
export type DayserviceExerciseMenusQuery = {
  facility_id: string;
  include_archived?: boolean;
};

/** PUT /dayservice/exercise-board/menus の body（id なし = 作る〔name 必須〕/ id あり = 直す） */
export type SaveDayserviceExerciseMenuInput = {
  facilityId: string;
  id?: string;
  name?: string;
  sortOrder?: number;
  /** 実施時間の初めの値（分・1〜600。null で消す・省くと触らない） */
  defaultMinutes?: number | null;
};

/** PUT /dayservice/exercise-board/assignments の body（その人の割り当てを置き換える） */
export type SetDayserviceClientExerciseMenusInput = {
  facilityId: string;
  clientId: string;
  menuIds: string[];
};

/** PUT /dayservice/exercise-board/checks の body（その人のその日のチェックを置き換える） */
export type SetDayserviceExerciseChecksInput = {
  facilityId: string;
  date: string;
  clientId: string;
  menuIds: string[];
};

/** PUT /dayservice/exercise-board/checks/bulk の body（人ごとに足す・外す） */
export type BulkSetDayserviceExerciseChecksInput = {
  facilityId: string;
  date: string;
  changes: { clientId: string; add?: string[]; remove?: string[] }[];
};

/** PUT /dayservice/exercise-board/checks/bulk のレスポンス */
export type DayserviceExerciseChecksBulkResult = {
  /** 確定した日（何も動かしていない） */
  dayClosed: boolean;
  /** 動かした人と、足した・外したメニュー（元に戻すは入れ替えてもう一度呼ぶ） */
  applied: { clientId: string; added: string[]; removed: string[]; progress: DayserviceExerciseProgress }[];
  /** 動かさなかった人と理由 */
  skippedPeople: { clientId: string; reason: "notAttending" | "absent" | "notAssigned" | "unchanged" | "failed" }[];
};

export type DayserviceSeatingRuleKind = "avoid" | "prefer";

/** 机 1 つ */
export type DayserviceSeatingDesk = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seatCount: number;
  sortOrder: number;
};

/** 配置 1 件 */
export type DayserviceSeatingPlacement = { deskId: string; seatNo: number; clientId: string };

/** 座席表 1 枚 */
export type DayserviceSeatingChart = {
  id: string;
  date: string;
  copiedFromDate: string | null;
  desks: DayserviceSeatingDesk[];
  placements: DayserviceSeatingPlacement[];
};

/** 座席表に出る人（その日の名簿 + 名簿から外れたが席に置いてある人） */
export type DayserviceSeatingPerson = DayserviceClientNameColumns & {
  clientId: string;
  onRoster: boolean;
  attendanceStatus: string | null;
};

/** 座席の相性 1 件（相手の氏名つき） */
export type DayserviceSeatingRule = {
  id: string;
  clientAId: string;
  clientBId: string;
  kind: DayserviceSeatingRuleKind;
  reason: string | null;
  a: DayserviceClientNameColumns;
  b: DayserviceClientNameColumns;
};

/** GET /dayservice/seating のレスポンス */
export type DayserviceSeatingBoard = {
  /** その日の座席表。無ければ null（開いただけでは作らない） */
  chart: DayserviceSeatingChart | null;
  people: DayserviceSeatingPerson[];
  rules: DayserviceSeatingRule[];
  /** 送迎の相性（参考表示・read のみ） */
  transportHints: { clientAId: string; clientBId: string; relation: DayserviceSeatingRuleKind }[];
  /** 相性の違反（warning = 離す 2 人が同じ机 / notice = 近くに置く 2 人が別の机） */
  conflicts: {
    level: "warning" | "notice";
    kind: DayserviceSeatingRuleKind;
    clientAId: string;
    clientBId: string;
    deskId: string | null;
  }[];
  /** その日より前でいちばん新しい座席表の日 */
  lastChartDate: string | null;
  scope: { client: { read: boolean }; schedule: { read: boolean }; transport: { read: boolean } };
};

/** 過去の座席表 1 件 */
export type DayserviceSeatingChartListItem = {
  date: string;
  copiedFromDate: string | null;
  deskCount: number;
  placedCount: number;
  createdAt: string;
};

/** POST /dayservice/seating/charts の body */
export type CreateDayserviceSeatingChartInput = {
  facilityId: string;
  date: string;
  /** 写し元の日（省くと机ゼロの新規） */
  copyFromDate?: string;
};

/** PUT /dayservice/seating/desks の body（座席表の机を desks の通りにそろえる） */
export type SaveDayserviceSeatingDesksInput = {
  facilityId: string;
  date: string;
  desks: {
    id?: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    seatCount: number;
  }[];
};

/** PUT /dayservice/seating/placements の body（deskId と seatNo を省く / null で席から外す） */
export type PlaceDayserviceSeatingClientInput = {
  facilityId: string;
  date: string;
  clientId: string;
  deskId?: string | null;
  seatNo?: number | null;
};

/** PUT /dayservice/seating/rules の body */
export type SaveDayserviceSeatingRuleInput = {
  facilityId: string;
  clientAId: string;
  clientBId: string;
  kind: DayserviceSeatingRuleKind;
  reason?: string | null;
};

/** PUT /dayservice/seating/rules のレスポンス */
export type DayserviceSeatingRuleSaved = {
  id: string;
  clientAId: string;
  clientBId: string;
  kind: DayserviceSeatingRuleKind;
  reason: string | null;
};

/**
 * 電話番号の逆引きの 1 件（種類・id・名称・一致した番号〔E.164〕）。正本は `@qaito/schemas/external-masters`
 * （種類は外の相手のマスタ 4 つに、電話受付の逆引きで利用者・家族・職員・緊急連絡先・事業所・会社が加わった）。
 */
export type PhonePartyMatch = import("@qaito/schemas/external-masters").PhonePartyMatch;

/** 一覧の共通の検索条件（`q` は名称・ふりがな・住所・電話番号の部分一致） */
export type ListExternalMasterParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

/** 医療機関（組織ごとの行・`tool.medical_institutions`） */
export type MedicalInstitutionMaster = {
  id: string;
  organizationId: string;
  name: string;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  phone: string | null;
  fax: string | null;
  phoneE164: string | null;
  faxE164: string | null;
  institutionCode: string | null;
  medicalDepartment: string | null;
  memo: string | null;
  /** 統合した先（統合された側だけ。統合された側は削除済み） */
  mergedIntoId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
/** 医療機関の重なりの候補の 1 組（名前 × 診療科をそろえた鍵が同じ有効な行が 2 つ以上） */
export type MedicalInstitutionDuplicateGroup = {
  normalizedName: string;
  /** そろえた診療科（無ければ空文字） */
  normalizedDepartment: string;
  institutions: MedicalInstitutionMaster[];
};
export type CreateMedicalInstitutionMasterInput = {
  name: string;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  addressLine?: string | null;
  phone?: string | null;
  fax?: string | null;
  /** 組織の中で重なると 409 */
  institutionCode?: string | null;
  medicalDepartment?: string | null;
  memo?: string | null;
};
/** 送った項目だけを変える（空文字・null で消す） */
export type UpdateMedicalInstitutionMasterInput = Partial<CreateMedicalInstitutionMasterInput>;

/** 居宅介護支援事業所（`tool.care_offices`） */
export type CareOffice = {
  id: string;
  organizationId: string;
  name: string;
  nameKana: string | null;
  /** 事業所番号（10 桁） */
  officeNumber: string | null;
  officeKind: "kyotaku" | "houkatsu";
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  phone: string | null;
  fax: string | null;
  phoneE164: string | null;
  faxE164: string | null;
  memo: string | null;
  /** 統合した先（統合された側だけ・統合された側は削除済み） */
  mergedIntoId: string | null;
  /** 所属するケアマネジャーの人数 */
  managerCount: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
/** 重なりの候補の 1 組（名称の正規化〔NFKC・空白を除く〕が同じ居宅介護支援事業所） */
export type CareOfficeDuplicateGroup = {
  normalizedName: string;
  offices: CareOffice[];
};
export type CreateCareOfficeInput = {
  name: string;
  nameKana?: string | null;
  officeNumber?: string | null;
  /** 事業所の種類（省くと居宅介護支援事業所） */
  officeKind?: "kyotaku" | "houkatsu";
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  addressLine?: string | null;
  phone?: string | null;
  fax?: string | null;
  memo?: string | null;
};
export type UpdateCareOfficeInput = Partial<CreateCareOfficeInput>;
/** GET /care-office/offices の絞り込み（`officeKind` で種類に絞る） */
export type ListCareOfficesParams = ListExternalMasterParams & { officeKind?: "kyotaku" | "houkatsu" };
/** 統合（統合先の ID） */
export type MergeExternalMasterInput = { intoId: string };
/** CSV 一括取込（居宅介護支援事業所・ケアマネ・医療機関）。`dryRun`（既定 true）は下見で何も登録しない */
export type ExternalMasterImportInput = { csv: string; dryRun?: boolean };
/** 取込の行の結果。new = 新規 / exists = 登録済み（取り込まない）/ error = 直す必要がある */
export type ExternalMasterImportRow = {
  /** CSV の行番号（見出しが 1 行目） */
  line: number;
  name: string;
  status: "new" | "exists" | "error";
  /** 登録済みの行・登録した行の ID */
  id: string | null;
  /** 直す箇所（列の見出しと理由） */
  errors: { column: string; message: string }[];
};
export type ExternalMasterImportResult = {
  /** 書き込んだか（下見・エラーで止めたときは false） */
  committed: boolean;
  /** ファイル全体の問題（見出しが無い・行が多すぎる 等） */
  fileError: string | null;
  rows: ExternalMasterImportRow[];
  counts: { new: number; exists: number; error: number };
  /** 登録した件数 */
  created: number;
};

/** ケアマネジャー（`tool.care_managers`・所属先は任意） */
export type CareOfficeManager = {
  id: string;
  organizationId: string;
  careOfficeId: string | null;
  careOfficeName: string | null;
  name: string;
  nameKana: string | null;
  /** 介護支援専門員番号（8 桁・未登録は null） */
  cmNumber: string | null;
  phone: string | null;
  email: string | null;
  phoneE164: string | null;
  isActive: boolean;
  memo: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ListCareOfficeManagersParams = ListExternalMasterParams & {
  careOfficeId?: string;
  /** 担当を外れた人も含める */
  includeInactive?: boolean;
};
export type CreateCareOfficeManagerInput = {
  careOfficeId?: string | null;
  name: string;
  nameKana?: string | null;
  /** 介護支援専門員番号（8 桁の数字） */
  cmNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
  memo?: string | null;
};
export type UpdateCareOfficeManagerInput = Partial<CreateCareOfficeManagerInput>;

/** 関係先の電話番号 */
export type ContactPartyPhone = {
  id: string;
  label: string | null;
  phone: string;
  phoneE164: string | null;
  isPrimary: boolean;
};
export type ContactPartyKind = "organization" | "person";
export type ContactPartyCategory =
  | "vendor"
  | "government"
  | "care_support"
  | "volunteer"
  | "neighbor"
  | "applicant"
  | "other";
/** 関係先（`tool.contact_parties`。法人・団体の下に担当者を 1 段） */
export type ContactParty = {
  id: string;
  organizationId: string;
  kind: ContactPartyKind;
  parentId: string | null;
  parentName: string | null;
  name: string;
  nameKana: string | null;
  department: string | null;
  title: string | null;
  category: ContactPartyCategory;
  email: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  memo: string | null;
  mergedIntoId: string | null;
  /** 所属する担当者の人数 */
  childCount: number;
  phones: ContactPartyPhone[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ListContactPartiesParams = ListExternalMasterParams & {
  kind?: ContactPartyKind;
  category?: ContactPartyCategory;
  parentId?: string;
};
export type ContactPartyPhoneInput = { label?: string | null; phone: string; isPrimary?: boolean };
export type CreateContactPartyInput = {
  kind: ContactPartyKind;
  parentId?: string | null;
  name: string;
  nameKana?: string | null;
  department?: string | null;
  title?: string | null;
  category?: ContactPartyCategory;
  email?: string | null;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  addressLine?: string | null;
  memo?: string | null;
  /** 送ると全件を置き換える */
  phones?: ContactPartyPhoneInput[];
};
/** `kind` は変えられない */
export type UpdateContactPartyInput = Partial<Omit<CreateContactPartyInput, "kind">>;

/** 組織の思考度「じっくり」の設定（`GET /chat/thinking-policy`）。正本は `@qaito/schemas/chat-thinking` の同名の型 */
export type ChatThinkingPolicy = {
  /** 「じっくり」を使えるか */
  deepEnabled: boolean;
  /** 「じっくり」の 1 日（JST）の上限（組織全体のターン数） */
  deepDailyTurnLimit: number;
};
/** 思考度「じっくり」の組織の設定の保存（`PUT /chat/thinking-policy`・管理者だけ）。正本は `@qaito/schemas/chat-thinking` の同名の型 */
export type UpdateChatThinkingPolicyInput = {
  deepEnabled: boolean;
  /** 0〜10,000。0 は使えないのと同じ */
  deepDailyTurnLimit: number;
};

/** `GET /client/handover` のクエリ（事業所 × 日付） */
export type ClientHandoverQuery = {
  facility_id: string;
  /** YYYY-MM-DD */
  date: string;
};

/** 引き継ぎの要点の利用者 1 人分。読めなかった欄は null（`unavailable` に名前が載る） */
export type ClientHandoverDigestClient = {
  client_id: string;
  name: string | null;
  /** scheduled / attended / absent */
  status: string;
  start_time: string | null;
  end_time: string | null;
  cautions: {
    bath_care_note: string | null;
    nursing_care_note: string | null;
    memo: string | null;
    medication_management: string | null;
  };
  dietary: {
    staple_amount: string | null;
    side_amount: string | null;
    food_restrictions: string[] | null;
    notes: string | null;
  };
  medical: { diagnoses: string[]; notes: string[] } | null;
  handovers: { date: string; body: string; audience: string; author: string | null }[] | null;
  observations: { level: string; headline: string }[] | null;
};

/** `GET /client/handover` の応答 */
export type ClientHandoverDigest = {
  facility_id: string;
  date: string;
  total_count: number;
  clients: ClientHandoverDigestClient[];
  unavailable: string[];
};

type PhoneSchemas = typeof import("@qaito/schemas/phone");
export type PhoneReception = import("@qaito/schemas/phone").PhoneReception;
export type PhoneEndpoint = import("@qaito/schemas/phone").PhoneEndpoint;
export type PhoneReceptionHour = import("@qaito/schemas/phone").PhoneReceptionHour;
export type PhoneReceptionClosure = import("@qaito/schemas/phone").PhoneReceptionClosure;
export type PhoneMenuNode = import("@qaito/schemas/phone").PhoneMenuNode;
export type PhoneScriptItem = import("@qaito/schemas/phone").PhoneScriptItem;
export type PhoneNumberRule = import("@qaito/schemas/phone").PhoneNumberRule;
export type PhoneNotifyTarget = import("@qaito/schemas/phone").PhoneNotifyTarget;
export type PhoneChannelCredentialSummary = import("@qaito/schemas/phone").PhoneChannelCredentialSummary;
export type PhoneCredentialKind = import("@qaito/schemas/phone").PhoneCredentialKind;
export type PhoneCall = import("@qaito/schemas/phone").PhoneCall;
export type PhoneCallAction = import("@qaito/schemas/phone").PhoneCallAction;
export type PhoneNotification = import("@qaito/schemas/phone").PhoneNotification;
export type PhoneRecordingContents = import("@qaito/schemas/phone").PhoneRecordingContents;
export type PhoneHandlingStatus = import("@qaito/schemas/phone").PhoneHandlingStatus;
export type PhoneProcessingStatus = import("@qaito/schemas/phone").PhoneProcessingStatus;
export type PhoneRole = import("@qaito/schemas/phone").PhoneRole;
/** POST /phone/roles（人かグループのどちらか一方に電話受付の管理者の役を付ける） */
export type AssignPhoneRoleInput = import("@qaito/schemas/phone").AssignPhoneRoleInput;
/** 電話受付の役の割り当て 1 行（相手は人かグループ） */
export type PhoneRoleAssignmentView = {
  id: string;
  role: "admin";
  subjectKind: "user" | "group";
  subjectId: string;
  name: string | null;
  /** 人が退職している（グループは常に false） */
  archived: boolean;
  /** グループの在籍のメンバーの数（人なら null） */
  memberCount: number | null;
  createdAt: string;
};
/** GET /phone/roles（役の画面がこれ 1 本で描ける。電話受付の管理者だけ） */
export type PhoneRolesView = {
  assignments: PhoneRoleAssignmentView[];
  /** 常に電話受付の管理者の人（組織の管理者。外せない） */
  orgAdmins: { userId: string; name: string }[];
  /** 追加の候補（組織の在籍の職員とグループ） */
  candidates: {
    users: { userId: string; name: string }[];
    groups: { groupId: string; name: string; memberCount: number }[];
  };
  /** 呼んだ本人 */
  me: { userId: string; isOrgAdmin: boolean; role: PhoneRole };
};

/** POST /phone/receptions */
export type CreatePhoneReceptionInput = import("@qaito/schemas/phone").CreatePhoneReceptionInput;
/** PATCH /phone/receptions/:id（送った項目だけ） */
export type UpdatePhoneReceptionInput = import("@qaito/schemas/phone").UpdatePhoneReceptionInput;
/** PUT /phone/receptions/:id/hours（枠を全部入れ直す） */
export type ReplacePhoneReceptionHoursInput = import("@qaito/schemas/phone").ReplacePhoneReceptionHoursInput;
/** POST /phone/receptions/:id/closures（kind で形が分かれる） */
export type CreatePhoneReceptionClosureInput = import("@qaito/schemas/phone").CreatePhoneReceptionClosureInput;
/** POST /phone/receptions/:id/menu-nodes */
export type CreatePhoneMenuNodeInput = import("@qaito/schemas/phone").CreatePhoneMenuNodeInput;
/** PATCH /phone/menu-nodes/:id（送った項目だけ） */
export type UpdatePhoneMenuNodeInput = Partial<CreatePhoneMenuNodeInput>;
/** PUT /phone/receptions/:id/script-items */
export type UpsertPhoneScriptItemInput = import("@qaito/schemas/phone").UpsertPhoneScriptItemInput;
/** POST /phone/receptions/:id/number-rules */
export type CreatePhoneNumberRuleInput = import("@qaito/schemas/phone").CreatePhoneNumberRuleInput;
/** PATCH /phone/number-rules/:id（送った項目だけ） */
export type UpdatePhoneNumberRuleInput = Partial<CreatePhoneNumberRuleInput>;
/** POST /phone/receptions/:id/notify-targets（channel ごとに宛先が排他） */
export type CreatePhoneNotifyTargetInput = import("@qaito/schemas/phone").CreatePhoneNotifyTargetInput;
/** PATCH /phone/notify-targets/:id（宛先は変えない） */
export type UpdatePhoneNotifyTargetInput = { includeSummary?: boolean; label?: string | null };
/** PUT /phone/receptions/:id/credentials/:kind（値はサーバで暗号化して保存。読み出す口は無い） */
export type SetPhoneCredentialInput = { value: string; label?: string | null };
/** PATCH /phone/calls/:id（null で分岐なし） */
export type UpdatePhoneCallInput = { menuNodeId: string | null };
/** POST /phone/calls/:id/actions（追記のみ） */
export type CreatePhoneCallActionInput = import("@qaito/schemas/phone").CreatePhoneCallActionInput;
/** POST /phone/calls/:id/notifications/resend（targetId なし = 失敗した通知先すべて） */
export type ResendPhoneNotificationInput = { targetId?: string };

/** GET /phone/receptions/:id/closures */
export type ListPhoneReceptionClosuresParams = { from?: string };
/** GET /phone/receptions/:id/menu-nodes */
export type ListPhoneMenuNodesParams = { includeDeleted?: boolean };
/** GET /phone/calls・/phone/calls/export・/phone-recording/calls/export（着信日は JST の YYYY-MM-DD・両端を含む） */
export type ListPhoneCallsParams = {
  receptionId?: string;
  facilityId?: string;
  menuNodeId?: string;
  handlingStatus?: PhoneHandlingStatus;
  handledByStaffId?: string;
  from?: string;
  to?: string;
  callerNumber?: string;
  isEmergency?: boolean;
  /** 確認していない通知の失敗がある受電だけ */
  notifyFailed?: boolean;
  /** キーワード（番号の一部・分岐名・受付名・メモ。要約・文字起こしは phone-recording:read の人だけに 2 文字以上で当てる） */
  q?: string;
  /** 一覧の行に文字起こしの全文を載せる（画面のため。phone-recording:read の人だけ・AI の呼び出しには載せない） */
  includeTranscript?: boolean;
  limit?: number;
  offset?: number;
};
/** GET /phone/receptions（facilityId = 画面の「選んでいる事業所」の絞り込み。認可の範囲との積） */
export type ListPhoneReceptionsParams = { facilityId?: string };
/** GET /phone/callers（facilityId = 受電の事業所で絞る。認可の範囲との積） */
export type ListPhoneCallersParams = { limit?: number; offset?: number; number?: string; facilityId?: string };
/** GET /phone/assignable-numbers（Qaito の在庫・0565） */
export type PhoneAssignableNumber = import("@qaito/schemas/phone").PhoneAssignableNumber;
/** GET /phone/receptions/:id/line-status（LINE の状況） */
export type PhoneLineStatus = import("@qaito/schemas/phone").PhoneLineStatus;
/** POST /phone/script-items/:id/audio/upload-url（肉声音声の送り先） */
export type PhoneGuidanceAudioTicket = import("@qaito/schemas/phone").PhoneGuidanceAudioTicket;
export type RequestPhoneGuidanceAudioUploadInput = import("@qaito/schemas/phone").RequestPhoneGuidanceAudioUploadInput;
export type CompletePhoneGuidanceAudioUploadInput = import("@qaito/schemas/phone").CompletePhoneGuidanceAudioUploadInput;
/** GET /phone/setup-status（はじめの設定の状況） */
export type PhoneSetupStatus = import("@qaito/schemas/phone").PhoneSetupStatus;
/** PUT /phone/receptions/:id/number */
export type AssignPhoneNumberInput = import("@qaito/schemas/phone").AssignPhoneNumberInput;
/** GET /phone/caller-notes の絞り込み */
export type ListPhoneCallerNotesParams = { facilityId?: string; number?: string; limit?: number; offset?: number };
/** 番号のメモ（台帳に当たらない番号に付ける・0563） */
export type PhoneCallerNote = import("@qaito/schemas/phone").PhoneCallerNote;
/** PUT /phone/caller-notes */
export type UpsertPhoneCallerNoteInput = import("@qaito/schemas/phone").UpsertPhoneCallerNoteInput;
/** GET /phone/stats（YYYY-MM。facilityId = 受電の事業所で絞る。認可の範囲との積） */
export type PhoneStatsParams = { from?: string; to?: string; receptionId?: string; facilityId?: string };
/** GET /phone-recording/calls/:id/recording-url */
export type PhoneRecordingUrlParams = { disposition?: "inline" | "attachment" };

/** GET /phone/permission-context（画面の出し分けの材料） */
export type PhonePermissionContext = {
  userId: string | null;
  /** 電話受付の管理者か（役が admin・または組織の管理者）。受付の設定・秘密・役の画面を出すか */
  isAdmin: boolean;
  /** 組織の管理者か（常に電話受付の管理者） */
  isOrgAdmin: boolean;
  /** 電話受付の役 */
  role: PhoneRole;
  canWrite: boolean;
  canDelete: boolean;
  canReadRecording: boolean;
  canDeleteRecording: boolean;
};
/** GET /phone/receptions/:id/status（reason は `@qaito/schemas/phone` の PHONE_RECEPTION_OPEN_REASONS） */
export type PhoneReceptionStatus = { active: boolean; open: boolean; reason: string };
/** 受電の一覧・詳細の 1 行（メタ〔分岐名・受付名の写しを含む〕 + 処理の状態 + 要約〔phone-recording:read が無ければ null〕） */
export type PhoneCallItem = PhoneCall & {
  processingStatus: PhoneProcessingStatus | null;
  processingErrorCode: string | null;
  notifiedAt: string | null;
  unresolvedNotificationFailures: number;
  summary: string | null;
  /** 文字起こしの全文（phone-recording:read の人が includeTranscript=true で頼んだ一覧と、1 件の詳細だけ。ほかは null） */
  transcript: string | null;
  contentsVisible: boolean;
};
/** GET /phone/calls/:id */
export type PhoneCallDetail = PhoneCallItem & { notifications: PhoneNotification[] };
/** POST /phone/calls/:id/actions の応答（追記した経緯と、反映後の受電） */
export type PhoneCallActionResult = { action: PhoneCallAction; call: PhoneCall };
/** 通知の再送の結果 */
/** queued = 人の再送（どのチャネルも送信待ちにし、録音処理のジョブが 1 分ほどで機械の主体で送る） */
export type PhoneNotifyOutcome = { sent: number; failed: number; queued: number };
/** テスト送信の結果（失敗の種類は `@qaito/schemas/phone` の PHONE_NOTIFICATION_ERROR_CODES） */
/** `queued: true` = Piazza（ジョブが送り、結果は通知先の lastTestAt / lastTestErrorCode） */
export type PhoneNotifyTestResult =
  | { ok: true; queued?: true }
  | { ok: false; errorCode: PhoneSchemas["PHONE_NOTIFICATION_ERROR_CODES"][number] };
/** GET /phone/callers の 1 行 */
export type PhoneCallerSummary = { callerNumber: string; callCount: number; openCount: number; lastCallAt: string };
/** GET /phone/callers/identify の 1 件（番号ごとの台帳の一致） */
export type PhoneCallerIdentification = { number: string; matches: PhonePartyMatch[] };
/** GET /phone/stats */
export type PhoneStats = {
  from: string;
  to: string;
  months: { month: string; total: number; emergency: number; lineSent: number }[];
  byMenu: { month: string; menuNodeId: string | null; label: string | null; total: number }[];
  openCount: number;
  unresolvedNotificationFailures: number;
  /** ダッシュボードの「いま」（今日の JST を基準） */
  recent: {
    /** 直近 14 日（古い順） */
    days: { date: string; total: number; emergency: number }[];
    /** 直近 30 日の時間帯ごと（0〜23 時） */
    hours: { hour: number; total: number }[];
    /** 直近 30 日の対応状況ごと */
    statuses: { status: PhoneHandlingStatus; total: number }[];
    /** 直近 30 日の分岐ごと（多い順） */
    byMenu: { menuNodeId: string | null; label: string | null; total: number }[];
    today: number;
    /** 今週（月曜から） */
    week: number;
    /** 今月（AI が一次受付した件数） */
    month: number;
    monthEmergency: number;
    monthDone: number;
    /** 今月の削減時間の推計（分） */
    estimatedMinutesSaved: number;
    minutesManual: number;
    minutesAutomated: number;
  };
};
/** GET /phone-recording/calls/:id/recording-url（300 秒で切れる） */
export type PhoneRecordingUrl = { url: string; expiresInSec: number };
/** DELETE /phone-recording/calls/:id/contents */
export type PhoneRecordingPurgeResult = { purged: boolean };

export type MeetingParticipant = import("@qaito/schemas/meeting").MeetingParticipant;
export type MeetingCapture = import("@qaito/schemas/meeting").MeetingCapture;
/** GET /meeting/meetings の 1 行（会議の URL・参加者は載らない）。契約 `meeting.meetings` の response_fields と同じ形 */
export type MeetingSummary = {
  id: string;
  title: string;
  facilityId: string;
  scheduledAt: string | null;
  sourceKind: MeetingSourceKind;
  status: MeetingStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  capture: MeetingCapture | null;
};
/** GET /meeting/meetings/:id（会議の URL・参加者つき） */
export type Meeting = {
  id: string;
  title: string;
  facilityId: string;
  scheduledAt: string | null;
  sourceKind: MeetingSourceKind;
  status: MeetingStatus;
  meetingUrl: string | null;
  calendarEventRef: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  capture: MeetingCapture | null;
  participants: MeetingParticipant[];
};
export type MeetingMinutes = import("@qaito/schemas/meeting").MeetingMinutes;
export type MeetingRecordingContents = import("@qaito/schemas/meeting").MeetingRecordingContents;
export type MeetingRecordingSettings = import("@qaito/schemas/meeting").MeetingRecordingSettings;
export type MeetingStatus = import("@qaito/schemas/meeting").MeetingStatus;
export type MeetingSourceKind = import("@qaito/schemas/meeting").MeetingSourceKind;
export type MeetingCaptureStatus = import("@qaito/schemas/meeting").MeetingCaptureStatus;
export type MeetingRecordingContentType = import("@qaito/schemas/meeting").MeetingRecordingContentType;
/** POST /meeting/meetings */
export type CreateMeetingInput = import("@qaito/schemas/meeting").CreateMeetingInput;
/** PATCH /meeting/meetings/:id（送った項目だけ。participants を送れば丸ごと入れ替え） */
export type UpdateMeetingInput = import("@qaito/schemas/meeting").UpdateMeetingInput;
/** POST /meeting-recording/meetings/:id/upload（申告の MIME とサイズ） */
export type IssueMeetingRecordingUploadInput = import("@qaito/schemas/meeting").IssueMeetingRecordingUploadInput;
/** PUT /meeting-recording/settings */
export type UpdateMeetingRecordingSettingsInput = import("@qaito/schemas/meeting").UpdateMeetingRecordingSettingsInput;
/** GET /meeting/meetings（日は JST の YYYY-MM-DD・両端を含む。facilityId = 事業所の絞り込み〔認可の範囲との積〕） */
export type ListMeetingsParams = {
  status?: MeetingStatus;
  facilityId?: string;
  /** カレンダーの予定の回に結んだ会議で絞る（`calendar:{予定ID}:{回の日付}`・完全一致） */
  calendarEventRef?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};
/** POST /meeting-recording/meetings/:id/upload の応答（この URL へ Content-Type を付けて PUT する） */
export type MeetingRecordingUploadTicket = {
  uploadUrl: string;
  method: "PUT";
  contentType: MeetingRecordingContentType;
  expiresInSec: number;
  maxBytes: number;
};
/** GET /meeting-recording/meetings/:id/recording-url */
export type MeetingRecordingUrlParams = { disposition?: "inline" | "attachment" };
/** GET /meeting-recording/meetings/:id/recording-url（300 秒で切れる） */
export type MeetingRecordingUrl = { url: string; expiresInSec: number };
/** DELETE /meeting-recording/meetings/:id/contents */
export type MeetingRecordingPurgeResult = { purged: boolean };

export type ClosingUnit = import("@qaito/schemas/daily-closing").ClosingUnit;
export type ClosingUnitCandidate = import("@qaito/schemas/daily-closing").ClosingUnitCandidate;
export type ClosingField = import("@qaito/schemas/daily-closing").ClosingField;
export type ClosingDay = import("@qaito/schemas/daily-closing").ClosingDay;
export type ClosingMonthSummary = import("@qaito/schemas/daily-closing").ClosingMonthSummary;
export type ClosingMissingUnit = import("@qaito/schemas/daily-closing").ClosingMissingUnit;
export type ClosingProgress = import("@qaito/schemas/daily-closing").ClosingProgress;
export type ClosingDivisionProgress = import("@qaito/schemas/daily-closing").ClosingProgress & {
  divisionId: string | null;
  name: string;
  monthActual: ClosingActualTotal;
};
/** 月の速報・実績（請求）・差と内訳 */
export type ClosingMonthActual = import("@qaito/schemas/daily-closing").ClosingMonthActual;
/** 束ねた月の速報・実績（請求）・差（全社・事業部） */
export type ClosingActualTotal = import("@qaito/schemas/daily-closing").ClosingActualTotal;
/** 書き出しの部署ごとの月の実績 */
export type ClosingExportMonthActual = import("@qaito/schemas/daily-closing").ClosingExportMonthActual;
export type ClosingLandingRow = import("@qaito/schemas/daily-closing").ClosingLandingRow;
export type ClosingHeatmapRow = import("@qaito/schemas/daily-closing").ClosingHeatmapRow;
export type ClosingCompanyDay = import("@qaito/schemas/daily-closing").ClosingCompanyDay;
export type ClosingAlert = import("@qaito/schemas/daily-closing").ClosingAlert;
export type ClosingWeeklyShift = import("@qaito/schemas/daily-closing").ClosingWeeklyShift;
export type ClosingFieldTotals = Record<string, number>;
export type ClosingFieldSource = import("@qaito/schemas/daily-closing").ClosingFieldSource;
export type ClosingFieldRole = import("@qaito/schemas/daily-closing").ClosingFieldRole;
/** GET /daily-closing/units（契約 `daily-closing.units`） */
export type ClosingUnitList = {
  units: ClosingUnit[];
  candidates: ClosingUnitCandidate[];
  /** 組織全体の数字（事業部・月の確定）を扱える人か */
  orgWide: boolean;
};
/** GET /daily-closing/units/:id/months/:month（契約 `daily-closing.months`） */
export type ClosingUnitMonth = {
  unit: ClosingUnit;
  month: string;
  asOf: string;
  locked: boolean;
  legacy: boolean;
  fields: ClosingField[];
  days: ClosingDay[];
  totals: ClosingFieldTotals;
  summary: ClosingMonthSummary;
  monthActual: ClosingMonthActual;
};
/** GET /daily-closing/missing（契約 `daily-closing.missing`） */
export type ClosingMissingEntries = {
  month: string;
  asOf: string;
  units: ClosingMissingUnit[];
};
/** GET /daily-closing/day-flash（契約 `daily-closing.day-flash`）。単価が無ければ data は null */
export type ClosingDayFlash = {
  unitId: string;
  facilityId: string;
  date: string;
  /** 利用人数 */
  attendance: number;
  /** 利用人数の欄の単価（円） */
  unitPriceYen: number;
  /** 暫定売上（円） */
  salesYen: number;
};
/** GET /daily-closing/divisions の 1 行（契約 `daily-closing.divisions`） */
export type ClosingDivision = {
  id: string;
  name: string;
  sortOrder: number;
};
/** GET /daily-closing/initiatives の 1 行（契約 `daily-closing.initiatives`） */
export type ClosingInitiative = {
  id: string;
  unitId: string;
  month: string;
  title: string;
  effect: number;
  prob: number;
  dueText: string | null;
  ownerText: string | null;
  createdAt: string;
  updatedAt: string;
};
/** GET /daily-closing/company（契約 `daily-closing.company`） */
export type ClosingCompanySummary = {
  month: string;
  asOf: string;
  throughDay: number;
  divisionId: string | null;
  total: ClosingProgress;
  prevMonthRate: number | null;
  divisions: ClosingDivisionProgress[];
  units: ClosingLandingRow[];
  heatmap: ClosingHeatmapRow[];
  daily: ClosingCompanyDay[];
  alerts: ClosingAlert[];
  weeklyShifts: ClosingWeeklyShift[];
  divisionResults: ClosingDivisionResult[];
  legacyUnits: number;
  monthActual: ClosingActualTotal;
};
/** GET /daily-closing/export（契約 `daily-closing.export`） */
export type ClosingExport = {
  filename: string;
  csv: string;
  monthActuals: ClosingExportMonthActual[];
};
/** POST /daily-closing/months/:month/snapshot の応答 */
export type ClosingSnapshotResult = { month: string; units: number; rows: number };
/** POST /daily-closing/units */
export type CreateClosingUnitInput = import("@qaito/schemas/daily-closing").CreateClosingUnitInput;
/** PATCH /daily-closing/units/:id */
export type UpdateClosingUnitInput = import("@qaito/schemas/daily-closing").UpdateClosingUnitInput;
/** POST /daily-closing/divisions */
export type ClosingDivisionInput = import("@qaito/schemas/daily-closing").ClosingDivisionInput;
/** PATCH /daily-closing/divisions/:id */
export type UpdateClosingDivisionInput = import("@qaito/schemas/daily-closing").UpdateClosingDivisionInput;
/** GET /daily-closing/initiatives */
export type ClosingInitiativesParams = import("@qaito/schemas/daily-closing").ClosingInitiativesQuery;
/** POST /daily-closing/initiatives */
export type CreateClosingInitiativeInput = import("@qaito/schemas/daily-closing").CreateClosingInitiativeInput;
/** PATCH /daily-closing/initiatives/:id */
export type UpdateClosingInitiativeInput = import("@qaito/schemas/daily-closing").UpdateClosingInitiativeInput;
/** GET /daily-closing/company */
export type ClosingCompanyParams = import("@qaito/schemas/daily-closing").ClosingCompanyQuery;
/** PUT /daily-closing/units/:id/months/:month/entries（count: null で外す） */
export type SaveClosingEntriesInput = import("@qaito/schemas/daily-closing").SaveClosingEntriesInput;
/** PUT /daily-closing/units/:id/notes/:date（空で外す） */
export type SaveClosingDayNoteInput = import("@qaito/schemas/daily-closing").SaveClosingDayNoteInput;
/** PUT /daily-closing/units/:id/months/:month/entries の応答 */
export type ClosingEntriesSaved = { saved: number; cleared: number };
/** PUT /daily-closing/units/:id/notes/:date の応答 */
export type ClosingDayNoteSaved = { note: string | null };
/** POST /daily-closing/legacy/import（部署 × 月の塊） */
export type ImportClosingLegacyInput = import("@qaito/schemas/daily-closing").ImportClosingLegacyInput;
/** 取り込みを止めた理由 1 つ */
export type ClosingLegacyProblem = import("@qaito/schemas/daily-closing").ClosingLegacyProblem;
/** 取り込みで書いた（dryRun は書く予定の）件数 */
export type ClosingLegacyCounts = import("@qaito/schemas/daily-closing").ClosingLegacyCounts;
/** POST /daily-closing/legacy/import の応答（契約 `daily-closing.legacy`） */
export type ClosingLegacyImportResult = {
  dryRun: boolean;
  applied: boolean;
  month: string;
  unitId: string | null;
  skipped: "locked" | null;
  problems: ClosingLegacyProblem[];
  counts: ClosingLegacyCounts;
};
/** POST /daily-closing/legacy/reconcile */
export type ReconcileClosingLegacyInput = import("@qaito/schemas/daily-closing").ReconcileClosingLegacyInput;
/** POST /daily-closing/legacy/reconcile の応答 */
export type ClosingLegacyReconcileResult = import("@qaito/schemas/daily-closing").ClosingLegacyReconcileResult;

/** GET /daily-closing-budget/units/:id/fields の 1 行（契約 `daily-closing-budget.fields`） */
export type ClosingUnitField = {
  unitId: string;
  fieldKey: string;
  source: ClosingFieldSource;
  name: string;
  unitLabel: string;
  avgPrice: number;
  role: ClosingFieldRole | null;
  budgetShare: number | null;
  activeFrom: string | null;
  activeTo: string | null;
  /** 手入力の自費の欄 */
  selfPay: boolean;
  sortOrder: number;
  updatedAt: string;
};
/** GET /daily-closing-budget/units/:id/price-history の 1 行（契約 `daily-closing-budget.price-history`） */
export type ClosingPriceChange = {
  id: string;
  unitId: string;
  fieldKey: string;
  oldPrice: number | null;
  newPrice: number;
  reason: string | null;
  changedBy: string | null;
  createdAt: string;
};
/** GET /daily-closing-budget/units/:id/plan（契約 `daily-closing-budget.plans`） */
export type ClosingUnitPlan = {
  unitId: string;
  coefWd: number;
  coefSat: number;
  coefSun: number;
  coefHol: number;
  closedDows: number[];
  avgPrice: number;
  maxSales: number | null;
  maxDays: number | null;
  eveningFrom: string;
  saved: boolean;
};
/** GET /daily-closing-budget/months の 1 行（契約 `daily-closing-budget.months`） */
export type ClosingMonth = {
  month: string;
  factor: number;
  locked: boolean;
  lockedAt: string | null;
  lockedBy: string | null;
};
/** GET /daily-closing-budget/months/:month/budgets の 1 行（契約 `daily-closing-budget.budgets`） */
export type ClosingBudget = {
  unitId: string;
  month: string;
  budget: number;
};
/** GET /daily-closing-budget/months/:month/division-results の 1 行（契約 `daily-closing-budget.division-results`） */
export type ClosingDivisionResult = {
  divisionId: string;
  month: string;
  budget: number | null;
  actual: number | null;
  note: string | null;
};
/** PUT /daily-closing-budget/units/:id/fields */
export type ClosingUnitFieldInput = import("@qaito/schemas/daily-closing").ClosingUnitFieldInput;
/** PUT /daily-closing-budget/units/:id/plan */
export type ClosingUnitPlanInput = import("@qaito/schemas/daily-closing").ClosingUnitPlanInput;
/** POST /daily-closing-budget/months */
export type AddClosingMonthInput = import("@qaito/schemas/daily-closing").AddClosingMonthInput;
/** PATCH /daily-closing-budget/months/:month */
export type UpdateClosingMonthInput = import("@qaito/schemas/daily-closing").UpdateClosingMonthInput;
/** PUT /daily-closing-budget/months/:month/budgets */
export type UpsertClosingBudgetsInput = import("@qaito/schemas/daily-closing").UpsertClosingBudgetsInput;
/** PUT /daily-closing-budget/division-results */
export type UpsertClosingDivisionResultInput = import("@qaito/schemas/daily-closing").UpsertClosingDivisionResultInput;

/** 訪問看護記録書Ⅱ（契約 `nursing.visit-records`） */
export type NursingVisitRecord = {
  status: "draft" | "final";
  finalizedAt: string | null;
  id: string;
  clientId: string;
  facilityId: string;
  visitId: string;
  authorStaffId: string | null;
  condition: string | null;
  careDailyLiving: string | null;
  careExcretion: string | null;
  careTreatment: string | null;
  careRehab: string | null;
  careGuidance: string | null;
  careManagement: string | null;
  comment: string | null;
  gafScore: number | null;
  /** 訪問日（YYYY-MM-DD）。一覧（`nursing.visitRecords.list`）だけが返す */
  serviceDate?: string;
  warnings: { missingSoapMarks: ("S" | "O" | "A" | "P")[] };
};

/** 24時間対応の記録の一覧の 1 件（契約 `nursing.oncall-records`）。氏名は `client:read` が無ければ「非公開」 */
export type NursingOncallRecord = {
  id: string;
  facilityId: string;
  clientId: string;
  clientName: string;
  /** 相談を受けた時刻（ISO 8601） */
  receivedAt: string;
  callerKind: "self" | "family" | "care_manager" | "doctor" | "institution" | "other";
  callerName: string | null;
  method: "phone" | "line" | "other";
  phoneCallId: string | null;
  responderStaffId: string;
  responderName: string | null;
  consultation: string;
  response: string;
  outcome: "phone_only" | "emergency_visit" | "hospital" | "other";
  /** 結んだ緊急訪問（schedule の訪問）。無ければ null */
  visitId: string | null;
  doctorContacted: boolean;
  authorUserId: string;
  authorName: string | null;
  mine: boolean;
  /** 自分が読んだか */
  read: boolean;
  /** 自分が印をつけたか（他人の印は見えない） */
  favorite: boolean;
  commentCount: number;
  /** 未読か（サーバの定義そのまま: 受けた時刻が直近 14 日で自分の既読が無い）。画面は自前で判定しない */
  unread: boolean;
  /** 「読んだ」を付けられるか。false の職員（nursing:read だけ）には未読の印・未読の件数を出さない */
  canMarkRead: boolean;
  createdAt: string;
  updatedAt: string;
};
export type NursingOncallReader = { userId: string; name: string | null; readAt: string };
export type NursingOncallComment = {
  id: string;
  recordId: string;
  body: string;
  authorUserId: string;
  authorName: string | null;
  mine: boolean;
  createdAt: string;
};
/** 1 件（読んだ人・コメントを含む） */
export type NursingOncallRecordDetail = NursingOncallRecord & {
  readers: NursingOncallReader[];
  comments: NursingOncallComment[];
  /** 結んだ緊急訪問が生きているか（取り消し・削除済みなら false。結んでいない・予定を読めないときは null）。1 件の GET だけが返す */
  visitAlive?: boolean | null;
};
/** 記録の保存のあと緊急訪問を作れなかったとき（記録は保存済み） */
export type NursingOncallEmergencyFailure = import("@qaito/schemas/nursing-oncall-records").OncallEmergencyFailure;
/** 作成・更新の結果。`emergencyStartTime` を渡して緊急訪問を作れなかったときだけ `emergencyFailure` が入る（それ以外は null） */
export type NursingOncallRecordSaved = NursingOncallRecordDetail & {
  emergencyFailure: NursingOncallEmergencyFailure | null;
};
export type NursingOncallCounts = {
  all: number;
  unread: number;
  read: number;
  favorite: number;
  /** 「読んだ」を付けられるか。false の職員には未読の件数を出さない */
  canMarkRead: boolean;
};
export type NursingOncallUnreadCount = { unread: number; canMarkRead: boolean };
export type NursingOncallEmergencyVisitResult = {
  visitId: string;
  /** 記録に結べたあとの読み直しが失敗したときは無い（結べた時点で成功） */
  record?: NursingOncallRecordDetail;
  /** 前の試みで作ったが記録に結べていなかった訪問に結んだ（新しくは作っていない） */
  reused: boolean;
};
export type CreateNursingOncallRecordInput = import("@qaito/schemas/nursing-oncall-records").CreateNursingOncallRecordInput;
export type UpdateNursingOncallRecordInput = import("@qaito/schemas/nursing-oncall-records").UpdateNursingOncallRecordInput;
export type ListNursingOncallRecordsQuery = import("@qaito/schemas/nursing-oncall-records").ListNursingOncallRecordsQuery;
export type CountNursingOncallRecordsQuery = import("@qaito/schemas/nursing-oncall-records").CountNursingOncallRecordsQuery;
export type CountNursingOncallUnreadQuery = import("@qaito/schemas/nursing-oncall-records").CountNursingOncallUnreadQuery;
export type SetNursingOncallFavoriteInput = import("@qaito/schemas/nursing-oncall-records").SetNursingOncallFavoriteInput;
export type CreateNursingOncallCommentInput = import("@qaito/schemas/nursing-oncall-records").CreateNursingOncallCommentInput;
export type CreateNursingOncallEmergencyVisitInput = import("@qaito/schemas/nursing-oncall-records").CreateNursingOncallEmergencyVisitInput;

export type CreateNursingVisitRecordInput = import("@qaito/schemas/nursing-visit-records").CreateNursingVisitRecordInput;
export type UpdateNursingVisitRecordInput = import("@qaito/schemas/nursing-visit-records").UpdateNursingVisitRecordInput;
export type ListNursingVisitRecordsQuery = import("@qaito/schemas/nursing-visit-records").ListNursingVisitRecordsQuery;
export type NursingVisitRecordStatus = import("@qaito/schemas/nursing-visit-statuses").NursingVisitRecordStatus;
export type ListNursingVisitRecordStatusesQuery = import("@qaito/schemas/nursing-visit-statuses").ListNursingVisitRecordStatusesQuery;
export type NursingHome = import("@qaito/schemas/nursing-home").NursingHome;
export type GetNursingHomeQuery = import("@qaito/schemas/nursing-home").GetNursingHomeQuery;
export type NursingRehabChecks = import("@qaito/schemas/nursing-rehab-checks").NursingRehabChecks;
export type NursingPlanVisitStaffTypesQuery = import("@qaito/schemas/nursing-plan").NursingPlanVisitStaffTypesQuery;
export type NursingPlanVisitStaffTypes = import("@qaito/schemas/nursing-plan").NursingPlanVisitStaffTypes;
export type NursingRehabChecksParams = import("@qaito/schemas/nursing-rehab-checks").NursingRehabChecksParams;
export type NursingClientSummary = import("@qaito/schemas/nursing-client-summary").NursingClientSummary;
export type NursingClientSummaryContent = import("@qaito/schemas/nursing-client-summary").NursingClientSummaryContent;
export type NursingClientSummaryInput = import("@qaito/schemas/nursing-client-summary").NursingClientSummaryInput;
export type NursingRoster = import("@qaito/schemas/nursing-roster").NursingRoster;
export type NursingRosterRow = import("@qaito/schemas/nursing-roster").NursingRosterRow;
export type ListNursingRosterQuery = import("@qaito/schemas/nursing-roster").ListNursingRosterQuery;
export type SaveNursingVisitRecordInput = import("@qaito/schemas/save-nursing-visit-record").SaveNursingVisitRecordInput;
export type UpdateSaveNursingVisitRecordInput = import("@qaito/schemas/save-nursing-visit-record").UpdateSaveNursingVisitRecordInput;
export type AttachNursingVisitRecordFileInput = import("@qaito/schemas/attach-nursing-visit-record-file").AttachNursingVisitRecordFileInput;
export type NursingReportStatusRow = import("@qaito/schemas/nursing-report-statuses").NursingReportStatusRow;
export type ListNursingReportStatusesQuery = import("@qaito/schemas/nursing-report-statuses").ListNursingReportStatusesQuery;
export type NursingReportStage = import("@qaito/schemas/nursing-report-statuses").NursingReportStage;
export type NursingReportStep = import("@qaito/schemas/nursing-report-statuses").NursingReportStep;
export type NursingReportBlocker = import("@qaito/schemas/nursing-report-statuses").NursingReportBlocker;
export type NursingReportBlockerKind = import("@qaito/schemas/nursing-report-statuses").NursingReportBlockerKind;
export type NursingReportRevision = import("@qaito/schemas/nursing-report-statuses").NursingReportRevision;

export type GetVisitStaffingInput = import("@qaito/schemas/schedule-visits").GetVisitStaffingInput;
export type AssignVisitStaffInput = import("@qaito/schemas/schedule-visits").AssignVisitStaffInput;
export type VisitStaffingData = import("@qaito/schemas/schedule-visits").VisitStaffingData;
export type ListUnrecordedEmergencyVisitsInput = import("@qaito/schemas/schedule-visits").ListUnrecordedEmergencyVisitsInput;
export type UnrecordedEmergencyVisit = import("@qaito/schemas/schedule-visits").UnrecordedEmergencyVisit;
export type AssignVisitStaffResult = import("@qaito/schemas/schedule-visits").AssignVisitStaffResult;
export type VisitGenerationResult = import("@qaito/schemas/schedule-visits").VisitGenerationResult;

/** 保険の種類（介護保険 / 医療保険） */
export type VisitInsuranceKind = "kaigo" | "iryo";
/** 判定の根拠（医療のとき）。臨床情報（clinical-record:read）を読めない人には返らない（null） */
export type VisitInsuranceBasis = "m1_no_certification" | "m2_beppyo7" | "m3_special_instruction" | "m4_psychiatric";
export type GetClientVisitInsuranceParams = { facilityId: string; month: string };
/** 月の区間（自動の判定で同じ結果・根拠が続く日のまとまり） */
export type VisitInsuranceInterval = {
  from: string;
  to: string;
  insurance: VisitInsuranceKind;
  basis: VisitInsuranceBasis | null;
  /** 介護認定の登録なし（登録か手の直しで直してもらう）。根拠を返さない人にも返る */
  noCertification: boolean;
};
export type VisitInsuranceVisit = {
  visitId: string;
  serviceDate: string;
  plannedStartTime: string;
  plannedEndTime: string | null;
  plannedEndsNextDay: boolean;
  status: string;
  /** 自動の判定（今の材料で計算した値） */
  auto: VisitInsuranceKind;
  autoBasis: VisitInsuranceBasis | null;
  /** 手の直し（null = 自動のまま） */
  override: VisitInsuranceKind | null;
  overrideReason: string | null;
  /** 効く値（手の直し ?? 自動） */
  effective: VisitInsuranceKind;
};
export type ClientVisitInsurance = {
  clientId: string;
  facilityId: string;
  month: string;
  intervals: VisitInsuranceInterval[];
  visits: VisitInsuranceVisit[];
  /** 医療の月の確定（無ければ null）。確定済みの月は医療の訪問を直せない */
  iryoConfirmation: { id: string; confirmedAt: string } | null;
};
export type SetVisitInsuranceOverrideInput = import("@qaito/schemas/visit-insurance").SetVisitInsuranceOverrideInput;
export type VisitInsuranceOverrideResult = {
  visitId: string;
  insuranceOverride: VisitInsuranceKind | null;
  insuranceOverrideReason: string | null;
  updatedAt: string;
};
export type ListIryoVisitConfirmationsParams = import("@qaito/schemas/visit-insurance").ListIryoVisitConfirmationsQuery;
export type ConfirmIryoVisitMonthInput = import("@qaito/schemas/visit-insurance").ConfirmIryoVisitMonthInput;
export type IryoVisitConfirmation = {
  id: string;
  facilityId: string;
  clientId: string;
  /** 月の初日（YYYY-MM-01） */
  targetMonth: string;
  /** 確定したときの医療の訪問の ID */
  visitIds: string[];
  confirmedBy: string;
  confirmedAt: string;
};

export type NursingVisitRecording = {
 id:string;visitId:string;clientId:string;
 clientName:string|null;
 /** 訪問日（YYYY-MM-DD）。職員が schedule:read を持つときだけ埋まる */
 serviceDate:string|null;
 /** 音声の置き場。drive = マイドライブのファイルを指す（state は元のファイルの今の状態）/ legacy = ドライブから登録する前に訪問看護のバケットへ直接置いた行 */
 source:import("@qaito/schemas/nursing-visit-recording").NursingVisitRecordingSource;
 /** 録音を上げた人の名前・自分が上げた録音か・消せるか（消せないときは理由） */
 uploaderName: string | null; uploadedByMe: boolean;
 deletion:{allowed:true}|{allowed:false;reason:"record_already_submitted"|"recording_not_owner"|"permission"};
 contentType:string;sizeBytes:number;durationSec:number;
 status:"awaiting_upload"|"stored"|"transcribing"|"drafting"|"done"|"failed";
 failureReason:string|null;draft:import("@qaito/schemas/nursing-visit-recording").NursingVisitRecordingDraft|null;
 createdAt:string;updatedAt:string;purgedAt:string|null;
};
export type NursingVisitRecordings = import("@qaito/schemas/nursing-visit-recording").NursingVisitRecordings;
export type NursingRecordingTranscript = import("@qaito/schemas/nursing-visit-recording").NursingRecordingTranscript;
/** 録音の一覧の絞り込み（訪問・利用者・事業所。どれも任意。limit は 1〜200・既定 50） */
export type ListNursingVisitRecordingsQuery = {visitId?:string;clientId?:string;facilityId?:string;limit?:number;offset?:number};
/** マイドライブの本人の音声ファイルを訪問看護の録音として登録する入力（指すだけ・コピーしない）。durationSec は分かれば渡す */
export type RegisterNursingVisitRecordingFromDriveInput = {userFileId:string;visitId:string;durationSec?:number;consent:true};
export type NursingVisitRecordingRegistration = import("@qaito/schemas/nursing-visit-recording").NursingVisitRecordingRegistration;
export type NursingRecordingUrl = {url:string;expiresInSec:number};

/** 分け方（勤務・待機・休み）。固定の 3 つ。 */
export type ShiftKindKey = "work" | "standby" | "leave";

/** システムが用意する種類の目印。 */
export type ShiftSystemKey = "work" | "oncall_1" | "oncall_2" | "standby_none" | "day_off" | "paid_leave" | "absent";

/** 確定の対象（予定 / 実績）。 */
export type ShiftCloseTarget = "plan" | "actual";

/** 種類 1 つ（契約 `staff.shift-types`） */
export type ShiftType = {
  id: string;
  /** 事業所専用なら事業所ID・組織共通なら null */
  facility_id: string | null;
  kind: ShiftKindKey;
  system_key: ShiftSystemKey | null;
  name: string;
  code: string;
  color: string | null;
  sort_order: number;
  active: boolean;
};

export type ListShiftTypesQuery = { facility_id?: string; include_inactive?: boolean };
export type CreateShiftTypeInput = {
  /** 省略 = 組織共通 */
  facility_id?: string | null;
  shift_kind: ShiftKindKey;
  name: string;
  code: string;
  color?: string | null;
  sort_order?: number;
};
/** 分け方・system_key・事業所は変えられない */
export type UpdateShiftTypeInput = {
  name?: string;
  code?: string;
  color?: string | null;
  sort_order?: number;
  active?: boolean;
};

/** 予定のコマ 1 つ（契約 `staff.shift-plans`） */
export type ShiftPlan = {
  id: string;
  facility_id: string;
  staff_id: string;
  shift_type_id: string;
  work_date: string;
  starts_at: string | null;
  ends_at: string | null;
  note: string | null;
};
/** 実績のコマ 1 つ（契約 `staff.shift-actuals`）。shift_plan_id が空なら追加 */
export type ShiftActual = ShiftPlan & { shift_plan_id: string | null };

type ShiftSlotInput = {
  /** あれば更新・無ければ作成 */
  id?: string;
  facility_id: string;
  staff_id: string;
  shift_type_id: string;
  work_date: string;
  /** 勤務と待機は必須・終日の休みは両方空 */
  starts_at?: string | null;
  ends_at?: string | null;
  note?: string | null;
};
export type SaveShiftPlanItem = ShiftSlotInput;
export type SaveShiftActualItem = ShiftSlotInput & { shift_plan_id?: string | null };
export type SaveShiftPlansInput = { facility_id: string; items: SaveShiftPlanItem[] };
export type SaveShiftActualsInput = { facility_id: string; items: SaveShiftActualItem[] };
export type DeleteShiftSlotsInput = { facility_id: string; ids: string[] };
export type DeleteShiftSlotsResult = { deleted: string[] };

export type CloseShiftDaysInput = { facility_id: string; target: ShiftCloseTarget; from: string; to: string };
export type CloseShiftDaysResult = { closed: string[] };
export type ReopenShiftDaysResult = { reopened: string[] };

/** 実際のコマ 1 つ（予定どおり / 置き換え / 追加の区別つき） */
export type ShiftResolvedSegment = {
  segment_id: string;
  source: "plan" | "actual";
  origin: "as_planned" | "changed" | "added";
  replaces_plan_id: string | null;
  facility_id: string;
  staff_id: string;
  shift_type_id: string;
  kind: ShiftKindKey;
  system_key: ShiftSystemKey | null;
  work_date: string;
  starts_at: string | null;
  ends_at: string | null;
  /** 勤務のコマだけ、拘束から休憩を引いた分 */
  net_minutes: number;
};

/** 実際の読み口の答え。`has_input` に無い (職員, 日) が未入力 */
export type ShiftActualAnswer = {
  segments: ShiftResolvedSegment[];
  closes: { facility_id: string; date: string; target: ShiftCloseTarget }[];
  has_input: { staff_id: string; date: string }[];
  /** include_parts のときだけ */
  plans?: ShiftPlan[];
  actuals?: ShiftActual[];
  types?: ShiftType[];
};
export type GetShiftActualQuery = {
  facility_id?: string;
  from: string;
  to: string;
  staff_id?: string[];
  include_parts?: boolean;
};
export type GetShiftMonthQuery = { facility_id: string; from: string; to: string };
export type ShiftMonth = ShiftActualAnswer & {
  staff: {
    id: string;
    name: string;
    kana: string | null;
    employment_type: string | null;
    default_start: string | null;
    default_end: string | null;
    retired: boolean;
  }[];
  plans: ShiftPlan[];
  actuals: ShiftActual[];
  types: ShiftType[];
};
export type ListMyShiftActualQuery = { from: string; to: string };

/** 曜日の決まり 1 枠（契約 `staff.shift-patterns`）。weekday: 0 = 日曜。staff_id が空 = 担当未定 */
export type ShiftPattern = {
  id: string;
  facility_id: string;
  weekday: number;
  shift_type_id: string;
  staff_id: string | null;
  start_local: string;
  end_local: string;
  ends_next_day: boolean;
};
export type ListShiftPatternsQuery = { facility_id: string };
export type SaveShiftPatternEntry = {
  weekday: number;
  shift_type_id: string;
  staff_id: string | null;
  start_local?: string;
  end_local?: string;
  ends_next_day?: boolean;
};
export type SaveShiftPatternsInput = { facility_id: string; entries: SaveShiftPatternEntry[] };
export type ShiftPatternMonthInput = { facility_id: string; month: string };
export type ShiftPatternMonthResult = {
  created: number;
  skipped_existing: number;
  skipped_decided: number;
  skipped_unassigned: number;
  failed: { date: string; shift_type_id: string; reason: "staff_unavailable" | "overlap" | "closed" }[];
  candidates: { date: string; shift_type_id: string; staff_id: string; starts_at: string; ends_at: string }[];
};
export type PlaceShiftStandbyPlanInput = { facility_id: string; staff_id: string; date: string; shift_type_id: string };
export type PlaceShiftStandbyPlanResult = { plan_id: string; created: boolean };
/** 当番の実績。staff_id が null なら中止。時刻は省ける（送るなら開始と終了の両方） */
export type RecordShiftStandbyActualInput = {
  facility_id: string;
  date: string;
  shift_type_id: string;
  staff_id: string | null;
  starts_at?: string;
  ends_at?: string;
};
export type RecordShiftStandbyActualResult = {
  actual_id: string | null;
  outcome: "as_planned" | "changed" | "swapped" | "cancelled" | "added";
};

/** 問い合わせ。月は暦月。mode=actual は予定と実績を合わせた「実際」の表 */
export type ShiftSheetQuery = { facility_id: string; month: string; mode?: "plan" | "actual" };
export type ShiftPrintCell = { text: string; tone: "empty" | "code" | "off" | "paid"; color: string | null; window: string };
export type ShiftPrintRow = {
  staffId: string;
  lane: "main" | "standby";
  index: number;
  name: string;
  employmentLabel: string;
  band: string;
  cells: ShiftPrintCell[];
  countsText: string;
  workMinutes: number;
  oncallCount: number;
  oncallText: string;
  oncallByCode?: Record<string, number>;
};
export type ShiftPrintSheet = {
  countsLabel: string;
  days: { date: string; day: number; isoWeekday: number; label: string; isSunday: boolean; isSaturday: boolean }[];
  rows: ShiftPrintRow[];
  legend: { symbol: string; label: string; color: string | null }[];
  dayCounts: number[];
  oncallLabel: string | null;
  oncallColumns?: string[];
};
export type ShiftPrintSheetResult = { sheet: ShiftPrintSheet; month: string; mode: "plan" | "actual" };

/** GET /staff/shift-oncall-summary のクエリ（月は暦月 YYYY-MM） */
export type ShiftStandbySummaryQuery = { facility_id: string; month: string };
/** 職員 1 人の当番回数 */
export type ShiftStandbyCount = {
  staffId: string;
  /** 当番の数（同じ夜に 2 本あれば 2） */
  duties: number;
  /** 当番のあった夜の数 */
  nights: number;
  byCode: { shiftCode: string; count: number }[];
};
/** GET /staff/shift-oncall-summary の応答（手当の金額は出さない） */
export type ShiftStandbySummary = {
  facilityId: string;
  month: string;
  span: "calendar";
  /** 期間（両端を含む・YYYY-MM-DD） */
  from: string;
  to: string;
  /** 当番のある職員だけ（かなの順） */
  rows: (ShiftStandbyCount & { name: string })[];
  total: number;
};
/** GET /staff/shift-capabilities の応答 */
export type ShiftCapabilities = { standbyAllowed: boolean };

/** サービス事業所が記録したサービス担当者会議。 */
/** サービス担当者会議の記録（GET /care-record/clients/:clientId/service-conferences）。形の SoT は `@qaito/schemas/service-conferences` */
export type ServiceConference = {
  id: string;
  facilityId: string;
  facilityName: string | null;
  serviceTypeCode: string;
  heldOn: string;
  meetingNumber: number;
  status: "draft" | "saved";
  contents: import("@qaito/schemas/service-conferences").ServiceConferenceInput["contents"];
  updatedAt: string;
  updatedByName: string | null;
  editable: boolean;
};
export type ServiceConferenceInput = import("@qaito/schemas/service-conferences").ServiceConferenceInput;
/** 担当者会議の音声の受け付け（POST /care-record/clients/:clientId/service-conferences/audio）。clientId は path */
export type QueueServiceConferenceAudioInput = { facilityId: string; fileId: string; consent: true };
/** 受け付けた会議の音声の状態と記録の下書き（GET …/service-conferences/audio/:id）。受け付けた本人だけ・1 日で消える */
export type ServiceConferenceAudioJob = {
  id: string;
  status: "queued" | "transcribing" | "done" | "failed";
  draft: import("@qaito/schemas/service-conferences").ServiceConferenceAudioDraft | null;
};

export type DraftNursingIntakeInput = import("@qaito/schemas/api/nursing-plan").DraftNursingIntakeInput;
export type NursingIntakeDraftResult = {
  generatedAt: string;
  sources: import("@qaito/schemas/api/nursing-plan").NursingIntakeDraftResult["sources"];
  fields: import("@qaito/schemas/api/nursing-plan").NursingIntakeDraftResult["fields"];
  unavailable: import("@qaito/schemas/api/nursing-plan").NursingIntakeDraftResult["unavailable"];
  aiFailed?: boolean;
};

/** 指示書と一緒に作る傷病名（`CreateDoctorInstructionInput.diagnoses`） */
export type InstructionDiagnosisInput = {
  name: string;
  /** 傷病名コード（7 桁） */
  diseaseCode?: string | null;
  icd10Code?: string | null;
  /** 修飾語コード（4 桁・5 件まで） */
  modifierCodes?: string[];
};

export type MatchDiagnosisNamesInput = {
  /** 当てる傷病名（1〜20 件・各 200 字まで） */
  names: string[];
};

/** 当たった結果。one = ちょうど 1 つ / many = 同じ段で複数（人が選ぶ）/ none = 当たらない */
export type DiagnosisMatchKind = "one" | "many" | "none";

export type DiagnosisNameMatch = {
  /** 渡された名前（そのまま） */
  input: string;
  kind: DiagnosisMatchKind;
  /** kind = one のときの当たった行 */
  hit?: NationalDisease;
  /** kind = many のときの候補 */
  hits?: NationalDisease[];
  /** kind = one のときの当たった理由の短い言葉 */
  reason?: string;
  /** 名前から外した修飾語のコード・名前（当たった形で外したもの） */
  modifierCodes: string[];
  modifierNames: string[];
  /** 名前の末尾の括弧から外した注記 */
  notes: string[];
  /** kind = none のときの近い順の部分一致（最大 5 件） */
  closest?: NationalDisease[];
};

export type DiagnosisMatchOutcome = {
  /** 傷病名マスターが取り込まれていないとき false（全部 none） */
  masterLoaded: boolean;
  matches: DiagnosisNameMatch[];
};

export type ApplyDiagnosisCodeItem = {
  /** 傷病名ID */
  id: string;
  /** 当てたときの記録の名前（書く直前に同じかを確かめる） */
  expectedName: string;
  /** 傷病名コード（7 桁。0000999 = マスターに無いと決めた） */
  diseaseCode: string;
  icd10Code?: string | null;
  /** 渡すと置き換える。省略は今の値のまま */
  modifierCodes?: string[];
};

export type ApplyDiagnosisCodesInput = {
  /** 1〜200 件 */
  items: ApplyDiagnosisCodeItem[];
};

export type ApplyDiagnosisCodesResult = {
  /** コードを付けた行数 */
  applied: number;
  /** 飛ばした行数（別の人が直した・名前が違う・見えない・マスターに無いコード・重複） */
  skipped: number;
};

/** 「コードの無い傷病名」に出す 1 行 */
export type DiagnosisCodeRow = {
  id: string;
  clientId: string;
  /** 利用者名（`client:read` が無いときは null） */
  clientName: string | null;
  diseaseName: string;
  /** null = コードなし / 0000999 = マスターに無いと決めた / それ以外 = コード付き（精神疾患の印の確かめだけで出る行） */
  diseaseCode: string | null;
  icd10Code: string | null;
  modifierCodes: string[];
  isPrimary: boolean;
  isPsychiatric: boolean;
  onsetDate: string | null;
  endDate: string | null;
};

export type UncodedMatchInfo = {
  hit: NationalDisease;
  /** 当たった理由の短い言葉（「半角カナ」「『の疑い』は修飾語に分ける」など） */
  reason: string;
  /** 付ける修飾語（名前から外したもの） */
  modifierCodes: string[];
  modifierNames: string[];
  notes: string[];
};

/** 「1 つに当たった」行（まとめて付ける） */
export type UncodedOneHitItem = {
  diagnosis: DiagnosisCodeRow;
  match: UncodedMatchInfo;
  /** 付けると、精神疾患の印が付けるコードの ICD-10 と食い違う（印は変えない） */
  psychiatricMismatch: boolean;
};

export type UncodedPickReason = "many" | "none" | "psychiatricMark";

/** 1 件ずつ選ぶ行 */
export type UncodedPickItem = {
  diagnosis: DiagnosisCodeRow;
  reasons: UncodedPickReason[];
  /** many のときは当たった候補・none のときは近い順の部分一致（最大 5 件） */
  candidates: NationalDisease[];
  modifierCodes: string[];
  modifierNames: string[];
  notes: string[];
};

export type UncodedDiagnosesView = {
  masterLoaded: boolean;
  /** ちょうど 1 つに当たったもの */
  oneHit: UncodedOneHitItem[];
  /** 候補が複数・当たらない・精神疾患の印の食い違い */
  pick: UncodedPickItem[];
  /** 「マスターに無い」と決めた行のうち、新しいマスターで当たるようになったもの */
  rematched: UncodedOneHitItem[];
  counts: { oneHit: number; pick: number; rematched: number };
  /** 行の上限で切れた */
  truncated: boolean;
};

/** 人が確かめる条件の種類 */
export type ConditionCheckKind = "terminalStage" | "hoehnYahr" | "confirm";
export type ConditionCheckStatus = "met" | "unknown";

export type ConditionCandidateCheck = {
  kind: ConditionCheckKind;
  text: string;
  /** met = 渡された値から満たしていると分かる / unknown = 人が確かめる */
  status: ConditionCheckStatus;
};

export type ConditionCandidateDiagnosisBasis = {
  kind: "diagnosis";
  id: string;
  /** 記録の名前 */
  name: string;
  /** マスターの名前＋修飾語（コードがあるとき） */
  masterName: string | null;
  icd10Code: string | null;
  modifierNames: string[];
};

export type ConditionCandidateInstructionBasis = {
  kind: "instruction";
  id: string;
  instructionType: string;
  validFrom: string | null;
  validUntil: string | null;
  /** 指示書の欄: devices / pressureUlcer / instructionType */
  field: string;
  /** field = devices のときの機器の番号 */
  deviceCode?: number;
};

export type ConditionCandidateBasis = ConditionCandidateDiagnosisBasis | ConditionCandidateInstructionBasis;

export type ConditionCandidate = {
  category: "besshi7" | "besshi8";
  /** 別表7/8 の項目コード（B7-01〜 / B8-01〜） */
  conditionCode: string;
  /** 告示の文言そのまま */
  conditionLabel: string;
  subtype: string | null;
  basis: ConditionCandidateBasis;
  /** 何で当たったか（ICD-10 の範囲・名前の語・機器・褥瘡の深さ） */
  matchedBy: string;
  conditions: ConditionCandidateCheck[];
  /** 傷病名に「疑い」が付いている */
  suspected: boolean;
  /** 別表8 の指導管理の名前（機器から決まるもの） */
  management: string | null;
  /** 人に確かめてもらうこと */
  note: string | null;
  /** 確定するときの既定の開始日（YYYY-MM-DD） */
  defaultStartDate: string;
};

export type ConditionCandidatesView = {
  /** 今日（JST・YYYY-MM-DD） */
  today: string;
  candidates: ConditionCandidate[];
};

export type DismissConditionCandidateInput = {
  category: "besshi7" | "besshi8";
  /** 別表7/8 の項目コード（候補の値をそのまま） */
  conditionCode: string;
  basisKind: "diagnosis" | "instruction";
  basisId: string;
  /** あたらない理由（500 字まで） */
  reason?: string | null;
};

export type DismissedConditionCandidate = {
  id: string;
  category: string;
  conditionCode: string;
  basisKind: string;
  basisId: string;
  reason: string | null;
  dismissedAt: string | null;
};

export type VideoSession = import("@qaito/schemas/video-analysis").VideoSession;
export type VideoSessionListItem = import("@qaito/schemas/video-analysis").VideoSessionListItem;
export type UpdateVideoSessionInput = import("@qaito/schemas/video-analysis").UpdateVideoSessionInput;
export type VideoSessionLine = import("@qaito/schemas/video-analysis").VideoSessionLine;
export type VideoStill = import("@qaito/schemas/video-analysis").VideoStill;
export type VideoStillList = import("@qaito/schemas/video-analysis").VideoStillList;
export type VideoStillUpload = import("@qaito/schemas/video-analysis").VideoStillUpload;
export type IssueVideoStillsInput = import("@qaito/schemas/video-analysis").IssueVideoStillsInput;
export type IssueVideoStillsResult = import("@qaito/schemas/video-analysis").IssueVideoStillsResult;
export type VideoSessionDetail = import("@qaito/schemas/video-analysis").VideoSessionDetail;
export type VideoReport = import("@qaito/schemas/video-analysis").VideoReport;
export type VideoReportBody = import("@qaito/schemas/video-analysis").VideoReportBody;
export type VideoEndpointState = import("@qaito/schemas/video-analysis").VideoEndpointState;
export type VideoCost = import("@qaito/schemas/video-analysis").VideoCost;
export type VideoBillingView = import("@qaito/schemas/video-analysis").VideoBillingView;
export type VideoAnalysisPermissionContext = import("@qaito/schemas/video-analysis").VideoAnalysisPermissionContext;
export type CreateVideoSessionInput = import("@qaito/schemas/video-analysis").CreateVideoSessionInput;
export type CreateVideoSegmentInput = import("@qaito/schemas/video-analysis").CreateVideoSegmentInput;
export type CameraRosterEntry = import("@qaito/schemas/video-analysis").CameraRosterEntry;
export type CameraStandbyInput = import("@qaito/schemas/video-analysis").CameraStandbyInput;
export type CameraSignalInput = import("@qaito/schemas/video-analysis").CameraSignalInput;
export type CameraControlInput = import("@qaito/schemas/video-analysis").CameraControlInput;
export type CameraStateReportInput = import("@qaito/schemas/video-analysis").CameraStateReportInput;
export type CameraFrameInput = import("@qaito/schemas/video-analysis").CameraFrameInput;
/** `GET /video-analysis/sessions` の絞り込み（日付は JST の YYYY-MM-DD・両端を含む） */
export type ListVideoSessionsParams = {
  facilityId?: string;
  kind?: import("@qaito/schemas/video-analysis").VideoSessionKind;
  status?: import("@qaito/schemas/video-analysis").VideoSessionStatus;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  offset?: number;
};
/** `GET /video-analysis/camera/list` の絞り込み（事業所は必須） */
export type ListVideoCamerasParams = { facilityId: string };

export type PublicLinkStatus = "pending" | "published" | "stale" | "revoking" | "revoked" | "failed";

/** 公開リンク（`ref` は照合用の hash の先頭 8 字） */
export type PublicLink = {
  id: string;
  kind: "library";
  sourceId: string;
  status: PublicLinkStatus;
  revokeReason: string | null;
  generation: number;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
  publishedSourceVersion: string | null;
  publishedSourceUpdatedAt: string | null;
  lastErrorCode: string | null;
  /** 公開したときの題名 */
  title: string | null;
  /** 作った人の名前（引けなければ null） */
  createdByName: string | null;
  ref: string;
};

export type ListPublicLinksQuery = {
  /** "1" なら取り消し済み・失敗も含める */
  includeEnded?: "1";
  sourceId?: string;
};

/** 取り消しの結果（もう取り消し中・取り消し済みなら started は false） */
export type RevokePublicLinkResult = { started: boolean; link: PublicLink | null };

export type ShareLibraryNodeInput = { expiresInDays?: 7 | 30 | 90 };
export type UpdateLibraryShareInput = { expiresInDays?: 7 | 30 | 90 };

/** 作った結果（`url` = 外の人に渡す URL。この応答で 1 度だけ。`skippedImages` = 書き出せなかった画像の数） */
export type LibraryShareCreated = { linkId: string; url: string; expiresAt: string; skippedImages: number };
export type LibraryShareUpdated = { linkId: string; generation: number; expiresAt: string; skippedImages: number };
