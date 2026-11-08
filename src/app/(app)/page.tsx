import { snapshotEvidence } from "@/lib/domain/evidence";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, BookOpenText, Clock3, Database, Sparkles } from "lucide-react";
import { AnalysisButton } from "@/components/analysis-button";
import { PageHeading } from "@/components/page-heading";
import { SetupRequired } from "@/components/setup-required";
import { ThreadCard } from "@/components/thread-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/lib/db";
import { getDashboardData } from "@/lib/db/queries";
import { STATUS_META } from "@/lib/domain/status";
import type { ThreadStatus } from "@/lib/domain/analysis";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isDatabaseConfigured()) return <SetupRequired />;
  const data = await getDashboardData();
  const evidence = snapshotEvidence(data.latest?.run.inputSnapshot);
  const statuses: ThreadStatus[] = ["DROP", "KEEP", "EXTEND_NOW", "RECOVER_LATER"];

  return (
    <>
      <PageHeading
        eyebrow="2028 strategy board"
        title="그래서, 이번 학기에 뭘 이어가야 하지?"
        description="과목별 기록을 따로 보지 않고, 시간에 따라 발전한 학업적 연결을 기준으로 다음 행동을 고릅니다."
        action={<AnalysisButton disabled={data.recordCount === 0} />}
      />

      {data.stale && (
        <Alert className="mb-6 border-amber-400/30 bg-amber-400/5 text-amber-100">
          <AlertTriangle className="size-4" /><AlertTitle>학생부가 마지막 분석 이후 변경되었습니다</AlertTitle>
          <AlertDescription>아래 결과는 보존되어 있습니다. 최신 기록을 반영하려면 사용자가 직접 다시 분석해야 합니다.</AlertDescription>
        </Alert>
      )}

      <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BookOpenText} label="등록 과목" value={`${data.subjectCount}`} detail="1-1부터 현재까지" />
        <Metric icon={Database} label="등록 기록" value={`${data.recordCount}`} detail="실제 원문 기준" />
        <Metric icon={Clock3} label="마지막 분석" value={data.latest ? formatDate(data.latest.run.createdAt) : "아직 없음"} detail={data.latest?.run.model ?? "분석 전"} />
        <Metric icon={Sparkles} label="현재 시점" value="고2 · 2학기" detail="Computer Science / Software" />
      </section>

      {data.latest ? (
        <>
          <Card className="mb-8 border-primary/20 bg-primary/[0.04]">
            <CardHeader><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold tracking-wider text-primary uppercase">Current profile</p><CardTitle className="mt-2 text-xl">{data.latest.run.overallSummary.currentProfile}</CardTitle></div><Badge variant="outline">Run #{data.latest.run.id}</Badge></div></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <Summary label="가장 강한 방향" value={data.latest.run.overallSummary.strongestDirection} />
              <Summary label="가장 큰 문제" value={data.latest.run.overallSummary.biggestProblem} />
              <Summary label="전략 요약" value={data.latest.run.overallSummary.strategySummary} />
            </CardContent>
          </Card>
          <section className="grid items-start gap-4 xl:grid-cols-4">
            {statuses.map((status) => {
              const meta = STATUS_META[status];
              const filtered = data.latest!.threads.filter((thread) => thread.effectiveStatus === status);
              return (
                <div key={status} className={status === "EXTEND_NOW" ? "rounded-xl border border-emerald-400/20 bg-emerald-400/[0.025] p-3" : "p-3"}>
                  <div className="mb-4 min-h-16"><div className="flex items-center justify-between"><h2 className="font-semibold">{meta.label}</h2><span className="font-mono text-xs text-muted-foreground">{filtered.length}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.description}</p></div>
                  <div className="space-y-4">{filtered.map((thread) => <ThreadCard key={thread.id} thread={thread} evidence={evidence} />)}{filtered.length === 0 && <div className="rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">분류된 Thread가 없습니다.</div>}</div>
                </div>
              );
            })}
          </section>
        </>
      ) : (
        <Card className="border-dashed py-10 text-center">
          <CardContent><Sparkles className="mx-auto mb-4 size-8 text-primary" /><h2 className="text-xl font-semibold">첫 연결 지도를 만들 준비가 됐습니다</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">과목과 실제 생기부 원문을 입력한 뒤 전체 분석을 실행하세요. 가짜 fallback 없이 검증된 결과만 저장됩니다.</p><Button asChild variant="outline" className="mt-5"><Link href="/subjects">과목과 기록 입력 <ArrowUpRight className="size-4" /></Link></Button></CardContent>
        </Card>
      )}
    </>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof BookOpenText; label: string; value: string; detail: string }) {
  return <Card><CardContent className="pt-5"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{detail}</p></div><Icon className="size-4 text-primary" /></div></CardContent></Card>;
}
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6">{value}</p></div>; }
function formatDate(date: Date) { return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date); }
