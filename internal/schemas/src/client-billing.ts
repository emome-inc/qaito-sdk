import { z } from "zod";
import { partialForUpdate } from "./partial-for-update";

export const billingMethodOptions = [
  { value: "bank_transfer", label: "口座振替" },
  { value: "cash", label: "現金" },
  { value: "wire_transfer", label: "振込" },
  { value: "family_payment", label: "家族払い" },
] as const;

export const billingMethodValues = [
  "bank_transfer",
  "cash",
  "wire_transfer",
  "family_payment",
] as const;

export const accountTypeOptions = [
  { value: "ordinary", label: "普通" },
  { value: "checking", label: "当座" },
] as const;

export const accountTypeValues = ["ordinary", "checking"] as const;

/**
 * 請求書送付先区分
 */
export const invoiceRecipientTypeOptions = [
  { value: "self", label: "本人" },
  { value: "family", label: "家族" },
  { value: "other", label: "その他" },
] as const;

export const invoiceRecipientTypeValues = ["self", "family", "other"] as const;

/** 金融機関コード（全銀 4 桁の数字） */
export const BANK_CODE_RE = /^\d{4}$/;
/** 支店コード（全銀 3 桁の数字） */
export const BRANCH_CODE_RE = /^\d{3}$/;
/** 口座番号（7 桁以内の数字） */
export const ACCOUNT_NUMBER_RE = /^\d{1,7}$/;

export const createClientBillingSchema = z.object({
  billing_method: z.enum(billingMethodValues).optional().nullable(),

  bank_code: z.string().regex(BANK_CODE_RE).optional(),
  branch_code: z.string().regex(BRANCH_CODE_RE).optional(),
  account_type: z.enum(accountTypeValues).optional().nullable(),
  account_number: z.string().regex(ACCOUNT_NUMBER_RE).optional(),
  account_holder_kana: z.string().optional(),

  invoice_recipient_type: z.enum(invoiceRecipientTypeValues).default("self"),
  invoice_family_id: z.string().uuid().optional().nullable(),
  invoice_address_prefecture: z.string().optional(),
  invoice_address_city: z.string().optional(),
  invoice_address_line: z.string().optional(),
  invoice_contact: z.string().optional(),
});

export const updateClientBillingSchema = partialForUpdate(createClientBillingSchema);

export const clientBillingClientIdParam = z.object({ client_id: z.string().uuid() });
