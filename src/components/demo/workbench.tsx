"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowUpRight, FlaskConical, GitBranch, History, Info, Network, Sparkles } from "lucide-react";
import { MODE_LABELS, runDemo, type Mode, type Run, type Success } from "@/lib/demo/runs";
import { demoSnapshot, SCENARIO_IDS, SCENARIOS, type DemoRecord, type WorkspaceId } from "@/lib/demo/scenarios";
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
type Workspace = {
  scenario: WorkspaceId;
  records: DemoRecord[];
  runs: Run[];
  reviews: Review[];
  nextId: number;
  drafts?: Partial<Record<WorkspaceId, DemoRecord[]>>;
};
type View = "records" | "results" | "history" | "review";
const NAV = [
  { id: "results", label: "탐구 흐름 지도" },
  { id: "history", label: "분석 이력" },
  { id: "records", label: "기록 입력" },
] as const;
const subscribe = () => () => {};
const seedRecords = (id: WorkspaceId) => id === "personal" ? [] : SCENARIOS[id].records;

function initialWorkspace(key: string, review: boolean): Workspace {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as Workspace | null;
    if (saved && (saved.scenario === "personal" || SCENARIO_IDS.includes(saved.scenario)) && Array.isArray(saved.records)
      && Array.isArray(saved.runs) && Array.isArray(saved.reviews) && Number.isInteger(saved.nextId)) {
      if (!review && saved.scenario !== "personal" && !saved.drafts) {
        return { ...saved, scenario: "personal", records: [], drafts: { [saved.scenario]: saved.records } };
      }
      return saved;
    }
  } catch {
    // The workspace remains usable when storage is unavailable.
  }
  const scenario = review ? "connected" : "personal";
  return { scenario, records: seedRecords(scenario), runs: [], reviews: [], nextId: 1000 };
}

export function DemoWorkbench(props: Props) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return ready ? <WorkspaceView {...props} /> : <main className="wtn wtn-loading">작업 공간을 열고 있어요.</main>;
}

function WorkspaceView({ review = false, live, reviewLink, homeLink, reports = [] }: Props) {
  const key = review ? "wtn-studio-v1" : "wtn-demo-v1";
  const [data, setData] = useState(() => initialWorkspace(key, review));
  const [view, setView] = useState<View>(review ? "review" : "records");
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<Mode>(live && data.scenario === "personal" ? "gemini" : "fixed");
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  const personal = data.scenario === "personal";
  const runs = data.runs.filter((run) => run.scenario === data.scenario);
  const latest = runs.find((run): run is Success => run.ok);
  const selected = runs.find((run) => run.id === selectedId) ?? (view === "review" ? runs[0] : latest);
  const result = selected?.ok ? selected : latest;
  const stale = result != null && JSON.stringify(demoSnapshot(data.records)) !== JSON.stringify(demoSnapshot(result.records));

  function update(next: Workspace) {
    setData(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }

  function switchScenario(id: WorkspaceId) {
    if (id === data.scenario) return;
    setMode(live && id === "personal" ? "gemini" : "fixed");
    setSelectedId("");
    setConsent(false);
    setNotice(id === "personal" ? "내 기록을 열었어요." : "예시 기록을 불러왔어요.");
    setConfirmReset(false);
    update({
      ...data,
      scenario: id,
      records: data.drafts?.[id] ?? seedRecords(id),
      drafts: { ...data.drafts, [data.scenario]: data.records },
    });
  }

  async function analyze() {
    if (busy || (personal && mode === "gemini" && !consent)) return;
    setBusy(true);
    setNotice("");
    try {
      const run = await runDemo(data.scenario, data.records, mode);
      setShowSettings(false);
      const runs = [run, ...data.runs].slice(0, 24);
      update({ ...data, runs, reviews: data.reviews.filter((evaluation) => runs.some((item) => item.id === evaluation.runId)) });
      setSelectedId(run.id);
      setView(review ? "review" : "results");
    } finally {
      setBusy(false);
    }
  }

  function saveRecord(record: Omit<DemoRecord, "id">, id?: number) {
    setConsent(false);
    if (id != null) {
      update({ ...data, records: data.records.map((item) => item.id === id ? { ...record, id } : item) });
    } else {
      update({ ...data, nextId: data.nextId + 1, records: [...data.records, { ...record, id: data.nextId }] });
    }
    setNotice(id == null ? "좋아요. 기록을 저장했어요." : "바꾼 내용을 저장했어요.");
  }

  function changeView(next: View) {
    setSelectedId("");
    setView(next);
    window.scrollTo({ top: 0 });
  }

  function resetRecords(restore: boolean) {
    update({ ...data, records: restore ? seedRecords(data.scenario) : [] });
    setConfirmReset(false);
    setConsent(false);
    setResetCount(resetCount + 1);
    setNotice(restore ? "처음 예시 기록으로 돌아왔어요." : "현재 기록을 비웠어요.");
  }

  const hasResult = view === "results" && !!result && selected?.ok !== false;
  const modes: Mode[] = ["fixed", ...(live ? ["gemini" as const] : []), ...(review ? ["bad-schema", "bad-id", "provider-error"] as const : [])];
  const nav = review ? [{ id: "review", label: "실행 및 평가" }, ...NAV] as const : NAV;
  const heading = review ? "Review Studio" : view === "records" ? "어떤 과목을 들었나요?"
    : view === "history" ? "이전 분석과 비교해 봐요" : "기록이 어떻게 이어지는지 봐요";
  const subheading = review ? "같은 가상 기록으로 여러 번 분석하고 원문과 결과를 비교해 봐요."
    : view === "records" ? "과목을 고르고, 학교생활기록부에 적힌 내용을 직접 입력해 주세요."
    : view === "history" ? "기록을 바꾸기 전과 후의 탐구 방향을 비교할 수 있어요."
    : "과목마다 흩어져 있던 질문을 모아 보고, 다음에 해볼 일을 골라요.";

  return (
    <div className="wtn">
      <a className="wtn-skip" href="#main-content">본문으로 이동</a>
      <header className="wtn-topbar">
        <div className="wtn-topbar-inner">
          <button className="wtn-brand" type="button" onClick={() => changeView(review ? "review" : "records")}>
            <span className="wtn-brand-icon"><Network size={22} aria-hidden /></span>
            <span>What to Next<small>학생부 탐구 로드맵</small></span>
          </button>
          <nav aria-label="작업 공간 메뉴">
            {nav.map(({ id, label }) =>
              <button key={id} type="button" aria-current={view === id ? "page" : undefined} onClick={() => changeView(id)}>
                {label}
              </button>)}
          </nav>
          <div className="wtn-top-actions">
            {reviewLink && <a href={reviewLink}><FlaskConical size={15} aria-hidden />Review Studio</a>}
            {homeLink && <a href={homeLink}>{review ? "학생용 화면" : "개인 기록 로그인"}<ArrowUpRight size={14} aria-hidden /></a>}
            {!homeLink && <span className="wtn-tag"><span className="wtn-dot" />비공개 작업 공간</span>}
          </div>
        </div>
      </header>

      <main id="main-content" className="wtn-main">
        <header key={"hero-" + view} className="wtn-hero wtn-reveal">
          <div>
            <p className="wtn-eyebrow">{review ? "개발 · 인간 검수" : "학생부 탐구 로드맵"}</p>
            <h1>{heading}</h1>
            <p>{subheading}</p>
          </div>
          {hasResult ? <div className="wtn-hero-actions">
            <span className="wtn-tag">{MODE_LABELS[result.mode]}</span>
            <button type="button" className="wtn-soft-button" onClick={() => changeView("history")}><History size={15} aria-hidden />지난 분석 비교</button>
            <button type="button" className="wtn-primary" aria-expanded={showSettings} onClick={() => setShowSettings(!showSettings)}>
              <Sparkles size={15} aria-hidden />분석 설정
            </button>
          </div> : <span className="wtn-tag">{review ? "개발 전용" : personal ? "내 기록" : "예시 기록"}</span>}
        </header>

        {(!hasResult || showSettings) && <section className="wtn-controls wtn-reveal" style={{ animationDelay: "60ms" }} aria-label="기록과 분석 설정">
          <div>
            <label htmlFor="wtn-scenario">{review ? "가상 시나리오" : "기록 작업 공간"}</label>
            <select id="wtn-scenario" disabled={busy} value={data.scenario} onChange={(event) => switchScenario(event.target.value as WorkspaceId)}>
              {!review && <option value="personal">내 기록 입력</option>}
              {SCENARIO_IDS.map((id) => <option key={id} value={id}>{review ? "" : "예시 · "}{SCENARIOS[id].title}</option>)}
            </select>
            <p>{data.scenario === "personal" ? "과목과 학기를 골라 기록을 모아 봐요." : SCENARIOS[data.scenario].description}</p>
          </div>
          <div>
            <label htmlFor="wtn-mode">분석 방식</label>
            <select id="wtn-mode" disabled={busy} value={mode} onChange={(event) => { setMode(event.target.value as Mode); setConsent(false); }}>
              {modes.map((item) => <option value={item} key={item}>{MODE_LABELS[item]}</option>)}
            </select>
            <p>{mode === "gemini" ? "입력한 내용을 Google Gemini로 보내 분석해요." : "고정 응답으로 화면 흐름을 체험할 수 있어요."}</p>
          </div>
          <div className="wtn-run-controls">
            <button type="button" className="wtn-primary" onClick={() => void analyze()} disabled={busy || (personal && (data.records.length === 0 || (mode === "gemini" && !consent)))}>
              <Sparkles size={16} aria-hidden />{busy ? "기록을 읽고 있어요…" : "분석 실행"}
            </button>
            {(!personal || data.records.length > 0) && <button type="button" className="wtn-text-button" disabled={busy} onClick={() => setConfirmReset(!confirmReset)}>기록 초기화·복구</button>}
          </div>
          {personal && data.records.length > 0 && mode === "gemini" && <label className="wtn-consent">
            <input type="checkbox" disabled={busy} checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            이름과 학교 등 개인정보를 뺐고, 입력 내용을 Gemini로 보내는 데 동의해요.
          </label>}
          {confirmReset && <div className="wtn-reset">
            <span>현재 작업 공간의 기록만 바뀌어요. 분석 이력과 검수 메모는 남아요.</span>
            {!personal && <button type="button" disabled={busy} onClick={() => resetRecords(true)}>기본 기록 복구</button>}
            <button type="button" disabled={busy} onClick={() => resetRecords(false)}>{personal ? "내 기록 비우기" : "가상 기록 비우기"}</button>
            <button type="button" onClick={() => setConfirmReset(false)}>취소</button>
          </div>}
        </section>}
        <div className={hasResult && !showSettings && !busy && !notice && !storageError ? "wtn-sr-only" : "wtn-feedback"} aria-live="polite">
          {busy ? "기록을 읽고 연결할 단서를 찾고 있어요." : storageError ? "이 브라우저에 저장하기 어려워요. 새로고침하면 변경 내용이 사라질 수 있어요." : notice}
        </div>

        <div key={"content-" + view} className="wtn-content wtn-reveal" style={{ animationDelay: "115ms" }}>
          {view === "records" && <RecordsPanel key={data.scenario + "-" + resetCount} records={data.records}
            showFirstEditor={personal && data.records.length === 0} locked={busy} save={saveRecord} remove={(id) => {
              setConsent(false);
              update({ ...data, records: data.records.filter((record) => record.id !== id) });
              setNotice("기록을 삭제했어요.");
            }} />}
          {view === "results" && <>
            {selected?.ok === false && <p className="wtn-warning" role="alert">{MODE_LABELS[selected.mode]} 실패 · {selected.message}{result ? " 이전 분석을 보여드려요." : ""}</p>}
            {result ? <ResultPanel key={result.id} run={result} stale={stale} compactHeader
              override={(index, status) => update({
                ...data, runs: data.runs.map((run) => run.id === result.id && run.ok ? { ...run, overrides: { ...run.overrides, [index]: status } } : run),
              })} locked={busy} /> : <div className="wtn-empty"><GitBranch size={24} /><h2>아직 연결 지도가 없어요</h2><p>기록을 먼저 추가하고 분석을 실행해 보세요.</p>
                <button type="button" onClick={() => changeView("records")}>기록 입력하기</button></div>}
          </>}
          {view === "history" && <HistoryPanel runs={runs} select={(run) => {
            setSelectedId(run.id);
            setView(review ? "review" : "results");
            window.scrollTo({ top: 0 });
          }} />}
          {view === "review" && <>
            <Diagnostics run={selected} stale={selected?.ok ? stale : undefined} />
            {selected?.ok && <>
              <ResultPanel key={selected.id} run={selected} stale={stale} />
              <Evaluation key={selected.id + "-evaluation"} run={selected} reviews={data.reviews} locked={busy}
                save={(evaluation) => {
                  update({ ...data, reviews: [evaluation, ...data.reviews].slice(0, 80) });
                  setNotice("검수 평가를 저장했어요.");
                }} />
            </>}
            <TestResults reports={reports} />
          </>}
        </div>
        <footer className="wtn-footer">
          <span><Info size={14} aria-hidden />기록과 분석 이력은 이 브라우저에 저장돼요.</span>
          <button type="button" className="wtn-text-button" onClick={() => changeView("history")}><History size={14} aria-hidden />지난 분석 보기</button>
        </footer>
      </main>
    </div>
  );
}
