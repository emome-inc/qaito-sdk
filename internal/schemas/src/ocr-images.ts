/**
 * ocr-images.ts — 書類の読み取り（OCR）で AI に渡す画像の上限と、写真を帯に分けて渡す形。
 *
 * 【なぜあるか（2026-11-11）】
 * 読み取りの口は 20MB まで受けるのに、Bedrock の Claude が 1 枚の画像で受けるのは 3.75MB まで。
 * スマホで撮った書類の写真はこれを超えやすく、AI に断られて「OCR処理中にエラー」とだけ出ていた。
 * 画面は写真を上から下へ帯に分け、1 枚ずつを AI が読む大きさに収めてから送る。
 * 帯は 1 回の呼び出しに順に並べる（呼ぶ回数は 1 回のまま）。
 *
 * 分けるのは横の帯だけ（左右には分けない）。表の行を左右で切ると、AI が行をつなぎ直す必要が出るため。
 *
 * 利用者（client）・アセスメント（assessment）・ケアプラン（kyotaku-plan）・提供票（claims）の読み取りが使う。
 * 依存は zod だけ。server・client どちらからも import してよい。
 */
import { z } from "zod";

/**
 * Bedrock の Claude が 1 枚の画像で受ける上限（デコードしたバイト数）。
 * AWS の「Anthropic Claude Messages API の要求と応答」の説明の値（Anthropic の説明は Bedrock で 5MB だが、小さいほうに合わせる）。
 */
export const OCR_AI_IMAGE_MAX_BYTES = 3_750_000;

/** Claude は長い辺がこれを超える画像を自分で縮めてから読む（Anthropic の Vision の説明）。帯はこの大きさに収める */
export const OCR_AI_IMAGE_MAX_EDGE = 1568;

/** 1 回の読み取りで渡す帯の数の上限（1 枚目 + 続き） */
export const OCR_MAX_PARTS = 4;

/** 続きの帯（base64）。形式は 1 枚目の `mime_type` と同じ。画像のときだけ受ける */
export const ocrExtraPartsSchema = z.array(z.string().min(1)).max(OCR_MAX_PARTS - 1);

export type OcrSourceBlock = {
  type: "image" | "document";
  source: { type: "base64"; media_type: string; data: string };
};

/** AI に渡す画像 / PDF の並び（1 枚目 + 続きの帯）。 */
export function ocrSourceBlocks(base64: string, mimeType: string, extraParts: readonly string[] = []): OcrSourceBlock[] {
  const type = mimeType === "application/pdf" ? "document" : "image";
  return [base64, ...extraParts].map((data) => ({ type, source: { type: "base64", media_type: mimeType, data } }));
}

/** 帯に分けたときに、指示の文に足す説明。1 枚なら空 */
export function ocrPartsNote(partCount: number): string {
  if (partCount <= 1) return "";
  return `画像は同じ書類を上から順に ${partCount} 枚に分けたものです。分け目は少し重なっているので、重なった行は 1 回だけ読んでください。`;
}

/**
 * 続きの帯の受け方の検査。PDF に続きは付けられない・画像は 1 枚ずつ AI の上限に収まっていること。
 * 上限を超える画像があれば `"too_large"`、続きの付け方が違えば `"invalid"`、問題なければ null。
 */
export function checkOcrParts(
  base64: string,
  mimeType: string,
  extraParts: readonly string[],
  estimateBytes: (base64: string) => number,
): "too_large" | "invalid" | null {
  if (mimeType === "application/pdf") return extraParts.length > 0 ? "invalid" : null;
  for (const part of [base64, ...extraParts]) {
    if (estimateBytes(part) > OCR_AI_IMAGE_MAX_BYTES) return "too_large";
  }
  return null;
}
