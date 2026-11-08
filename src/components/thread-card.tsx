import Link from "next/link";
import { BookMarked, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusOverride } from "@/components/status-override";
import type { Thread } from "@/lib/db/schema";
import type { SnapshotEvidence } from "@/lib/domain/evidence";
import { effectiveStatus } from "@/lib/domain/analysis";
import { STATUS_META } from "@/lib/domain/status";

export function ThreadCard({ thread, evidence, compact = false }: { thread: Thread; evidence: Map<number, SnapshotEvidence>; compact?: boolean }) {
  const status = effectiveStatus(thread.aiStatus, thread.userStatus);
  const meta = STATUS_META[status];
  const rows = thread.evidenceRecordIds.map((id) => evidence.get(id)).filter((row) => row !== undefined);
  return (
    <Card className={status === "EXTEND_NOW" ? "border-emerald-400/30 shadow-lg shadow-emerald-950/20" : "border-border/80"}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className={meta.className}>{meta.short}</Badge>
          {!compact && <StatusOverride threadId={thread.id} aiStatus={thread.aiStatus} userStatus={thread.userStatus} />}
        </div>
        <CardTitle className="text-lg leading-6">{thread.title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{thread.description}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">판단</p>
          <p className="text-sm leading-6">{thread.reasoning}</p>
        </div>
        {!compact && (
          <>
            <Separator />
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"><BookMarked className="size-3.5" />실제 근거</p>
              <div className="space-y-2">
                {rows.map(({ record, subject }) => (
                  <details key={record.id} className="rounded-lg border bg-muted/20 p-3"><summary className="cursor-pointer text-xs font-medium">{subject.grade}-{subject.semester} · {subject.subjectName} · #{record.id}</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{record.recordText}</p>{record.memo && <p className="mt-2 text-xs text-muted-foreground">{record.memo}</p>}<Link href={`/subjects/${subject.id}`} className="mt-2 inline-block text-xs text-primary underline">현재 과목 보기</Link></details>
                ))}
                {rows.length === 0 && <p className="flex items-center gap-2 text-xs text-amber-300"><ShieldAlert className="size-4" />확인할 수 있는 근거가 없습니다.</p>}
              </div>
            </div>
          </>
        )}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">Next step</p>
          <p className="mt-1 text-sm leading-6">{thread.recommendedNextStep}</p>
        </div>
      </CardContent>
      {!compact && (
        <CardFooter className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <span>{thread.userStatus ? `AI: ${STATUS_META[thread.aiStatus].label} · 내 판단 적용` : "AI 판단 적용 중"}</span>
        </CardFooter>
      )}
    </Card>
  );
}
