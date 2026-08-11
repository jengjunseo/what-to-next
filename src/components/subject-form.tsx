import { createSubject, updateSubject } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type InitialSubject = { id: number; grade: number; semester: number; subjectName: string; category: string | null };

export function SubjectForm({ initial }: { initial?: InitialSubject }) {
  const action = initial ? updateSubject.bind(null, initial.id) : createSubject;
  return (
    <Card>
      <CardHeader><CardTitle>{initial ? "과목 정보 수정" : "과목과 첫 기록 추가"}</CardTitle><CardDescription>{initial ? "학년·학기와 과목 분류를 고칩니다." : "실제 기록을 그대로 붙여 넣으세요. 메모는 분석 근거를 보완합니다."}</CardDescription></CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={`grade-${initial?.id ?? "new"}`}>학년</Label><Select name="grade" defaultValue={String(initial?.grade ?? 2)}><SelectTrigger id={`grade-${initial?.id ?? "new"}`}><SelectValue /></SelectTrigger><SelectContent>{[1,2,3].map((grade) => <SelectItem key={grade} value={String(grade)}>{grade}학년</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor={`semester-${initial?.id ?? "new"}`}>학기</Label><Select name="semester" defaultValue={String(initial?.semester ?? 2)}><SelectTrigger id={`semester-${initial?.id ?? "new"}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1학기</SelectItem><SelectItem value="2">2학기</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={`subject-${initial?.id ?? "new"}`}>과목명</Label><Input id={`subject-${initial?.id ?? "new"}`} name="subjectName" defaultValue={initial?.subjectName} placeholder="예: 정보" required /></div>
            <div className="space-y-2"><Label htmlFor={`category-${initial?.id ?? "new"}`}>분류 <span className="text-muted-foreground">(선택)</span></Label><Input id={`category-${initial?.id ?? "new"}`} name="category" defaultValue={initial?.category ?? ""} placeholder="예: 기술·가정/정보" /></div>
          </div>
          {!initial && <><div className="space-y-2"><Label htmlFor="recordText">생기부 원문</Label><Textarea id="recordText" name="recordText" rows={8} placeholder="학생부에 기재된 실제 문장을 입력하세요." /></div><div className="space-y-2"><Label htmlFor="memo">추가 메모 <span className="text-muted-foreground">(선택)</span></Label><Textarea id="memo" name="memo" rows={3} placeholder="실제 활동 과정, 질문, 구현·검증 내용처럼 기억해 둘 사실" /></div></>}
          <SubmitButton pendingLabel={initial ? "수정 중..." : "추가 중..."}>{initial ? "과목 정보 저장" : "과목 추가"}</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
