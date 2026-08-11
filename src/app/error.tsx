"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="flex min-h-screen items-center justify-center p-6"><Card className="max-w-lg"><CardContent className="pt-6 text-center"><AlertTriangle className="mx-auto mb-4 size-8 text-destructive" /><h1 className="text-xl font-semibold">화면을 불러오지 못했습니다</h1><p className="mt-2 text-sm text-muted-foreground">데이터베이스 연결과 서버 환경 변수를 확인한 뒤 다시 시도해 주세요.</p><Button onClick={reset} className="mt-5">다시 시도</Button></CardContent></Card></main>; }
