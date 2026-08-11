import { Database, KeyRound, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupRequired() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <Alert className="mb-6 border-amber-400/30 bg-amber-400/5 text-amber-100">
        <KeyRound className="size-4" /><AlertTitle>서버 환경 설정이 필요합니다</AlertTitle>
        <AlertDescription>데이터베이스 연결 전까지 기록 화면을 열 수 없습니다. 실제 secret은 저장소에 추가하지 마세요.</AlertDescription>
      </Alert>
      <Card>
        <CardHeader><CardTitle>필수 환경 변수</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4"><Database className="mb-3 size-5 text-primary" /><p className="font-mono text-sm">DATABASE_URL</p><p className="mt-1 text-xs text-muted-foreground">Neon PostgreSQL 연결 문자열</p></div>
          <div className="rounded-lg border p-4"><Sparkles className="mb-3 size-5 text-primary" /><p className="font-mono text-sm">GEMINI_API_KEY</p><p className="mt-1 text-xs text-muted-foreground">분석 실행 시 서버에서만 사용</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
