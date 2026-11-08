import { AnalysisFailure, failureDetails, verifyAnalysis, type AnalysisStage } from "@/lib/ai/analysis-response";
import type { AnalysisResult, ThreadStatus } from "@/lib/domain/analysis";
import { demoSnapshot, fixedResponse, type DemoRecord, type ScenarioId } from "./scenarios";

export type Mode = "fixed" | "gemini" | "bad-schema" | "bad-id" | "provider-error";
type RunBase = {
  id: string;
  time: string;
  hash: string;
  mode: Mode;
  durationMs: number;
  httpStatus: number | null;
  scenario: ScenarioId;
};
export type Success = RunBase & {
  ok: true;
  result: AnalysisResult;
  records: DemoRecord[];
  overrides: Partial<Record<number, ThreadStatus>>;
};
export type Failure = RunBase & { ok: false; stage: AnalysisStage; message: string };
export type Run = Success | Failure;

export const MODE_LABELS: Record<Mode, string> = {
  fixed: "고정 응답",
  gemini: "Gemini 실분석",
  "bad-schema": "스키마 오류 재현",
  "bad-id": "잘못된 근거 ID 재현",
  "provider-error": "공급자 오류 재현",
};

export async function snapshotHash(records: DemoRecord[]) {
  const bytes = new TextEncoder().encode(JSON.stringify(demoSnapshot(records)));
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function runDemo(scenario: ScenarioId, records: DemoRecord[], mode: Mode): Promise<Run> {
  const started = performance.now();
  const id = crypto.randomUUID();
  const time = new Date().toISOString();
  let hash = "";
  let httpStatus: number | null = null;
  let durationMs: number | undefined;
  const details = () => ({
    id, time, hash, mode, scenario, httpStatus,
    durationMs: durationMs ?? Math.round(performance.now() - started),
  });
  try {
    hash = await snapshotHash(records);
    if (records.length === 0) throw new AnalysisFailure("input", "분석할 기록을 먼저 추가해 주세요.", 422);
    const snapshot = demoSnapshot(records);
    let value: unknown;
    if (mode === "gemini") {
      const response = await fetch("/api/demo-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
        signal: AbortSignal.timeout(50_000),
      });
      httpStatus = response.status;
      const data = await response.json();
      durationMs = typeof data.durationMs === "number" ? data.durationMs : undefined;
      if (!response.ok) throw new AnalysisFailure(data.stage ?? "provider", data.message ?? "Gemini 요청을 처리하지 못했습니다.", response.status);
      value = data.result;
    } else {
      const fixture = fixedResponse(scenario, records);
      if (mode === "provider-error") throw new AnalysisFailure("provider", "재현용 공급자 장애입니다. 다시 실행해 보세요.", 502);
      if (mode === "bad-id") fixture.threads[0].evidenceRecordIds = [999999];
      value = mode === "bad-schema" ? { threads: [] } : fixture;
    }
    return { ...details(), ok: true, result: verifyAnalysis(value, snapshot), records, overrides: {} };
  } catch (error) {
    const failure = failureDetails(error);
    return { ...details(), ok: false, stage: failure.stage, message: failure.message };
  }
}
