import { afterEach, describe, expect, it, vi } from "vitest";
import { handleDemoAnalysis } from "./analysis-request";
import { demoSnapshot, fixedResponse, SCENARIOS } from "./scenarios";

const records = SCENARIOS.connected.records;
const snapshot = demoSnapshot(records);
const fixture = fixedResponse("connected", records);
const origin = "http://localhost:3000";
const fakeKey = "unit-test-credential";

function request(body: unknown, from = origin) {
  return new Request(origin + "/api/demo-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: from },
    body: JSON.stringify(body),
  });
}
function geminiResult(value: unknown) {
  return Response.json({ candidates: [{ content: { parts: [{ thought: true, text: "internal thought" }, { text: JSON.stringify(value) }] } }] });
}

afterEach(() => vi.unstubAllGlobals());

describe("demo analysis request and provider contract", () => {
  it("sends a structured output request using the configured model and header, then validates it", async () => {
    const fetchMock = vi.fn(async () => geminiResult(fixture));
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ result: fixture });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/models\/gemini-3\.5-flash-lite:generateContent$/),
      expect.objectContaining({ headers: expect.objectContaining({ "x-goog-api-key": fakeKey }), body: expect.stringContaining("responseJsonSchema") }),
    );
  });

  it("reports unconfigured, cross-origin, and empty inputs without calling the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await handleDemoAnalysis(request(snapshot))).status).toBe(503);
    expect((await handleDemoAnalysis(request(snapshot, "https://example.com"), fakeKey)).status).toBe(403);
    const empty = await handleDemoAnalysis(request(demoSnapshot([])), fakeKey);
    expect(empty.status).toBe(422);
    expect(await empty.json()).toMatchObject({ stage: "input" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate record IDs, invalid request JSON, and oversized input", async () => {
    const duplicate = structuredClone(snapshot);
    duplicate.subjects[0].records.push(duplicate.subjects[0].records[0]);
    expect((await handleDemoAnalysis(request(duplicate), fakeKey)).status).toBe(422);
    const invalid = new Request(origin + "/api/demo-analysis", {
      method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{",
    });
    expect((await handleDemoAnalysis(invalid, fakeKey)).status).toBe(400);
    expect((await handleDemoAnalysis(request("a".repeat(98_305)), fakeKey)).status).toBe(413);
  });

  it("reports invalid schema and nonexistent evidence without returning a result", async () => {
    const badId = structuredClone(fixture);
    badId.threads[0].evidenceRecordIds[0] = 999999;
    vi.stubGlobal("fetch", vi.fn()
      .mockImplementationOnce(() => geminiResult({ threads: [] }))
      .mockImplementationOnce(() => geminiResult(badId)));
    const schema = await handleDemoAnalysis(request(snapshot), fakeKey);
    const evidence = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(schema.status).toBe(422);
    expect(await schema.json()).toMatchObject({ stage: "schema" });
    expect(evidence.status).toBe(422);
    expect(await evidence.json()).toMatchObject({ stage: "evidence", message: expect.stringContaining("999999") });
  });

  it("redacts provider response bodies and succeeds on retry", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ error: fakeKey }, { status: 429 }))
      .mockImplementationOnce(() => geminiResult(fixture)));
    const response = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(response.status).toBe(429);
    expect(await response.text()).not.toContain(fakeKey);
    expect((await handleDemoAnalysis(request(snapshot), fakeKey)).status).toBe(200);
  });

  it("accepts one record without a thread and rejects inconsistent rubric evidence", async () => {
    const onlyOne = [records[0]];
    const shortSnapshot = demoSnapshot(onlyOne);
    const limited = fixedResponse("personal", onlyOne);
    const invalid = structuredClone(fixture);
    invalid.perspectives![0].grade = 3;
    invalid.perspectives![0].evidenceRecordIds = [records[0].id];
    vi.stubGlobal("fetch", vi.fn()
      .mockImplementationOnce(() => geminiResult(limited))
      .mockImplementationOnce(() => geminiResult(invalid)));
    const accepted = await handleDemoAnalysis(request(shortSnapshot), fakeKey);
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toMatchObject({ result: { threads: [], perspectives: limited.perspectives } });
    const rejected = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(rejected.status).toBe(422);
    expect(await rejected.json()).toMatchObject({ stage: "evidence" });
  });
});
