import { ArrowRight, LockKeyhole, Route } from "lucide-react";
import { loginAction } from "@/app/login/actions";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="surface-grid relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,oklch(0.72_0.15_181/0.12),transparent_35%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Route className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">Student Record Strategy Engine</p>
            <h1 className="mt-1 text-lg font-semibold">2028 생기부 연결 지도</h1>
          </div>
        </div>

        <Card className="border-border/80 bg-card/95 shadow-2xl shadow-black/20">
          <CardHeader className="space-y-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
              <LockKeyhole className="size-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">개인 전략 보드에 접속</CardTitle>
            <CardDescription>이 도구는 한 명의 실제 기록만을 위한 비공개 작업 공간입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertTitle>{error === "config" ? "환경 설정 필요" : "접속 실패"}</AlertTitle>
                <AlertDescription>
                  {error === "config"
                    ? "APP_PASSWORD와 AUTH_SECRET을 서버 환경 변수에 설정해 주세요."
                    : "비밀번호가 올바르지 않습니다."}
                </AlertDescription>
              </Alert>
            )}
            <form action={loginAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">개인 비밀번호</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
              </div>
              <SubmitButton className="w-full" pendingLabel="확인 중...">
                접속하기 <ArrowRight className="size-4" />
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          비밀번호와 분석 자격 증명은 브라우저에 저장되지 않습니다.
        </p>
      </div>
    </main>
  );
}
