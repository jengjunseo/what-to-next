import { z } from "zod";
import { AnalysisResultSchema, type AnalysisSnapshot } from "@/lib/domain/analysis";
import { buildAnalysisPrompt, STRATEGY_SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { AnalysisFailure, verifyAnalysis } from "@/lib/ai/analysis-response";

export const GEMINI_MODEL = "gemini-3.5-flash-lite";

export async function generateAnalysis(snapshot: AnalysisSnapshot, apiKey: string | undefined) {
  if (!apiKey) throw new AnalysisFailure("configuration", "서버에 Gemini 키가 설정되지 않았습니다.", 503);

  const responseJsonSchema = z.toJSONSchema(AnalysisResultSchema);
  Reflect.deleteProperty(responseJsonSchema, "$schema");

  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: STRATEGY_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: buildAnalysisPrompt(snapshot) }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema, temperature: 0.2 },
      }),
    });
  } catch {
    throw new AnalysisFailure("provider", "Gemini에 연결하지 못했거나 응답 시간이 초과되었습니다.", 502);
  }

  if (!response.ok) {
    await response.body?.cancel();
    throw new AnalysisFailure("provider", `Gemini 요청이 실패했습니다 (HTTP ${response.status}).`, response.status === 429 ? 429 : 502);
  }

  let value: unknown;
  try {
    const body = await response.json() as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    const output = body.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text ?? "").join("");
    value = JSON.parse(output ?? "");
  } catch {
    throw new AnalysisFailure("schema", "Gemini가 비어 있거나 유효하지 않은 JSON을 반환했습니다.", 422);
  }
  return verifyAnalysis(value, snapshot);
}
