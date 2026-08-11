import { createHash } from "node:crypto";
import { z } from "zod";

export const THREAD_STATUSES = ["KEEP", "EXTEND_NOW", "RECOVER_LATER", "DROP"] as const;
export const ThreadStatusSchema = z.enum(THREAD_STATUSES);
export type ThreadStatus = z.infer<typeof ThreadStatusSchema>;

const score = z.number().int().min(0).max(100);

export const AnalysisResultSchema = z
  .object({
    overall: z
      .object({
        currentProfile: z.string().min(1),
        strongestDirection: z.string().min(1),
        biggestProblem: z.string().min(1),
        strategySummary: z.string().min(1),
      })
      .strict(),
    threads: z
      .array(
        z
          .object({
            title: z.string().min(1),
            description: z.string().min(1),
            status: ThreadStatusSchema,
            evidenceRecordIds: z.array(z.number().int().positive()).min(1),
            strengthScore: score,
            continuityScore: score,
            growthScore: score,
            majorFitScore: score,
            academicDepthScore: score,
            forcedConnectionRisk: score,
            reasoning: z.string().min(1),
            relatedSubjects: z.array(z.string().min(1)),
            recommendedNextStep: z.string().min(1),
            avoid: z.string().min(1),
            targetSemester: z.enum(["2-2", "3-1", "NONE"]),
            priorityRank: z.number().int().positive().nullable(),
          })
          .strict(),
      )
      .min(1),
    semesterStrategy: z
      .object({
        secondYearSecondSemester: z.string().min(1),
        thirdYearFirstSemester: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const SubjectInputSchema = z.object({
  id: z.number().int().positive(),
  grade: z.number().int().min(1).max(3),
  semester: z.number().int().min(1).max(2),
  subjectName: z.string().min(1),
  category: z.string().nullable(),
  records: z.array(
    z.object({
      id: z.number().int().positive(),
      recordText: z.string().min(1),
      memo: z.string().nullable(),
    }),
  ),
});

export const AnalysisSnapshotSchema = z.object({
  targetAdmissionYear: z.literal(2028),
  currentGrade: z.literal(2),
  currentSemester: z.literal(2),
  intendedField: z.literal("Computer Science / Software"),
  subjects: z.array(SubjectInputSchema),
});

export type AnalysisSnapshot = z.infer<typeof AnalysisSnapshotSchema>;
export type SubjectInput = z.infer<typeof SubjectInputSchema>;

export function normalizeAnalysisInput(subjectRows: SubjectInput[]): AnalysisSnapshot {
  const subjects = subjectRows
    .map((subject) => ({
      ...subject,
      subjectName: subject.subjectName.trim(),
      category: subject.category?.trim() || null,
      records: subject.records
        .map((record) => ({
          ...record,
          recordText: record.recordText.trim(),
          memo: record.memo?.trim() || null,
        }))
        .sort((a, b) => a.id - b.id),
    }))
    .sort(
      (a, b) =>
        a.grade - b.grade ||
        a.semester - b.semester ||
        a.subjectName.localeCompare(b.subjectName, "ko") ||
        a.id - b.id,
    );

  return AnalysisSnapshotSchema.parse({
    targetAdmissionYear: 2028,
    currentGrade: 2,
    currentSemester: 2,
    intendedField: "Computer Science / Software",
    subjects,
  });
}

export function hashAnalysisInput(snapshot: AnalysisSnapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export function isAnalysisStale(currentInputHash: string, latestInputHash?: string | null) {
  return latestInputHash != null && latestInputHash !== currentInputHash;
}

export function effectiveStatus(aiStatus: ThreadStatus, userStatus: ThreadStatus | null) {
  return userStatus ?? aiStatus;
}

export function validateEvidenceIds(result: AnalysisResult, validIds: Iterable<number>) {
  const valid = new Set(validIds);
  const invalid = result.threads.flatMap((thread) =>
    thread.evidenceRecordIds.filter((id) => !valid.has(id)),
  );
  if (invalid.length > 0) {
    throw new Error(`Gemini가 존재하지 않는 근거 record ID를 반환했습니다: ${[...new Set(invalid)].join(", ")}`);
  }
  return result;
}
