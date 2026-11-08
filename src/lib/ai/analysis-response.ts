import { AnalysisResultSchema, EvidenceResultSchema, validateEvidenceIds, type AnalysisSnapshot } from "@/lib/domain/analysis";

export type AnalysisStage = "input" | "configuration" | "provider" | "schema" | "evidence";

export class AnalysisFailure extends Error {
  constructor(public stage: AnalysisStage, message: string, public status: number) {
    super(message);
  }
}

export function verifyAnalysis(value: unknown, snapshot: AnalysisSnapshot, requireEvidenceRubric = false) {
  const schema = requireEvidenceRubric ? EvidenceResultSchema : AnalysisResultSchema;
  const result = schema.safeParse(value);
  if (!result.success) {
    const path = result.error.issues[0]?.path.join(".");
    throw new AnalysisFailure("schema", `응답 형식이 맞지 않아요${path ? ` (${path})` : ""}.`, 422);
  }

  const ids = snapshot.subjects.flatMap((subject) => subject.records.map((record) => record.id));
  try {
    return validateEvidenceIds(result.data, ids);
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
