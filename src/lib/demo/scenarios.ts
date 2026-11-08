import { normalizeAnalysisInput, type AnalysisResult, type ThreadStatus } from "@/lib/domain/analysis";

export type DemoRecord = {
  id: number;
  grade: number;
  semester: number;
  subject: string;
  text: string;
  memo: string;
};

function record(id: number, grade: number, semester: number, subject: string, text: string): DemoRecord {
  return { id, grade, semester, subject, text, memo: "" };
}

export const SCENARIOS = {
  connected: {
    title: "과목을 넘는 탐구",
    description: "교실 온도 관찰이 데이터 분석과 센서 실험으로 발전한 사례",
    records: [
      record(101, 1, 2, "통합과학", "교실 창가와 복도의 온도를 5일간 같은 시각에 재었다. 햇빛이 강한 날에는 두 지점의 온도 차가 커졌다."),
      record(102, 2, 1, "확률과 통계", "온도 차를 상자그림으로 나타내고 일조량에 따라 분류했다. 측정 위치가 다른 두 값을 합치면 이상치 해석이 바뀐다는 점을 확인했다."),
      record(103, 2, 2, "정보", "온도 센서로 5분마다 측정값을 기록하는 프로그램을 구현했다. 실내 이동 시 순간값이 튀어 3회 이동평균을 적용하고 원본과 비교했다."),
      record(104, 2, 1, "국어", "교실 환경 조사 결과를 발표했다. 측정 결과와 개선 제안을 분리하고 표본이 한 교실뿐이라는 한계를 밝혔다."),
    ],
    status: "EXTEND_NOW",
    thread: "교실 온도 관찰에서 센서 검증으로",
    reasoning: "수동 관측에서 확인한 장소별 차이를 통계로 비교하고, 센서 구현에서는 측정 오류를 줄이는 방법을 시험했다.",
    next: "같은 센서 두 대를 창가와 복도에 두고 일주일간 측정하세요. 위치를 중간에 교환한 뒤 원본과 이동평균에서 같은 차이가 나타나는지 비교해 보세요.",
  },
  weak: {
    title: "연결 근거가 약한 기록",
    description: "서로 다른 분야의 활동이 같은 학기에 섞여 있는 사례",
    records: [
      record(201, 1, 1, "미술", "명암 대비를 바꾼 포스터 세 장을 제작하고 가독성을 비교했다."),
      record(202, 2, 1, "지구과학", "지역 하천 수위를 조사하고 강수량이 높은 날짜를 표로 정리했다."),
      record(203, 2, 2, "영어", "재생에너지에 관한 영어 기사 한 편을 읽고 핵심 주장을 발표했다."),
    ],
    status: "KEEP",
    thread: "포스터 가독성 비교",
    reasoning: "세 가지 시안의 비교는 확인된다. 다른 과목 기록과의 발전 관계를 판단할 공통 질문이나 방법은 확인되지 않는다.",
    next: "포스터 세 장을 같은 거리에서 보여 주고 제목을 읽는 데 걸리는 시간을 기록해 보세요.",
  },
  incomplete: {
    title: "기록이 불완전한 탐구",
    description: "결과, 방법 또는 학생 역할이 빠진 사례",
    records: [
      record(301, 1, 2, "화학", "산·염기 지시약 비교 실험에 참여했다. 조별 측정 결과는 기록에 남아 있지 않다."),
      record(302, 2, 1, "정보", "수업에서 데이터 시각화 과제를 제출했다. 어떤 데이터와 기준을 사용했는지는 기록에 없다."),
    ],
    status: "RECOVER_LATER",
    thread: "지시약 실험의 측정 근거 복원",
    reasoning: "실험 참여는 확인된다. 지시약별 반응이나 학생이 수행한 역할은 추가 자료가 필요하다.",
    next: "실험 노트에서 사용한 용액, 지시약과 관찰 색을 확인하고 본인이 맡은 절차를 함께 정리해 보세요.",
  },
  repeated: {
    title: "주제 반복과 발전의 구분",
    description: "세 학기 연속 같은 주제를 조사했으나 새 방법이나 검증이 없는 사례",
    records: [
      record(401, 1, 1, "정보", "생성형 AI의 정의와 활용 사례 세 가지를 조사해 발표했다."),
      record(402, 1, 2, "영어", "생성형 AI 활용 사례 세 가지를 영어 자료로 찾아 정리했다."),
      record(403, 2, 1, "사회", "생성형 AI 활용 분야를 소개하는 자료를 만들었다. 기존 조사와 동일한 예시를 사용했다."),
    ],
    status: "DROP",
    thread: "활용 사례 소개의 반복",
    reasoning: "주제는 이어지지만 이후 기록에서 새로운 질문, 구현 또는 검증이 확인되지 않는다.",
    next: "사례 조사 대신 동일 질문에서 출처 제시 여부를 비교할 평가표를 만들고 응답 10개에 적용해 보세요.",
  },
} satisfies Record<string, {
  title: string;
  description: string;
  records: DemoRecord[];
  status: ThreadStatus;
  thread: string;
  reasoning: string;
  next: string;
}>;

export type ScenarioId = keyof typeof SCENARIOS;
export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

export function demoSnapshot(records: DemoRecord[]) {
  const subjects = new Map<string, Parameters<typeof normalizeAnalysisInput>[0][number]>();
  for (const record of [...records].sort((a, b) => a.id - b.id)) {
    const key = JSON.stringify([record.grade, record.semester, record.subject.trim()]);
    const subject = subjects.get(key) ?? {
      id: record.id,
      grade: record.grade,
      semester: record.semester,
      subjectName: record.subject,
      category: null,
      records: [],
    };
    subject.records.push({ id: record.id, recordText: record.text, memo: record.memo });
    subjects.set(key, subject);
  }
  return normalizeAnalysisInput([...subjects.values()]);
}

export function fixedResponse(scenarioId: ScenarioId, records: DemoRecord[]): AnalysisResult {
  const scenario = SCENARIOS[scenarioId];
  const unchanged = JSON.stringify(demoSnapshot(records)) === JSON.stringify(demoSnapshot(scenario.records));
  const selected = unchanged
    ? records.filter((record) => scenarioId === "connected" ? record.id !== 104 : scenarioId === "repeated" || record.id === scenario.records[0].id)
    : records.slice(0, 1);
  const status = unchanged ? scenario.status : "RECOVER_LATER";
  const title = unchanged ? scenario.thread : "수정한 기록의 검토";
  const reasoning = unchanged ? scenario.reasoning : "수정한 입력의 첫 기록을 근거 보기 예시로 사용합니다. 연결 관계에 대한 판단은 실제 분석에서 확인할 수 있습니다.";
  const next = unchanged ? scenario.next : "기록에서 확인할 수 있는 질문, 활동 방법과 결과를 각각 한 문장으로 적어 보세요.";
  return {
    overall: {
      currentProfile: unchanged ? scenario.title : "편집한 가상 기록",
      strongestDirection: title,
      biggestProblem: unchanged ? scenario.description : "편집 이후의 근거와 연결을 다시 확인해야 합니다.",
      strategySummary: next,
    },
    threads: [{
      title, status, reasoning,
      description: unchanged ? scenario.description : "편집한 입력의 원문을 여는 테스트용 예시",
      evidenceRecordIds: selected.map((record) => record.id),
      relatedSubjects: [...new Set(selected.map((record) => record.subject))],
      strengthScore: unchanged && scenarioId === "connected" ? 86 : 35,
      continuityScore: unchanged && scenarioId === "connected" ? 80 : 25,
      growthScore: unchanged && scenarioId === "connected" ? 82 : 25,
      majorFitScore: 40,
      academicDepthScore: 55,
      forcedConnectionRisk: unchanged && scenarioId === "connected" ? 18 : 65,
      recommendedNextStep: next,
      avoid: "기록으로 확인하기 어려운 성과를 추정하지 않기",
      targetSemester: status === "EXTEND_NOW" ? "2-2" : "3-1",
      priorityRank: status === "EXTEND_NOW" ? 1 : null,
    }],
    semesterStrategy: {
      secondYearSecondSemester: next,
      thirdYearFirstSemester: "결과와 한계를 원래 기록과 비교하고 다음 질문을 정리해 보세요.",
    },
  };
}
