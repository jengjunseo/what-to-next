import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  AnalysisResultSchema,
  type AnalysisResult,
  type AnalysisSnapshot,
  validateEvidenceIds,
} from "@/lib/domain/analysis";
import { buildAnalysisPrompt, STRATEGY_SYSTEM_PROMPT } from "@/lib/ai/prompt";

export const GEMINI_MODEL = "gemini-3.5-flash-lite";

export async function analyzeWithGemini(snapshot: AnalysisSnapshot): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const responseJsonSchema = z.toJSONSchema(AnalysisResultSchema);
  Reflect.deleteProperty(responseJsonSchema, "$schema");
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildAnalysisPrompt(snapshot),
    config: {
      systemInstruction: STRATEGY_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema,
      temperature: 0.2,
    },
  });

  if (!response.text) {
    throw new Error("Gemini가 빈 분석 결과를 반환했습니다.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    throw new Error("Gemini 응답이 유효한 JSON이 아닙니다.");
  }

  const result = AnalysisResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Gemini 분석 결과가 스키마를 통과하지 못했습니다: ${z.prettifyError(result.error)}`);
  }

  const recordIds = snapshot.subjects.flatMap((subject) => subject.records.map((record) => record.id));
  return validateEvidenceIds(result.data, recordIds);
}
