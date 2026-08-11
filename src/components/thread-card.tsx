import Link from "next/link";
import { BookMarked, ChevronRight, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusOverride } from "@/components/status-override";
import type { RecordEntry, Subject, Thread } from "@/lib/db/schema";
import { effectiveStatus } from "@/lib/domain/analysis";
import { STATUS_META } from "@/lib/domain/status";

type EvidenceRow = { record: RecordEntry; subject: Subject };

export function ThreadCard({ thread, evidence, compact = false }: { thread: Thread; evidence: Map<number, EvidenceRow>; compact?: boolean }) {
  const status = effectiveStatus(thread.aiStatus, thread.userStatus);
  const meta = STATUS_META[status];
  const rows = thread.evidenceRecordIds.map((id) => evidence.get(id)).filter(Boolean) as EvidenceRow[];
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
                  <Link key={record.id} href={`/subjects/${subject.id}`} className="group block rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/50">
                    <div className="mb-1 flex items-center justify-between gap-2"><span className="text-xs font-medium">{subject.grade}-{subject.semester} · {subject.subjectName}</span><span className="font-mono text-[10px] text-muted-foreground">#{record.id}</span></div>
                    <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{record.recordText}</p>
                  </Link>
                ))}
                {rows.length === 0 && <p className="flex items-center gap-2 text-xs text-amber-300"><ShieldAlert className="size-4" />확인할 수 있는 근거가 없습니다.</p>}
              </div>
            </div>
          </>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <Score label="강도" value={thread.strengthScore} />
          <Score label="연속성" value={thread.continuityScore} />
          <Score label="깊이" value={thread.academicDepthScore} />
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">Next step</p>
          <p className="mt-1 text-sm leading-6">{thread.recommendedNextStep}</p>
        </div>
      </CardContent>
      {!compact && (
        <CardFooter className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <span>{thread.userStatus ? `AI: ${STATUS_META[thread.aiStatus].label} · 내 판단 적용` : "AI 판단 적용 중"}</span>
          <span className="flex items-center gap-1">억지 연결 위험 {thread.forcedConnectionRisk}<ChevronRight className="size-3" /></span>
        </CardFooter>
      )}
    </Card>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-muted/40 px-2 py-2"><p className="font-mono text-base font-semibold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}
