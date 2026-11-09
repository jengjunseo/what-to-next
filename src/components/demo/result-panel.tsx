import { useRef, useState } from "react";
import { ArrowRight, ClipboardList, GitBranch, Info, Lightbulb, Network } from "lucide-react";
import { recordExcerpts } from "@/lib/ai/record-excerpts";
import { effectiveStatus, PERSPECTIVES, THREAD_STATUSES, type ThreadStatus } from "@/lib/domain/analysis";
import { MODE_LABELS, type Success } from "@/lib/demo/runs";
import type { DemoRecord } from "@/lib/demo/scenarios";

const STRATEGIES: Record<ThreadStatus, string> = {
  EXTEND_NOW: "지금 확장해요",
  KEEP: "이어가요",
  RECOVER_LATER: "나중에 살펴봐요",
  DROP: "지금은 멈춰요",
};
const LEVELS = ["기록에 단서 없음", "주제·참여·결과만 확인", "행동과 방법·조건·기준 확인", "서로 다른 기록에서 변화와 차이 확인"];

function OriginalPreview({ record, quote, open }: {
  record: DemoRecord;
  quote?: string;
  open: (record: DemoRecord) => void;
}) {
  const sentence = recordExcerpts(quote ?? record.text)[0] ?? "";
  const preview = sentence.slice(0, 96).trimEnd();
  return <button type="button" className="wtn-quote-preview" aria-haspopup="dialog"
    aria-label={record.subject + " 원문 전체 보기"} onClick={() => open(record)}>
    <span>{preview}{preview !== record.text.trim() ? "…" : ""}</span>
    <small>전체 보기</small>
  </button>;
}

export function ResultPanel({ run, stale, override, locked, compactHeader }: {
  run: Success;
  stale: boolean;
  override?: (index: number, status?: ThreadStatus) => void;
  locked?: boolean;
  compactHeader?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [original, setOriginal] = useState<DemoRecord>();
  const [selectedSubject, setSelectedSubject] = useState<string>();
  const [index, setIndex] = useState(0);
  const [evidenceId, setEvidenceId] = useState<number>();
  const [timeline, setTimeline] = useState(false);
  const { threads, overall, perspectives, subjectNotes } = run.result;
  const thread = threads[index];
  const status = thread && effectiveStatus(thread.status, run.overrides[index] ?? null);
  const evidence = thread ? run.records.filter((record) => thread.evidenceRecordIds.includes(record.id))
    .sort((a, b) => a.grade - b.grade || a.semester - b.semester || a.id - b.id) : [];
  const record = evidence.find((record) => record.id === evidenceId) ?? evidence[0];
  const citedIds = new Set([...threads.flatMap((item) => item.evidenceRecordIds),
    ...(perspectives?.flatMap((item) => item.evidenceRecordIds) ?? []),
    ...(subjectNotes?.map((item) => item.recordId) ?? [])]);
  const verifiedQuotes = perspectives?.some((item) => item.quotes !== undefined);
  const options = threads.filter((item) => item.connection?.experiment || item.connection?.experiment === undefined).length;
  const experiment = thread?.connection?.experiment;
  const anchor = thread?.connection?.evidence.find((item) => item.recordId === experiment?.recordId);
  const anchorRecord = evidence.find((item) => item.id === anchor?.recordId);
  const subjects = [...new Set(run.records.map((item) => item.subject.trim()))];
  const subject = subjects.includes(selectedSubject ?? "") ? selectedSubject : subjects[0];
  const subjectRecords = run.records.filter((item) => item.subject.trim() === subject);
  const subjectNote = subjectNotes?.find((item) => subjectRecords.some((record) => record.id === item.recordId));
  const subjectRecord = subjectRecords.find((record) => record.id === subjectNote?.recordId) ?? subjectRecords[0];

  function openOriginal(record: DemoRecord) {
    setOriginal(record);
    dialog.current?.showModal();
  }

  return <section className="wtn-section" aria-labelledby="wtn-map-title">
    <header className={compactHeader ? "wtn-sr-only" : "wtn-section-heading"}>
      <div className="wtn-section-label">
        <span className="wtn-section-icon"><GitBranch size={18} aria-hidden /></span>
        <div><h2 id="wtn-map-title">탐구 연결 지도</h2><p className="wtn-muted">{MODE_LABELS[run.mode]} · 분석 당시 기록</p></div>
      </div>
    </header>

    {stale && <p className="wtn-warning" role="status">기록 변경됨 · 이전 원문을 보여드려요. 최신 기록을 보려면 다시 분석해 주세요.</p>}

    {run.mode === "gemini" && !verifiedQuotes && <p className="wtn-info">이전 방식으로 작성한 결과예요. 원문 인용과 검증 과제를 보려면 다시 분석해 주세요.</p>}
    <dl className="wtn-metrics">
      {[
        ["읽어 본 기록", run.records.length, "건"],
        ["찾은 연결", threads.length, "갈래"],
        ["검증 과제", options, "개"],
        ["인용한 원문", citedIds.size, "건"],
      ].map(([label, value, unit]) => <div className="wtn-panel wtn-metric" key={label}>
        <dt>{label}</dt><dd>{value} <small>{unit}</small></dd>
      </div>)}
    </dl>
    <p className="wtn-info"><Info size={16} aria-hidden />학교생활 기록을 돌아보고 다음 탐구를 고르는 데 참고해요. 대학의 공식 평가나 합격 예측과는 달라요.</p>

    {subjectRecord && <section className="wtn-panel wtn-subject-notes wtn-reveal" aria-labelledby="wtn-subject-notes-title">
      <div className="wtn-section-heading">
        <h3 id="wtn-subject-notes-title">과목별로 살펴봐요</h3>
        <select aria-label="요약할 과목" value={subject} onChange={(event) => setSelectedSubject(event.target.value)}>
          {subjects.map((name) => <option key={name}>{name}</option>)}
        </select>
      </div>
      <div className="wtn-subject-note">
        <div><h4>생기부 포인트</h4><p>{subjectNote?.point ?? "이 과목은 아래 원문부터 살펴봐요."}</p></div>
        <div><h4>다음에는 이렇게 할 수 있어요</h4><p>{subjectNote?.next ?? (subjectNotes
          ? "다음 활동을 제안할 단서가 부족해요."
          : "Gemini 실분석을 다시 실행하면 이 과목의 제안을 볼 수 있어요.")}</p></div>
      </div>
      <OriginalPreview record={subjectRecord} quote={subjectNote?.quote} open={openOriginal} />
    </section>}

    <div className="wtn-map-layout">
        <article className="wtn-panel wtn-graph wtn-reveal" style={{ animationDelay: "60ms" }}>
          <div className="wtn-section-heading">
            <div className="wtn-section-label">
              <span className="wtn-section-icon"><Network size={18} aria-hidden /></span>
              <div><h3>탐구 네트워크 흐름도</h3><p className="wtn-muted">과목을 골라 원문 한 문장을 살펴봐요.</p></div>
            </div>
            {thread && <div className="wtn-actions" aria-label="근거 보기 방식">
              <button type="button" aria-pressed={!timeline} onClick={() => setTimeline(false)}>연결 보기</button>
              <button type="button" aria-pressed={timeline} onClick={() => setTimeline(true)}>타임라인</button>
            </div>}
          </div>
          {!thread && <div className="wtn-empty"><Network size={22} /><h3>기록만으로 연결을 찾기 어려워요</h3><p>{overall.biggestProblem}</p></div>}
          {thread && (timeline ? <ol className="wtn-timeline">{evidence.map((item) =>
            <li key={item.id}><p className="wtn-id">{item.grade}-{item.semester} · {item.subject} · #{item.id}</p>
              <OriginalPreview record={item} quote={thread.connection?.evidence.find(({ recordId }) => recordId === item.id)?.quote} open={openOriginal} />
            </li>)}</ol>
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
                <OriginalPreview record={record} quote={thread.connection?.evidence.find(({ recordId }) => recordId === record.id)?.quote} open={openOriginal} />
              </div>}
            </>)}
        </article>

      <aside className="wtn-result-rail wtn-reveal" aria-label="전략 보드" style={{ animationDelay: "85ms" }}>
        <div className="wtn-section-label">
          <span className="wtn-section-icon"><ClipboardList size={18} aria-hidden /></span>
          <div><h3>전략 의사결정 보드</h3><p className="wtn-muted">이어갈 탐구를 직접 골라요.</p></div>
        </div>
        {threads.map((item, position) => <button type="button" className="wtn-strategy-card" key={position}
          aria-pressed={index === position} onClick={() => { setIndex(position); setEvidenceId(undefined); }}>
          <span className="wtn-tag" data-status={run.overrides[position] ?? item.status}>{STRATEGIES[run.overrides[position] ?? item.status]}</span>
          <strong>{item.title}</strong>

        </button>)}
        {thread ? <div className="wtn-panel wtn-board-task" key={index}>
          {experiment && anchor?.quote && anchorRecord ? <>
            <h4><Lightbulb size={17} aria-hidden />이 대목부터 확인해 봐요</h4>
            <OriginalPreview record={anchorRecord} quote={anchor.quote} open={openOriginal} />
            <p>{experiment.gap}</p>
            <h4>이렇게 해보세요</h4>
            <p>{experiment.action}</p>
            <p className="wtn-muted">{experiment.tool} · {experiment.scope} · 약 {experiment.minutes}분</p>
            <h4>여기까지 하면 끝이에요</h4>
            <p>{experiment.done}</p>
          </> : thread.connection?.experiment === undefined ? <>
            <h4>당시 제안</h4>
            <p>{thread.recommendedNextStep}</p>
          </> : <p className="wtn-muted">이 연결에서 제안할 검증 과제는 없어요.</p>}
          {override && <div className="wtn-override">
            <label>내 판단<select value={run.overrides[index] ?? ""} disabled={locked}
              onChange={(event) => override(index, (event.target.value || undefined) as ThreadStatus | undefined)}>
              <option value="">분석의 제안 따르기</option>
              {THREAD_STATUSES.map((value) => <option key={value} value={value}>{STRATEGIES[value]}</option>)}
            </select></label>
            <p className="wtn-muted">{run.mode === "gemini" ? "AI 제안" : "고정 응답의 제안"} · {STRATEGIES[thread.status]}</p>
          </div>}
        </div> : <p className="wtn-muted">아직 검증 과제가 없어요.</p>}
      </aside>

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
              <h3>{thread.title}</h3>{thread.description !== thread.reasoning && <p>{thread.description}</p>}
            </header>
            <div className="wtn-bridge"><Network size={18} aria-hidden /><p>{thread.reasoning}</p></div>
            {thread.connection?.question && <p><strong>기록에 빠진 질문</strong> · {thread.connection.question}</p>}
          </article>
        </section>}

        {perspectives && <section className="wtn-panel wtn-perspectives wtn-reveal" style={{ animationDelay: "150ms" }}>
          <h3>여섯 가지 관점에서 봤어요</h3><p className="wtn-muted">기록마다 어떤 단서가 있는지 살펴봐요.</p>
          <details className="wtn-evidence-guide"><summary>무엇을 근거로 봤나요?</summary><ul>
            {LEVELS.map((level) => <li key={level}>{level}</li>)}
          </ul></details>
          {perspectives.map((item) => <details key={item.aspect}>
            <summary>{PERSPECTIVES[item.aspect]} <span className="wtn-tag">{item.evidenceRecordIds.length ? ("근거 " + item.evidenceRecordIds.length + "건") : "단서 없음"}</span></summary>
            <p>{item.summary}</p><p className="wtn-muted">{LEVELS[item.grade]} · {item.uncertainty}</p>
            {item.evidenceRecordIds.map((id) => {
              const cited = run.records.find((candidate) => candidate.id === id);
              return cited && <div className="wtn-perspective-quote" key={id}>
                <p className="wtn-id">{cited.subject} · 원문 #{id}</p>
                <OriginalPreview record={cited} quote={item.quotes?.find((quote) => quote.recordId === id)?.quote} open={openOriginal} />
              </div>;
            })}
          </details>)}
        </section>}


    </div>
    <dialog className="wtn-original-dialog" ref={dialog} aria-labelledby="wtn-original-title">
      <div className="wtn-section-heading">
        <h3 id="wtn-original-title">기록 원문</h3>
        <form method="dialog"><button type="submit" className="wtn-soft-button">닫기</button></form>
      </div>
      {original && <>
        <p className="wtn-eyebrow">{original.subject} · {original.grade}학년 {original.semester}학기 · #{original.id}</p>
        <p className="wtn-original-text">{original.text}</p>
        {original.memo && <p className="wtn-muted">메모 · {original.memo}</p>}
      </>}
    </dialog>
  </section>;
}
