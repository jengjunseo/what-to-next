import { afterEach, describe, expect, it, vi } from "vitest";
import { indexedSubjects } from "@/lib/ai/record-excerpts";
import { handleDemoAnalysis } from "./analysis-request";
import { demoSnapshot, fixedResponse, SCENARIOS } from "./scenarios";

const records = SCENARIOS.connected.records;
const snapshot = demoSnapshot(records);
const fixture = fixedResponse("connected", records);
const firstExcerpts = new Map(indexedSubjects(snapshot).flatMap(({ records }) =>
  records.map(({ id, excerpts }) => [id, excerpts[0].id] as const)));
const wireFixture = {
  focus: fixture.overall.biggestProblem,
  threads: fixture.threads.map(({ title, status, reasoning, connection }) => ({
    title, status, reasoning,
    connection: { ...connection!, evidence: connection!.evidence.map(({ recordId }) => firstExcerpts.get(recordId)!) },
  })),
  perspectives: fixture.perspectives!.map(({ aspect, grade, summary, uncertainty, quotes }) =>
    ({ aspect, grade, summary, uncertainty, evidence: quotes?.map(({ recordId }) => firstExcerpts.get(recordId)!) ?? [] })),
};
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
  it("resolves an excerpt index to the exact source sentence", async () => {
    const fetchMock = vi.fn(async () => geminiResult(wireFixture));
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      result: { threads: [{
        evidenceRecordIds: fixture.threads[0].evidenceRecordIds,
        connection: { evidence: expect.arrayContaining([{ recordId: 101, quote: "교실 창가와 복도의 온도를 5일간 같은 시각에 재었다." }]) },
      }] },
    });
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

  it("rejects invalid schema and nonexistent excerpts", async () => {
    const badId = structuredClone(wireFixture);
    badId.threads[0].connection.evidence[0] = 999999;
    vi.stubGlobal("fetch", vi.fn()
      .mockImplementationOnce(() => geminiResult({ threads: [] }))
      .mockImplementation(() => geminiResult(badId)));
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
      .mockImplementationOnce(() => geminiResult(wireFixture)));
    const response = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(response.status).toBe(429);
    expect(await response.text()).not.toContain(fakeKey);
    expect((await handleDemoAnalysis(request(snapshot), fakeKey)).status).toBe(200);
  });

  it("accepts one record without a thread and limits a cross-record grade to the evidence", async () => {
    const limited = { ...wireFixture, threads: [], perspectives: wireFixture.perspectives.map((item) => ({ ...item, grade: 0, evidence: [] })) };
    const invalid = structuredClone(wireFixture);
    invalid.perspectives[0].grade = 3;
    invalid.perspectives[0].evidence = [firstExcerpts.get(records[0].id)!];
    vi.stubGlobal("fetch", vi.fn()
      .mockImplementationOnce(() => geminiResult(limited))
      .mockImplementationOnce(() => geminiResult(invalid)));
    const accepted = await handleDemoAnalysis(request(demoSnapshot([records[0]])), fakeKey);
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toMatchObject({ result: { threads: [], perspectives: limited.perspectives.map(({ aspect }) => ({ aspect, grade: 0, quotes: [] })) } });
    const adjusted = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(adjusted.status).toBe(200);
    expect(await adjusted.json()).toMatchObject({
      result: { perspectives: expect.arrayContaining([expect.objectContaining({
        aspect: invalid.perspectives[0].aspect, grade: 1, evidenceRecordIds: [records[0].id],
      })]) },
    });
  });

  it("counts excerpts from the same record once and omits only unsupported threads", async () => {
    const responseFixture = structuredClone(wireFixture);
    const [first, second] = indexedSubjects(snapshot)
      .flatMap(({ records }) => records).find(({ id }) => id === 101)!.excerpts;
    const validThread = responseFixture.threads[0];
    validThread.connection.evidence.splice(1, 0, second.id);
    const unsupportedThread = structuredClone(validThread);
    unsupportedThread.title = "한 기록만 인용한 연결";
    unsupportedThread.connection.evidence = [first.id, second.id];
    responseFixture.threads.unshift(unsupportedThread);
    const inquiry = responseFixture.perspectives.find(({ aspect }) => aspect === "inquiry")!;
    inquiry.evidence = [first.id, second.id, firstExcerpts.get(102)!];
    vi.stubGlobal("fetch", vi.fn(async () => geminiResult(responseFixture)));

    const response = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(response.status).toBe(200);
    const { result } = await response.json();
    expect(result.threads.map(({ title }: { title: string }) => title)).toEqual([validThread.title]);
    expect(result.threads[0].evidenceRecordIds).toEqual([101, 102, 103]);
    expect(result.threads[0].connection.evidence[0]).toEqual({ recordId: 101, quote: first.text });
    expect(result.perspectives.find(({ aspect }: { aspect: string }) => aspect === "inquiry")).toMatchObject({
      grade: 3, evidenceRecordIds: [101, 102],
    });
  });

  it("asks Gemini to repair missing completion criteria and rejects a repeated vague answer", async () => {
    const vague = structuredClone(wireFixture);
    vague.threads[0].connection.experiment!.done = "짧은 글을 써요.";
    const fetchMock = vi.fn(async () => geminiResult(vague));
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleDemoAnalysis(request(snapshot), fakeKey);
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ stage: "schema", message: expect.stringContaining("완료 기준") });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
