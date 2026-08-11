import Link from "next/link";
import { ArrowLeft, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteSubject } from "@/app/actions";
import { DeleteConfirm } from "@/components/delete-confirm";
import { PageHeading } from "@/components/page-heading";
import { RecordEditor } from "@/components/record-editor";
import { SubjectForm } from "@/components/subject-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubjectDetail } from "@/lib/db/queries";
import { STATUS_META } from "@/lib/domain/status";
import { effectiveStatus } from "@/lib/domain/analysis";

export const dynamic = "force-dynamic";

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();
  const detail = await getSubjectDetail(numericId);
  if (!detail) notFound();
  const { subject, records, relatedThreads, linkedSubjects } = detail;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-5"><Link href="/subjects"><ArrowLeft className="size-4" />전체 과목</Link></Button>
      <PageHeading eyebrow={`${subject.grade}학년 ${subject.semester}학기`} title={subject.subjectName} description={`${subject.category || "분류 없음"} · 실제 기록 ${records.length}개 · 마지막 수정 ${new Intl.DateTimeFormat("ko-KR").format(subject.updatedAt)}`} action={<DeleteConfirm action={deleteSubject.bind(null, subject.id)} title={`${subject.subjectName} 과목을 삭제할까요?`} description="이 과목의 모든 현재 기록도 함께 삭제됩니다. 과거 분석 snapshot은 보존됩니다." label="과목 삭제" />} />
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">생기부 원문과 메모</h2>
          {records.map((record) => <RecordEditor key={record.id} subjectId={subject.id} record={record} />)}
          <RecordEditor subjectId={subject.id} />
        </div>
        <div className="space-y-5 xl:sticky xl:top-8">
          <SubjectForm initial={subject} />
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Link2 className="size-4 text-primary" />최신 분석의 연결</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {relatedThreads.map((thread) => { const status = effectiveStatus(thread.aiStatus, thread.userStatus); return <div key={thread.id} className="rounded-lg border p-3"><Badge variant="outline" className={STATUS_META[status].className}>{STATUS_META[status].short}</Badge><p className="mt-2 text-sm font-medium">{thread.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{thread.reasoning}</p></div>; })}
              {!relatedThreads.length && <p className="text-sm text-muted-foreground">최신 분석에서 이 기록을 근거로 사용한 Thread가 없습니다.</p>}
              {!!linkedSubjects.length && <div className="border-t pt-4"><p className="mb-2 text-xs font-medium text-muted-foreground">함께 연결된 과목</p><div className="flex flex-wrap gap-2">{linkedSubjects.map((linked) => <Button key={linked.id} asChild variant="outline" size="sm"><Link href={`/subjects/${linked.id}`}>{linked.subjectName}</Link></Button>)}</div></div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
