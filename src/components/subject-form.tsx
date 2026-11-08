"use client";

import { useState } from "react";
import { createSubject, updateSubject } from "@/app/actions";
import { CourseOptions } from "@/components/course-options";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InitialSubject = { id: number; grade: number; semester: number; subjectName: string; category: string | null };
const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

export function SubjectForm({ initial }: { initial?: InitialSubject }) {
  const action = initial ? updateSubject.bind(null, initial.id) : createSubject;
  const [chosen, setChosen] = useState(initial?.subjectName ?? "");
  const [grade, setGrade] = useState(initial?.grade ? String(initial.grade) : "");
  const [semester, setSemester] = useState(initial?.semester ? String(initial.semester) : "");
  const suffix = initial?.id ?? "new";
  return (
    <Card>
      <CardHeader><CardTitle>{initial ? "과목 정보를 수정해요" : "과목과 첫 기록을 추가해요"}</CardTitle>
        <CardDescription>과목을 고르고 어느 학기에 배웠는지 알려 주세요.</CardDescription></CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={`subject-${suffix}`}>과목명</Label>
            <select id={`subject-${suffix}`} name="subjectName" className={selectClass} required
              value={chosen} onChange={(event) => setChosen(event.target.value)}><CourseOptions existing={initial?.subjectName} /></select>
          </div>
          {chosen && <div className="grid gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={`grade-${suffix}`}>학년</Label>
              <select id={`grade-${suffix}`} name="grade" className={selectClass} required value={grade} onChange={(event) => setGrade(event.target.value)}>
                <option value="" disabled>학년 선택</option>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}학년</option>)}
              </select></div>
            <div className="space-y-2"><Label htmlFor={`semester-${suffix}`}>학기</Label>
              <select id={`semester-${suffix}`} name="semester" className={selectClass} required value={semester} onChange={(event) => setSemester(event.target.value)}>
                <option value="" disabled>학기 선택</option>{[1, 2].map((value) => <option key={value} value={value}>{value}학기</option>)}
              </select></div>
          </div>}
          {chosen && grade && semester && <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
            <div className="space-y-2"><Label htmlFor={`category-${suffix}`}>분류 (선택)</Label>
              <Input id={`category-${suffix}`} name="category" defaultValue={initial?.category ?? ""} /></div>
            {!initial && <>
              <div className="space-y-2"><Label htmlFor="recordText">생기부 원문</Label>
                <Textarea id="recordText" name="recordText" rows={5} placeholder="기록에서 확인되는 실제 활동을 적어 주세요." /></div>
              <div className="space-y-2"><Label htmlFor="memo">추가 메모 (선택)</Label><Textarea id="memo" name="memo" rows={2} /></div>
            </>}
            <SubmitButton pendingLabel="저장하고 있어요…">{initial ? "과목 정보 저장" : "과목 추가"}</SubmitButton>
          </div>}
        </form>
      </CardContent>
    </Card>
  );
}
