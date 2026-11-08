import { useState, type FormEvent } from "react";
import { Clock3 } from "lucide-react";
import { MODE_LABELS, type Run, type Success } from "@/lib/demo/runs";

const CRITERIA = [
  ["evidence", "근거의 적절성"],
  ["logic", "활동 연결의 논리성"],
  ["specificity", "추천의 구체성"],
  ["helpfulness", "학생에게 도움이 되는 정도"],
  ["accuracy", "잘못된 추론·과장의 억제"],
] as const;

type Item = { score: number; note: string };
export type Review = { runId: string; time: string; items: Record<typeof CRITERIA[number][0], Item> };
export type TestReport = { label: string; command: string; time: string; environment: string; exitCode: number | null };

export function Diagnostics({ run, stale }: { run?: Run; stale?: boolean }) {
  if (!run) return <section className="wtn-empty"><Clock3 size={24} /><h2>아직 실행 기록이 없습니다</h2><p>분석 방식을 선택하고 실행하면 진단과 평가가 열립니다.</p></section>;
  const schema = run.ok || run.stage === "evidence" ? "통과" : run.stage === "schema" ? "실패" : "미실행";
  const evidence = run.ok ? "통과" : run.stage === "evidence" ? "실패" : "미실행";
  return <section className="wtn-panel wtn-diagnostics">
    <div className="wtn-section-heading">
      <div><p className="wtn-eyebrow">실행 진단</p><h2>{run.ok ? "분석 성공" : "분석 실패"}</h2></div>
      <span className="wtn-tag">{MODE_LABELS[run.mode]}</span>
    </div>
    {!run.ok && <p role="alert" className="wtn-warning">{run.message}</p>}
    <dl className="wtn-diagnostic-grid">
      <div><dt>실행 ID</dt><dd className="wtn-id">{run.id}</dd></div>
      <div><dt>입력 스냅샷 SHA-256</dt><dd className="wtn-id">{run.hash || "계산 실패"}</dd></div>
      <div><dt>처리 시간</dt><dd>{run.durationMs} ms · {run.httpStatus !== null ? "서버" : "브라우저"}</dd></div>
      <div><dt>요청 상태</dt><dd>{run.httpStatus !== null ? `HTTP ${run.httpStatus}` : run.mode === "gemini" ? "응답 없음" : "브라우저 테스트"}</dd></div>
      <div><dt>스키마 검증</dt><dd>{schema}</dd></div>
      <div><dt>참조 ID 무결성</dt><dd>{evidence}</dd></div>
      <div><dt>최신 기록 대조</dt><dd>{stale == null ? "해당 없음" : stale ? "변경됨" : "일치"}</dd></div>
      <div><dt>실패 단계</dt><dd>{run.ok ? "해당 없음" : run.stage}</dd></div>
      <div><dt>실행 시각</dt><dd>{formatTime(run.time)}</dd></div>
    </dl>
  </section>;
}

export function Evaluation({ run, reviews, save, locked }: {
  run: Success;
  reviews: Review[];
  save: (review: Review) => void;
  locked: boolean;
}) {
  const entries = reviews.filter((review) => review.runId === run.id);
  const prior = reviews.find((review) => review.runId !== run.id);
  const latest = entries[0];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const items = Object.fromEntries(CRITERIA.map(([key]) => [
      key, { score: Number(data.get(key)), note: String(data.get(`${key}-note`)).trim() },
    ])) as Review["items"];
    save({ runId: run.id, time: new Date().toISOString(), items });
  }

  return <section className="wtn-panel wtn-evaluation">
    <h2>인간 평가</h2><p className="wtn-muted">각 기준을 1점(낮음)부터 5점(높음)으로 평가하고 관찰 내용을 남기세요.</p>
    <form onSubmit={submit}>
      {CRITERIA.map(([key, label]) => <fieldset key={key}>
        <legend>{label}</legend>
        <label>점수<select name={key} defaultValue={latest?.items[key].score ?? ""} required>
          <option value="" disabled>선택</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}점</option>)}
        </select></label>
        <label>검수 메모<textarea name={`${key}-note`} rows={2} maxLength={500} defaultValue={latest?.items[key].note} /></label>
      </fieldset>)}
      <button type="submit" className="wtn-primary" disabled={locked}>평가 저장</button>
    </form>
    {(entries.length > 0 || prior) && <div className="wtn-past-reviews">
      <h3>이전 평가와 비교</h3>
      {entries.map((review, index) => <SavedEvaluation key={`${review.time}-${index}`} review={review} label={index === 0 ? "이 실행의 최신 평가" : "이 실행의 이전 평가"} />)}
      {prior && <SavedEvaluation review={prior} label={`다른 실행의 최근 평가 · ${prior.runId.slice(0, 8)}`} />}
    </div>}
  </section>;
}

function SavedEvaluation({ review, label }: { review: Review; label: string }) {
  return <details><summary>{label} · {formatTime(review.time)}</summary>
    <dl>{CRITERIA.map(([key, title]) => <div key={key}><dt>{title}</dt><dd>{review.items[key].score}점{review.items[key].note && ` · ${review.items[key].note}`}</dd></div>)}</dl>
  </details>;
}

export function HistoryPanel({ runs, select }: { runs: Run[]; select: (run: Run) => void }) {
  const successes = runs.filter((run): run is Success => run.ok);
  const [baselineId, setBaselineId] = useState("");
  const current = successes[0];
  const baseline = successes.find((run) => run.id === baselineId) ?? successes[1];
  const before = new Map(baseline?.records.map((record) => [record.id, JSON.stringify(record)]));
  const after = new Map(current?.records.map((record) => [record.id, JSON.stringify(record)]));
  const added = [...after.keys()].filter((id) => !before.has(id));
  const removed = [...before.keys()].filter((id) => !after.has(id));
  const changed = [...after.keys()].filter((id) => before.has(id) && before.get(id) !== after.get(id));
  return <section className="wtn-section">
    <header className="wtn-section-heading"><div><p className="wtn-eyebrow">03 / 분석 이력</p><h2>분석 이력</h2></div></header>
    {!runs.length && <div className="wtn-empty"><Clock3 size={24} /><h3>이 시나리오의 분석 이력이 없습니다</h3></div>}
    {current && baseline && <div className="wtn-panel">
      <div className="wtn-section-heading">
        <h3>최신 분석과 비교</h3>
        <label>비교할 이전 분석<select value={baseline.id} onChange={(event) => setBaselineId(event.target.value)}>
          {successes.slice(1).map((run) => <option key={run.id} value={run.id}>{formatTime(run.time)} · {MODE_LABELS[run.mode]}</option>)}
        </select></label>
      </div>
      <p className="wtn-muted">추가 {added.length} · 수정 {changed.length} · 삭제 {removed.length}</p>
      <div className="wtn-compare">{[baseline, current].map((run, index) => <article key={run.id}>
        <p className="wtn-eyebrow">{index ? "최신 분석" : "이전 분석"} · {MODE_LABELS[run.mode]}</p>
        <h4>{run.result.overall.currentProfile}</h4>
        <p>{run.result.overall.strategySummary}</p>
        <button type="button" onClick={() => select(run)}>전체 결과 보기</button>
      </article>)}</div>
    </div>}
    <ul className="wtn-history">{runs.map((run) => <li key={run.id}>
      <div><strong>{MODE_LABELS[run.mode]} · {run.ok ? "성공" : "실패"}</strong>
        <p className="wtn-muted">{formatTime(run.time)} · {run.durationMs} ms</p>
        {!run.ok && <p>{run.message}</p>}
      </div>
      <button type="button" onClick={() => select(run)}>{run.ok ? "결과 보기" : "실패 확인"}</button>
    </li>)}</ul>
  </section>;
}

export function TestResults({ reports }: { reports: TestReport[] }) {
  const checks = [
    { label: "단위 테스트", command: "npm run verify -- unit" },
    { label: "통합 테스트", command: "npm run verify -- integration" },
    { label: "브라우저 E2E", command: "npm run verify -- e2e" },
  ];
  return <section className="wtn-panel">
    <h2>자동 테스트 결과</h2><p className="wtn-muted">로컬 실행 기록입니다. 명령을 실행한 뒤 새로고침하면 결과가 반영됩니다.</p>
    <ul className="wtn-test-list">{checks.map(({ label, command }) => {
      const result = reports.find((item) => item.label === label);
      return <li key={label}>
        <div><strong>{label}</strong><code>{command}</code>{result && <p className="wtn-muted">실행된 명령 · {result.command}</p>}</div>
        <div><strong>{result ? (result.exitCode === 0 ? "통과" : "실패") : "미실행"}</strong>
          {result && <p className="wtn-muted">{result.environment} · {formatTime(result.time)} · 종료 코드 {result.exitCode ?? "없음"}</p>}
        </div>
      </li>;
    })}</ul>
  </section>;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}
