import Link from "next/link";
import { ArrowUpRight, Clock3, Database } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { SetupRequired } from "@/components/setup-required";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/lib/db";
import { getAnalysisHistory } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  if (!isDatabaseConfigured()) return <SetupRequired />;
  const runs = await getAnalysisHistory();
  return (
    <>
      <PageHeading eyebrow="immutable snapshots" title="분석 이력" description="다시 분석해도 이전 결과를 덮어쓰지 않습니다. 당시 입력 snapshot과 판단을 그대로 확인할 수 있습니다." />
      <div className="space-y-3">
        {runs.map((run, index) => (
          <Link href={`/history/${run.id}`} key={run.id}>
            <Card className="mb-3 transition-colors hover:border-primary/40 hover:bg-card/80"><CardContent className="grid items-center gap-4 pt-5 sm:grid-cols-[180px_1fr_auto]">
              <div><p className="font-mono text-sm">{formatDate(run.createdAt)}</p><p className="mt-1 text-xs text-muted-foreground">Run #{run.id}</p></div>
              <div><p className="line-clamp-1 text-sm font-medium">{run.overallSummary.strategySummary}</p><div className="mt-2 flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Database className="size-3" />{run.recordCount} records</span><span className="flex items-center gap-1"><Clock3 className="size-3" />{run.model}</span></div></div>
              <div className="flex items-center gap-3">{index === 0 && <Badge>최신</Badge>}<ArrowUpRight className="size-4 text-muted-foreground" /></div>
            </CardContent></Card>
          </Link>
        ))}
        {!runs.length && <Card className="border-dashed py-10 text-center"><CardContent><p className="text-sm text-muted-foreground">저장된 분석 이력이 없습니다.</p></CardContent></Card>}
      </div>
    </>
  );
}
function formatDate(date: Date) { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date); }
