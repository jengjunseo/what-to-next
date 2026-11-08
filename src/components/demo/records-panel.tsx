import { useId, useState, type FormEvent } from "react";
import { BookOpen, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { CourseOptions } from "@/components/course-options";
import type { DemoRecord } from "@/lib/demo/scenarios";

type Props = {
  records: DemoRecord[];
  showFirstEditor: boolean;
  locked: boolean;
  save: (record: Omit<DemoRecord, "id">, id?: number) => void;
  remove: (id: number) => void;
};

export function RecordsPanel({ records, showFirstEditor, locked, save, remove }: Props) {
  const courseId = useId();
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [editor, setEditor] = useState<DemoRecord | "new" | null>(showFirstEditor ? "new" : null);
  const [chosen, setChosen] = useState("");
  const [inputGrade, setInputGrade] = useState("");
  const [inputSemester, setInputSemester] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const subjects = [...new Set(records.map((record) => record.subject))].sort((a, b) => a.localeCompare(b, "ko"));
  const subjectExists = subjects.includes(subject);
  const filtered = records.filter((record) => (!grade || record.grade === Number(grade))
    && (!semester || record.semester === Number(semester)) && (!subjectExists || record.subject === subject))
    .sort((a, b) => a.grade - b.grade || a.semester - b.semester || a.id - b.id);
  const editing = editor !== "new" ? editor : null;

  function openEditor(record: DemoRecord | "new") {
    setChosen(record === "new" ? "" : record.subject);
    setInputGrade(record === "new" ? "" : String(record.grade));
    setInputSemester(record === "new" ? "" : String(record.semester));
    setFormError("");
    setEditor(record);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      grade: Number(form.get("grade")),
      semester: Number(form.get("semester")),
      subject: chosen,
      text: String(form.get("text")).trim(),
      memo: String(form.get("memo")).trim(),
    };
    if (!input.subject || !input.grade || !input.semester || !input.text) {
      setFormError("과목과 학기를 고르고 기록을 입력해 주세요.");
      return;
    }
    save(input, editing?.id);
    setEditor(null);
  }

  return <section className="wtn-section" aria-labelledby="wtn-record-title">
    <header className="wtn-section-heading">
      <div className="wtn-section-label">
        <span className="wtn-section-icon"><BookOpen size={18} aria-hidden /></span>
        <div><h2 id="wtn-record-title">기록 입력</h2><p className="wtn-muted">저장한 기록 {records.length}건</p></div>
      </div>
      {!editor && <button type="button" className="wtn-primary" disabled={locked} onClick={() => openEditor("new")}><Plus size={17} aria-hidden />기록 추가</button>}
    </header>

    {editor && <form key={editing?.id ?? "new"} className="wtn-panel wtn-editor wtn-reveal" onSubmit={submit}>
      <section className="wtn-step">
        <span className="wtn-step-number" aria-hidden>1</span>
        <div>
          <h3>{editing ? "어떤 과목의 기록인지 확인해요" : "과목부터 골라요"}</h3>
          <p className="wtn-muted">2022 개정 교육과정의 보통 교과를 모았어요. 실제 개설 과목은 학교마다 달라요.</p>
          <div className="wtn-course-label"><label htmlFor={courseId}>과목</label>
            <span className="wtn-select-shell">
              <select id={courseId} name="subject" required value={chosen} disabled={locked} onChange={(event) => setChosen(event.target.value)}>
                <CourseOptions existing={editing?.subject} />
              </select>
              <ChevronDown size={16} aria-hidden />
            </span>
          </div>
        </div>
      </section>
      {chosen && <section className="wtn-step wtn-reveal">
        <span className="wtn-step-number" aria-hidden>2</span>
        <div>
          <h3>좋아요. 어느 학기의 기록인가요?</h3>
          <div className="wtn-form-row">
            <label>학년<select name="grade" aria-label="학년" required value={inputGrade} onChange={(event) => setInputGrade(event.target.value)}>
              <option value="" disabled>학년 선택</option>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}학년</option>)}
            </select></label>
            <label>학기<select name="semester" aria-label="학기" required value={inputSemester} onChange={(event) => setInputSemester(event.target.value)}>
              <option value="" disabled>학기 선택</option>{[1, 2].map((value) => <option key={value} value={value}>{value}학기</option>)}
            </select></label>
          </div>
        </div>
      </section>}
      {chosen && inputGrade && inputSemester && <section className="wtn-step wtn-reveal" style={{ animationDelay: "80ms" }}>
        <span className="wtn-step-number" aria-hidden>3</span>
        <div>
          <h3>생기부에 적힌 내용을 입력해요</h3>
          <p className="wtn-muted">실제로 한 활동이 담긴 문장을 적어 주세요. 이름과 학교 등 개인정보는 빼 주세요.</p>
          <label>기록 원문<textarea name="text" rows={4} required maxLength={2500} defaultValue={editing?.text} placeholder="기록에서 확인할 수 있는 활동과 과정을 적어 주세요." /></label>
          <details open={editing?.memo ? true : undefined}>
            <summary>메모 추가하기</summary>
            <label>메모 <span className="wtn-muted">(선택)</span><textarea name="memo" rows={2} maxLength={500} defaultValue={editing?.memo} /></label>
          </details>
          {formError && <p role="alert" className="wtn-warning">{formError}</p>}
          <div className="wtn-actions">
            <button type="submit" className="wtn-primary" disabled={locked}>저장</button>
            <button type="button" onClick={() => setEditor(null)}>취소</button>
          </div>
        </div>
      </section>}
    </form>}

    {records.length > 0 && <div className="wtn-filters">
      <label>학년 필터<select value={grade} onChange={(event) => setGrade(event.target.value)}><option value="">전체 학년</option>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}학년</option>)}</select></label>
      <label>학기 필터<select value={semester} onChange={(event) => setSemester(event.target.value)}><option value="">전체 학기</option>{[1, 2].map((value) => <option key={value} value={value}>{value}학기</option>)}</select></label>
      <label>과목 필터<select value={subjectExists ? subject : ""} onChange={(event) => setSubject(event.target.value)}><option value="">전체 과목</option>{subjects.map((name) => <option key={name}>{name}</option>)}</select></label>
    </div>}
    {filtered.length === 0 ? !editor && <div className="wtn-empty"><BookOpen size={24} /><h3>{records.length ? "이 조건에 맞는 기록이 없어요" : "아직 저장한 기록이 없어요"}</h3><p>{records.length ? "학년이나 과목 필터를 바꿔 보세요." : "과목을 골라 첫 기록을 남겨 보세요."}</p></div> :
      <ul className="wtn-records">
        {filtered.map((record) => <li className="wtn-record" key={record.id}>
          <div className="wtn-record-meta"><span className="wtn-tag">{record.grade}학년 {record.semester}학기</span><h3>{record.subject}</h3><span className="wtn-id">#{record.id}</span></div>
          <p>{record.text}</p>
          {record.memo && <p className="wtn-muted">메모 · {record.memo}</p>}
          <div className="wtn-actions">
            {deleting === record.id ? <>
              <span>이 기록을 삭제할까요? 이전 분석에는 당시 원문이 남아요.</span>
              <button type="button" className="wtn-danger" disabled={locked} onClick={() => { remove(record.id); setDeleting(null); if (editing?.id === record.id) setEditor(null); }}>삭제 확인</button>
              <button type="button" onClick={() => setDeleting(null)}>취소</button>
            </> : <>
              <button type="button" disabled={locked} onClick={() => openEditor(record)}><Pencil size={14} aria-hidden />수정</button>
              <button type="button" disabled={locked} onClick={() => setDeleting(record.id)}><Trash2 size={14} aria-hidden />삭제</button>
            </>}
          </div>
        </li>)}
      </ul>}
  </section>;
}
