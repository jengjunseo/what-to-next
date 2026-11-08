import { createHash } from "node:crypto";
import type { AnalysisSnapshot } from "./analysis";

export function hashAnalysisInput(snapshot: AnalysisSnapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}
