export {
  getVisitStaffingSchema as getVisitStaffingApiSchema,
  listUnrecordedEmergencyVisitsSchema as listUnrecordedEmergencyVisitsApiSchema,
  assignVisitStaffSchema as assignVisitStaffApiSchema,
  previewVisitGenerationSchema as previewVisitGenerationApiSchema,
  createScheduleVisitSchema as createScheduleVisitApiSchema,
  updateScheduleVisitSchema as updateScheduleVisitApiSchema,
  provideScheduleVisitSchema as provideScheduleVisitApiSchema,
  moveScheduleVisitSchema as moveScheduleVisitApiSchema,
  cancelScheduleVisitSchema as cancelScheduleVisitApiSchema,
  createVisitProviderSchema as createVisitProviderApiSchema,
  updateVisitProviderSchema as updateVisitProviderApiSchema,
  createVisitPatternSchema as createVisitPatternApiSchema,
  updateVisitPatternSchema as updateVisitPatternApiSchema,
  generateVisitScheduleSchema as generateVisitScheduleApiSchema,
  setupVisitPatternsSchema,
  listMyVisitsSchema as listMyVisitsQueryApiSchema,
  MY_VISITS_MAX_DAYS,
  visitIdParam as visitIdParamSchema,
  visitProviderIdParam as visitProviderIdParamSchema,
  visitPatternIdParam as visitPatternIdParamSchema,
  isValidVisitKind,
  VISIT_KIND_BY_SERVICE_TYPE,
} from "../schedule-visits";
/** 訪問詳細に付く、同じ利用者の次の予定（閲覧可能な事業所内）。 */
export type NextScheduledVisit = {
  id: string;
  serviceDate: string;
  plannedStartTime: string;
  plannedEndTime: string | null;
};
