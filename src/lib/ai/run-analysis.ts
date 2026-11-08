import { hashAnalysisInput } from "@/lib/domain/analysis-hash";
import "server-only";

import { AnalysisFailure } from "@/lib/ai/analysis-response";
import { getDb } from "@/lib/db";
import { analysisRuns, threads } from "@/lib/db/schema";
import { getCurrentSnapshot } from "@/lib/db/queries";
import { analyzeWithGemini, GEMINI_MODEL } from "@/lib/ai/gemini";
import { PROMPT_VERSION } from "@/lib/ai/prompt";

export async function runFullAnalysis() {
  const snapshot = await getCurrentSnapshot();
  const recordCount = snapshot.subjects.reduce((sum, subject) => sum + subject.records.length, 0);
  if (recordCount === 0) {
    throw new AnalysisFailure("input", "분석할 생기부 기록이 없습니다. 먼저 과목과 기록을 추가해 주세요.", 422);
  }

  const inputHash = hashAnalysisInput(snapshot);
  const result = await analyzeWithGemini(snapshot);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [run] = await tx
      .insert(analysisRuns)
      .values({
        model: GEMINI_MODEL,
        promptVersion: PROMPT_VERSION,
        inputHash,
        inputSnapshot: snapshot,
        overallSummary: result.overall,
        rawResult: result,
      })
      .returning({ id: analysisRuns.id, createdAt: analysisRuns.createdAt });

    if (result.threads.length > 0) await tx.insert(threads).values(
      result.threads.map((thread) => ({
        analysisRunId: run.id,
        title: thread.title,
        description: thread.description,
        aiStatus: thread.status,
        userStatus: null,
        // The initial table requires legacy score columns. The rubric lives in rawResult.
        strengthScore: thread.strengthScore ?? 0,
        continuityScore: thread.continuityScore ?? 0,
        growthScore: thread.growthScore ?? 0,
        majorFitScore: thread.majorFitScore ?? 0,
        academicDepthScore: thread.academicDepthScore ?? 0,
        forcedConnectionRisk: thread.forcedConnectionRisk ?? 0,
        evidenceRecordIds: thread.evidenceRecordIds,
        reasoning: thread.reasoning,
        relatedSubjects: thread.relatedSubjects,
        recommendedNextStep: thread.recommendedNextStep,
        avoid: thread.avoid,
        targetSemester: thread.targetSemester,
        priorityRank: thread.priorityRank,
      })),
    );

    return run;
  });
}
