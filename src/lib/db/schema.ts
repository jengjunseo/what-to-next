import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AnalysisResult, AnalysisSnapshot, ThreadStatus } from "@/lib/domain/analysis";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const subjects = pgTable(
  "subjects",
  {
    id: serial("id").primaryKey(),
    grade: smallint("grade").notNull(),
    semester: smallint("semester").notNull(),
    subjectName: text("subject_name").notNull(),
    category: text("category"),
    ...timestamps,
  },
  (table) => [
    check("subjects_grade_check", sql`${table.grade} between 1 and 3`),
    check("subjects_semester_check", sql`${table.semester} between 1 and 2`),
  ],
);

export const records = pgTable(
  "records",
  {
    id: serial("id").primaryKey(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    recordText: text("record_text").notNull(),
    memo: text("memo"),
    ...timestamps,
  },
  (table) => [index("records_subject_id_idx").on(table.subjectId)],
);

export const analysisRuns = pgTable("analysis_runs", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  inputHash: text("input_hash").notNull(),
  inputSnapshot: jsonb("input_snapshot").$type<AnalysisSnapshot>().notNull(),
  overallSummary: jsonb("overall_summary").$type<AnalysisResult["overall"]>().notNull(),
  rawResult: jsonb("raw_result").$type<AnalysisResult>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const threads = pgTable(
  "threads",
  {
    id: serial("id").primaryKey(),
    analysisRunId: integer("analysis_run_id")
      .notNull()
      .references(() => analysisRuns.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    aiStatus: text("ai_status").$type<ThreadStatus>().notNull(),
    userStatus: text("user_status").$type<ThreadStatus>(),
    strengthScore: integer("strength_score").notNull(),
    continuityScore: integer("continuity_score").notNull(),
    growthScore: integer("growth_score").notNull(),
    majorFitScore: integer("major_fit_score").notNull(),
    academicDepthScore: integer("academic_depth_score").notNull(),
    forcedConnectionRisk: integer("forced_connection_risk").notNull(),
    evidenceRecordIds: jsonb("evidence_record_ids").$type<number[]>().notNull(),
    reasoning: text("reasoning").notNull(),
    relatedSubjects: jsonb("related_subjects").$type<string[]>().notNull(),
    recommendedNextStep: text("recommended_next_step").notNull(),
    avoid: text("avoid").notNull(),
    targetSemester: text("target_semester").$type<"2-2" | "3-1" | "NONE">().notNull(),
    priorityRank: integer("priority_rank"),
    ...timestamps,
  },
  (table) => [
    index("threads_analysis_run_id_idx").on(table.analysisRunId),
    check("threads_ai_status_check", sql`${table.aiStatus} in ('KEEP','EXTEND_NOW','RECOVER_LATER','DROP')`),
    check("threads_user_status_check", sql`${table.userStatus} is null or ${table.userStatus} in ('KEEP','EXTEND_NOW','RECOVER_LATER','DROP')`),
    check("threads_target_semester_check", sql`${table.targetSemester} in ('2-2','3-1','NONE')`),
    check("threads_strength_score_check", sql`${table.strengthScore} between 0 and 100`),
    check("threads_continuity_score_check", sql`${table.continuityScore} between 0 and 100`),
    check("threads_growth_score_check", sql`${table.growthScore} between 0 and 100`),
    check("threads_major_fit_score_check", sql`${table.majorFitScore} between 0 and 100`),
    check("threads_academic_depth_score_check", sql`${table.academicDepthScore} between 0 and 100`),
    check("threads_forced_connection_risk_check", sql`${table.forcedConnectionRisk} between 0 and 100`),
    check("threads_priority_rank_check", sql`${table.priorityRank} is null or ${table.priorityRank} > 0`),
  ],
);

export type Subject = typeof subjects.$inferSelect;
export type RecordEntry = typeof records.$inferSelect;
export type AnalysisRun = typeof analysisRuns.$inferSelect;
export type Thread = typeof threads.$inferSelect;
