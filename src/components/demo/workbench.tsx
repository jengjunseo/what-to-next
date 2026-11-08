"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowUpRight, BookOpen, FlaskConical, GitBranch, History, Route } from "lucide-react";
import { MODE_LABELS, runDemo, type Mode, type Run, type Success } from "@/lib/demo/runs";
import { demoSnapshot, SCENARIO_IDS, SCENARIOS, type DemoRecord, type ScenarioId } from "@/lib/demo/scenarios";
import { RecordsPanel } from "./records-panel";
import { ResultPanel } from "./result-panel";
import { Diagnostics, Evaluation, HistoryPanel, TestResults, type Review, type TestReport } from "./review-panels";
import "./workbench.css";

type Props = {
  review?: boolean;
  live: boolean;
  reviewLink?: string;
  homeLink?: string;
  reports?: TestReport[];
};
type Workspace = { scenario: ScenarioId; records: DemoRecord[]; runs: Run[]; reviews: Review[]; nextId: number };
type View = "records" | "results" | "history" | "review";
const NAV = [
  { id: "records", label: "기록", icon: BookOpen },
  { id: "results", label: "연결 지도", icon: GitBranch },
  { id: "history", label: "분석 이력", icon: History },
] as const;
const subscribe = () => () => {};

function initialWorkspace(key: string): Workspace {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as Workspace | null;
    if (saved && SCENARIO_IDS.includes(saved.scenario) && Array.isArray(saved.records)
      && Array.isArray(saved.runs) && Array.isArray(saved.reviews) && Number.isInteger(saved.nextId)) return saved;
  } catch {
    // A fresh workspace remains usable when storage is unavailable.
  }
  return { scenario: "connected", records: SCENARIOS.connected.records, runs: [], reviews: [], nextId: 1000 };
}

export function DemoWorkbench(props: Props) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return ready ? <WorkspaceView {...props} /> : <main className="wtn wtn-loading">What to Next · 작업 공간을 여는 중…</main>;
}

function WorkspaceView({ review = false, live, reviewLink, homeLink, reports = [] }: Props) {
  const key = review ? "wtn-studio-v1" : "wtn-demo-v1";
  const [data, setData] = useState(() => initialWorkspace(key));
  const [view, setView] = useState<View>(review ? "review" : "records");
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<Mode>("fixed");
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  const runs = data.runs.filter((run) => run.scenario === data.scenario);
  const successes = runs.filter((run): run is Success => run.ok);
  const latest = successes[0];
  const selected = runs.find((run) => run.id === selectedId) ?? (view === "review" ? runs[0] : latest);
  const result = selected?.ok ? selected : latest;
  const stale = result != null && JSON.stringify(demoSnapshot(data.records)) !== JSON.stringify(demoSnapshot(result.records));
  const scenario = SCENARIOS[data.scenario];

  function update(next: Workspace) {
    setData(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }

  function switchScenario(id: ScenarioId) {
    if (id === data.scenario) return;
    setSelectedId("");
    setNotice("시나리오의 가상 기록을 불러왔습니다.");
    setConfirmReset(false);
    update({ ...data, scenario: id, records: SCENARIOS[id].records });
  }

  async function analyze() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const run = await runDemo(data.scenario, data.records, mode);
      const runs = [run, ...data.runs].slice(0, 24);
      update({ ...data, runs, reviews: data.reviews.filter((evaluation) => runs.some((item) => item.id === evaluation.runId)) });
      setSelectedId(run.id);
      setView(review ? "review" : "results");
    } finally {
      setBusy(false);
    }
  }

  function saveRecord(record: Omit<DemoRecord, "id">, id?: number) {
    if (id != null) {
      update({ ...data, records: data.records.map((item) => item.id === id ? { ...record, id } : item) });
    } else {
      update({ ...data, nextId: data.nextId + 1, records: [...data.records, { ...record, id: data.nextId }] });
    }
    setNotice(id == null ? "기록을 추가했습니다." : "기록을 수정했습니다.");
  }

  function selectRun(run: Run) {
    setSelectedId(run.id);
    setView(review ? "review" : "results");
  }

  const modes: Mode[] = ["fixed", ...(live ? ["gemini" as const] : []), ...(review ? ["bad-schema", "bad-id", "provider-error"] as const : [])];
  const nav = review ? [{ id: "review", label: "실행 및 평가", icon: FlaskConical }, ...NAV] as const : NAV;
  const tabs: Record<View, ReactNode> = {
    records: <RecordsPanel key={data.scenario + "-" + resetCount} records={data.records} locked={busy} save={saveRecord} remove={(id) => {
      update({ ...data, records: data.records.filter((record) => record.id !== id) });
      setNotice("기록을 삭제했습니다.");
    }} />,
    results: result ? (
      <ResultPanel key={result.id} run={result} stale={stale} override={(index, status) => {
        update({
          ...data,
          runs: data.runs.map((run) => run.id === result.id && run.ok
            ? { ...run, overrides: { ...run.overrides, [index]: status } } : run),
        });
      }} locked={busy} />
    ) : <div className="wtn-empty"><GitBranch size={24} /><h2>아직 연결 지도가 없습니다</h2><p>기록을 확인한 뒤 분석을 실행해 보세요.</p></div>,
    history: <HistoryPanel runs={runs} select={selectRun} />,
    review: <>
      <Diagnostics run={selected} stale={selected?.ok ? stale : undefined} />
      {selected?.ok && <>
        <ResultPanel key={selected.id} run={selected} stale={stale} />
        <Evaluation key={selected.id + "-evaluation"} run={selected} reviews={data.reviews} locked={busy}
          save={(evaluation) => {
            update({ ...data, reviews: [evaluation, ...data.reviews].slice(0, 80) });
            setNotice("검수 평가를 저장했습니다.");
          }} />
      </>}
      <TestResults reports={reports} />
    </>,
  };

  return (
    <div className="wtn">
      <aside className="wtn-sidebar">
        <a className="wtn-brand" href={review ? (homeLink ?? "/demo") : "#main-content"}>
          <span className="wtn-brand-icon"><Route size={22} aria-hidden /></span>
          <span>What to Next<small>학생 탐구 작업 공간</small></span>
        </a>
        <nav aria-label="작업 공간 메뉴">
          {nav.map(({ id, label, icon: Icon }) =>
            <button key={id} type="button" aria-current={view === id ? "page" : undefined}
              onClick={() => { setSelectedId(""); setView(id); }}>
              <Icon size={17} aria-hidden />{label}
            </button>)}
        </nav>
        <div className="wtn-side-bottom">
          {reviewLink && <a href={reviewLink}><FlaskConical size={16} aria-hidden />Review Studio <ArrowUpRight size={14} aria-hidden /></a>}
          {homeLink && <a href={homeLink}>{review ? "학생용 화면" : "개인 기록 로그인"} <ArrowUpRight size={14} aria-hidden /></a>}
          <span>{review ? "로컬 개발 전용" : "가상 데이터 작업 공간"}</span>
        </div>
      </aside>

      <main id="main-content" className="wtn-main">
        <header className="wtn-hero">
          <div>
            <p className="wtn-eyebrow">{review ? "개발 · 인간 검수" : "학교생활 · 다음 탐구"}</p>
            <h1>{review ? "Review Studio" : "다음 탐구를 찾아보세요"}</h1>
            <p>{review ? "가상 기록으로 분석을 실행하고, 원문을 대조하며 판단의 품질을 평가합니다."
              : "흩어진 과목 기록에서 연결고리를 발견하고, 원문을 바탕으로 다음 활동을 결정하세요."}</p>
          </div>
          <span className="wtn-tag">{review ? "개발 전용" : "가상 데이터"}</span>
        </header>

        <section className="wtn-controls" aria-label="시나리오와 분석 설정">
          <div>
            <label htmlFor="wtn-scenario">가상 시나리오</label>
            <select id="wtn-scenario" disabled={busy} value={data.scenario} onChange={(event) => switchScenario(event.target.value as ScenarioId)}>
              {SCENARIO_IDS.map((id) => <option key={id} value={id}>{SCENARIOS[id].title}</option>)}
            </select>
            <p>{scenario.description}</p>
          </div>
          <div>
            <label htmlFor="wtn-mode">분석 방식</label>
            <select id="wtn-mode" disabled={busy} value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
              {modes.map((item) => <option value={item} key={item}>{MODE_LABELS[item]}</option>)}
            </select>
            <p>{mode === "gemini" ? "가상 기록을 Google Gemini에 전송합니다." : "테스트 실행은 API를 호출하지 않습니다."}</p>
          </div>
          <div className="wtn-run-controls">
            <button type="button" className="wtn-primary" onClick={() => void analyze()} disabled={busy}>
              {busy ? "분석 중…" : "분석 실행"} <ArrowUpRight size={16} aria-hidden />
            </button>
            <button type="button" className="wtn-text-button" disabled={busy} onClick={() => setConfirmReset(!confirmReset)}>기록 초기화·복구</button>
          </div>
          {confirmReset && <div className="wtn-reset">
            <span>현재 가상 기록만 바뀝니다. 분석 이력과 검수 메모는 유지됩니다.</span>
            <button type="button" disabled={busy} onClick={() => {
              update({ ...data, records: scenario.records }); setConfirmReset(false); setResetCount(resetCount + 1); setNotice("기본 가상 기록을 복구했습니다.");
            }}>기본 기록 복구</button>
            <button type="button" disabled={busy} onClick={() => {
              update({ ...data, records: [] }); setConfirmReset(false); setResetCount(resetCount + 1); setNotice("가상 기록을 비웠습니다.");
            }}>가상 기록 비우기</button>
            <button type="button" onClick={() => setConfirmReset(false)}>취소</button>
          </div>}
        </section>
        <div className="wtn-feedback" aria-live="polite">
          {busy ? "분석 요청을 처리하고 있습니다." : storageError ? "브라우저 저장 공간을 사용할 수 없습니다. 새로고침하면 변경이 사라질 수 있습니다." : notice}
        </div>

        {view === "results" && selected?.ok === false &&
          <p className="wtn-warning" role="alert">{MODE_LABELS[selected.mode]} 실패 · {selected.message}{result ? " 이전 성공 결과를 표시합니다." : ""}</p>}
        {tabs[view]}
        <footer className="wtn-footer">가상 기록과 검수 내용은 이 브라우저에 저장됩니다. 실제 학생의 개인정보는 입력하지 마세요.</footer>
      </main>
    </div>
  );
}
