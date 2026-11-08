import { AnalysisFailure, failureDetails } from "@/lib/ai/analysis-response";
import { generateAnalysis } from "@/lib/ai/gemini-provider";
import { AnalysisSnapshotSchema, normalizeAnalysisInput } from "@/lib/domain/analysis";

const MAX_BYTES = 96 * 1024;

export async function handleDemoAnalysis(request: Request, apiKey?: string, origin = new URL(request.url).origin) {
  const started = performance.now();
  const headers = { "Cache-Control": "no-store" };
  try {
    if (request.headers.get("Origin") !== origin
      || !request.headers.get("Content-Type")?.startsWith("application/json")) {
      throw new AnalysisFailure("input", "같은 사이트에서 보낸 JSON 요청만 허용됩니다.", 403);
    }

    const reader = request.body?.getReader();
    if (!reader) throw new AnalysisFailure("input", "분석할 데이터가 없습니다.", 400);
    const decoder = new TextDecoder();
    let size = 0;
    let body = "";
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new AnalysisFailure("input", "가상 기록이 입력 한도를 초과했습니다.", 413);
      }
      body += decoder.decode(chunk.value, { stream: true });
    }

    let value: unknown;
    try {
      value = JSON.parse(body + decoder.decode());
    } catch {
      throw new AnalysisFailure("input", "요청 본문을 읽지 못했습니다.", 400);
    }

    const input = AnalysisSnapshotSchema.safeParse(value);
    if (!input.success) throw new AnalysisFailure("input", "가상 기록의 입력 형식이 올바르지 않습니다.", 400);

    const recordIds = input.data.subjects.flatMap((subject) => subject.records.map((record) => record.id));
    if (recordIds.length === 0) throw new AnalysisFailure("input", "분석할 기록을 먼저 추가해 주세요.", 422);
    if (recordIds.length !== new Set(recordIds).size) {
      throw new AnalysisFailure("input", "같은 기록 ID가 두 번 포함되었습니다.", 422);
    }

    const result = await generateAnalysis(normalizeAnalysisInput(input.data.subjects), apiKey);
    return Response.json({ result, durationMs: Math.round(performance.now() - started) }, { headers });
  } catch (error) {
    const { stage, message, status } = failureDetails(error);
    return Response.json({ stage, message, durationMs: Math.round(performance.now() - started) }, { status, headers });
  }
}
