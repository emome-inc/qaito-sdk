import { z } from "zod";
export const attachNursingVisitRecordFileSchema=z.object({clientId:z.string().uuid(),recordId:z.string().uuid(),documentType:z.string().min(1).max(100),filePath:z.string().min(1).max(2000),fileName:z.string().min(1).max(255),mimeType:z.string().min(1).max(255)});
export type AttachNursingVisitRecordFileInput=z.infer<typeof attachNursingVisitRecordFileSchema>;
