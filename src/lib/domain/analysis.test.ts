import { hashAnalysisInput } from "@/lib/domain/analysis-hash";
import { describe, expect, it } from "vitest";
import {
  AnalysisResultSchema,
  effectiveStatus,
  isAnalysisStale,
  normalizeAnalysisInput,
  validateEvidenceIds,
  type AnalysisResult,
} from "@/lib/domain/analysis";

const validResult: AnalysisResult = {
  overall: {
    currentProfile: "구현과 검증을 통해 질문을 발전시킨다.",
    strongestDirection: "실제 문제를 소프트웨어로 구조화한다.",
    biggestProblem: "일부 연결의 교과 깊이가 약하다.",
    strategySummary: "현재 줄기 하나를 검증 가능한 프로젝트로 확장한다.",
  },
  threads: [
    {
      title: "문서 문제를 구조화해 검증하는 흐름",
      description: "정보와 국어 기록 사이의 발전 관계",
      status: "EXTEND_NOW",
      evidenceRecordIds: [7],
      strengthScore: 80,
      continuityScore: 74,
      growthScore: 81,
      majorFitScore: 78,
      academicDepthScore: 70,
      forcedConnectionRisk: 12,
      reasoning: "기록 7에서 구현과 검증이 확인된다.",
      relatedSubjects: ["정보"],
      recommendedNextStep: "오류 사례를 수집하고 분류 기준을 수정한다.",
      avoid: "AI라는 단어만 반복하지 않는다.",
      targetSemester: "2-2",
      priorityRank: 1,
    },
  ],
  semesterStrategy: {
    secondYearSecondSemester: "검증 가능한 구현을 완성한다.",
    thirdYearFirstSemester: "다른 교과의 관점으로 한계를 회수한다.",
  },
};

describe("analysis contract", () => {
  it("accepts the required structured output", () => {
    expect(AnalysisResultSchema.parse(validResult)).toEqual(validResult);
  });

  it("rejects an unknown status when every score is valid", () => {
    expect(AnalysisResultSchema.safeParse({
      ...validResult,
      threads: [{ ...validResult.threads[0], status: "MAYBE" }],
    }).success).toBe(false);
  });

  it("rejects a score outside 0-100 when the status is valid", () => {
    expect(AnalysisResultSchema.safeParse({
      ...validResult,
      threads: [{ ...validResult.threads[0], strengthScore: 101 }],
    }).success).toBe(false);
  });

  it("rejects evidence IDs that are not in the input", () => {
    expect(() => validateEvidenceIds(validResult, [1, 2, 3])).toThrow("record ID");
    expect(validateEvidenceIds(validResult, [7])).toEqual(validResult);
  });
});

describe("normalized input and stale hash", () => {
  const a = [
    { id: 2, grade: 2, semester: 1, subjectName: " 수학 ", category: "수학", records: [{ id: 9, recordText: " 둘째 ", memo: " " }] },
    { id: 1, grade: 1, semester: 2, subjectName: "정보", category: null, records: [{ id: 7, recordText: " 첫째 ", memo: null }] },
  ];
  const b = [a[1], a[0]];

  it("is stable across source ordering and insignificant whitespace", () => {
    expect(hashAnalysisInput(normalizeAnalysisInput(a))).toBe(hashAnalysisInput(normalizeAnalysisInput(b)));
  });

  it("is not stale when the latest hash matches the current normalized input", () => {
    const currentHash = hashAnalysisInput(normalizeAnalysisInput(a));
    expect(isAnalysisStale(currentHash, currentHash)).toBe(false);
  });

  it("is stale when a real record changes after the latest analysis", () => {
    const latestHash = hashAnalysisInput(normalizeAnalysisInput(a));
    const changed = structuredClone(a);
    changed[0].records[0].recordText = "내용이 바뀜";
    const currentHash = hashAnalysisInput(normalizeAnalysisInput(changed));
    expect(isAnalysisStale(currentHash, latestHash)).toBe(true);
  });
});

describe("effective status", () => {
  it("uses user override and restores the AI status when cleared", () => {
    expect(effectiveStatus("DROP", "KEEP")).toBe("KEEP");
    expect(effectiveStatus("DROP", null)).toBe("DROP");
  });
});
