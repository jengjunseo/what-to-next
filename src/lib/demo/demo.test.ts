import { describe, expect, it } from "vitest";
import { hashAnalysisInput } from "@/lib/domain/analysis-hash";
import { demoSnapshot, SCENARIOS, SCENARIO_IDS } from "./scenarios";
import { runDemo, snapshotHash } from "./runs";

describe("isolated demo runs", () => {
  it.each(SCENARIO_IDS)("checks the %s fixture against its original record IDs", async (id) => {
    const records = SCENARIOS[id].records;
    const run = await runDemo(id, records, "fixed");
    expect(run).toMatchObject({ ok: true, mode: "fixed", httpStatus: null });
    if (!run.ok) throw new Error(run.message);
    expect(run.result.threads[0].status).toBe(SCENARIOS[id].status);
    expect(run.result.threads[0].evidenceRecordIds.every((id) => records.some((record) => record.id === id))).toBe(true);
  });

  it.each([["bad-id", "evidence"], ["bad-schema", "schema"], ["provider-error", "provider"]] as const)(
    "records %s as a failure at %s", async (mode, stage) => {
      const run = await runDemo("connected", SCENARIOS.connected.records, mode);
      expect(run).toMatchObject({ ok: false, stage, httpStatus: null });
      expect(run).not.toHaveProperty("result");
    },
  );

  it("shows empty input as a failure and allows a subsequent run", async () => {
    expect(await runDemo("connected", [], "fixed")).toMatchObject({ ok: false, stage: "input" });
    expect(await runDemo("connected", SCENARIOS.connected.records, "fixed")).toMatchObject({ ok: true });
  });

  it("matches the existing SHA-256 algorithm and changes when a record changes", async () => {
    const records = SCENARIOS.connected.records;
    const hash = await snapshotHash(records);
    expect(hash).toBe(hashAnalysisInput(demoSnapshot(records)));
    expect(await snapshotHash([...records].reverse())).toBe(hash);
    expect(await snapshotHash(records.map((record) => ({ ...record, text: "변경됨" })))).not.toBe(hash);
  });
});
