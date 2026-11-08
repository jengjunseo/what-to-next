import { useState, type FormEvent } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import type { DemoRecord } from "@/lib/demo/scenarios";

type Props = {
  records: DemoRecord[];
  locked: boolean;
  save: (record: Omit<DemoRecord, "id">, id?: number) => void;
  remove: (id: number) => void;
};

export function RecordsPanel({ records, locked, save, remove }: Props) {
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [editor, setEditor] = useState<DemoRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const subjectExists = records.some((item) => item.subject === subject);
  const filtered = records.filter((record) => (!grade || record.grade === Number(grade))
    && (!semester || record.semester === Number(semester)) && (!subjectExists || record.subject === subject))
    .sort((a, b) => a.grade - b.grade || a.semester - b.semester || a.id - b.id);
  const editing = editor !== "new" ? editor : null;
  const subjects = [...new Set(records.map((record) => record.subject))].sort((a, b) => a.localeCompare(b, "ko"));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      grade: Number(form.get("grade")),
      semester: Number(form.get("semester")),
      subject: String(form.get("subject")).trim(),
      text: String(form.get("text")).trim(),
      memo: String(form.get("memo")).trim(),
    };
    if (!input.subject || !input.text) {
      setFormError("과목과 기록 원문을 입력해 주세요.");
      return;
    }
    save(input, editing?.id);
    setEditor(null);
  }

  return <section className="wtn-section" aria-labelledby="wtn-record-title">
    <header className="wtn-section-heading">
      <div><p className="wtn-eyebrow">01 / 기록</p><h2 id="wtn-record-title">활동 기록 <span className="wtn-count">{records.length}</span></h2></div>
      <button type="button" className="wtn-primary" disabled={locked} onClick={() => { setEditor("new"); setFormError(""); }}><Plus size={17} aria-hidden />기록 추가</button>
    </header>

    {editor && <form key={editing?.id ?? "new"} className="wtn-panel wtn-editor" onSubmit={submit}>
      <h3>{editing ? "기록 수정" : "새 가상 기록"}</h3>
      <div className="wtn-form-row">
        <label>학년<select name="grade" defaultValue={editing?.grade ?? 2}>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}학년</option>)}</select></label>
        <label>학기<select name="semester" defaultValue={editing?.semester ?? 2}>{[1, 2].map((value) => <option key={value} value={value}>{value}학기</option>)}</select></label>
        <label>과목<input name="subject" required maxLength={60} defaultValue={editing?.subject} placeholder="예: 통합과학" /></label>
      </div>
      <label>기록 원문<textarea name="text" rows={3} required maxLength={2500} defaultValue={editing?.text} /></label>
      <label>메모 <span className="wtn-muted">(선택)</span><textarea name="memo" rows={2} maxLength={500} defaultValue={editing?.memo} /></label>
      {formError && <p role="alert" className="wtn-warning">{formError}</p>}
      <div className="wtn-actions">
        <button type="submit" className="wtn-primary" disabled={locked}>저장</button>
        <button type="button" onClick={() => setEditor(null)}>취소</button>
      </div>
    </form>}

    <div className="wtn-filters">
      <label>학년 필터<select value={grade} onChange={(event) => setGrade(event.target.value)}><option value="">전체 학년</option>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}학년</option>)}</select></label>
      <label>학기 필터<select value={semester} onChange={(event) => setSemester(event.target.value)}><option value="">전체 학기</option>{[1, 2].map((value) => <option key={value} value={value}>{value}학기</option>)}</select></label>
      <label>과목 필터<select value={subjects.includes(subject) ? subject : ""} onChange={(event) => setSubject(event.target.value)}><option value="">전체 과목</option>{subjects.map((name) => <option key={name}>{name}</option>)}</select></label>
    </div>
    {filtered.length === 0 ? <div className="wtn-empty"><BookOpen size={24} /><h3>{records.length ? "필터에 해당하는 기록이 없습니다" : "아직 기록이 없습니다"}</h3><p>{records.length ? "학년, 학기 또는 과목 필터를 바꿔 보세요." : "가상 기록을 추가하거나 기본 기록을 복구하세요."}</p></div> :
      <ul className="wtn-records">
        {filtered.map((record) => <li className="wtn-record" key={record.id}>
          <div className="wtn-record-meta"><span className="wtn-tag">{record.grade}학년 {record.semester}학기</span><h3>{record.subject}</h3><span className="wtn-id">#{record.id}</span></div>
          <p>{record.text}</p>
          {record.memo && <p className="wtn-muted">메모 · {record.memo}</p>}
          <div className="wtn-actions">
            {deleting === record.id ? <>
              <span>이 가상 기록을 삭제할까요?</span>
              <button type="button" className="wtn-danger" disabled={locked} onClick={() => { remove(record.id); setDeleting(null); if (editing?.id === record.id) setEditor(null); }}>삭제 확인</button>
              <button type="button" onClick={() => setDeleting(null)}>취소</button>
            </> : <>
              <button type="button" disabled={locked} onClick={() => { setFormError(""); setEditor(record); }}><Pencil size={14} aria-hidden />수정</button>
              <button type="button" disabled={locked} onClick={() => setDeleting(record.id)}><Trash2 size={14} aria-hidden />삭제</button>
            </>}
          </div>
        </li>)}
      </ul>}
  </section>;
}
