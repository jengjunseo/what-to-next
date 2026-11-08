import { z } from "zod";

export const THREAD_STATUSES = ["KEEP", "EXTEND_NOW", "RECOVER_LATER", "DROP"] as const;
export const ThreadStatusSchema = z.enum(THREAD_STATUSES);
export type ThreadStatus = z.infer<typeof ThreadStatusSchema>;

const score = z.number().int().min(0).max(100);
const text = z.string().trim().min(1);
const recordId = z.number().int().positive();

export const PERSPECTIVES = {
  concepts: "교과 개념과 이해",
  inquiry: "탐구 과정과 근거",
  agency: "주도성·실행·수정",
  growth: "성장과 시간적 연결",
  exploration: "과목 연결과 관심 탐색",
  collaboration: "협업과 공동체 기여",
} as const;

const PerspectiveSchema = z.object({
  aspect: z.enum(Object.keys(PERSPECTIVES) as [keyof typeof PERSPECTIVES, ...(keyof typeof PERSPECTIVES)[]]),
  grade: z.number().int().min(0).max(3),
  evidenceRecordIds: z.array(recordId),
  summary: text,
  uncertainty: text,
}).strict();

const ConnectionSchema = z.object({
  type: z.enum(["주제 반복", "개념 확장", "방법 개선", "관점 변화", "공동체 적용", "관련성 약함"]),
  strength: z.enum(["높음", "중간", "낮음"]),
  evidence: z.array(z.object({ recordId, summary: text }).strict()).min(2),
  alternative: text,
  question: text,
  options: z.array(z.object({ action: text, output: text }).strict()).min(1).max(3),
}).strict();

const ThreadSchema = z.object({
  title: text,
  description: text,
  status: ThreadStatusSchema,
  evidenceRecordIds: z.array(recordId).min(1),
  reasoning: text,
  relatedSubjects: z.array(text),
  recommendedNextStep: text,
  avoid: text,
  targetSemester: z.enum(["2-2", "3-1", "NONE"]),
  priorityRank: z.number().int().positive().nullable(),
}).strict();

// Old snapshots and fixed fixtures can still be read. The provider uses the stricter rubric below.
export const AnalysisResultSchema = z.object({
  overall: z.object({
    currentProfile: text,
    strongestDirection: text,
    biggestProblem: text,
    strategySummary: text,
  }).strict(),
  threads: z.array(ThreadSchema.extend({
    strengthScore: score.optional(),
    continuityScore: score.optional(),
    growthScore: score.optional(),
    majorFitScore: score.optional(),
    academicDepthScore: score.optional(),
    forcedConnectionRisk: score.optional(),
    connection: ConnectionSchema.optional(),
  })),
  semesterStrategy: z.object({
    secondYearSecondSemester: text,
    thirdYearFirstSemester: text,
  }).strict(),
  perspectives: z.array(PerspectiveSchema).length(6).optional(),
}).strict();

export const EvidenceResultSchema = AnalysisResultSchema.extend({
  threads: z.array(ThreadSchema.extend({
    evidenceRecordIds: z.array(recordId).min(2),
    connection: ConnectionSchema,
  })),
  perspectives: z.array(PerspectiveSchema).length(6),
});

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

export function isAnalysisStale(currentInputHash: string, latestInputHash?: string | null) {
  return latestInputHash != null && latestInputHash !== currentInputHash;
}

export function effectiveStatus(aiStatus: ThreadStatus, userStatus: ThreadStatus | null) {
  return userStatus ?? aiStatus;
}

export function validateEvidenceIds(result: AnalysisResult, validIds: Iterable<number>) {
  const valid = new Set(validIds);
  const cited = [
    ...result.threads.flatMap((thread) => [
      ...thread.evidenceRecordIds,
      ...(thread.connection?.evidence.map(({ recordId }) => recordId) ?? []),
    ]),
    ...(result.perspectives?.flatMap((item) => item.evidenceRecordIds) ?? []),
  ];
  const invalid = cited.filter((id) => !valid.has(id));
  if (invalid.length) {
    throw new Error("존재하지 않는 근거 record ID가 있어요: " + [...new Set(invalid)].join(", "));
  }

  for (const thread of result.threads) {
    if (!thread.connection) continue;
    const ids = new Set(thread.evidenceRecordIds);
    const summaries = new Set(thread.connection.evidence.map(({ recordId }) => recordId));
    if (ids.size < 2 || ids.size !== thread.evidenceRecordIds.length
      || summaries.size !== thread.connection.evidence.length
      || summaries.size !== ids.size || [...summaries].some((id) => !ids.has(id))) {
      throw new Error("연결에는 서로 다른 기록 두 개 이상이 필요하고, 원문 요약 ID가 연결 근거와 일치해야 해요.");
    }
  }

  if (result.perspectives) {
    if (new Set(result.perspectives.map((item) => item.aspect)).size !== Object.keys(PERSPECTIVES).length) {
      throw new Error("여섯 가지 관점이 각각 한 번씩 필요해요.");
    }
    for (const item of result.perspectives) {
      const count = new Set(item.evidenceRecordIds).size;
      if (count !== item.evidenceRecordIds.length || (item.grade === 0 && count !== 0)
        || (item.grade > 0 && count === 0) || (item.grade === 3 && count < 2)) {
        throw new Error("관점의 근거 수준과 기록 ID가 맞지 않아요.");
      }
    }
  }
  return result;
}
