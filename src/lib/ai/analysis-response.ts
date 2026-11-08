import { indexedSubjects } from "@/lib/ai/record-excerpts";
import { AnalysisResultSchema, EvidenceResultSchema, validateEvidenceIds, type AnalysisResult, type AnalysisSnapshot } from "@/lib/domain/analysis";

export type AnalysisStage = "input" | "configuration" | "provider" | "schema" | "evidence";

export class AnalysisFailure extends Error {
  constructor(public stage: AnalysisStage, message: string, public status: number, public repair?: string) {
    super(message);
  }
}

const vaguePhrases = /다양한|일관된|구체적인|유기적|심화\s*(탐구|연구|활동)|폭넓게/;

function analysisFromProvider(value: unknown, snapshot: AnalysisSnapshot): AnalysisResult {
  const data = parseResult(EvidenceResultSchema.safeParse(value));
  const excerpts = new Map(indexedSubjects(snapshot).flatMap((subject) =>
    subject.records.flatMap((record) => record.excerpts.map(({ id, text }) =>
      [id, { recordId: record.id, quote: text, subject: subject.subjectName }] as const))));

  function resolveExcerpt(id: number) {
    const excerpt = excerpts.get(id);
    if (!excerpt) throw new AnalysisFailure("evidence", "원문에 없는 구절 번호를 인용했어요: " + id, 422);
    return excerpt;
  }

  const threads = data.threads.map((thread) => ({
    ...thread,
    citations: thread.connection.evidence.map(resolveExcerpt),
  }));

  for (const { connection: { experiment }, citations } of threads) {
    if (!experiment) continue;
    if (!citations.some((item) => item.recordId === experiment.recordId)) {
      throw new AnalysisFailure("evidence", "제안의 인용이 연결의 원문 근거에 포함되어야 해요.", 422);
    }
    if (!/\d/.test(experiment.scope) || !/\d/.test(experiment.done)
      || [experiment.gap, experiment.action, experiment.done].some((part) => vaguePhrases.test(part))) {
      throw new AnalysisFailure("schema", "실험 분량과 완료 기준이 빠졌거나 제안이 너무 막연해요. 다시 분석해 주세요.", 422, "실험 scope와 done에 아라비아 숫자, 실제 비교 대상, 남길 측정값을 넣어요. 금지 수식어는 빼 주세요.");
    }
  }

  let rank = 0;
  return {
    overall: {
      currentProfile: data.threads[0]?.title ?? "기록에서 확인할 점",
      strongestDirection: data.threads[0]?.reasoning ?? data.focus,
      biggestProblem: data.focus,
      strategySummary: data.focus,
    },
    threads: threads.map(({ citations, ...thread }) => ({
      ...thread,
      connection: { ...thread.connection, evidence: citations.map(({ recordId, quote }) => ({ recordId, quote })) },
      description: thread.reasoning,
      evidenceRecordIds: citations.map(({ recordId }) => recordId),
      relatedSubjects: [...new Set(citations.map(({ subject }) => subject))],
      recommendedNextStep: thread.connection.experiment?.action ?? thread.connection.question ?? "지금 기록에서 추가로 확인할 내용이 없어요.",
      avoid: "기록에 없는 내용을 추측하지 않아요.",
      targetSemester: "NONE",
      priorityRank: thread.status === "EXTEND_NOW" ? ++rank : null,
    })),
    semesterStrategy: {
      secondYearSecondSemester: data.focus,
      thirdYearFirstSemester: data.focus,
    },
    perspectives: data.perspectives.map(({ evidence, ...perspective }) => {
      const quotes = evidence.map(resolveExcerpt).map(({ recordId, quote }) => ({ recordId, quote }));
      return { ...perspective, evidenceRecordIds: quotes.map(({ recordId }) => recordId), quotes };
    }),
  };
}

function parseResult<T>(result: { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[] }[] } }): T {
  if (result.success) return result.data;
  const path = result.error.issues[0]?.path.join(".");
  throw new AnalysisFailure("schema", `응답 형식이 맞지 않아요${path ? ` (${path})` : ""}.`, 422);
}

export function verifyAnalysis(value: unknown, snapshot: AnalysisSnapshot, requireEvidenceRubric = false) {
  const result = requireEvidenceRubric ? analysisFromProvider(value, snapshot) : parseResult(AnalysisResultSchema.safeParse(value));
  const ids = snapshot.subjects.flatMap((subject) => subject.records.map((record) => record.id));
  try {
    return validateEvidenceIds(result, ids);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    throw new AnalysisFailure("evidence", error.message, 422);
  }
}

export function failureDetails(error: unknown) {
  return error instanceof AnalysisFailure
    ? { stage: error.stage, message: error.message, status: error.status }
    : { stage: "provider" as const, message: "분석을 마치지 못했어요. 잠시 후 다시 시도해 주세요.", status: 500 };
}
