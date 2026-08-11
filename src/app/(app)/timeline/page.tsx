import Link from "next/link";
import { ArrowDown, BookOpen, GitCommitHorizontal } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { SetupRequired } from "@/components/setup-required";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/lib/db";
import { getDashboardData } from "@/lib/db/queries";
import { STATUS_META } from "@/lib/domain/status";

export const dynamic = "force-dynamic";
const semesterKeys = [[1,1],[1,2],[2,1],[2,2],[3,1]] as const;

export default async function TimelinePage() {
  if (!isDatabaseConfigured()) return <SetupRequired />;
  const data = await getDashboardData();
  const recordToSemester = new Map<number, string>();
  data.subjects.forEach((subject) => subject.records.forEach((record) => recordToSemester.set(record.id, `${subject.grade}-${subject.semester}`)));

  return (
    <>
      <PageHeading eyebrow="development map" title="연결 타임라인" description="같은 키워드가 반복되는지가 아니라, 과거 질문이 다음 교과와 방법을 만나 어떻게 발전했는지 봅니다." />
      <div className="relative mx-auto max-w-5xl">
        <div className="absolute top-8 bottom-8 left-6 w-px bg-border sm:left-1/2" />
        <div className="space-y-6">
          {semesterKeys.map(([grade, semester], index) => {
            const key = `${grade}-${semester}`;
            const semesterSubjects = data.subjects.filter((subject) => `${subject.grade}-${subject.semester}` === key);
            const semesterThreads = data.latest?.threads.filter((thread) => thread.evidenceRecordIds.some((id) => recordToSemester.get(id) === key)) ?? [];
            return (
              <section key={key} className="relative grid gap-4 pl-16 sm:grid-cols-2 sm:pl-0">
                <div className="absolute left-0 top-2 flex size-12 items-center justify-center rounded-full border bg-background font-mono text-sm font-semibold sm:left-1/2 sm:-translate-x-1/2">{key}</div>
                <div className={index % 2 === 0 ? "sm:pr-10" : "sm:order-2 sm:pl-10"}>
                  <Card><CardContent className="pt-5"><p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"><BookOpen className="size-3.5" />기록</p><div className="space-y-2">{semesterSubjects.map((subject) => <Link href={`/subjects/${subject.id}`} key={subject.id} className="block rounded-md border p-3 hover:bg-muted/40"><div className="flex items-center justify-between"><span className="text-sm font-medium">{subject.subjectName}</span><span className="font-mono text-[10px] text-muted-foreground">{subject.records.map((record) => `#${record.id}`).join(" ")}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{subject.records[0]?.recordText || "기록 없음"}</p></Link>)}{!semesterSubjects.length && <p className="text-xs text-muted-foreground">아직 입력된 기록이 없습니다.</p>}</div></CardContent></Card>
                </div>
                <div className={index % 2 === 0 ? "sm:order-2 sm:pl-10" : "sm:pr-10"}>
                  <div className="space-y-2 pt-2"><p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"><GitCommitHorizontal className="size-3.5" />이 시점에 닿는 Thread</p>{semesterThreads.map((thread) => <div key={thread.id} className="rounded-lg border bg-card p-3"><Badge variant="outline" className={STATUS_META[thread.effectiveStatus].className}>{STATUS_META[thread.effectiveStatus].short}</Badge><p className="mt-2 text-sm font-medium">{thread.title}</p></div>)}{!semesterThreads.length && <p className="text-xs leading-5 text-muted-foreground">최신 분석에서 이 시점을 근거로 삼은 Thread가 없습니다.</p>}</div>
                </div>
                {index < semesterKeys.length - 1 && <ArrowDown className="absolute -bottom-5 left-[18px] size-3 text-muted-foreground sm:left-1/2 sm:-translate-x-1/2" />}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
