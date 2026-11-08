import { snapshotEvidence } from "@/lib/domain/evidence";
import Link from "next/link";
import { ArrowRight, GitBranch, ShieldX, Target } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { SetupRequired } from "@/components/setup-required";
import { ThreadCard } from "@/components/thread-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/lib/db";
import { getLatestAnalysis } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function StrategyNowPage() {
  if (!isDatabaseConfigured()) return <SetupRequired />;
  const latest = await getLatestAnalysis();
  const items = latest?.threads
    .filter((thread) => thread.effectiveStatus === "EXTEND_NOW")
    .sort((a, b) => (a.priorityRank ?? 999) - (b.priorityRank ?? 999)) ?? [];
  const evidence = snapshotEvidence(latest?.run.inputSnapshot);

  return (
    <>
      <PageHeading eyebrow="2학년 2학기 실행 전략" title="지금 뭘 해야 하지?" description="AI의 긴 설명을 늘어놓지 않고, 현재 학기에 직접 이어갈 행동만 우선순위대로 정리했습니다." />
      {latest ? (
        <>
          <Card className="mb-7 border-primary/20 bg-primary/[0.04]">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Target className="size-5 text-primary" />이번 학기의 한 문장 전략</CardTitle></CardHeader>
            <CardContent><p className="text-base leading-7">{latest.run.rawResult.semesterStrategy.secondYearSecondSemester}</p></CardContent>
          </Card>
          <div className="space-y-6">
            {items.map((thread, index) => {
              const sourceRows = thread.evidenceRecordIds.map((id) => evidence.get(id)).filter(Boolean);
              return (
                <section key={thread.id} className="grid items-start gap-4 lg:grid-cols-[64px_minmax(0,1fr)_360px]">
                  <div className="flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-lg font-semibold text-primary">{thread.priorityRank ?? index + 1}</div>
                  <ThreadCard thread={thread} evidence={evidence} />
                  <Card>
                    <CardHeader><CardTitle className="text-base">행동 체크</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <Question icon={GitBranch} label="무엇을 이어가나" value={thread.title} />
                      <Question icon={ArrowRight} label="어디서 이어지나" value={sourceRows.map((row) => row ? `${row.subject.grade}-${row.subject.semester} ${row.subject.subjectName} #${row.record.id}` : "").join(" · ")} />
                      <Question icon={Target} label="어떻게 발전시키나" value={thread.recommendedNextStep} />
                      <Question icon={ShieldX} label="어떤 방식은 피하나" value={thread.avoid} />
                    </CardContent>
                  </Card>
                </section>
              );
            })}
            {!items.length && <Card className="border-dashed py-10 text-center"><CardContent><p className="font-medium">현재 이어갈 Thread가 없습니다.</p><p className="mt-2 text-sm text-muted-foreground">최신 분석이 없거나 EXTEND_NOW로 분류된 연결이 없습니다.</p><Button asChild variant="outline" className="mt-5"><Link href="/">전략 보드로 이동</Link></Button></CardContent></Card>}
          </div>
        </>
      ) : <Card className="border-dashed py-10 text-center"><CardContent><p className="font-medium">먼저 전체 생기부 분석을 실행해 주세요.</p><Button asChild className="mt-5"><Link href="/">전략 보드로 이동</Link></Button></CardContent></Card>}
    </>
  );
}

function Question({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return <div><p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="size-3.5" />{label}</p><p className="leading-6">{value || "확인 가능한 근거 없음"}</p></div>;
}
