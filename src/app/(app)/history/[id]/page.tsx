import { snapshotEvidence } from "@/lib/domain/evidence";
import Link from "next/link";
import { ArrowLeft, Braces } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { ThreadCard } from "@/components/thread-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalysisRun } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAnalysisRun(Number(id));
  if (!result) notFound();
  const evidence = snapshotEvidence(result.run.inputSnapshot);
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-5"><Link href="/history"><ArrowLeft className="size-4" />전체 이력</Link></Button>
      <PageHeading eyebrow={`analysis run #${result.run.id}`} title={new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(result.run.createdAt)} description={`${result.run.inputSnapshot.subjects.length}과목 · ${result.run.inputSnapshot.subjects.reduce((sum, subject) => sum + subject.records.length, 0)}기록 · ${result.run.model}`} action={<Badge variant="outline">{result.run.promptVersion}</Badge>} />
      <Card className="mb-7 border-primary/20"><CardHeader><CardTitle>{result.run.overallSummary.currentProfile}</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-3"><Summary label="가장 강한 방향" value={result.run.overallSummary.strongestDirection} /><Summary label="가장 큰 문제" value={result.run.overallSummary.biggestProblem} /><Summary label="당시 전략" value={result.run.overallSummary.strategySummary} /></CardContent></Card>
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4 md:grid-cols-2">{result.threads.map((thread) => <ThreadCard key={thread.id} thread={thread} evidence={evidence} compact />)}</div>
        <Card className="xl:sticky xl:top-8"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Braces className="size-4 text-primary" />당시 입력 snapshot</CardTitle></CardHeader><CardContent><div className="max-h-[70vh] space-y-4 overflow-auto pr-2">{result.run.inputSnapshot.subjects.map((subject) => <div key={subject.id} className="rounded-lg border p-3"><p className="text-sm font-medium">{subject.grade}-{subject.semester} · {subject.subjectName}</p>{subject.records.map((record) => <div key={record.id} className="mt-2 border-t pt-2"><p className="font-mono text-[10px] text-muted-foreground">record #{record.id}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{record.recordText}</p></div>)}</div>)}</div></CardContent></Card>
      </div>
    </>
  );
}
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6">{value}</p></div>; }
