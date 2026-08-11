import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { SetupRequired } from "@/components/setup-required";
import { SubjectForm } from "@/components/subject-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/lib/db";
import { getSubjectInputs } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
const semesters = [[1,1],[1,2],[2,1],[2,2],[3,1],[3,2]] as const;

export default async function SubjectsPage() {
  if (!isDatabaseConfigured()) return <SetupRequired />;
  const subjects = await getSubjectInputs();
  return (
    <>
      <PageHeading eyebrow="source of truth" title="과목과 실제 기록" description="AI가 만들어낸 요약이 아니라, 학생부에 존재하는 문장과 직접 작성한 사실 메모만 입력합니다." />
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-8">
          {semesters.map(([grade, semester]) => {
            const items = subjects.filter((subject) => subject.grade === grade && subject.semester === semester);
            return (
              <section key={`${grade}-${semester}`}>
                <div className="mb-3 flex items-center gap-3"><h2 className="text-lg font-semibold">{grade}학년 {semester}학기</h2><Badge variant={grade === 2 && semester === 2 ? "default" : "secondary"}>{items.length}과목</Badge></div>
                {items.length ? <div className="grid gap-3 sm:grid-cols-2">{items.map((subject) => <Link key={subject.id} href={`/subjects/${subject.id}`}><Card className="h-full transition-colors hover:border-primary/40 hover:bg-card/80"><CardContent className="flex h-full items-start justify-between gap-4 pt-5"><div><p className="font-semibold">{subject.subjectName}</p><p className="mt-1 text-xs text-muted-foreground">{subject.category || "분류 없음"} · 기록 {subject.records.length}개</p><p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{subject.records[0]?.recordText || "아직 입력된 기록이 없습니다."}</p></div><ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" /></CardContent></Card></Link>)}</div> : <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">이 학기에 등록된 과목이 없습니다.</div>}
              </section>
            );
          })}
        </div>
        <div className="xl:sticky xl:top-8"><SubjectForm /></div>
      </div>
    </>
  );
}
