import { runFullAnalysis } from "@/lib/ai/run-analysis";
import { failureDetails } from "@/lib/ai/analysis-response";
import { hasSession } from "@/lib/auth/session";

export const maxDuration = 60;

export async function POST() {
  if (!(await hasSession())) {
    return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const run = await runFullAnalysis();
    return Response.json({ runId: run.id, createdAt: run.createdAt });
  } catch (error) {
    const failure = failureDetails(error);
    return Response.json({ error: failure.message }, { status: failure.status });
  }
}
