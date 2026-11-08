import { useRef, useState } from "react";
import { ArrowRight, ClipboardList, GitBranch, Info, Lightbulb, Network } from "lucide-react";
import { effectiveStatus, PERSPECTIVES, THREAD_STATUSES, type ThreadStatus } from "@/lib/domain/analysis";
import { MODE_LABELS, type Success } from "@/lib/demo/runs";

const STRATEGIES: Record<ThreadStatus, string> = {
  EXTEND_NOW: "지금 확장해요",
  KEEP: "이어가요",
  RECOVER_LATER: "나중에 살펴봐요",
  DROP: "지금은 멈춰요",
};
const LEVELS = ["판단하기 어려워요", "단편 근거가 있어요", "과정이 보여요", "여러 기록이 이어져요"];

export function ResultPanel({ run, stale, override, locked, compactHeader }: {
  run: Success;
  stale: boolean;
  override?: (index: number, status?: ThreadStatus) => void;
  locked?: boolean;
  compactHeader?: boolean;
}) {
  const graph = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [evidenceId, setEvidenceId] = useState<number>();
  const [timeline, setTimeline] = useState(false);
  const { threads, overall, perspectives, semesterStrategy } = run.result;
  const thread = threads[index];
  const status = thread && effectiveStatus(thread.status, run.overrides[index] ?? null);
  const evidence = thread ? run.records.filter((record) => thread.evidenceRecordIds.includes(record.id))
    .sort((a, b) => a.grade - b.grade || a.semester - b.semester || a.id - b.id) : [];
  const record = evidence.find((record) => record.id === evidenceId) ?? evidence[0];
  const citedIds = new Set([...threads.flatMap((item) => item.evidenceRecordIds),
    ...(perspectives?.flatMap((item) => item.evidenceRecordIds) ?? [])]);
  const options = threads.reduce((total, item) => total + (item.connection?.options.length ?? 1), 0);

  return <section className="wtn-section" aria-labelledby="wtn-map-title">
    <header className={compactHeader ? "wtn-sr-only" : "wtn-section-heading"}>
      <div className="wtn-section-label">
        <span className="wtn-section-icon"><GitBranch size={18} aria-hidden /></span>
        <div><h2 id="wtn-map-title">탐구 연결 지도</h2><p className="wtn-muted">{MODE_LABELS[run.mode]} · 분석 당시 기록</p></div>
      </div>
    </header>

    {stale && <p className="wtn-warning" role="status">기록 변경됨 · 이전 원문을 보여드려요. 최신 기록을 보려면 다시 분석해 주세요.</p>}

    <dl className="wtn-metrics">
      {[
        ["읽어 본 기록", run.records.length, "건"],
        ["찾은 연결", threads.length, "갈래"],
        ["다음 활동 선택지", options, "개"],
        ["인용한 원문", citedIds.size, "건"],
      ].map(([label, value, unit]) => <div className="wtn-panel wtn-metric" key={label}>
        <dt>{label}</dt><dd>{value} <small>{unit}</small></dd>
      </div>)}
    </dl>
    <p className="wtn-info"><Info size={16} aria-hidden />학교생활 기록을 돌아보고 다음 탐구를 고르는 데 참고해요. 대학의 공식 평가나 합격 예측과는 달라요.</p>

    <div className="wtn-map-layout">
      <div className="wtn-main-column">
        <article ref={graph} className="wtn-panel wtn-graph wtn-reveal" style={{ animationDelay: "60ms" }}>
          <div className="wtn-section-heading">
            <div className="wtn-section-label">
              <span className="wtn-section-icon"><Network size={18} aria-hidden /></span>
              <div><h3>탐구 네트워크 흐름도</h3><p className="wtn-muted">과목을 누르면 당시 기록을 바로 볼 수 있어요.</p></div>
            </div>
            {thread && <div className="wtn-actions" aria-label="근거 보기 방식">
              <button type="button" aria-pressed={!timeline} onClick={() => setTimeline(false)}>연결 보기</button>
              <button type="button" aria-pressed={timeline} onClick={() => setTimeline(true)}>타임라인</button>
            </div>}
          </div>
          {!thread && <div className="wtn-empty"><Network size={22} /><h3>기록만으로 연결을 찾기 어려워요</h3><p>{overall.biggestProblem}</p></div>}
          {thread && (timeline ? <ol className="wtn-timeline">{evidence.map((item) =>
            <li key={item.id}><p className="wtn-id">{item.grade}-{item.semester} · {item.subject} · #{item.id}</p><p>{item.text}</p></li>)}</ol>
            : <>
              <div className="wtn-nodes">
                {evidence.map((item, position) => <div key={item.id}>
                  {position > 0 && <ArrowRight size={16} aria-hidden />}
                  <button type="button" aria-pressed={record?.id === item.id} onClick={() => setEvidenceId(item.id)}>
                    <small>{item.grade}학년 {item.semester}학기</small><strong>{item.subject}</strong><span className="wtn-id">#{item.id}</span>
                  </button>
                </div>)}
              </div>
              {record && <div className="wtn-source" aria-live="polite">
                <p className="wtn-eyebrow">원문 기록 #{record.id} · {record.subject}</p>
                <p>{record.text}</p>{record.memo && <p className="wtn-muted">메모 · {record.memo}</p>}
              </div>}
            </>)}
        </article>

        {thread && <section className="wtn-story wtn-reveal" style={{ animationDelay: "110ms" }}>
          <div className="wtn-section-label">
            <span className="wtn-section-icon wtn-section-icon-solid"><GitBranch size={18} aria-hidden /></span>
            <div><h3>과목 간 연결 스토리</h3><p className="wtn-muted">연결을 뒷받침하는 기록과 확인할 점을 함께 봐요.</p></div>
          </div>
          <article className="wtn-panel wtn-thread" key={index}>
            <header>
              <div className="wtn-actions">
                {status && <span className="wtn-tag" data-status={status}>{STRATEGIES[status]}</span>}
                {thread.connection && <span className="wtn-tag">{thread.connection.type} · 근거 {thread.connection.strength}</span>}
              </div>
              <h3>{thread.title}</h3><p>{thread.description}</p>
            </header>
            <div className="wtn-bridge"><Network size={18} aria-hidden /><p>{thread.reasoning}</p></div>
            {thread.connection && <>
              <section className="wtn-evidence-summaries">
                <h4>AI가 짚은 원문 근거</h4>
                <ul>{thread.connection.evidence.map((item) => <li key={item.recordId}>
                  <button type="button" className="wtn-text-button" onClick={() => { setTimeline(false); setEvidenceId(item.recordId); graph.current?.scrollIntoView({ block: "nearest" }); }}>
                    원문 #{item.recordId} 보기
                  </button><p>{item.summary}</p>
                </li>)}</ul>
              </section>
              <p className="wtn-muted"><strong>다르게 볼 수도 있어요</strong> · {thread.connection.alternative}</p>
              <p><strong>스스로 확인해 봐요</strong> · {thread.connection.question}</p>
            </>}
            <div className="wtn-next">
              <Lightbulb size={19} aria-hidden />
              <div><h4>다음 활동을 골라 봐요</h4>
                {thread.connection ? <ol>{thread.connection.options.map(({ action, output }, position) =>
                  <li key={position}><p>{action}</p><p className="wtn-muted">예상 산출물 · {output}</p></li>)}</ol> : <p>{thread.recommendedNextStep}</p>}
                <p className="wtn-muted">생각해 볼 점 · {thread.avoid}</p>
              </div>
            </div>
            {override && <div className="wtn-override">
              <label>내 판단<select value={run.overrides[index] ?? ""} disabled={locked}
                onChange={(event) => override(index, (event.target.value || undefined) as ThreadStatus | undefined)}>
                <option value="">분석의 제안 따르기</option>
                {THREAD_STATUSES.map((value) => <option key={value} value={value}>{STRATEGIES[value]}</option>)}
              </select></label>
              <p className="wtn-muted">{run.mode === "gemini" ? "AI 제안" : "고정 응답의 제안"} · {STRATEGIES[thread.status]}</p>
            </div>}
          </article>
        </section>}

        {perspectives && <section className="wtn-panel wtn-perspectives wtn-reveal" style={{ animationDelay: "150ms" }}>
          <h3>여섯 가지 관점에서 봤어요</h3><p className="wtn-muted">근거 수준은 기록이 판단을 얼마나 뒷받침하는지 보여줘요.</p>
          {perspectives.map((item) => <details key={item.aspect}>
            <summary>{PERSPECTIVES[item.aspect]} <span className="wtn-tag">{item.grade}단계 · {LEVELS[item.grade]}</span></summary>
            <p>{item.summary}</p><p className="wtn-muted">{item.uncertainty}</p>
            {item.evidenceRecordIds.map((id) => {
              const cited = run.records.find((candidate) => candidate.id === id);
              return cited && <details key={id}><summary>원문 #{id} · {cited.subject}</summary><p>{cited.text}</p></details>;
            })}
          </details>)}
        </section>}
      </div>

      <aside className="wtn-result-rail wtn-reveal" aria-label="전략 보드" style={{ animationDelay: "85ms" }}>
        <div className="wtn-section-label">
          <span className="wtn-section-icon"><ClipboardList size={18} aria-hidden /></span>
          <div><h3>전략 의사결정 보드</h3><p className="wtn-muted">이어갈 탐구를 직접 골라요.</p></div>
        </div>
        {threads.map((item, position) => <button type="button" className="wtn-strategy-card" key={position}
          aria-pressed={index === position} onClick={() => { setIndex(position); setEvidenceId(undefined); }}>
          <span className="wtn-tag" data-status={run.overrides[position] ?? item.status}>{STRATEGIES[run.overrides[position] ?? item.status]}</span>
          <strong>{item.title}</strong>
          {index === position && <span className="wtn-muted">{item.recommendedNextStep}</span>}
        </button>)}
        <div className="wtn-panel wtn-coaching">
          <h3><Lightbulb size={17} aria-hidden />탐구 코칭</h3>
          <p>{overall.currentProfile}</p>
          <p>{overall.strategySummary}</p>
          <details><summary>학기별 선택지 살펴보기</summary>
            <dl><dt>고2 2학기에 해본다면</dt><dd>{semesterStrategy.secondYearSecondSemester}</dd>
              <dt>고3 1학기에 해본다면</dt><dd>{semesterStrategy.thirdYearFirstSemester}</dd></dl>
          </details>
        </div>
      </aside>
    </div>
  </section>;
}
