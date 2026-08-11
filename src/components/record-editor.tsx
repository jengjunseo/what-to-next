import { createRecord, deleteRecord, updateRecord } from "@/app/actions";
import { DeleteConfirm } from "@/components/delete-confirm";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RecordEntry } from "@/lib/db/schema";

export function RecordEditor({ subjectId, record }: { subjectId: number; record?: RecordEntry }) {
  const action = record ? updateRecord.bind(null, record.id) : createRecord.bind(null, subjectId);
  return (
    <Card className={record ? "border-border/70" : "border-dashed"}>
      <CardHeader className="flex-row items-center justify-between gap-4"><CardTitle className="text-base">{record ? <>기록 <span className="font-mono text-muted-foreground">#{record.id}</span></> : "새 기록 추가"}</CardTitle>{record && <Badge variant="outline">근거 ID {record.id}</Badge>}</CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2"><Label htmlFor={`record-${record?.id ?? "new"}`}>생기부 원문</Label><Textarea id={`record-${record?.id ?? "new"}`} name="recordText" rows={record ? 7 : 5} defaultValue={record?.recordText} required /></div>
          <div className="space-y-2"><Label htmlFor={`memo-${record?.id ?? "new"}`}>추가 메모 <span className="text-muted-foreground">(선택)</span></Label><Textarea id={`memo-${record?.id ?? "new"}`} name="memo" rows={3} defaultValue={record?.memo ?? ""} /></div>
          <div className="flex items-center justify-between gap-3"><SubmitButton size="sm" pendingLabel="저장 중...">{record ? "기록 저장" : "기록 추가"}</SubmitButton>{record && <DeleteConfirm action={deleteRecord.bind(null, record.id)} title="이 기록을 삭제할까요?" description="연결된 분석 이력은 보존되지만, 최신 분석에서는 이 근거를 더 이상 사용할 수 없습니다." />}</div>
        </form>
      </CardContent>
    </Card>
  );
}
