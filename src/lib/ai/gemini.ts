import "server-only";

import type { AnalysisSnapshot } from "@/lib/domain/analysis";
import { generateAnalysis } from "@/lib/ai/gemini-provider";

export { GEMINI_MODEL } from "@/lib/ai/gemini-provider";

export function analyzeWithGemini(snapshot: AnalysisSnapshot) {
  return generateAnalysis(snapshot, process.env.GEMINI_API_KEY);
}
