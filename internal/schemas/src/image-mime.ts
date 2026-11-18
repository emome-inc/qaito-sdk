
/** 写真として扱う Content-Type。 */
export const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

const IMAGE_SET = new Set<string>(IMAGE_CONTENT_TYPES);

/** その Content-Type を「写真」として扱うか。 */
export function isImageContentType(contentType: string | null | undefined): boolean {
  return contentType !== null && contentType !== undefined && IMAGE_SET.has(contentType);
}
