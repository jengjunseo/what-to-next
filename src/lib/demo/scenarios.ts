import { normalizeAnalysisInput, PERSPECTIVES, type AnalysisResult, type ThreadStatus } from "@/lib/domain/analysis";

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
    next: "온도값 12개에 3회 이동평균을 적용하고, 이웃한 값의 차가 2℃를 넘은 횟수를 원본과 비교해 보세요.",
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
export type WorkspaceId = ScenarioId | "personal";
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

export function fixedResponse(workspace: WorkspaceId, records: DemoRecord[]): AnalysisResult {
  const scenario = workspace === "personal" ? null : SCENARIOS[workspace];
  const unchanged = scenario != null
    && JSON.stringify(demoSnapshot(records)) === JSON.stringify(demoSnapshot(scenario.records));
  const linked = unchanged && (workspace === "connected" || workspace === "repeated");
  const evidence = linked ? records.filter((record) => record.id !== 104) : [];
  const title = unchanged ? scenario.thread : "입력한 기록을 먼저 살펴봐요";
  const next = unchanged ? scenario.next : "기록에서 확인할 수 있는 질문, 활동 방법과 결과를 각각 한 문장으로 적어 보세요.";
  const uncertainty = "기록만으로 판단하기 어려워요. 직접 맡은 일이나 이전 활동에서 달라진 점을 확인해 보세요.";
  return {
    overall: {
      currentProfile: unchanged ? scenario.title : "입력한 기록을 살펴봐요",
      strongestDirection: title,
      biggestProblem: linked ? scenario.description : "지금 기록만으로 이어지는 흐름을 확인하기 어려워요.",
      strategySummary: next,
    },
    threads: linked ? [{
      title, status: scenario.status, reasoning: scenario.reasoning,
      description: scenario.description,
      evidenceRecordIds: evidence.map(({ id }) => id),
      relatedSubjects: [...new Set(evidence.map(({ subject }) => subject))],
      recommendedNextStep: next,
      avoid: "기록에 없는 성과는 추정하지 않아요.",
      targetSemester: scenario.status === "EXTEND_NOW" ? "2-2" : "NONE",
      priorityRank: scenario.status === "EXTEND_NOW" ? 1 : null,
      connection: {
        type: workspace === "repeated" ? "주제 반복" : "방법 개선",
        strength: workspace === "repeated" ? "낮음" : "높음",
        evidence: evidence.map(({ id, text }) => ({ recordId: id, quote: text })),
        question: workspace === "repeated"
          ? "사회 발표에 같은 사례를 넣을 때, 정보 시간과 비교해 확인하려던 기준이 달랐나요?"
          : "이동평균을 쓰고 나서 위치가 바뀐 시점도 늦게 보였나요?",
        experiment: workspace === "repeated" ? {
          recordId: 403,
          gap: "같은 예시를 소개한 뒤, 답변에 실제로 확인할 수 있는 출처가 있는지는 살펴보지 않았어요.",
          action: "같은 질문을 출처 요청 문장 없이 한 번, 출처를 요청해 한 번 입력해 보세요. 열린 출처에서 답변의 주장을 찾을 수 있는지 비교해요.",
          tool: "사용할 수 있는 생성형 AI와 스프레드시트",
          scope: "질문 5개 × 요청 조건 2가지",
          minutes: 45,
          done: "응답 10건의 출처 존재와 주장 일치 여부를 표 1개에 표시하면 끝이에요.",
        } : {
          recordId: 103,
          gap: "이동평균을 적용했지만, 순간적으로 큰 차이가 난 횟수는 기록에 없어요.",
          action: next,
          tool: "스프레드시트",
          scope: "5분 간격 온도값 12개",
          minutes: 40,
          done: "원본과 이동평균의 2℃ 초과 횟수를 표 1개에 적고, 차이를 1문장으로 설명해요.",
        },
      },
    }] : [],
    semesterStrategy: {
      secondYearSecondSemester: next,
      thirdYearFirstSemester: "결과와 한계를 원래 기록과 비교하고 다음 질문을 정리해 보세요.",
    },
    perspectives: (Object.keys(PERSPECTIVES) as (keyof typeof PERSPECTIVES)[]).map((aspect) => {
      if (linked && aspect === "inquiry") {
        return {
          aspect,
          grade: workspace === "connected" ? 3 : 1,
          evidenceRecordIds: evidence.map(({ id }) => id),
          quotes: evidence.map(({ id, text }) => ({ recordId: id, quote: text })),
          summary: scenario.reasoning,
          uncertainty: "학생이 각 활동에서 어떤 결정을 직접 했는지는 더 확인해 보세요.",
        };
      }
      return { aspect, grade: 0, evidenceRecordIds: [], quotes: [], summary: "기록만으로 판단하기 어려워요.", uncertainty };
    }),
  };
}
