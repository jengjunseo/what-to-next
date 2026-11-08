import { useState } from "react";
import { ArrowRight, GitBranch } from "lucide-react";
import { effectiveStatus, THREAD_STATUSES, type ThreadStatus } from "@/lib/domain/analysis";
import { STATUS_META } from "@/lib/domain/status";
import { MODE_LABELS, type Success } from "@/lib/demo/runs";

export function ResultPanel({ run, stale, override, locked }: {
  run: Success;
  stale: boolean;
  override?: (index: number, status?: ThreadStatus) => void;
  locked?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [evidenceId, setEvidenceId] = useState<number>();
  const [timeline, setTimeline] = useState(false);
  const thread = run.result.threads[index];
  const status = effectiveStatus(thread.status, run.overrides[index] ?? null);
  const evidence = run.records.filter((record) => thread.evidenceRecordIds.includes(record.id))
    .sort((a, b) => a.grade - b.grade || a.semester - b.semester || a.id - b.id);
  const record = evidence.find((record) => record.id === evidenceId) ?? evidence[0];

  return <section className="wtn-section" aria-labelledby="wtn-map-title">
    <header className="wtn-section-heading">
      <div><p className="wtn-eyebrow">02 / 연결 지도</p><h2 id="wtn-map-title">탐구 연결 지도</h2></div>
      <span className="wtn-tag">{MODE_LABELS[run.mode]}</span>
    </header>
    {stale && <p className="wtn-warning" role="status">기록 변경됨 · 이 분석은 실행 당시의 원문을 보여 줍니다. 최신 기록을 반영하려면 다시 분석하세요.</p>}
    <div className="wtn-panel wtn-profile">
      <h3>{run.result.overall.currentProfile}</h3>
      <p>{run.result.overall.strategySummary}</p>
      <details><summary>분석 요약 더 보기</summary>
        <dl>
          <dt>가장 강한 방향</dt><dd>{run.result.overall.strongestDirection}</dd>
          <dt>확인할 한계</dt><dd>{run.result.overall.biggestProblem}</dd>
        </dl>
      </details>
    </div>
    <div className="wtn-map-layout">
      <div className="wtn-panel wtn-thread-list" aria-label="연결고리">
        <h3>연결고리 <span className="wtn-count">{run.result.threads.length}</span></h3>
        {run.result.threads.map((item, itemIndex) => <button type="button" key={itemIndex}
          aria-pressed={index === itemIndex} onClick={() => { setIndex(itemIndex); setEvidenceId(undefined); }}>
          <GitBranch size={16} aria-hidden /><span>{item.title}<small>{STATUS_META[run.overrides[itemIndex] ?? item.status].short}</small></span>
        </button>)}
      </div>

      <article className="wtn-panel wtn-thread">
        <header><span className="wtn-tag" data-status={status}>{STATUS_META[status].short}</span><h3>{thread.title}</h3><p>{thread.description}</p></header>
        <p>{thread.reasoning}</p>
        <div className="wtn-evidence-header">
          <h4>판단 근거 <span className="wtn-count">{evidence.length}</span></h4>
          <div className="wtn-actions" aria-label="근거 보기 방식">
            <button type="button" aria-pressed={!timeline} onClick={() => setTimeline(false)}>연결 보기</button>
            <button type="button" aria-pressed={timeline} onClick={() => setTimeline(true)}>타임라인</button>
          </div>
        </div>
        {timeline ? <ol className="wtn-timeline">{evidence.map((item) =>
          <li key={item.id}><p className="wtn-id">{item.grade}-{item.semester} · {item.subject} · #{item.id}</p><p>{item.text}</p></li>)}</ol>
          : <>
            <div className="wtn-nodes">
              {evidence.map((item, position) => <div key={item.id}>
                {position > 0 && <ArrowRight size={15} aria-hidden />}
                <button type="button" aria-pressed={record?.id === item.id} onClick={() => setEvidenceId(item.id)}>
                  <small>{item.grade}학년 {item.semester}학기</small>{item.subject}<span className="wtn-id">#{item.id}</span>
                </button>
              </div>)}
            </div>
            {record && <div className="wtn-source" aria-live="polite">
              <p className="wtn-eyebrow">원문 기록 #{record.id} · {record.subject}</p>
              <p>{record.text}</p>{record.memo && <p className="wtn-muted">메모 · {record.memo}</p>}
            </div>}
          </>}
        <div className="wtn-next">
          <h4>다음 활동 제안</h4><p>{thread.recommendedNextStep}</p>
          <p className="wtn-muted">유의점 · {thread.avoid}</p>
        </div>
        <details>
          <summary>학기별 전략과 점수</summary>
          <dl><dt>고2 2학기</dt><dd>{run.result.semesterStrategy.secondYearSecondSemester}</dd>
            <dt>고3 1학기</dt><dd>{run.result.semesterStrategy.thirdYearFirstSemester}</dd>
            <dt>강도 · 연속성 · 탐구 깊이 · 억지 연결 위험</dt>
            <dd>{thread.strengthScore} · {thread.continuityScore} · {thread.academicDepthScore} · {thread.forcedConnectionRisk}</dd>
          </dl>
        </details>
        {override && <div className="wtn-override">
          <label>내 판단<select value={run.overrides[index] ?? ""} disabled={locked}
            onChange={(event) => override(index, (event.target.value || undefined) as ThreadStatus | undefined)}>
            <option value="">분석 판단 따르기</option>
            {THREAD_STATUSES.map((value) => <option key={value} value={value}>{STATUS_META[value].short} · {STATUS_META[value].label}</option>)}
          </select></label>
          <p className="wtn-muted">{run.mode === "gemini" ? "AI 판단" : "고정 응답의 판단"} · {STATUS_META[thread.status].short}</p>
        </div>}
      </article>
    </div>
  </section>;
}
