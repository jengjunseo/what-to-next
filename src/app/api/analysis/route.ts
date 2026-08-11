import { runFullAnalysis } from "@/lib/ai/run-analysis";
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
    const message = error instanceof Error ? error.message : "분석을 완료하지 못했습니다.";
    return Response.json({ error: message }, { status: 422 });
  }
}
