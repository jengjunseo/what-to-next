"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalysisButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/analysis", { method: "POST" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "분석을 완료하지 못했습니다.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "분석을 완료하지 못했습니다.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button onClick={run} disabled={disabled || running} size="lg">
        {running ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {running ? "전체 기록을 읽는 중..." : "전체 생기부 분석"}
      </Button>
      {error && <p role="alert" className="max-w-sm text-xs leading-5 text-destructive">{error}</p>}
    </div>
  );
}
